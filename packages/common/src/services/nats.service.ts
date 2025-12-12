import { NatsConnection, Msg, ConnectionOptions, RequestOptions, TimeoutError } from '@nats-io/nats-core';
import { connect } from '@nats-io/transport-node';
import { JetStreamClient } from '@nats-io/jetstream';
import { Kvm } from '@nats-io/kv';
import { injectable, inject } from 'inversify';
import { LoggerService } from './logger.service';
import pino from 'pino';
import { Service } from './service.interface';
import { NatsMessage, NatsPublish, NatsRequest, NatsResponse } from './nats.message';
import { DEFAULT_REQUEST_TIMEOUT } from '../constants';

export const NATS_CONNECTION_OPTIONS = 'nats.connectionOptions';

@injectable()
export class NatsService extends Service {
  name = 'nats';
  private nats: NatsConnection | null = null;
  private logger: pino.Logger;
  private jetstream: JetStreamClient | null = null;
  private kvManager: Kvm | null = null;

  constructor(
    @inject(LoggerService) private loggerService: LoggerService,
    @inject(NATS_CONNECTION_OPTIONS) private readonly natsConnectionOptions: Partial<ConnectionOptions>,
  ) {
    super();
    this.logger = this.loggerService.getLogger(this.name);
    if (!this.natsConnectionOptions.servers) {
      throw new Error('Servers are required for NATS connection');
    }
    if (!this.natsConnectionOptions.name) {
      throw new Error('Name is required for NATS connection');
    }
  }

  // Connects to NATS and initializes JetStream clients
  protected async initialize() {
    this.logger.info('Starting');
    this.logger.debug(`Connecting options: ${JSON.stringify(this.natsConnectionOptions)}`);
    try {
      this.nats = await connect({
        ...this.natsConnectionOptions,
        reconnect: true,
        maxReconnectAttempts: -1,
        reconnectTimeWait: 1000,
      });
      this.kvManager = new Kvm(this.nats);
    } catch (error) {
      this.logger.error(`Error connecting to NATS: ${error}`);
      throw error as Error;
    }
  }

  // Gracefully drains and closes the NATS connection
  protected async shutdown() {
    this.logger.info('Stopping');
    if (this.nats && !this.nats.isClosed()) {
      await this.nats.drain();
      this.nats = null;
    }
    this.logger.info('Stopped');
  }

  // Reports whether the service is connected and started
  public isConnected(): boolean {
    return this.state === 'STARTED' && this.nats !== null && !this.nats.isClosed();
  }

  /**
   * Get the KV manager for use by CacheService.
   * Returns null if not connected.
   */
  public getKvManager(): Kvm | null {
    return this.kvManager;
  }

  // Subscribes to a core NATS subject (ephemeral, no persistence)
  subscribe(subject: string) {
    if (!this.nats) {
      throw new Error('Not connected to NATS');
    }
    const sub = this.nats.subscribe(subject);
    return {
      [Symbol.asyncIterator]: async function* () {
        for await (const msg of sub) {
          yield NatsMessage.get(msg);
        }
      },
      closed: sub.closed,
      unsubscribe: () => sub?.unsubscribe?.(),
      drain: async () => {
        try {
          if (sub && typeof sub.drain === 'function' && !sub.isClosed()) {
            await sub.drain();
          }
        } catch (error) {
          console.warn('Failed to drain subscription:', error);
        }
      },
      isDraining: () => sub?.isDraining?.() ?? false,
      isClosed: () => sub?.isClosed?.() ?? true,
      getSubject: () => sub?.getSubject?.() ?? '',
      getReceived: () => sub?.getReceived?.() ?? 0,
      getProcessed: () => sub?.getProcessed?.() ?? 0,
      getPending: () => sub?.getPending?.() ?? 0,
      getID: () => sub?.getID?.() ?? 0,
      getMax: () => sub?.getMax?.() ?? 0,
    };
  }

  // Publishes a core NATS message (fire-and-forget)
  publish(message: NatsPublish) {
    if (!this.nats) {
      throw new Error('Not connected to NATS');
    }
    const data = message.prepareData();
    if (!data.subject) {
      throw new Error('Subject is required for NATS publish');
    }
    this.nats.publish(data.subject!, JSON.stringify(data));
  }

  // Publish with JetStream
  async publishWithJetStream(message: NatsPublish) {
    if (!this.jetstream) {
      throw new Error('Jetstream not initialized');
    }
    const data = message.prepareData();
    if (!data.subject) {
      throw new Error('Subject is required for NATS publish with JetStream');
    }
    await this.jetstream.publish(data.subject!, JSON.stringify(data));
  }

  // Sends a core NATS request and awaits a reply (RPC style)
  async request(
    message: NatsRequest,
    opts: RequestOptions & { retryOnTimeout?: boolean } = { timeout: DEFAULT_REQUEST_TIMEOUT, retryOnTimeout: false },
  ): Promise<NatsResponse> {
    if (!this.nats) {
      throw new Error('Not connected to NATS');
    }

    const data = message.prepareData();
    let responseMessage: Msg | null = null;
    try {
      if (!data.subject) {
        throw new Error('Subject is required for NATS request');
      }
      responseMessage = await this.nats.request(data.subject!, JSON.stringify(data), opts);
    } catch (error) {
      if (error instanceof TimeoutError && opts.retryOnTimeout) {
        this.logger.warn(`Timeout error with NATS request (${data.subject!}), retrying...`);
        return this.request(message, { ...opts, retryOnTimeout: false });
      }
      this.logger.error(`Error with NATS request (${data.subject!}): ${error}`);
      throw error as Error;
    }
    const response = NatsMessage.get(responseMessage);
    if (!(response instanceof NatsResponse)) {
      throw new Error('Invalid response, must be a NatsResponse');
    }
    return response;
  }
}
