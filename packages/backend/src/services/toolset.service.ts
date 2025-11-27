import { inject, injectable } from 'inversify';
import {
  LoggerService,
  NatsService,
  RuntimeMCPServersPublish,
  Service,
  ToolsetListToolsPublish,
  dgraphResolversTypes,
} from '@2ly/common';
import { DGraphService } from './dgraph.service';
import pino from 'pino';
import { Subscription } from 'rxjs';
import { tap, debounceTime } from 'rxjs/operators';

import {
  ToolSetRepository,
  WorkspaceRepository,
} from '../repositories';
import { IdentityService } from './identity.service';
import { ToolsetHandshakeIdentity } from '../types';

export const DROP_ALL_DATA = 'dropAllData';

@injectable()
export class ToolSetService extends Service {
  name = 'toolset';
  private logger: pino.Logger;
  private rxjsSubscriptions: Subscription[] = [];
  private natsSubscriptions: { unsubscribe: () => void; drain: () => Promise<void>; isClosed?: () => boolean }[] = [];
  private toolsetHandshakeCallbackId?: string;

  constructor(
    @inject(LoggerService) private loggerService: LoggerService,
    @inject(IdentityService) private identityService: IdentityService,
    @inject(DGraphService) private dgraphService: DGraphService,
    @inject(NatsService) private natsService: NatsService,
    @inject(ToolSetRepository) private toolSetRepository: ToolSetRepository,
    @inject(WorkspaceRepository) private workspaceRepository: WorkspaceRepository,
  ) {
    super();
    this.logger = this.loggerService.getLogger(this.name);
  }

  protected async initialize() {
    this.logger.info('Starting');
    await this.startService(this.dgraphService);
    await this.startService(this.natsService);
    await this.subscribeToAllToolSets();
    this.toolsetHandshakeCallbackId = this.identityService.onHandshake('toolset', (identity: ToolsetHandshakeIdentity) => {
      this.handleToolSetHandshake(identity);
    });
  }

  protected async shutdown() {
    this.logger.info('Stopping');

    // Unregister handshake callback
    if (this.toolsetHandshakeCallbackId) {
      this.identityService.offHandshake('toolset', this.toolsetHandshakeCallbackId);
      this.toolsetHandshakeCallbackId = undefined;
    }

    await this.stopService(this.dgraphService);

    // Clean up RxJS subscriptions
    this.rxjsSubscriptions.forEach((subscription) => subscription.unsubscribe());
    this.rxjsSubscriptions = [];

    // Clean up NATS subscriptions
    const drainPromises = this.natsSubscriptions.map(async (subscription) => {
      try {
        if (!subscription.isClosed?.()) {
          await subscription.drain();
        }
      } catch (error) {
        this.logger.warn(`Failed to drain subscription: ${error}`);
      }
    });
    await Promise.allSettled(drainPromises);
    this.natsSubscriptions = [];

    await this.stopService(this.natsService);
  }

  private async handleToolSetHandshake(identity: ToolsetHandshakeIdentity) {
    this.logger.info(`Toolset ${identity.instance.id} connected`);
    try {
      this.publishToolSetTools(identity.instance);
      await this.publishAgentMCPServers(identity.instance);
      this.workspaceRepository.completeOnboardingStep(
        identity.instance.workspace.id,
        'connect-tool-set-to-agent',
        {
          toolsetName: identity.instance.name,
          toolsetId: identity.instance.id,
        }
      );
    } catch (error) {
      this.logger.error(`Error handling toolset handshake: ${error}`);
    }
  }

  /**
   * Subscribe to all the tool sets of the database and keep the NATS KV up-to-date.
   * TODO: this pattern is not resilient for high volume but is designed to test the tool-set concept quickly.
   * In a near future we'll need to implement a pattern which leverage the health check mechanism and keep alive
   * only active toolsets
   */
  private async subscribeToAllToolSets() {
    this.logger.debug('Subscribing to all toolsets');

    const subscription = this.toolSetRepository
      .observeAllToolSets()
      .pipe(
        debounceTime(100), // Avoid spamming NATS
        tap((toolSets) => {
          // Publish one message per toolset with toolset name as the key
          toolSets.forEach((toolSet) => {
            this.publishToolSetTools(toolSet);
          });
        }),
      )
      .subscribe();

    // Store subscription for cleanup
    this.rxjsSubscriptions.push(subscription);
  }

  private publishToolSetTools(toolSet: dgraphResolversTypes.ToolSet) {
    this.logger.debug(`Publishing ${toolSet.mcpTools?.length ?? 0} tools for toolset ${toolSet.id} in workspace ${toolSet.workspace.id}`);
    const message = ToolsetListToolsPublish.create({
      workspaceId: toolSet.workspace.id,
      toolsetId: toolSet.id,
      mcpTools: toolSet.mcpTools ?? [],
    }) as ToolsetListToolsPublish;
    this.natsService.publishEphemeral(message);
  }

  // TODO: leverage root from handshake ?
  private async publishAgentMCPServers(toolSet: dgraphResolversTypes.ToolSet) {
    const mcpServers  = await this.toolSetRepository.getMCPServersOnAgent(toolSet.id);
    this.logger.debug(`Publishing ${mcpServers.length ?? 0} MCP Servers for toolset ${toolSet.id} in workspace ${toolSet.workspace.id}`);
    const mcpServersMessage = RuntimeMCPServersPublish.create({
      workspaceId: toolSet.workspace.id,
      runtimeId: toolSet.id,
      roots: [] as { name: string; uri: string }[],
      mcpServers,
    }) as RuntimeMCPServersPublish;
    this.natsService.publishEphemeral(mcpServersMessage);
  }
}
