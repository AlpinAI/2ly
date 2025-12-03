import { inject, injectable } from 'inversify';
import { ApolloService } from './apollo.service';
import pino from 'pino';
import { RuntimeService } from './runtime.service';
import { FastifyService } from './fastify.service';
import { LoggerService, Service } from '@2ly/common';
import { DGraphService } from './dgraph.service';
import { container } from '../di/container';
import { WorkspaceRepository, SystemRepository } from '../repositories';
import { MonitoringService } from './monitoring.service';
import packageJson from '../../package.json';
import { ToolSetService } from './toolset.service';
import { IdentityService } from './identity.service';

export const DROP_ALL_DATA = 'dropAllData';

@injectable()
export class MainService extends Service {
  name = 'main';
  private logger: pino.Logger;

  @inject(DROP_ALL_DATA)
  private dropAllData!: boolean;

  constructor(
    @inject(LoggerService) private loggerService: LoggerService,
    @inject(DGraphService) private dgraphService: DGraphService,
    @inject(ApolloService) private apolloService: ApolloService,
    @inject(RuntimeService) private runtimeService: RuntimeService,
    @inject(ToolSetService) private toolSetService: ToolSetService,
    @inject(FastifyService) private fastifyService: FastifyService,
    @inject(SystemRepository) private systemRepository: SystemRepository,
    @inject(WorkspaceRepository) private workspaceRepository: WorkspaceRepository,
    @inject(MonitoringService) private monitoringService: MonitoringService,
    @inject(IdentityService) private identityService: IdentityService,
  ) {
    super();
    this.logger = this.loggerService.getLogger(this.name);
  }

  protected async initialize() {
    this.logger.info(`Starting backend, version: ${packageJson.version}`);
    await this.startService(this.dgraphService);
    await this.dgraphService.initSchema(this.dropAllData);
    await this.startService(this.identityService);
    await this.startService(this.runtimeService);
    await this.startService(this.toolSetService);
    this.registerHealthCheck();
    this.registerUtilityEndpoints();
    await this.startService(this.apolloService);
    await this.initInstance();
    await this.startService(this.monitoringService);
    this.registerGracefulShutdown();
  }

  protected async shutdown() {
    this.logger.info('Stopping');
    await Promise.all([
      this.stopService(this.identityService),
      this.stopService(this.runtimeService),
      this.stopService(this.apolloService),
      this.stopService(this.monitoringService),
      this.stopService(this.dgraphService),
      this.stopService(this.toolSetService),
    ]);
    this.logger.info('All services stopped');
    this.logActiveServices();
    this.removeGracefulShutdownHandlers();
    this.logger.info('Stopped');
  }

  private async initInstance() {
    // find if a workspace already exists
    this.logger.info('Initializing instance');
    
    let system = await this.systemRepository.getSystem();
    if (!system) {
      this.logger.info('Creating system');
      const systemKey = process.env.SYSTEM_KEY ?? '';
      system = await this.systemRepository.createSystem(systemKey);
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
        res.status(200).send({ status: 'ok' });
      } catch (error) {
        this.logger.error(`Error during health check: ${error}`);
        res.status(503).send({ status: 'error', message: 'Service not running' });
      }
    });
  }

  private registerUtilityEndpoints() {
    this.logger.debug('Registering utility endpoints');
    this.fastifyService.fastify.get('/reset', async (req, res) => {
      this.logger.info('Resetting all data');
      const dgraphService = container.get(DGraphService) as DGraphService;
      try {
        // Reset all runtime instances and notify them to reconnect
        await this.runtimeService.resetRuntimes();

        // Drop and reinitialize database
        await dgraphService.dropAll();
        await dgraphService.initSchema(true);
        await this.initInstance();
        // Reset the observed runtimes in system repository
        this.systemRepository.stopObservingRuntimes();

        res.send({ response: 'OK' });
      } catch (error) {
        this.logger.error(`🔴 Error during reset: ${error}`);
        res.status(500).send('Error during reset');
      }
    });
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
      this.logActiveServices();
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

  private logActiveServices() {
    const activeServices = Service.getActiveServices();
    if (activeServices.length > 0) {
      this.logger.warn('⚠️  Some services are still active after shutdown:');
      activeServices.forEach((service) => {
        this.logger.warn(
          `   - Service "${service.name}" (${service.state}) is kept alive by consumers: [${service.consumers.join(', ')}]`,
        );
      });
    }
  }
}
