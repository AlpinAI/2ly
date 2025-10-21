import { injectable } from 'inversify';
import pino from 'pino';
import {
  dgraphResolversTypes,
  NatsService,
  Service,
  UpdateConfiguredMCPServerMessage,
  AgentCapabilitiesMessage,
  RUNTIME_SUBJECT,
  HeartbeatMessage,
  SetRuntimeCapabilitiesMessage,
  AckMessage,
  SetRootsMessage,
  SetGlobalRuntimeMessage,
  SetMcpClientNameMessage,
} from '@2ly/common';
import { RuntimeRepository, WorkspaceRepository } from '../repositories';
import { BehaviorSubject, combineLatest, debounceTime, of, Subscription, switchMap, tap } from 'rxjs';

// TODO: the "connect"/"disconnect" status is not always meaningful since we can potentially have multiple
// instances of the same runtime running with different process ids
// we should monitor by pid
// alive runtimes could also be derived by the active buckets on the bus

export const CHECK_HEARTBEAT_INTERVAL = 'check.heartbeat.interval';

export type RuntimeInstanceMetadata = {
  RID: string;
  pid: string;
  hostIP: string;
  hostname: string;
  mcpClientName: string;
};

@injectable()
export class RuntimeInstance extends Service {
  name = 'runtime-instance';
  private rxjsSubscriptions: Subscription[] = [];
  private natsSubscriptions: { unsubscribe: () => void; drain: () => Promise<void> }[] = [];
  private isGlobalRuntime: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    private logger: pino.Logger,
    private natsService: NatsService,
    private workspaceRepository: WorkspaceRepository,
    private runtimeRepository: RuntimeRepository,
    private instance: dgraphResolversTypes.Runtime,
    private metadata: RuntimeInstanceMetadata,
    private onReady: () => void,
    private onDisconnect: () => void,
  ) {
    super();
  }

  protected async initialize() {
    this.logger.info(`Initializing runtime instance: ${this.instance.id}:${this.metadata.pid}`);
    await this.runtimeRepository.setActive(
      this.instance.id,
      this.metadata.pid,
      this.metadata.hostIP,
      this.metadata.hostname,
    );
    this.observeHeartbeat();
    this.handleRuntimeMessages();
    this.observeMCPServers();
    this.observeCapabilities();
    this.onReady();
  }

  private async observeHeartbeat() {
    if (!this.instance) {
      throw new Error('Instance not initialized');
    }
    this.logger.info(`Observed heartbeat for runtime ${this.instance.id}`);
    const heartbeatSubscription = await this.natsService.observeHeartbeat(this.metadata.RID);
    this.natsSubscriptions.push(heartbeatSubscription);
    for await (const heartbeat of heartbeatSubscription) {
      if (heartbeat instanceof HeartbeatMessage) {
        this.logger.debug(`Heartbeat for runtime ${this.instance.id}: ${JSON.stringify(heartbeat, null, 2)}`);
        await this.runtimeRepository.updateLastSeen(this.instance.id);
      }
    }
    // when the heartbeatSubscription terminates it can mean two things
    // 1) The runtime instance service is shutting down (runtime is still alive and should not be *disconnected*)
    // 2) Heartbeat has been missed -> runtime must be disconnected
    if (this.state === 'STARTED') {
      await this.disconnect();
    }
  }

  private async handleRuntimeMessages() {
    if (!this.instance) {
      throw new Error('Instance not initialized');
    }
    this.logger.debug(`Listening for ${RUNTIME_SUBJECT}.${this.metadata.RID}.* messages`);
    const msgSubscription = this.natsService.subscribe(`${RUNTIME_SUBJECT}.${this.metadata.RID}.*`);
    this.natsSubscriptions.push(msgSubscription);
    for await (const message of msgSubscription) {
      if (message instanceof SetRuntimeCapabilitiesMessage) {
        const instance = await this.runtimeRepository.setCapabilities(this.instance.id, message.data.capabilities);
        message.respond(new AckMessage({ metadata: { id: instance.id, capabilities: instance.capabilities ?? [] } }));
      } else if (message instanceof SetRootsMessage) {
        const instance = await this.runtimeRepository.setRoots(this.instance.id, message.data.roots);
        message.respond(new AckMessage({ metadata: { id: instance.id, roots: instance.roots ?? [] } }));
      } else if (message instanceof SetGlobalRuntimeMessage) {
        this.logger.debug(`Setting ${this.instance.id} as global runtime`);
        await this.workspaceRepository.setGlobalRuntime(this.instance.id);
        this.isGlobalRuntime.next(true);
        message.respond(new AckMessage({}));
      } else if (message instanceof SetMcpClientNameMessage) {
        this.logger.debug(`Setting ${this.instance.id} as MCP client name`);
        await this.runtimeRepository.setMcpClientName(this.instance.id, message.data.mcpClientName);
        message.respond(new AckMessage({}));
      }
    }
  }

  private async disconnect() {
    if (!this.instance) {
      throw new Error('Instance not initialized');
    }
    this.logger.info(`Disconnecting runtime 1 ${this.metadata.RID}`);
    await this.runtimeRepository.setInactive(this.instance.id);
    this.onDisconnect();
  }

  protected async shutdown() {
    for (const subscription of this.natsSubscriptions) {
      subscription.unsubscribe();
    }
    this.natsSubscriptions = [];
    for (const subscription of this.rxjsSubscriptions) {
      subscription.unsubscribe();
    }
    this.rxjsSubscriptions = [];
  }

  /**
   * Observe the list of MCP servers that a runtime should run. This list is composed of:
   * - MCP Servers running "on the edge" with a direct link to the runtime (Runtime - (mcpServers) -> MCP Server(filter runOn: EDGE))
   * - MCP Servers running "on the agent side" AND that are linked to the runtime via an MCP Tool (Runtime - (mcpToolCapabilities) -> MCP Tool - (mcpServer) -> MCP Server)
   * - ONLY if the runtime is the global runtime, the list of MCP Servers running "on Main Runtime" with property runOn: GLOBAL
   *
   * Publish an UpdateConfiguredMCPServerMessage in the nats KV ephemeral store
   * - the message will stay in the KV ephemeral long enough to be observed by the runtime
   */
  private async observeMCPServers() {
    if (!this.instance) {
      throw new Error('Instance not initialized');
    }
    this.logger.info(`Observing MCP Servers for runtime ${this.instance.id}`);
    const runtime = await this.runtimeRepository.getRuntime(this.instance.id);
    const roots = this.runtimeRepository.observeRoots(this.instance.id);
    const edgeMcpServers = this.runtimeRepository.observeMCPServersOnEdge(this.instance.id);
    const agentMcpServers = this.runtimeRepository.observeMCPServersOnAgent(this.instance.id);
    this.isGlobalRuntime.next(runtime.workspace.globalRuntime?.id === this.instance.id);
    const globalMcpServers = this.isGlobalRuntime.pipe(
      switchMap((isGlobal) => isGlobal ? this.runtimeRepository.observeMCPServersOnGlobal(runtime.workspace.id) : of([] as dgraphResolversTypes.McpServer[])),
    );
    const subscription = combineLatest([roots, edgeMcpServers, agentMcpServers, globalMcpServers])
      .pipe(
        debounceTime(100), // debounce to avoid spamming the nats service
        tap(([roots, edgeMcpServers, agentMcpServers, globalMcpServers]) => {
          if (!this.instance) {
            // ignore
            return;
          }
          const mcpServers = [...edgeMcpServers, ...agentMcpServers, ...globalMcpServers].reduce((acc, mcpServer) => {
            if (!acc.has(mcpServer.id)) {
              acc.set(mcpServer.id, mcpServer);
            }
            return acc;
          }, new Map<string, dgraphResolversTypes.McpServer>());
          this.logger.debug(`Update with ${mcpServers.size} MCP Servers for runtime ${this.instance.id}`);
          const mcpServersMessage = UpdateConfiguredMCPServerMessage.create({
            RID: this.metadata.RID,
            roots,
            mcpServers: Array.from(mcpServers.values()),
          }) as UpdateConfiguredMCPServerMessage;

          this.natsService.publishEphemeral(mcpServersMessage);
        }),
      )
      .subscribe();

    this.rxjsSubscriptions.push(subscription);
  }

  /**
   * Observe the list of Capabilities that an agent have access to
   * - MCP Tools related with the mcpToolCapabilities edge
   * - (future) API Tools related with the apiToolCapabilities edge
   * - (future) Other types of tools
   *
   * Publish an AgentCapabilitiesMessage in the nats KV ephemeral store
   * - the message will stay in the KV ephemeral long enough to be observed by the runtime
   */
  private observeCapabilities() {
    if (!this.instance) {
      throw new Error('Instance not initialized');
    }
    this.logger.info(`Observing capabilities for runtime ${this.instance.id}`);
    const subscription = this.runtimeRepository
      .observeCapabilities(this.instance.id)
      .pipe(
        tap((runtime) => {
          if (!this.instance) {
            // ignore
            return;
          }
          this.logger.debug(
            `Capabilities for runtime ${this.instance.id}: ${JSON.stringify(runtime?.mcpToolCapabilities, null, 2)}`,
          );
          const message = AgentCapabilitiesMessage.create({
            RID: this.metadata.RID,
            capabilities: runtime?.mcpToolCapabilities ?? [],
          }) as AgentCapabilitiesMessage;
          this.natsService.publishEphemeral(message);
        }),
      )
      .subscribe();
    this.rxjsSubscriptions.push(subscription);
  }
}

export type RuntimeInstanceFactory = (
  instance: dgraphResolversTypes.Runtime,
  metadata: RuntimeInstanceMetadata,
  onReady: () => void,
  onDisconnect: () => void,
) => RuntimeInstance;
