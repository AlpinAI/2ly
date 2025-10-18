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
  IdentityService,
  IDENTITY_NAME,
  WORKSPACE_ID,
  AGENT_CAPABILITY,
  TOOL_CAPABILITY,
} from '../services/identity.service';
import { HealthService, HEARTBEAT_INTERVAL } from '../services/runtime.health.service';
import { ToolClientService } from '../services/tool.client.service';
import { ToolServerService, type ToolServerServiceFactory } from '../services/tool.server.service';
import { ROOTS, ToolService, GLOBAL_RUNTIME } from '../services/tool.service';
import { AgentService } from '../services/agent.service';
import {
  AgentServerService,
  AGENT_SERVER_TRANSPORT,
  AGENT_SERVER_TRANSPORT_PORT,
} from '../services/agent.server.service';
import pino from 'pino';

const container = new Container();
const start = () => {
  container.bind(WORKSPACE_ID).toConstantValue(process.env.WORKSPACE_ID || 'DEFAULT');

  // Init identity service
  const runtimeName = process.env.RUNTIME_NAME;
  if (!runtimeName) {
    throw new Error('RUNTIME_NAME is not set');
  }
  container.bind(IDENTITY_NAME).toConstantValue(runtimeName);
  // by default, all runtimes have the tool capability
  container.bind(TOOL_CAPABILITY).toConstantValue(process.env.TOOL_CAPABILITY === 'false' ? false : true);
  // by default, runtimes don't have the agent capability but get it as soon as an agent is detected
  // - detection is currently done when an MCP client launches the agent runtime and try to initialize the agent server
  container.bind(AGENT_CAPABILITY).toConstantValue(process.env.AGENT_CAPABILITY === 'true' ? true : 'auto');

  container.bind(IdentityService).toSelf().inSingletonScope();

  container.bind(AgentService).toSelf().inSingletonScope();

  container.bind(ToolService).toSelf().inSingletonScope();

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

  // Init agent server service
  container.bind(AGENT_SERVER_TRANSPORT).toConstantValue(process.env.AGENT_SERVER_TRANSPORT || 'stdio');
  container.bind(AGENT_SERVER_TRANSPORT_PORT).toConstantValue(process.env.AGENT_SERVER_TRANSPORT_PORT || '3000');
  container.bind(AgentServerService).toSelf().inSingletonScope();

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
  loggerService.setLogLevel('agent', (process.env.LOG_LEVEL_AGENT || 'info') as pino.Level);
  loggerService.setLogLevel('agent.server', (process.env.LOG_LEVEL_AGENT_SERVER || 'info') as pino.Level);
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
