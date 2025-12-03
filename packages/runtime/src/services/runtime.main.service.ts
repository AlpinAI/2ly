import { inject, injectable, optional } from 'inversify';
import pino from 'pino';
import {
  LoggerService,
  NatsService,
  RuntimeReconnectPublish,
  Service,
} from '@2ly/common';
import { HealthService } from './runtime.health.service';
import { McpStdioService } from './mcp.stdio.service';
import { FastifyManagerService } from './fastify.manager.service';
import { McpSseService } from './mcp.sse.service';
import { McpStreamableService } from './mcp.streamable.service';
import { ToolService } from './tool.service';
import { AuthService, PermanentAuthenticationError } from './auth.service';
import { RUNTIME_MODE, type RuntimeMode } from '../di/symbols';

@injectable()
export class MainService extends Service {
  name = 'main';
  private logger: pino.Logger;
  private failedConnectionCounter: number = 0;
  private subscriptions: { unsubscribe: () => void; drain: () => Promise<void>; isClosed?: () => boolean }[] = [];

  constructor(
    @inject(LoggerService) private loggerService: LoggerService,
    @inject(NatsService) private natsService: NatsService,
    @inject(AuthService) private authService: AuthService,
    @inject(HealthService) private healthService: HealthService,
    @inject(RUNTIME_MODE) private runtimeMode: RuntimeMode,
    @inject(McpStdioService) @optional() private mcpStdioService: McpStdioService | undefined,
    @inject(FastifyManagerService) @optional() private fastifyManager: FastifyManagerService | undefined,
    @inject(McpSseService) @optional() private mcpSseService: McpSseService | undefined,
    @inject(McpStreamableService) @optional() private mcpStreamableService: McpStreamableService | undefined,
    @inject(ToolService) @optional() private toolService: ToolService | undefined,
  ) {
    super();
    this.logger = this.loggerService.getLogger(this.name);
  }

  protected async initialize() {
    this.logger.info(`Starting with PID: ${process.pid}`);
    this.registerGracefulShutdown();
    // Calling up but do not block the initialize() so that the state of the service is correctly updated
    (async () => {
      await this.up();
    })();
  }

  protected async shutdown() {
    this.logger.info('Stopping');
    // no need to send disconnect message, health service kills the heartbeat signal upon stopping
    await this.down();
    this.logActiveServices();
    this.removeGracefulShutdownHandlers();
    this.logger.info('Stopped');
  }

  // Keeps trying to up the services until the main is considered stopped
  private async up() {
    // If the main service is STOPPED or STOPPING, return
    if (this.state === 'STOPPED' || this.state === 'STOPPING') {
      return;
    }

    // Connect phase - Only when runtime or skill is present
    if (this.runtimeMode !== 'STANDALONE_MCP_STREAM') {
      this.logger.debug(`Starting connect phase in ${this.runtimeMode} mode`);
      try {
        // Start NATS service
        await this.startService(this.natsService);
        // Login and retrieve identity
        try {
          await this.startService(this.authService);
        } catch (error) {
          if (error instanceof PermanentAuthenticationError) {
            this.logger.error(`Permanent authentication failure: ${error.message}`);
            this.logger.error('Cannot recover from authentication failure. Process will exit.');
            await this.gracefulShutdown('AUTH_FAILURE');
            return;
          }
          throw error;
        }
        // Start heartbeat
        await this.startService(this.healthService);
        // Subscribe to RuntimeReconnectMessage after NATS is connected
        await this.subscribeToReconnectMessage();
      } catch (error) {
        this.logger.error(`Failed to start nats or auth service: ${error}`);
        await this.reconnect();
        return;
      }
    }

    try {
      // START PHASE
      // Only start runtime services if not in standalone MCP mode
      if (this.toolService) {
        this.logger.info(`Starting tool service in ${this.runtimeMode} mode`);
        await this.startService(this.toolService);
      }

      // Start MCP services based on mode
      if (this.mcpStdioService) {
        this.logger.info(`Starting MCP stdio service in ${this.runtimeMode} mode`);
        await this.startService(this.mcpStdioService);
      }

      // Start Fastify Manager first (creates Fastify instance and MCP Server, but doesn't listen yet)
      if (this.fastifyManager) {
        this.logger.info(`Starting Fastify Manager in ${this.runtimeMode} mode`);
        await this.startService(this.fastifyManager);
      }

      // Then start transport services (they register routes on the shared Fastify instance)
      if (this.mcpSseService) {
        this.logger.info(`Starting MCP SSE service in ${this.runtimeMode} mode`);
        await this.startService(this.mcpSseService);
      }

      if (this.mcpStreamableService) {
        this.logger.info(`Starting MCP Streamable HTTP service in ${this.runtimeMode} mode`);
        await this.startService(this.mcpStreamableService);
      }

      // Finally, start listening on the port (after all routes are registered)
      if (this.fastifyManager) {
        this.logger.info('Starting Fastify server to listen for connections');
        await this.fastifyManager.startListening();
      }
    } catch (error) {
      this.logger.error(`Failed to start services: ${error}`);
      await this.reconnect();
      return;
    }
  }

  private async down() {
    await this.unsubscribeFromMessages();
    if (this.mcpStdioService) {
      await this.stopService(this.mcpStdioService);
    }
    // Stop transport services first (before closing the Fastify instance)
    if (this.mcpSseService) {
      await this.stopService(this.mcpSseService);
    }
    if (this.mcpStreamableService) {
      await this.stopService(this.mcpStreamableService);
    }
    // Then stop Fastify Manager (closes Fastify instance and MCP Server)
    if (this.fastifyManager) {
      await this.stopService(this.fastifyManager);
    }
    if (this.toolService) {
      await this.stopService(this.toolService);
    }
    await this.stopService(this.healthService);
    await this.stopService(this.natsService);
    await this.stopService(this.authService);
  }

