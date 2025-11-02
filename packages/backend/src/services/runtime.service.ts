import { inject, injectable } from 'inversify';
import {
  LoggerService,
  NatsErrorMessage,
  NatsMessage,
  NatsService,
  Service,
  UpdateMcpToolsMessage,
  dgraphResolversTypes,
  AckMessage,
  RUNTIME_SUBJECT,
  NatsRequest,
  RuntimeConnectMessage,
  RuntimeReconnectMessage,
} from '@2ly/common';
import { DGraphService } from './dgraph.service';
import pino from 'pino';

import { type RuntimeInstanceFactory, RuntimeInstance } from './runtime.instance';
import {
  MCPServerRepository,
  RuntimeRepository,
  WorkspaceRepository,
  SystemRepository,
} from '../repositories';
import { gql } from 'urql';

export const DROP_ALL_DATA = 'dropAllData';

@injectable()
export class RuntimeService extends Service {
  name = 'runtime';
  private logger: pino.Logger;

  private subscriptions: { unsubscribe: () => void; drain: () => Promise<void>; isClosed: () => boolean }[] = [];
  private runtimeInstances: Map<string, RuntimeInstance> = new Map();

  @inject(DROP_ALL_DATA)
  private dropAllData!: boolean;

  constructor(
    @inject(LoggerService) private loggerService: LoggerService,
    @inject(DGraphService) private dgraphService: DGraphService,
    @inject(NatsService) private natsService: NatsService,
    @inject(RuntimeInstance) private runtimeInstanceFactory: RuntimeInstanceFactory,
    @inject(MCPServerRepository) private mcpServerRepository: MCPServerRepository,
    @inject(RuntimeRepository) private runtimeRepository: RuntimeRepository,
    @inject(WorkspaceRepository) private workspaceRepository: WorkspaceRepository,
    @inject(SystemRepository) private systemRepository: SystemRepository,
  ) {
    super();
    this.logger = this.loggerService.getLogger(this.name);
  }

  protected async initialize() {
    this.logger.info('Starting');
    await this.startService(this.dgraphService);
    await this.dgraphService.initSchema(this.dropAllData);
    await this.startService(this.natsService);
    await this.rehydrateRuntimes();
    this.subscribeToRuntime();
  }

  protected async shutdown() {
    this.logger.info('Stopping');
    for (const subscription of this.subscriptions) {
      try {
        if (!subscription.isClosed()) {
          await subscription.drain();
        }
      } catch (error) {
        this.logger.error(`Failed to drain subscription with error ${error}`);
      }
    }
    this.subscriptions = [];
    for (const runtimeInstance of this.runtimeInstances.values()) {
      await runtimeInstance.stop('runtime');
    }
    this.runtimeInstances.clear();
    await this.stopService(this.natsService);
    await this.stopService(this.dgraphService);
  }

  isRunning(): boolean {
    return this.natsService.isConnected() && this.dgraphService.isConnected();
  }

