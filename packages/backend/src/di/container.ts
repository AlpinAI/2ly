import { Container } from 'inversify';
import {
  NatsService,
  NATS_CONNECTION_OPTIONS,
  LoggerService,
  LOG_LEVEL,
  MAIN_LOGGER_NAME,
  FORWARD_STDERR,
  dgraphResolversTypes,
  HEARTBAT_TTL,
  DEFAULT_HEARTBAT_TTL,
  EPHEMERAL_TTL,
  DEFAULT_EPHEMERAL_TTL,
} from '@2ly/common';
import { DGraphService, DGRAPH_URL } from '../services/dgraph.service';
import { ApolloService } from '../services/apollo.service';
import { RuntimeService, DROP_ALL_DATA } from '../services/runtime.service';
import { FastifyService } from '../services/fastify.service';
import { MainService } from '../services/backend.main.service';
import { RuntimeInstance, RuntimeInstanceFactory, RuntimeInstanceMetadata } from '../services/runtime.instance';
import {
  RuntimeRepository,
  WorkspaceRepository,
  UserRepository,
  SessionRepository,
  MCPServerRepository,
  MCPToolRepository,
  SystemRepository,
  MonitoringRepository,
} from '../repositories';
import { JwtService, AuthenticationService, AccountSecurityService, PasswordPolicyService } from '../services/auth';
import { SecurityMiddleware, RateLimitMiddleware, GraphQLAuthMiddleware } from '../middleware';
import { MCPServerAutoConfigService, AZURE_ENDPOINT, AZURE_API_KEY, BRAVE_SEARCH_API_KEY } from '../services/mcp-auto-config.service';
import pino from 'pino';
import { MonitoringService } from '../services/monitoring.service';

const container = new Container();
const start = () => {

  // Init nats service
  const natsServers = process.env.NATS_SERVERS || 'localhost:4222';
  const natsName = process.env.NATS_NAME || 'backend';
  container.bind(NATS_CONNECTION_OPTIONS).toConstantValue({
    servers: natsServers,
    name: natsName,
    reconnect: true,
    maxReconnectAttempts: -1,
    reconnectTimeWait: 1000,
  });
  container.bind(HEARTBAT_TTL).toConstantValue(process.env.HEARTBAT_TTL || DEFAULT_HEARTBAT_TTL);
  container.bind(EPHEMERAL_TTL).toConstantValue(process.env.EPHEMERAL_TTL || DEFAULT_EPHEMERAL_TTL);
  container.bind(NatsService).toSelf().inSingletonScope();

  // Init dgraph service
  container.bind(DROP_ALL_DATA).toConstantValue(process.env.DROP_ALL_DATA === 'true');
  container.bind(DGRAPH_URL).toConstantValue(process.env.DGRAPH_URL || 'localhost:8080');
  container.bind(DGraphService).toSelf().inSingletonScope();

  // Init apollo service
  container.bind(ApolloService).toSelf().inSingletonScope();

  // Init runtime service
  container.bind(RuntimeService).toSelf().inSingletonScope();

  // Init fastify service
  container.bind(FastifyService).toSelf().inSingletonScope();

  // Init monitoring service
  container.bind(MonitoringService).toSelf().inSingletonScope();

  // Init main service
  container.bind(MainService).toSelf().inSingletonScope();

  // Init repositories
  container.bind(RuntimeRepository).toSelf().inSingletonScope();
  container.bind(WorkspaceRepository).toSelf().inSingletonScope();
  container.bind(UserRepository).toSelf().inSingletonScope();
  container.bind(SessionRepository).toSelf().inSingletonScope();
  container.bind(MCPServerRepository).toSelf().inSingletonScope();
  container.bind(MCPToolRepository).toSelf().inSingletonScope();
  container.bind(SystemRepository).toSelf().inSingletonScope();
  container.bind(MonitoringRepository).toSelf().inSingletonScope();

  // Init authentication services
  container.bind(JwtService).toSelf().inSingletonScope();
  container.bind(AuthenticationService).toSelf().inSingletonScope();

  // Init security services
  container.bind(AccountSecurityService).toSelf().inSingletonScope();
  container.bind(PasswordPolicyService).toSelf().inSingletonScope();

  // Init middleware services
  container.bind(SecurityMiddleware).toSelf().inSingletonScope();
  container.bind(RateLimitMiddleware).toSelf().inSingletonScope();
  container.bind(GraphQLAuthMiddleware).toSelf().inSingletonScope();

  // Init MCP server auto config service
  container.bind(AZURE_ENDPOINT).toConstantValue(process.env.AZURE_ENDPOINT || 'https://models.inference.ai.azure.com');
  container.bind(AZURE_API_KEY).toConstantValue(process.env.AZURE_API_KEY || '');
  container.bind(BRAVE_SEARCH_API_KEY).toConstantValue(process.env.BRAVE_SEARCH_API_KEY || '');
  container.bind(MCPServerAutoConfigService).toSelf().inSingletonScope();

  // Init logger service
  container.bind(MAIN_LOGGER_NAME).toConstantValue('2ly-backend');
  container.bind(FORWARD_STDERR).toConstantValue(false);
  container.bind(LOG_LEVEL).toConstantValue(process.env.LOG_LEVEL || 'info');
  container.bind(LoggerService).toSelf().inSingletonScope();

  // Set child log levels
  const loggerService = container.get(LoggerService);
  loggerService.setLogLevel('dgraph', (process.env.DGRAPH_LOG_LEVEL || 'info') as pino.Level);
  loggerService.setLogLevel('nats', (process.env.NATS_LOG_LEVEL || 'info') as pino.Level);
  loggerService.setLogLevel('fastify', (process.env.FASTIFY_LOG_LEVEL || 'info') as pino.Level);
  loggerService.setLogLevel('apollo', (process.env.APOLLO_LOG_LEVEL || 'info') as pino.Level);
  loggerService.setLogLevel('runtime', (process.env.RUNTIME_LOG_LEVEL || 'info') as pino.Level);
  loggerService.setLogLevel('mcp-auto-config', (process.env.MCP_AUTO_CONFIG_LOG_LEVEL || 'info') as pino.Level);

  // Init Runtime Instance Factory
  container.bind<RuntimeInstanceFactory>(RuntimeInstance).toFactory((context) => {
    return (
      instance: dgraphResolversTypes.Runtime,
      metadata: RuntimeInstanceMetadata,
      onReady: () => void,
      onDisconnect: () => void) => {
      const logger = context.get(LoggerService).getLogger(`runtime.instance`);
      logger.level = process.env.RUNTIME_INSTANCE_LOG_LEVEL || 'info';
      const runtimeInstance = new RuntimeInstance(
        logger,
        context.get(NatsService),
        context.get(WorkspaceRepository),
        context.get(RuntimeRepository),
        instance,
        metadata,
        onReady,
        onDisconnect,
      );
      // We know the runtime factory is used by the runtime service so we can
      // identify the consumer safely
      runtimeInstance.start('runtime');
      return runtimeInstance;
    };
  });
};

export { container, start };
