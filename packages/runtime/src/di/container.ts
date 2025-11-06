import { Container } from 'inversify';
import {
  NatsService,
  NATS_CONNECTION_OPTIONS,
  LoggerService,
  LOG_LEVEL,
  MAIN_LOGGER_NAME,
  dgraphResolversTypes,
  FORWARD_STDERR,
  HEARTBAT_TTL,
  DEFAULT_HEARTBAT_TTL,
  EPHEMERAL_TTL,
  DEFAULT_EPHEMERAL_TTL,
} from '@2ly/common';
import { MainService } from '../services/runtime.main.service';
import {
  AuthService,
} from '../services/auth.service';
import { HealthService, HEARTBEAT_INTERVAL } from '../services/runtime.health.service';
import { ToolClientService } from '../services/tool.client.service';
import { ToolServerService, type ToolServerServiceFactory } from '../services/tool.server.service';
import { ToolService } from '../services/tool.service';
import { McpStdioService } from '../services/mcp.stdio.service';
import { McpRemoteService } from '../services/mcp.remote.service';
import { type RuntimeMode, RUNTIME_MODE } from './symbols';
import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';

const container = new Container();

/**
 * Validates environment variables and determines the runtime operational mode
 */
function validateAndDetectMode(): RuntimeMode {
  const remotePort = process.env.REMOTE_PORT;
  const masterKey = process.env.MASTER_KEY;
  const toolsetName = process.env.TOOLSET_NAME;
  const runtimeName = process.env.RUNTIME_NAME;
  const toolsetKey = process.env.TOOLSET_KEY;
  const runtimeKey = process.env.RUNTIME_KEY;

  // Keys are mutually exclusive
  const keyVariables = [masterKey, toolsetKey, runtimeKey];
  const keyVariablesSetCount = keyVariables.filter((key) => !!key).length;
  if (keyVariablesSetCount > 1) {
    throw new Error('Invalid configuration: Only one of MASTER_KEY, TOOLSET_KEY, or RUNTIME_KEY can be set');
  }

  // Validate name with master key
  if (masterKey) {
    if (!toolsetName && !runtimeName) {
      throw new Error('Invalid configuration: MASTER_KEY requires TOOLSET_NAME or RUNTIME_NAME');
    }
    if (toolsetName && toolsetKey) {
      throw new Error('Invalid configuration: TOOLSET_NAME and TOOLSET_KEY are mutually exclusive');
    }
  }

  // Validate no name with toolset/runtime keys
  if ((toolsetName && toolsetKey) || (runtimeName && runtimeKey)) {
    throw new Error('Invalid configuration: TOOLSET_NAME and RUNTIME_NAME are mutually exclusive with TOOLSET_KEY and RUNTIME_KEY');
  }

  // Validate mutually exclusive environment variables
  if (remotePort && (toolsetName || toolsetKey)) {
    throw new Error(
      'Invalid configuration: REMOTE_PORT is mutually exclusive with TOOLSET_NAME and TOOLSET_KEY. ' +
        'Please use only REMOTE_PORT for edge runtimes',
    );
  }

  // Determine mode and runtime type based on environment variables
  if (toolsetName || toolsetKey) {
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
      'Invalid configuration: At least one of TOOL_SET, RUNTIME_NAME, or REMOTE_PORT must be set. ' +
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
    container.bind<McpRemoteService | undefined>(McpRemoteService).toConstantValue(undefined);
  } else if (mode === 'EDGE_MCP_STREAM' || mode === 'STANDALONE_MCP_STREAM') {
    // Remote mode: bind McpRemoteService
    container.bind(McpRemoteService).toSelf().inSingletonScope();
    container.bind<McpStdioService | undefined>(McpStdioService).toConstantValue(undefined);
  } else {
    // EDGE mode: no MCP services
    container.bind<McpStdioService | undefined>(McpStdioService).toConstantValue(undefined);
    container.bind<McpRemoteService | undefined>(McpRemoteService).toConstantValue(undefined);
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
  container.bind(HEARTBAT_TTL).toConstantValue(process.env.HEARTBAT_TTL || DEFAULT_HEARTBAT_TTL);
  container.bind(EPHEMERAL_TTL).toConstantValue(process.env.EPHEMERAL_TTL || DEFAULT_EPHEMERAL_TTL);
  container.bind(NatsService).toSelf().inSingletonScope();

  // Init tool client service
  container.bind(ToolClientService).toSelf().inSingletonScope();

  // Init health service
  container.bind(HEARTBEAT_INTERVAL).toConstantValue(process.env.HEARTBEAT_INTERVAL || '5000');
  container.bind(HealthService).toSelf().inSingletonScope();

  // Init main service
  container.bind(MainService).toSelf().inSingletonScope();

  // Init logger service
  const defaultLevel = 'info';
  container.bind(MAIN_LOGGER_NAME).toConstantValue(runtimeId);
  container.bind(FORWARD_STDERR).toConstantValue(process.env.FORWARD_STDERR === 'false' ? false : true);
  container.bind(LOG_LEVEL).toConstantValue(process.env.LOG_LEVEL || defaultLevel);
  container.bind(LoggerService).toSelf().inSingletonScope();

  // Set child log levels
  const loggerService = container.get(LoggerService);
  loggerService.setLogLevel('main', (process.env.LOG_LEVEL_MAIN || 'info') as pino.Level);
  loggerService.setLogLevel('auth', (process.env.LOG_LEVEL_AUTH || 'info') as pino.Level);
  loggerService.setLogLevel('health', (process.env.LOG_LEVEL_HEALTH || 'info') as pino.Level);
  loggerService.setLogLevel('nats', (process.env.NATS_LOG_LEVEL || 'info') as pino.Level);
  loggerService.setLogLevel('mcp-server', (process.env.LOG_LEVEL_MCP_SERVER || 'info') as pino.Level);
  loggerService.setLogLevel('mcp-stdio', (process.env.LOG_LEVEL_MCP_STDIO || 'info') as pino.Level);
  loggerService.setLogLevel('mcp-remote', (process.env.LOG_LEVEL_MCP_REMOTE || 'info') as pino.Level);
  loggerService.setLogLevel('tool', (process.env.LOG_LEVEL_TOOL || 'info') as pino.Level);
  loggerService.setLogLevel('tool.client', (process.env.LOG_LEVEL_TOOL_CLIENT || 'info') as pino.Level);
  loggerService.setLogLevel('toolset', (process.env.LOG_LEVEL_TOOLSET || 'info') as pino.Level);

  // Init MCP server service factory
  container.bind<ToolServerServiceFactory>(ToolServerService).toFactory((context) => {
    return (config: dgraphResolversTypes.McpServer, roots: { name: string; uri: string }[]) => {
      const logger = context.get(LoggerService).getLogger(`tool.server.${config.name}`);
      logger.level = process.env.LOG_LEVEL_TOOL_SERVER || 'silent';
      return new ToolServerService(logger, config, roots);
    };
  });
};

export { container, start };