  async rehydrateRuntimes() {
    this.logger.info('Rehydrating runtimes');
    // fetch all active runtimes
    const activeRuntimes = await this.runtimeRepository.findActive();
    this.logger.debug(`Found ${activeRuntimes?.length} active runtimes: ${JSON.stringify(activeRuntimes.map((r) => r.id), null, 2)}`);
    // identify which runtime is active (has a heartbeat)
    const heartbeatKeys = await this.natsService.heartbeatKeys();
    this.logger.debug(`Found ${heartbeatKeys?.length} heartbeat keys: ${JSON.stringify(heartbeatKeys, null, 2)}`);
    const aliveRuntimes: Set<string> = new Set();
    let nbHydratedRuntimes = 0;
    let nbMarkedInactiveRuntimes = 0;
    for (const key of heartbeatKeys) {
      // hydrate active runtime
      const [runtimeId, pid] = key.split('-');
      aliveRuntimes.add(runtimeId);
      const runtime = activeRuntimes?.find((r) => r.id === runtimeId);
      if (runtime) {
        this.logger.debug(`Hydrating runtime ${key}`);
        nbHydratedRuntimes++;
        const runtimeInstance = this.runtimeInstanceFactory(
          runtime,
          {
            RID: key,
            pid: pid,
            hostIP: runtime.hostIP ?? '',
            hostname: runtime.hostname ?? '',
            mcpClientName: runtime.mcpClientName ?? '',
          },
          () => {
            this.runtimeInstances.set(key, runtimeInstance);
          },
          () => {
            runtimeInstance.stop('runtime');
            this.runtimeInstances.delete(key);
          },
        )
      }
    }
    // mark inactive runtimes
    for (const runtime of activeRuntimes ?? []) {
      this.logger.debug(`Marking runtime ${runtime.id} as inactive`);
      if (!aliveRuntimes.has(runtime.id)) {
        await this.runtimeRepository.setInactive(runtime.id);
        nbMarkedInactiveRuntimes++;
      }
    }
    this.logger.info(`Hydrated ${nbHydratedRuntimes} runtimes and marked ${nbMarkedInactiveRuntimes} runtimes as inactive`);
  }

  async createRuntime(
    workspaceId: string,
    name: string,
    processId: string,
    hostIP: string,
    hostname: string,
    type: 'EDGE' | 'MCP',
  ) {
    this.logger.debug(`Creating runtime ${name}`);
    const runtime = await this.runtimeRepository.create(name, '', 'ACTIVE', workspaceId, type);
    return this.runtimeRepository.setActive(runtime.id, processId, hostIP, hostname);
  }

  async setRuntimeActive(
    runtimeId: string,
    processId: string,
    hostIP: string,
    hostname: string,
  ) {
    this.logger.debug(`Updating runtime ${runtimeId} status to ACTIVE`);
    return this.runtimeRepository.setActive(runtimeId, processId, hostIP, hostname);
  }

  async disconnectRuntime(runtimeId: string) {
    this.logger.debug(`Disconnecting runtime ${runtimeId}`);
    const response = (await this.runtimeRepository.setInactive(runtimeId)) as dgraphResolversTypes.Runtime;
    return response;
  }

  async resetRuntimes() {
    this.logger.info('Resetting all runtime instances');

    // Stop all runtime instances
    for (const runtimeInstance of this.runtimeInstances.values()) {
      await runtimeInstance.stop('runtime');
    }

    // Clear the runtime instances map
    this.runtimeInstances.clear();
    this.logger.info('Cleared runtime instances map');

    // Clear NATS heartbeat KV bucket
    await Promise.all([
      this.natsService.clearHeartbeatKeys(),
      this.natsService.clearEphemeralKeys()
    ]);

    // Publish RuntimeReconnectMessage to all connected runtimes
    const reconnectMessage = new RuntimeReconnectMessage({
      reason: 'Backend reset - please reconnect',
    });
    this.natsService.publish(reconnectMessage);
    this.logger.info('Published RuntimeReconnectMessage to all runtimes');
  }

  async upsertTool(
    mcpServerId: string,
    toolName: string,
    toolDescription: string,
    toolInputSchema: string,
    toolAnnotations: string,
  ) {
    this.logger.debug(`Upserting tool ${toolName} for MCP Server ${mcpServerId}`);
    await this.runtimeRepository.upserTool(
      mcpServerId,
      toolName,
      toolDescription,
      toolInputSchema,
      toolAnnotations,
    );
  }

  async disconnectTool(toolId: string): Promise<void> {
    this.logger.debug(`Disconnecting tool ${toolId}`);
    const toolMutation = gql`
      mutation {
        updateTool(input: { filter: { id: [${toolId}] }, set: { status: INACTIVE } }) {
          tool {
            id
            name
            status
          }
        }
      }
    `;
    const toolResponse = (await this.dgraphService.mutation(toolMutation, {})) as {
      updateTool: {
        tool: { id: string; name: string; status: string };
      };
    };
    this.logger.debug(`Disconnected tool: ${JSON.stringify(toolResponse, null, 2)}`);
  }

