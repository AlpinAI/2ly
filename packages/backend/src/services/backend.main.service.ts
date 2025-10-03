import { inject, injectable } from 'inversify';
import { ApolloService } from './apollo.service';
import pino from 'pino';
import { RuntimeService } from './runtime.service';
import { FastifyService } from './fastify.service';
import { LoggerService, Service } from '@2ly/common';
import { DGraphService } from './dgraph.service';
import { container } from '../di/container';
import { WorkspaceRepository, SystemRepository } from '../repositories';
import { MCPServerAutoConfigService } from './mcp-auto-config.service';
import { MonitoringService } from './monitoring.service';

@injectable()
export class MainService extends Service {
  name = 'main';
  private logger: pino.Logger;

  constructor(
    @inject(LoggerService) private loggerService: LoggerService,
    @inject(ApolloService) private apolloService: ApolloService,
    @inject(RuntimeService) private runtimeService: RuntimeService,
    @inject(FastifyService) private fastifyService: FastifyService,
    @inject(MCPServerAutoConfigService) private mcpServerAutoConfigService: MCPServerAutoConfigService,
    @inject(SystemRepository) private systemRepository: SystemRepository,
    @inject(WorkspaceRepository) private workspaceRepository: WorkspaceRepository,
    @inject(MonitoringService) private monitoringService: MonitoringService,
  ) {
    super();
    this.logger = this.loggerService.getLogger(this.name);
  }

  protected async initialize() {
    this.logger.info('Starting');
    await this.startService(this.runtimeService);
    this.registerHealthCheck();
    this.registerUtilityEndpoints();
    await this.startService(this.apolloService);
    await this.initInstance();
    await this.startService(this.mcpServerAutoConfigService);
    await this.startService(this.monitoringService);
    this.registerGracefulShutdown();
  }

  protected async shutdown() {
    this.logger.info('Stopping');
    await this.stopService(this.runtimeService);
    await this.stopService(this.apolloService);
    await this.stopService(this.mcpServerAutoConfigService);
    await this.stopService(this.monitoringService);

    // Check if any services are still active
    const activeServices = Service.getActiveServices();
    if (activeServices.length > 0) {
      this.logger.warn('⚠️  Some services are still active after shutdown:');
      activeServices.forEach(service => {
        this.logger.warn(
          `   - Service "${service.name}" (${service.state}) is kept alive by consumers: [${service.consumers.join(', ')}]`
        );
      });
    }
  }

  private async initInstance() {
    // find if a workspace already exists
    this.logger.info('Initializing instance');
    let system = await this.systemRepository.getSystem();
    if (!system) {
      this.logger.info('Creating system');
      system = await this.systemRepository.createSystem();
      this.logger.info(`✅ Created system: ${system.instanceId}`);
    } else {
      this.logger.info(`✅ Loaded system: ${system.instanceId}`);
    }
    const defaultWorkspace = system?.defaultWorkspace;
    this.logger.info(`Default workspace: ${defaultWorkspace?.name ?? 'not found'}`);
    if (!defaultWorkspace) {
      // create a default workspace
      this.logger.info('Creating default workspace');
      const newDefaultWorkspace = await this.workspaceRepository.create('Default', system.admins![0].id);
      await this.systemRepository.setDefaultWorkspace(newDefaultWorkspace.id);
      this.logger.info('Created default workspace');
    }
  }

  private registerHealthCheck() {
    this.logger.debug('Registering health check endpoint');
    this.fastifyService.fastify.get('/health', async (req, res) => {
      try {
        if (!this.runtimeService.isRunning()) {
          throw new Error('Runtime is not running');
        }
        if (!this.apolloService.isRunning()) {
          throw new Error('Apollo is not running');
        }
        res.status(200).send('OK');
      } catch (error) {
        this.logger.error(`Error during health check: ${error}`);
        res.status(503).send('Service not running');
      }
    });
  }

  private registerUtilityEndpoints() {
    this.logger.debug('Registering utility endpoints');
    this.fastifyService.fastify.get('/reset', async (req, res) => {
      this.logger.info('Resetting all data');
      const dgraphService = container.get(DGraphService) as DGraphService;
      try {
        await dgraphService.dropAll();
        await dgraphService.initSchema(true);
        await this.initInstance();
        res.send({ response: 'OK' });
      } catch (error) {
        this.logger.error(`🔴 Error during reset: ${error}`);
        res.status(500).send('Error during reset');
      }
    });
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
    }, 1000);
    this.logger.info(`Graceful shutdown: ${signal}`);
    // the shutdown is expressed from the index consumer point of view
    // we might want to move the gracefull shutdown logic into index
    await this.stop('index');
    clearInterval(keepAlive);
    process.exit(0);
  }
}