  public async reconnect() {
    this.failedConnectionCounter++;
    const waitTime = this.calculateReconnectWaitTime();

    this.logger.info(
      `Connection failed. Attempt ${this.failedConnectionCounter}. Waiting ${waitTime}ms before reconnecting...`,
    );

    // Shutdown the main service (will shutdown child services automatically)
    await this.down();

    this.logActiveServices(1);

    // Wait with exponential backoff
    await this.wait(waitTime);

    // Restart the main service
    await this.up();
  }

  private calculateReconnectWaitTime(): number {
    const INITIAL_WAIT_TIME = 5000; // 5 seconds
    const MAX_WAIT_TIME = 10 * 60 * 1000; // 10 minutes
    const BACKOFF_MULTIPLIER = 2;
    const JITTER_FACTOR = 0.1; // 10% jitter

    const baseWaitTime = INITIAL_WAIT_TIME * Math.pow(BACKOFF_MULTIPLIER, this.failedConnectionCounter - 1);
    const cappedWaitTime = Math.min(baseWaitTime, MAX_WAIT_TIME);

    // Add random jitter to prevent thundering herd
    const jitter = cappedWaitTime * JITTER_FACTOR * Math.random();
    const finalWaitTime = cappedWaitTime + jitter;

    return Math.floor(finalWaitTime);
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async subscribeToReconnectMessage() {
    this.logger.debug('Subscribing to RuntimeReconnectMessage');
    const subscription = this.natsService.subscribe(RuntimeReconnectPublish.subscribe());
    this.subscriptions.push(subscription);

    // Process messages in the background
    (async () => {
      try {
        for await (const msg of subscription) {
          if (msg instanceof RuntimeReconnectPublish) {
            this.logger.info(`Received RuntimeReconnectMessage: ${msg.data.reason || 'No reason provided'}`);
            // Clear identity to force re-registration
            // DO WE STILL NEED TO CLEAR IDENTITY ?
            // this.authService.clearIdentity();
            // Trigger reconnection
            await this.reconnect();
          }
        }
      } catch (error) {
        this.logger.error(`Error processing RuntimeReconnectMessage: ${error}`);
      }
    })();
  }

  private async unsubscribeFromMessages() {
    this.logger.debug('Unsubscribing from NATS messages');
    for (const subscription of this.subscriptions) {
      try {
        if (subscription.isClosed && !subscription.isClosed()) {
          await subscription.drain();
        }
      } catch (error) {
        this.logger.error(`Failed to drain subscription: ${error}`);
      }
    }
    this.subscriptions = [];
  }

  private isShuttingDown = false;

  // Store handler references for cleanup
  private sigintHandler = () => this.gracefulShutdown('SIGINT');
  private sigtermHandler = () => this.gracefulShutdown('SIGTERM');
  private uncaughtExceptionHandler = (error: Error) => {
    this.logger.error(`Uncaught exception: ${error.message}`);
    if (error.stack) {
      this.logger.error(`Stack trace: ${error.stack}`);
    }
    console.error(error);
    this.gracefulShutdown('uncaughtException');
  };
  private unhandledRejectionHandler = (error: unknown) => {
    this.logger.error(`Unhandled rejection: ${error}`);
    if (error instanceof Error && error.stack) {
      this.logger.error(`Stack trace: ${error.stack}`);
    }
    console.error(error);
    this.gracefulShutdown('unhandledRejection');
  };

  private registerGracefulShutdown() {
    process.on('SIGINT', this.sigintHandler);
    process.on('SIGTERM', this.sigtermHandler);
    process.on('uncaughtException', this.uncaughtExceptionHandler);
    process.on('unhandledRejection', this.unhandledRejectionHandler);
  }

  private removeGracefulShutdownHandlers() {
    process.off('SIGINT', this.sigintHandler);
    process.off('SIGTERM', this.sigtermHandler);
    process.off('uncaughtException', this.uncaughtExceptionHandler);
    process.off('unhandledRejection', this.unhandledRejectionHandler);
  }

  private async gracefulShutdown(signal: string) {
    if (this.isShuttingDown) {
      this.logger.info(`Already shutting down, ignoring signal: ${signal}`);
      return;
    }
    this.logger.info(`Shutting down: ${signal}`);
    this.isShuttingDown = true;
    const keepAlive = setInterval(() => {
      console.log('processing shutdown...');
    }, 2000);
    const forceKill = setInterval(() => {
      console.log('force killing...');
      process.kill(process.pid, 'SIGKILL');
    }, 10000);
    this.logger.info(`Graceful shutdown: ${signal}`);
    // the shutdown is expressed from the index consumer point of view
    // we might want to move the gracefull shutdown logic into index
    await this.stop('index');
    clearInterval(keepAlive);
    clearInterval(forceKill);
    process.exit(0);
  }

  private logActiveServices(numberOfExpectedAlive: number = 0) {
    const activeServices = Service.getActiveServices();
    if (activeServices.length > numberOfExpectedAlive) {
      this.logger.warn('⚠️  Some services are still active:');
      activeServices.forEach((service) => {
        this.logger.warn(
          `   - Service "${service.name}" (${service.state}) is kept alive by consumers: [${service.consumers.join(', ')}]`,
        );
      });
    }
  }
}
