import { Container } from 'inversify';
import {
  NatsService,
  NATS_CONNECTION_OPTIONS,
  LoggerService,
  LOG_LEVEL,
  LOG_LEVELS,
  MAIN_LOGGER_NAME,
  dgraphResolversTypes,
  FORWARD_STDERR,
  AIProviderService,
  type RuntimeSmartSkill,
  // Cache service
  NatsCacheService,
  CACHE_SERVICE,
  CACHE_BUCKET_TTLS,
  CACHE_SERVICE_CONFIG,
  CacheServiceConfig,
  CACHE_BUCKETS,
} from '@skilder-ai/common';
import { MainService } from '../services/runtime.main.service';
import { AuthService } from '../services/auth.service';
import { HealthService, HEARTBEAT_INTERVAL } from '../services/runtime.health.service';
import { ToolServerService, type ToolServerServiceFactory } from '../services/tool.mcp.server.service';
import { ToolSmartSkillService, type ToolSmartSkillServiceFactory } from '../services/tool.smart-skill.service';
import { ToolService } from '../services/tool.service';
import { McpStdioService } from '../services/mcp.stdio.service';
import { McpSseService } from '../services/mcp.sse.service';
import { McpStreamableService } from '../services/mcp.streamable.service';
import { FastifyManagerService } from '../services/fastify.manager.service';
import { type RuntimeMode, RUNTIME_MODE } from './symbols';
import { v4 as uuidv4 } from 'uuid';

const container = new Container();

/**
 * Validates environment variables and determines the runtime operational mode
 */
function validateAndDetectMode(): RuntimeMode {
  if (process.env.MASTER_KEY && process.env.SKILL_KEY) {
    console.warn('SKILL_KEY provided -> ignoring MASTER_KEY');
    delete process.env.MASTER_KEY;
  } else if (process.env.SYSTEM_KEY && process.env.RUNTIME_KEY) {
    console.warn('RUNTIME_KEY provided -> ignoring SYSTEM_KEY');
    delete process.env.SYSTEM_KEY;
  } else if (process.env.SYSTEM_KEY && process.env.WORKSPACE_KEY) {
    console.warn('WORKSPACE_KEY provided -> ignoring SYSTEM_KEY');
    delete process.env.SYSTEM_KEY;
  }

  // Get keys from environment variables
  const systemKey = process.env.SYSTEM_KEY;
  const workspaceKey = process.env.WORKSPACE_KEY;
  const skillKey = process.env.SKILL_KEY;
  const runtimeKey = process.env.RUNTIME_KEY;

  // Get names from environment variables
  const skillName = process.env.SKILL_NAME;
  const runtimeName = process.env.RUNTIME_NAME;

  // Get remote port from environment variables
  const remotePort = process.env.REMOTE_PORT;

  // Keys are mutually exclusive
  const keyVariables = [systemKey, workspaceKey, skillKey, runtimeKey];
  const keyVariablesSet = keyVariables.filter((key) => !!key);
  if (keyVariablesSet.length > 1) {
    throw new Error(
      `Invalid configuration: Only one of SYSTEM_KEY, WORKSPACE_KEY, SKILL_KEY, or RUNTIME_KEY can be set but found values for ${keyVariablesSet.join(', ')}`,
    );
  }

  // Validate name with their respective keys
  if (systemKey) {
    if (!runtimeName) {
      throw new Error('Invalid configuration: SYSTEM_KEY requires RUNTIME_NAME');
    }
  }

  if (workspaceKey) {
    if (!skillName) {
      throw new Error('Invalid configuration: WORKSPACE_KEY requires SKILL_NAME');
    }
  }

  // Validate mutually exclusive environment variables
  if (remotePort && (skillName || skillKey)) {
    throw new Error(
      'Invalid configuration: REMOTE_PORT is mutually exclusive with SKILL_NAME and SKILL_KEY. ' +
        'Please use only REMOTE_PORT for edge runtimes',
    );
  }

  // Runtime and skill cannot be set at the same time
  if ((runtimeName || runtimeKey) && (skillName || skillKey)) {
    throw new Error('Invalid configuration: trying to start both a runtime and a skill, this is not supported');
  }

  // Determine mode and runtime type based on environment variables
  if (skillName || skillKey) {
    return 'MCP_STDIO';
  } else if (runtimeName || runtimeKey) {
    if (remotePort) {
      return 'EDGE_MCP_STREAM';
    }
    return 'EDGE';
  } else if (remotePort) {
    return 'STANDALONE_MCP_STREAM';
  } else {
    throw new Error(
      'Invalid configuration: At least one of SKILL_NAME, SKILL_KEY, RUNTIME_NAME, RUNTIME_KEY, or REMOTE_PORT must be set. ' +
        'See documentation for valid operational modes.',
    );
  }
}

