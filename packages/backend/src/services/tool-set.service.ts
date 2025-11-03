import { inject, injectable } from 'inversify';
import {
  LoggerService,
  NatsErrorMessage,
  NatsService,
  Service,
  AckMessage,
  NatsRequest,
  AgentCapabilitiesMessage,
  RequestToolSetCapabilitiesMessage,
} from '@2ly/common';
import { DGraphService } from './dgraph.service';
import pino from 'pino';
import { Subscription } from 'rxjs';
import { tap, debounceTime } from 'rxjs/operators';

import {
  ToolSetRepository,
} from '../repositories';

export const DROP_ALL_DATA = 'dropAllData';

@injectable()
export class ToolSetService extends Service {
  name = 'tool-set';
  private logger: pino.Logger;
  private rxjsSubscriptions: Subscription[] = [];
  private natsSubscriptions: { unsubscribe: () => void; drain: () => Promise<void>; isClosed?: () => boolean }[] = [];

  constructor(
    @inject(LoggerService) private loggerService: LoggerService,
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
    await this.subscribeToToolSetRequests();
  }

  protected async shutdown() {
    this.logger.info('Stopping');

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
    await this.stopService(this.dgraphService);
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
          this.logger.debug(`Publishing ${toolSets.length} toolsets to ephemeral storage`);

          // Publish one message per toolset with toolset name as the key
          toolSets.forEach((toolSet) => {
            const message = AgentCapabilitiesMessage.create({
              name: toolSet.name,
              capabilities: toolSet.mcpTools ?? [],
            }) as AgentCapabilitiesMessage;

            this.natsService.publishEphemeral(message);
          });
        }),
      )
      .subscribe();

    // Store subscription for cleanup
    this.rxjsSubscriptions.push(subscription);
  }

  /**
   * Subscribe to toolset capability requests from runtimes.
   * When a runtime doesn't find capabilities in ephemeral storage, it sends a request.
   * This handler fetches the toolset and publishes ONE AgentCapabilitiesMessage for it.
   */
  private async subscribeToToolSetRequests() {
    this.logger.info('Subscribing to toolset capability requests');
    const subscription = this.natsService.subscribe(RequestToolSetCapabilitiesMessage.subscribe());
    this.natsSubscriptions.push(subscription);

    for await (const msg of subscription) {
      try {
        if (msg instanceof RequestToolSetCapabilitiesMessage) {
          await this.handleToolSetCapabilitiesRequest(msg);
        }
      } catch (error) {
        this.logger.error(`Error handling toolset capability request: ${error}`);
        if (msg instanceof NatsRequest && msg.shouldRespond() && error instanceof Error) {
          const response = new NatsErrorMessage({ error: error.message });
          msg.respond(response);
        }
      }
    }
  }

  /**
   * Handle a request for toolset capabilities.
   * Fetches the toolset by name and publishes ONE AgentCapabilitiesMessage.
   */
  private async handleToolSetCapabilitiesRequest(msg: RequestToolSetCapabilitiesMessage) {
    const { toolSetName } = msg.data;
    this.logger.info(`Received request for toolset capabilities: ${toolSetName}`);

    const toolSet = await this.toolSetRepository.findByName(toolSetName);
    if (!toolSet) {
      const errorMsg = `ToolSet not found: ${toolSetName}`;
      this.logger.error(errorMsg);
      msg.respond(new NatsErrorMessage({ error: errorMsg }));
      return;
    }

    // Publish capabilities to ephemeral storage
    const message = AgentCapabilitiesMessage.create({
      name: toolSet.name,
      capabilities: toolSet.mcpTools ?? [],
    }) as AgentCapabilitiesMessage;

    await this.natsService.publishEphemeral(message);
    this.logger.info(`Published capabilities for toolset ${toolSetName}: ${toolSet.mcpTools?.length ?? 0} tools`);

    // Respond with acknowledgment
    msg.respond(new AckMessage({ metadata: { toolSetName } }));
  }
}
