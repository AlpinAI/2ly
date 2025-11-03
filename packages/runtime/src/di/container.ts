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
  IDENTITY_NAME,
  WORKSPACE_ID,
  AGENT_CAPABILITY,
  TOOL_CAPABILITY,
} from '../services/auth.service';
import { HealthService, HEARTBEAT_INTERVAL } from '../services/runtime.health.service';
import { ToolClientService } from '../services/tool.client.service';
import { ToolServerService, type ToolServerServiceFactory } from '../services/tool.server.service';
import { ROOTS, ToolService, GLOBAL_RUNTIME } from '../services/tool.service';
import { McpServerService } from '../services/mcp.server.service';
import { RUNTIME_MODE, RUNTIME_TYPE, type RuntimeMode, type RuntimeType } from './symbols';
import pino from 'pino';

const container = new Container();

/**
 * Validates environment variables and determines the runtime operational mode
 */
function validateAndDetectMode(): { mode: RuntimeMode; runtimeType: RuntimeType; runtimeName: string } {
  const toolSet = process.env.TOOL_SET;
  const runtimeName = process.env.RUNTIME_NAME;
  const remotePort = process.env.REMOTE_PORT;

  // Validate mutually exclusive environment variables
  if (toolSet && (runtimeName || remotePort)) {
    throw new Error(
      'Invalid configuration: TOOL_SET is mutually exclusive with RUNTIME_NAME and REMOTE_PORT. ' +
        'Please use only TOOL_SET for MCP stdio mode, or RUNTIME_NAME/REMOTE_PORT for edge modes.',
    );
  }

  // Determine mode and runtime type based on environment variables
  if (toolSet) {
    // Mode 1: MCP stdio (TOOL_SET only)
    return {
      mode: 'MCP_STDIO',
      runtimeType: 'MCP',
      runtimeName: `mcp:${toolSet}`,
    };
  } else if (runtimeName && remotePort) {
    // Mode 3: Edge + MCP stream (RUNTIME_NAME + REMOTE_PORT)
    return {
      mode: 'EDGE_MCP_STREAM',
      runtimeType: 'EDGE',
      runtimeName,
    };
  } else if (runtimeName) {
    // Mode 2: Edge (RUNTIME_NAME only)
    return {
      mode: 'EDGE',
      runtimeType: 'EDGE',
      runtimeName,
    };
  } else if (remotePort) {
    // Mode 4: Standalone MCP stream (REMOTE_PORT only)
    return {
      mode: 'STANDALONE_MCP_STREAM',
      runtimeType: 'MCP',
      runtimeName: 'standalone-mcp',
    };
  } else {
    throw new Error(
      'Invalid configuration: At least one of TOOL_SET, RUNTIME_NAME, or REMOTE_PORT must be set. ' +
        'See documentation for valid operational modes.',
    );
  }
}

const start = () => {
  // Validate environment variables and detect operational mode
  const { mode, runtimeType, runtimeName } = validateAndDetectMode();

  // Bind mode and type for other services to use
  container.bind(RUNTIME_MODE).toConstantValue(mode);
  container.bind(RUNTIME_TYPE).toConstantValue(runtimeType);

  container.bind(WORKSPACE_ID).toConstantValue(process.env.WORKSPACE_ID || 'DEFAULT');

  // Init identity service
  container.bind(IDENTITY_NAME).toConstantValue(runtimeName);
  // by default, all runtimes have the tool capability
  container.bind(TOOL_CAPABILITY).toConstantValue(process.env.TOOL_CAPABILITY === 'false' ? false : true);
  // by default, runtimes don't have the agent capability but get it as soon as an agent is detected
  // - detection is currently done when an MCP client launches the agent runtime and try to initialize the agent server
  container.bind(AGENT_CAPABILITY).toConstantValue(process.env.AGENT_CAPABILITY === 'true' ? true : 'auto');

  container.bind(AuthService).toSelf().inSingletonScope();

  // Conditionally bind MCP server service (Mode 1, 3, 4)
  if (mode === 'MCP_STDIO' || mode === 'EDGE_MCP_STREAM' || mode === 'STANDALONE_MCP_STREAM') {
    container.bind(McpServerService).toSelf().inSingletonScope();
  } else {
    container.bind<McpServerService | undefined>(McpServerService).toConstantValue(undefined);
  }

  // Conditionally bind Tool service (Mode 1, 2, 3)
  if (mode !== 'STANDALONE_MCP_STREAM') {
    container.bind(ToolService).toSelf().inSingletonScope();
  } else {
    container.bind<ToolService | undefined>(ToolService).toConstantValue(undefined);
  }

  // Init nats service
  const natsServers = process.env.NATS_SERVERS || 'localhost:4222';
  const natsName = process.env.NATS_NAME || 'runtime:' + runtimeName;
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
  container.bind(ROOTS).toConstantValue(process.env.ROOTS || undefined);
  container.bind(GLOBAL_RUNTIME).toConstantValue(process.env.GLOBAL_RUNTIME === 'true');
  container.bind(ToolClientService).toSelf().inSingletonScope();

  // Init health service
  container.bind(HEARTBEAT_INTERVAL).toConstantValue(process.env.HEARTBEAT_INTERVAL || '5000');
  container.bind(HealthService).toSelf().inSingletonScope();

  // Init main service
  container.bind(MainService).toSelf().inSingletonScope();

  // Init logger service
  const defaultLevel = 'info';
  container.bind(MAIN_LOGGER_NAME).toConstantValue(`${runtimeName}`);
  container.bind(FORWARD_STDERR).toConstantValue(process.env.FORWARD_STDERR === 'false' ? false : true);
  container.bind(LOG_LEVEL).toConstantValue(process.env.LOG_LEVEL || defaultLevel);
  container.bind(LoggerService).toSelf().inSingletonScope();

  // Set child log levels
  const loggerService = container.get(LoggerService);
  loggerService.setLogLevel('main', (process.env.LOG_LEVEL_MAIN || 'info') as pino.Level);
  loggerService.setLogLevel('nats', (process.env.NATS_LOG_LEVEL || 'info') as pino.Level);
  loggerService.setLogLevel('mcp-server', (process.env.LOG_LEVEL_MCP_SERVER || 'info') as pino.Level);
  loggerService.setLogLevel('tool', (process.env.LOG_LEVEL_TOOL || 'info') as pino.Level);
  loggerService.setLogLevel('tool.client', (process.env.LOG_LEVEL_TOOL_CLIENT || 'info') as pino.Level);
  loggerService.setLogLevel('health', (process.env.LOG_LEVEL_HEALTH || 'info') as pino.Level);

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
