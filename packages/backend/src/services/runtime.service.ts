import { inject, injectable } from 'inversify';
import {
  LoggerService,
  NatsService,
  Service,
  RuntimeDiscoveredToolsPublish,
  RuntimeReconnectPublish,
} from '@2ly/common';
import { DGraphService } from './dgraph.service';
import pino from 'pino';
import { IdentityService } from './identity.service';
import { type RuntimeInstanceFactory, RuntimeInstance } from './runtime.instance';
import {
  MCPServerRepository,
  RuntimeRepository,
} from '../repositories';
import { gql } from 'urql';
import { RuntimeHandshakeIdentity } from '../types';

@injectable()
export class RuntimeService extends Service {
  name = 'runtime';
  private logger: pino.Logger;

  private subscriptions: { unsubscribe: () => void; drain: () => Promise<void>; isClosed: () => boolean }[] = [];
  private runtimeInstances: Map<string, RuntimeInstance> = new Map();
  private runtimeHandshakeCallbackId?: string;

  constructor(
    @inject(LoggerService) private loggerService: LoggerService,
    @inject(DGraphService) private dgraphService: DGraphService,
    @inject(NatsService) private natsService: NatsService,
    @inject(IdentityService) private identityService: IdentityService,
    @inject(RuntimeInstance) private runtimeInstanceFactory: RuntimeInstanceFactory,
    @inject(MCPServerRepository) private mcpServerRepository: MCPServerRepository,
    @inject(RuntimeRepository) private runtimeRepository: RuntimeRepository,
  ) {
    super();
    this.logger = this.loggerService.getLogger(this.name);
  }

  protected async initialize() {
    this.logger.info('Starting');
    await this.startService(this.dgraphService);
    await this.startService(this.natsService);
    await this.rehydrateRuntimes();
    // listen for runtime handshakes and create runtime instances on the fly when connecting
    this.runtimeHandshakeCallbackId = this.identityService.onHandshake('runtime', (identity: RuntimeHandshakeIdentity) => {
      const instance = identity.instance;
      const metadata = {pid: identity.pid, hostIP: identity.hostIP, hostname: identity.hostname};
      const runtimeInstance = this.runtimeInstanceFactory(
        instance,
        metadata, () => {
          this.runtimeInstances.set(instance.id, runtimeInstance);
        }, () => {
          runtimeInstance.stop('runtime');
          this.runtimeInstances.delete(instance.id);
        }
      );
    });
    this.handleDiscoveredTools();
  }

  protected async shutdown() {
    this.logger.info('Stopping');
    // Unregister handshake callback
    if (this.runtimeHandshakeCallbackId) {
      this.identityService.offHandshake('runtime', this.runtimeHandshakeCallbackId);
      this.runtimeHandshakeCallbackId = undefined;
    }
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
    this.logger.info('Stopped');
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
      const runtimeId = key;
      aliveRuntimes.add(runtimeId);
      const runtime = activeRuntimes?.find((r) => r.id === runtimeId);
      if (runtime) {
        this.logger.debug(`Hydrating runtime ${key}`);
        nbHydratedRuntimes++;
        const runtimeInstance = this.runtimeInstanceFactory(
          runtime,
          {
            pid: runtime.processId ?? '',
            hostIP: runtime.hostIP ?? '',
            hostname: runtime.hostname ?? '',
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

  /**
   * Notify all runtime instances to reconnect
   */
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
    const reconnectMessage = new RuntimeReconnectPublish({
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
    return this.runtimeRepository.findByName('workspace', workspaceId, name);
  }

  private handleDiscoveredTools() {
    this.logger.debug(`Subscribing to discovered tools messages`);
    const subscription = this.natsService.subscribe(RuntimeDiscoveredToolsPublish.subscribeToAll());
    this.subscriptions.push(subscription);

    (async () => {
      for await (const msg of subscription) {
        try {
          if (msg instanceof RuntimeDiscoveredToolsPublish) {
            this.logger.debug(`${msg.data.mcpServerId} discovered ${msg.data.tools.length} tools`);
      
            // fetch current tools
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
          } else {
            throw new Error(`Unknown message type: ${msg.type}`);
          }
        } catch (error) {
          this.logger.error(`Error handling discovered tools message ${msg.type}: ${error}`);
        }
      }
    })();
  }
}
