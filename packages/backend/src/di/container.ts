import { Container } from 'inversify';
import {
  NatsService,
  NATS_CONNECTION_OPTIONS,
  LoggerService,
  LOG_LEVEL,
  LOG_LEVELS,
  MAIN_LOGGER_NAME,
  FORWARD_STDERR,
  dgraphResolversTypes,
  HEARTBAT_TTL,
  DEFAULT_HEARTBAT_TTL,
  EPHEMERAL_TTL,
  DEFAULT_EPHEMERAL_TTL,
  EncryptionService,
  AIProviderService,
} from '@2ly/common';
import { DGraphService, DGRAPH_URL } from '../services/dgraph.service';
import { ApolloService } from '../services/apollo.service';
import { RuntimeService } from '../services/runtime.service';
import { SkillService } from '../services/skill.service';
import { FastifyService } from '../services/fastify.service';
import { MainService, DROP_ALL_DATA } from '../services/backend.main.service';
import { RuntimeInstance, RuntimeInstanceFactory } from '../services/runtime.instance';
import type { ConnectionMetadata } from '../types';
import {
  RuntimeRepository,
  WorkspaceRepository,
  UserRepository,
  SessionRepository,
  MCPServerRepository,
  MCPToolRepository,
  SystemRepository,
  MonitoringRepository,
  SkillRepository,
  IdentityRepository,
  AIProviderRepository,
} from '../repositories';
import { JwtService, AuthenticationService, AccountSecurityService, PasswordPolicyService } from '../services/auth';
import { SecurityMiddleware, RateLimitMiddleware, GraphQLAuthMiddleware } from '../middleware';
import { IdentityService } from '../services/identity.service';
import { KeyRateLimiterService } from '../services/key-rate-limiter.service';
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

  // Init skill service
  container.bind(SkillService).toSelf().inSingletonScope();

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
  container.bind(SkillRepository).toSelf().inSingletonScope();
  container.bind(IdentityRepository).toSelf().inSingletonScope();
  container.bind(AIProviderRepository).toSelf().inSingletonScope();

  // Init authentication services
  container.bind(JwtService).toSelf().inSingletonScope();
  container.bind(AuthenticationService).toSelf().inSingletonScope();

  // Init identity service
  container.bind(IdentityService).toSelf().inSingletonScope();

  // Init key rate limiter service
  container.bind(KeyRateLimiterService).toSelf().inSingletonScope();

  // Init AI provider core service (from @2ly/common)
  container.bind(EncryptionService).toSelf().inSingletonScope();
  container.bind(AIProviderService).toSelf().inSingletonScope();

  // Init security services
  container.bind(AccountSecurityService).toSelf().inSingletonScope();
  container.bind(PasswordPolicyService).toSelf().inSingletonScope();

  // Init middleware services
  container.bind(SecurityMiddleware).toSelf().inSingletonScope();
  container.bind(RateLimitMiddleware).toSelf().inSingletonScope();
  container.bind(GraphQLAuthMiddleware).toSelf().inSingletonScope();

  // Init logger service
  // LOG_LEVEL: Default level for all loggers (e.g., 'info', 'debug', 'warn')
  // LOG_LEVELS: Pattern-based configuration (e.g., 'mcp.*=debug,dgraph=trace')
  container.bind(MAIN_LOGGER_NAME).toConstantValue('2ly-backend');
  container.bind(FORWARD_STDERR).toConstantValue(false);
  container.bind(LOG_LEVEL).toConstantValue(process.env.LOG_LEVEL || 'info');
  container.bind(LOG_LEVELS).toConstantValue(process.env.LOG_LEVELS);
  container.bind(LoggerService).toSelf().inSingletonScope();

  // Init Runtime Instance Factory
  container.bind<RuntimeInstanceFactory>(RuntimeInstance).toFactory((context) => {
    return (
      instance: dgraphResolversTypes.Runtime,
      metadata: ConnectionMetadata,
      onReady: () => void,
      onDisconnect: () => void) => {
      const logger = context.get(LoggerService).getLogger('runtime.instance');
      const runtimeInstance = new RuntimeInstance(
        logger,
        context.get(NatsService),
        context.get(RuntimeRepository),
        context.get(SkillRepository),
        context.get(AIProviderRepository),
        context.get(AIProviderService),
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
