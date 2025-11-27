import { injectable } from 'inversify';
import pino from 'pino';
import {
  dgraphResolversTypes,
  NatsService,
  Service,
  RuntimeMCPServersPublish,
  RUNTIME_SUBJECT,
} from '@2ly/common';
import { RuntimeRepository } from '../repositories';
import { BehaviorSubject, combineLatest, debounceTime, Subscription, tap } from 'rxjs';
import type { ConnectionMetadata } from '../types';

export const CHECK_HEARTBEAT_INTERVAL = 'check.heartbeat.interval';

@injectable()
export class RuntimeInstance extends Service {
  name = 'runtime-instance';
  private rxjsSubscriptions: Subscription[] = [];
  private natsSubscriptions: { unsubscribe: () => void; drain: () => Promise<void> }[] = [];
  private isSystemRuntime: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    private logger: pino.Logger,
    private natsService: NatsService,
    private runtimeRepository: RuntimeRepository,
    private instance: dgraphResolversTypes.Runtime,
    private metadata: ConnectionMetadata,
    private onReady: () => void,
    private onDisconnect: () => void,
  ) {
    super();
  }

  protected async initialize() {
    this.logger.info(`Initializing runtime instance: ${this.instance.id}`);
    try {
      await this.runtimeRepository.setActive(
        this.instance.id,
        this.metadata,
      );
      this.observeHeartbeat();
      this.handleRuntimeMessages();
      this.observeMCPServers();
      this.onReady();
    } catch (error) {
      this.logger.error(`Error setting runtime active: ${error}`);
      await this.disconnect();
      this.onDisconnect();
    }
  }

  private async observeHeartbeat() {
    if (!this.instance) {
      throw new Error('Instance not initialized');
    }
    this.logger.info(`Observed heartbeat for runtime ${this.instance.id}`);
    const heartbeatSubscription = await this.natsService.observeHeartbeat(this.instance.id);
    this.natsSubscriptions.push(heartbeatSubscription);
    for await (const heartbeat of heartbeatSubscription) {
      if (heartbeat?.i && heartbeat?.t) {
        this.logger.debug(`Heartbeat for runtime ${heartbeat.i}`);
        await this.runtimeRepository.updateLastSeen(heartbeat.i);
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
    this.logger.debug(`Listening for ${RUNTIME_SUBJECT}.${this.instance.id}.* messages`);
    const msgSubscription = this.natsService.subscribe(`${RUNTIME_SUBJECT}.${this.instance.id}.*`);
    this.natsSubscriptions.push(msgSubscription);
    for await (const _message of msgSubscription) {
      // TODO: handle runtime messages ?
    }
  }

  private async disconnect() {
    if (!this.instance) {
      throw new Error('Instance not initialized');
    }
    this.logger.info(`Disconnecting runtime ${this.instance.id}`);
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
    const mcpServers = this.runtimeRepository.observeMCPServersOnEdge(this.instance.id);

    this.isSystemRuntime.next(runtime.system?.id === this.instance.id);
    const subscription = combineLatest([roots, mcpServers])
      .pipe(
        debounceTime(100), // debounce to avoid spamming the nats service
        tap(([roots, mcpServers]) => {
          if (!this.instance) {
            // ignore
            return;
          }
          this.logger.debug(`Update with ${mcpServers.length} MCP Servers for runtime ${this.instance.id}`);
          const mcpServersMessage = RuntimeMCPServersPublish.create({
            workspaceId: runtime.workspace?.id ?? null,
            runtimeId: this.instance.id,
            roots,
            mcpServers,
          }) as RuntimeMCPServersPublish;
          this.natsService.publishEphemeral(mcpServersMessage);
        }),
      )
      .subscribe();

    this.rxjsSubscriptions.push(subscription);
  }
}

export type RuntimeInstanceFactory = (
  instance: dgraphResolversTypes.Runtime,
  metadata: ConnectionMetadata,
  onReady: () => void,
  onDisconnect: () => void,
) => RuntimeInstance;
