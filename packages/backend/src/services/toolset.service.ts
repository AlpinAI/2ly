import { inject, injectable } from 'inversify';
import {
  LoggerService,
  NatsService,
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
} from '../repositories';
import { IdentityService } from './identity.service';

export const DROP_ALL_DATA = 'dropAllData';

@injectable()
export class ToolSetService extends Service {
  name = 'toolset';
  private logger: pino.Logger;
  private rxjsSubscriptions: Subscription[] = [];
  private natsSubscriptions: { unsubscribe: () => void; drain: () => Promise<void>; isClosed?: () => boolean }[] = [];

  constructor(
    @inject(LoggerService) private loggerService: LoggerService,
    @inject(IdentityService) private identityService: IdentityService,
    @inject(DGraphService) private dgraphService: DGraphService,
    @inject(NatsService) private natsService: NatsService,
    @inject(ToolSetRepository) private toolSetRepository: ToolSetRepository,
  ) {
    super();
    this.logger = this.loggerService.getLogger(this.name);
  }

  protected async initialize() {
    this.logger.info('Starting');
    await this.startService(this.dgraphService);
    await this.startService(this.natsService);
    await this.subscribeToToolSet();
    this.identityService.onHandshake('toolset', (identity) => {
      this.handleToolSetHandshake(identity);
    });
  }

  protected async shutdown() {
    this.logger.info('Stopping');

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

  private async handleToolSetHandshake(identity: { instance: dgraphResolversTypes.ToolSet; pid: string; hostIP: string; hostname: string; }) {
    this.logger.debug(`Toolset ${identity.instance.id} connected`);
    try {
      this.publishToolSetTools(identity.instance);
    } catch (error) {
      this.logger.error(`Error handling toolset handshake: ${error}`);
    }
    
  }

  /**
   * Subscribe to all the tool sets of the database and keep the NATS KV up-to-date.
   * TODO: this pattern is not resilient for high volume but is designed to test the tool-set concept quickly.
   */
  private async subscribeToToolSet() {
    this.logger.info('Subscribing to all toolsets');

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
    this.logger.debug(`Publishing ${toolSet.mcpTools?.length ?? 0} tools for toolset ${toolSet.id}`);
    const message = ToolsetListToolsPublish.create({
      workspaceId: toolSet.workspace.id,
      toolsetId: toolSet.id,
      mcpTools: toolSet.mcpTools ?? [],
    }) as ToolsetListToolsPublish;
    this.natsService.publishEphemeral(message);
  }
}