  async getRuntimeByName(workspaceId: string, name: string) {
    return this.runtimeRepository.findByName(workspaceId, name);
  }

  private async subscribeToRuntime() {
    this.logger.debug(`Subscribing to runtime messages`);
    const subscription = this.natsService.subscribe(`${RUNTIME_SUBJECT}.*`);
    this.subscriptions.push(subscription);
    for await (const msg of subscription) {
      try {
        await this.handleRuntimeMessage(msg);
      } catch (error) {
        this.logger.error(`Error handling runtime message ${msg.type}: ${error}`);
        if (msg instanceof NatsRequest && msg.shouldRespond() && error instanceof Error) {
          const response = new NatsErrorMessage({ error: error.message });
          msg.respond(response);
        }
      }
    }
  }

  private async getWorkspace(workspaceId: string) {
    if (workspaceId !== 'DEFAULT') {
      return this.workspaceRepository.findById(workspaceId);
    } else {
      return this.systemRepository.getDefaultWorkspace();
    }
  }

  private async handleRuntimeMessage(msg: NatsMessage): Promise<void> {
    this.logger.debug(`Handling ${msg.type} message: ${JSON.stringify(msg.data, null, 2)?.slice(0, 100)}...`);
    if (msg instanceof RuntimeConnectMessage) {
      const workspace = await this.getWorkspace(msg.data.workspaceId);
      if (!workspace) {
        throw new Error(`Workspace ${msg.data.workspaceId} not found`);
      }
      let instance = await this.runtimeRepository.findByName(workspace.id, msg.data.name);
      if (!instance) {
        // Use the runtime type specified in the connect message
        // The runtime determines its own type based on environment variables
        instance = await this.runtimeRepository.create(msg.data.name, '', 'ACTIVE', workspace.id, msg.data.type);
      }
      // Runtime ID is a unique identifier for the runtime, including its process id
      const RID = `${instance.id}-${msg.data.pid}`;
      if (this.runtimeInstances.has(RID)) {
        msg.respond(new NatsErrorMessage({ error: `Runtime ${msg.data.name} already connected with process id ${msg.data.pid}` }));
      } else {
        const runtimeInstance = this.runtimeInstanceFactory(
          instance,
          {
            RID: RID,
            pid: msg.data.pid,
            hostIP: msg.data.hostIP,
            hostname: msg.data.hostname,
            mcpClientName: msg.data.name || 'unknown',
          }, () => {
            this.runtimeInstances.set(RID, runtimeInstance);
            msg.respond(new AckMessage({ metadata: { RID: RID, workspaceId: workspace.id, id: instance.id } }));
          }, () => {
            runtimeInstance.stop('runtime');
            this.runtimeInstances.delete(RID);
          });
      }
    } else if (msg instanceof UpdateMcpToolsMessage) {
      this.logger.debug(
        `Updating MCP Tools for MCP Server ${msg.data.mcpServerId} with ${msg.data.tools.length} tools`,
      );

      // fetch current capabilities
      const currentTools = await this.mcpServerRepository.getTools(msg.data.mcpServerId);

      // identify tools that are not in the current list -> must be disconnected
      const toolsToDisconnect =
        currentTools?.tools?.filter((tool) => !msg.data.tools.some((t) => t.name === tool.name)) ??
        [];
      // disconnect tools
      for (const tool of toolsToDisconnect) {
        await this.disconnectTool(tool.id);
      }

      // upsert tools
      for (const tool of msg.data.tools) {
        await this.upsertTool(
          msg.data.mcpServerId,
          tool.name,
          tool.description ?? '',
          JSON.stringify(tool.inputSchema ?? {}),
          JSON.stringify(tool.annotations ?? {}),
        );
      }
      return;
    } else if (msg instanceof NatsErrorMessage) {
      this.logger.error(`Error message received. ${msg.getSubject()}: ${msg.data.error}`);
      return;
    } else {
      throw new Error(`Unknown message type: ${msg.type}`);
    }
  }
}
