import { inject, injectable } from 'inversify';
import pino from 'pino';
import {
  AckMessage,
  LoggerService,
  NatsService,
  RuntimeConnectMessage,
  RuntimeReconnectMessage,
  Service,
} from '@2ly/common';
import { HealthService } from './runtime.health.service';
import { AgentService } from './agent.service';
import { ToolService } from './tool.service';
import { IdentityService } from './identity.service';

@injectable()
export class MainService extends Service {
  name = 'main';
  private logger: pino.Logger;
  private RID: string | null = null;
  private failedConnectionCounter: number = 0;
  private subscriptions: { unsubscribe: () => void; drain: () => Promise<void>; isClosed?: () => boolean }[] = [];

  constructor(
    @inject(LoggerService) private loggerService: LoggerService,
    @inject(NatsService) private natsService: NatsService,
    @inject(IdentityService) private identityService: IdentityService,
    @inject(HealthService) private healthService: HealthService,
    @inject(AgentService) private agentService: AgentService,
    @inject(ToolService) private toolService: ToolService,
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
  }

  // Keeps trying to up the services until the main is considered stopped
  private async up() {
    if (this.state === 'STARTED' || this.state === 'STARTING') {
      try {
        await this.startService(this.natsService);
        await this.startService(this.identityService);
        // Subscribe to RuntimeReconnectMessage after NATS is connected
        await this.subscribeToReconnectMessage();
      } catch (error) {
        this.logger.error(`Failed to start nats or identity service: ${error}`);
        await this.reconnect();
        return;
      }

      try {
        // INIT PHASE
        const identity = this.identityService.getIdentity();
        const connectMessage = new RuntimeConnectMessage({
          name: identity.name,
          pid: identity.processId,
          hostIP: identity.hostIP,
          hostname: identity.hostname,
          workspaceId: identity.workspaceId,
        });
        const ack = await this.natsService.request(connectMessage);
        if (ack instanceof AckMessage) {
          if (!ack.data.metadata?.id || !ack.data.metadata?.RID || !ack.data.metadata?.workspaceId) {
            throw new Error('Runtime connected but no id, RID or workspaceId found');
          }
          this.logger.info(`Runtime connected with RID: ${ack.data.metadata?.RID}`);
          this.identityService.setId(
            ack.data.metadata?.id as string,
            ack.data.metadata?.RID as string,
            ack.data.metadata?.workspaceId as string,
          );
          // Reset failed connection counter on successful connection
          this.failedConnectionCounter = 0;
        } else {
          throw new Error('Invalid Connection response received');
        }
      } catch (error) {
        // When the INIT fails -> reconnect
        this.logger.error(`Failed to connect to the backend: ${error}`);
        await this.reconnect();
        return;
      }

      try {
        // START PHASE
        await this.startService(this.healthService);

        if (
          this.identityService.getAgentCapability() === true ||
          this.identityService.getAgentCapability() === 'auto'
        ) {
          this.logger.info(`Starting agent service`);
          await this.startService(this.agentService);
        }
        if (this.identityService.getToolCapability() === true) {
          this.logger.info(`Starting tool service`);
          await this.startService(this.toolService);
        }

        // Agent service is initialized - the runtime type is now determined at creation time
        // so no need to dynamically update capabilities
        this.agentService.onInitializeMCPServer(async () => {
          this.logger.debug('Agent service initialized');
        });
      } catch (error) {
        this.logger.error(`Failed to start the health service: ${error}`);
        await this.reconnect();
        return;
      }
    }
  }

  private async down() {
    await this.unsubscribeFromMessages();
    await this.stopService(this.healthService);
    await this.stopService(this.toolService);
    await this.stopService(this.agentService);
    await this.stopService(this.natsService);
    await this.stopService(this.identityService);
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
    const subscription = this.natsService.subscribe(RuntimeReconnectMessage.subscribe());
    this.subscriptions.push(subscription);

    // Process messages in the background
    (async () => {
      try {
        for await (const msg of subscription) {
          if (msg instanceof RuntimeReconnectMessage) {
            this.logger.info(`Received RuntimeReconnectMessage: ${msg.data.reason || 'No reason provided'}`);
            // Clear identity to force re-registration
            this.identityService.clearIdentity();
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
  private registerGracefulShutdown() {
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('uncaughtException', (error: Error) => {
      this.logger.error(`Uncaught exception: ${error.message}`);
      if (error.stack) {
        this.logger.error(`Stack trace: ${error.stack}`);
      }
      console.error(error);
      this.gracefulShutdown('uncaughtException');
    });
    process.on('unhandledRejection', (error) => {
      this.logger.error(`Unhandled rejection: ${error}`);
      if (error instanceof Error && error.stack) {
        this.logger.error(`Stack trace: ${error.stack}`);
      }
      console.error(error);
      this.gracefulShutdown('unhandledRejection');
    });
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