const start = () => {
  // Validate environment variables and detect operational mode
  const mode = validateAndDetectMode();

  // Bind mode and type for other services to use
  container.bind(RUNTIME_MODE).toConstantValue(mode);

  // Init auth service
  container.bind(AuthService).toSelf().inSingletonScope();

  // Conditionally bind MCP services based on mode
  if (mode === 'MCP_STDIO') {
    // Stdio mode: bind McpStdioService
    container.bind(McpStdioService).toSelf().inSingletonScope();
    container.bind<FastifyManagerService | undefined>(FastifyManagerService).toConstantValue(undefined);
    container.bind<McpSseService | undefined>(McpSseService).toConstantValue(undefined);
    container.bind<McpStreamableService | undefined>(McpStreamableService).toConstantValue(undefined);
  } else if (mode === 'EDGE_MCP_STREAM' || mode === 'STANDALONE_MCP_STREAM') {
    // Remote mode: bind FastifyManager and both transport services
    container.bind(FastifyManagerService).toSelf().inSingletonScope();
    container.bind(McpSseService).toSelf().inSingletonScope();
    container.bind(McpStreamableService).toSelf().inSingletonScope();
    container.bind<McpStdioService | undefined>(McpStdioService).toConstantValue(undefined);
  } else {
    // EDGE mode: no MCP services
    container.bind<McpStdioService | undefined>(McpStdioService).toConstantValue(undefined);
    container.bind<FastifyManagerService | undefined>(FastifyManagerService).toConstantValue(undefined);
    container.bind<McpSseService | undefined>(McpSseService).toConstantValue(undefined);
    container.bind<McpStreamableService | undefined>(McpStreamableService).toConstantValue(undefined);
  }

  // Conditionally bind Tool service (Mode 1, 2, 3)
  if (mode !== 'STANDALONE_MCP_STREAM') {
    container.bind(ToolService).toSelf().inSingletonScope();
  } else {
    container.bind<ToolService | undefined>(ToolService).toConstantValue(undefined);
  }

  // Init nats service
  const runtimeId = 'runtime:' + uuidv4();
  const natsServers = process.env.NATS_SERVERS || 'localhost:4222';
  const natsName = process.env.NATS_NAME || runtimeId;
  container.bind(NATS_CONNECTION_OPTIONS).toConstantValue({
    servers: natsServers,
    name: natsName,
    reconnect: true,
    maxReconnectAttempts: -1,
    reconnectTimeWait: 1000,
  });
  container.bind(NatsService).toSelf().inSingletonScope();

  // Init cache service
  // Build cache service config with all initial buckets
  const cacheServiceConfig: CacheServiceConfig = {
    initialBuckets: [
      {
        name: CACHE_BUCKETS.HEARTBEAT,
        ttlMs: parseInt(process.env.HEARTBEAT_CACHE_TTL || '') || CACHE_BUCKET_TTLS.HEARTBEAT,
      },
      {
        name: CACHE_BUCKETS.EPHEMERAL,
        ttlMs: parseInt(process.env.EPHEMERAL_CACHE_TTL || '') || CACHE_BUCKET_TTLS.EPHEMERAL,
      },
      {
        name: CACHE_BUCKETS.OAUTH_NONCE,
        ttlMs: parseInt(process.env.OAUTH_NONCE_CACHE_TTL || '') || CACHE_BUCKET_TTLS.OAUTH_NONCE,
      },
      {
        name: CACHE_BUCKETS.RATE_LIMIT_KEY,
        ttlMs: parseInt(process.env.RATE_LIMIT_KEY_CACHE_TTL || '') || CACHE_BUCKET_TTLS.RATE_LIMIT_KEY,
      },
      {
        name: CACHE_BUCKETS.RATE_LIMIT_IP,
        ttlMs: parseInt(process.env.RATE_LIMIT_IP_CACHE_TTL || '') || CACHE_BUCKET_TTLS.RATE_LIMIT_IP,
      },
    ],
  };
  container.bind(CACHE_SERVICE_CONFIG).toConstantValue(cacheServiceConfig);
  container.bind(CACHE_SERVICE).to(NatsCacheService).inSingletonScope();
  container.bind(NatsCacheService).toSelf().inSingletonScope();

  // Init health service
  container.bind(HEARTBEAT_INTERVAL).toConstantValue(process.env.HEARTBEAT_INTERVAL || '5000');
  container.bind(HealthService).toSelf().inSingletonScope();

  // Init main service
  container.bind(MainService).toSelf().inSingletonScope();

  // Init logger service
  // LOG_LEVEL: Default level for all loggers (e.g., 'info', 'debug', 'warn')
  // LOG_LEVELS: Pattern-based configuration (e.g., 'mcp.*=debug,tool.*=trace')
  container.bind(MAIN_LOGGER_NAME).toConstantValue(runtimeId);
  container.bind(FORWARD_STDERR).toConstantValue(process.env.FORWARD_STDERR === 'false' ? false : true);
  container.bind(LOG_LEVEL).toConstantValue(process.env.LOG_LEVEL || 'info');
  container.bind(LOG_LEVELS).toConstantValue(process.env.LOG_LEVELS);
  container.bind(LoggerService).toSelf().inSingletonScope();

  // Init MCP server service factory
  container.bind<ToolServerServiceFactory>(ToolServerService).toFactory((context) => {
    return (config: dgraphResolversTypes.McpServer, roots: { name: string; uri: string }[]) => {
      const logger = context.get(LoggerService).getLogger(`tool.server.${config.name}`);
      return new ToolServerService(logger, config, roots);
    };
  });

  // Init AI provider service
  container.bind(AIProviderService).toSelf().inSingletonScope();

  // Init smart skill service factory
  container.bind<ToolSmartSkillServiceFactory>(ToolSmartSkillService).toFactory((context) => {
    return (config: RuntimeSmartSkill) => {
      const logger = context.get(LoggerService).getLogger(`tool.smart-skill.${config.name}`);
      logger.level = process.env.LOG_LEVEL_TOOL_SMART_SKILL || 'info';
      const aiProviderService = context.get(AIProviderService);
      return new ToolSmartSkillService(logger, config, aiProviderService);
    };
  });
};

export { container, start };
