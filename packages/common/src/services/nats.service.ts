import { NatsConnection, Msg, ConnectionOptions, RequestOptions } from '@nats-io/nats-core';
import { connect } from '@nats-io/transport-node';
import { jetstream, jetstreamManager, JetStreamClient, JetStreamManager } from "@nats-io/jetstream";
import { Kvm, KV } from "@nats-io/kv";
import { injectable, inject } from 'inversify';
import { LoggerService } from './logger.service';
import pino from 'pino';
import { Service } from './service.interface';
import { NatsMessage, NatsPublish, NatsRequest, NatsResponse } from './nats.message';
import { callToolStream, replyStream } from '../messages';
import { DEFAULT_REQUEST_TIMEOUT } from '../constants';

export const NATS_CONNECTION_OPTIONS = 'nats.connectionOptions';
export const HEARTBAT_TTL = 'nats.heartbeat.ttl';
export const DEFAULT_HEARTBAT_TTL = 30 * 1000; // 30 seconds in milliseconds
export const EPHEMERAL_TTL = 'nats.ephemeral.ttl';
export const DEFAULT_EPHEMERAL_TTL = 60 * 1000; // 60 seconds in milliseconds

@injectable()
export class NatsService extends Service {
  name = 'nats';
  private nats: NatsConnection | null = null;
  private logger: pino.Logger;
  private jetstream: JetStreamClient | null = null;
  private jetstreamManager: JetStreamManager | null = null;
  private kvManager: Kvm | null = null;
  private heartbeatKV: KV | null = null;
  private ephemeralKV: KV | null = null;
  private jetstreamPendingRequests = new Map<string, { resolve: (value: NatsResponse) => void, reject: (reason: string) => void, timeout: NodeJS.Timeout }>();
  constructor(
    @inject(LoggerService) private loggerService: LoggerService,
    @inject(NATS_CONNECTION_OPTIONS) private readonly natsConnectionOptions: Partial<ConnectionOptions>,
    @inject(HEARTBAT_TTL) private readonly heartbeatTTL: number = DEFAULT_HEARTBAT_TTL,
    @inject(EPHEMERAL_TTL) private readonly ephemeralTTL: number = DEFAULT_EPHEMERAL_TTL,
  ) {
    super();
    this.logger = this.loggerService.getLogger(this.name);
    if (!this.natsConnectionOptions.servers) {
      throw new Error('Servers are required for NATS connection');
    }
    if (!this.natsConnectionOptions.name) {
      throw new Error('Name is required for NATS connection');
    }

    // Fake usage to avoid TS6133 error - temporarily
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.jetstreamPendingRequests;
    // Fake usage to avoid TS6133 error - temporarily
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.createStreams;
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
      this.jetstreamManager = await jetstreamManager(this.nats);
      this.jetstream = jetstream(this.nats);
      this.kvManager = new Kvm(this.nats);
      this.heartbeatKV = await this.kvManager.create('heartbeat', {
        ttl: this.heartbeatTTL,
      });
      this.ephemeralKV = await this.kvManager.create('ephemeral', {
        ttl: this.ephemeralTTL,
      });
      // Streams are not used yet
      // await this.createStreams();
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
  async request(message: NatsRequest, opts: RequestOptions = { timeout: DEFAULT_REQUEST_TIMEOUT }): Promise<NatsResponse> {
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
      this.logger.error(`Error sending NATS request: ${error}`);
      throw error as Error;
    }
    const response = NatsMessage.get(responseMessage);
    if (!(response instanceof NatsResponse)) {
      throw new Error('Invalid response, must be a NatsResponse');
    }
    return response;
  }

  heartbeat(id: string, metadata: Record<string, string>) {
    if (!this.heartbeatKV) {
      throw new Error('Heartbeat KV not initialized');
    }
    metadata.timestamp = Date.now().toString();
    this.heartbeatKV.put(id, JSON.stringify(metadata));
  }

  async heartbeatKeys(): Promise<string[]> {
    if (!this.heartbeatKV) {
      throw new Error('Heartbeat KV not initialized');
    }
    const keys = await this.heartbeatKV.keys();
    if (!keys) {
      return [];
    }
    const keysArray = [];
    for await (const key of keys) {
      keysArray.push(key);
    }
    return keysArray;
  }

  kill(id: string) {
    if (!this.heartbeatKV) {
      throw new Error('Heartbeat KV not initialized');
    }
    try {
      this.heartbeatKV.delete(id);
    } catch (error) {
      this.logger.warn(`Failed to delete the hearbeatKV for ${id}: ${error}`)
    }
  }

  async observeHeartbeat(id: string) {
    if (!this.heartbeatKV) {
      throw new Error('Heartbeat KV not initialized');
    }
    if (!this.nats) {
      throw new Error('Not connected to NATS');
    }

    const TTL = this.heartbeatTTL;
    const watcher = await this.heartbeatKV.watch({ key: id });
    const TIMEOUT_ERROR_MSG = 'Timeout Error';
    const activeTimeouts = new Set<NodeJS.Timeout>();
    const clearTimoutId = (timeoutId: NodeJS.Timeout) => {
      clearTimeout(timeoutId);
      activeTimeouts.delete(timeoutId);
    };

    return {
      [Symbol.asyncIterator]: async function* () {
        const iterator = watcher[Symbol.asyncIterator]();
        let timeoutId: NodeJS.Timeout | null = null;

        const createTimeoutPromise = (): Promise<never> => {
          return new Promise((_, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error(TIMEOUT_ERROR_MSG));
            }, TTL);
            activeTimeouts.add(timeout);
            timeoutId = timeout;
          });
        };

        const cleanup = () => {
          if (timeoutId) {
            clearTimoutId(timeoutId);
            timeoutId = null;
          }
        };

        try {
          while (true) {
            const timeoutPromise = createTimeoutPromise();

            try {
              const result = await Promise.race([
                iterator.next(),
                timeoutPromise
              ]);

              // Clear the timeout since we got a result
              cleanup();

              if (result.done || result.value.operation === 'DEL') {
                return;
              }

              yield result.value.json() as Record<string, string>;

            } catch (error) {
              cleanup();
              if (error instanceof Error && error.message === TIMEOUT_ERROR_MSG) {
                // silently fail => just terminate the async iterator
                watcher?.stop?.();
              } else {
                throw error;
              }
            }
          }
        } finally {
          cleanup();
        }
      },

      unsubscribe: () => {
        watcher?.stop?.();
        activeTimeouts.forEach(clearTimoutId);
        activeTimeouts.clear();
      },

      drain: () => Promise.resolve()
    };
  }

  async publishEphemeral(msg: NatsPublish) {
    if (!this.ephemeralKV) {
      throw new Error('Ephemeral KV not initialized');
    }
    const data = msg.prepareData();
    await this.ephemeralKV.put(data.subject!, JSON.stringify(data));
  }

  async observeEphemeral(subject: string) {
    if (!this.ephemeralKV) {
      throw new Error('Ephemeral KV not initialized');
    }
    const watcher = await this.ephemeralKV.watch({ key: subject });
    return {
      [Symbol.asyncIterator]: async function* () {
        for await (const msg of watcher) {
          yield NatsMessage.get(msg as unknown as Msg);
        }
      },
      unsubscribe: () => {
        watcher?.stop?.();
      },
      drain: () => Promise.resolve()
    };
  }

  private async createStreams() {
    if (!this.jetstreamManager) {
      throw new Error('JetstreamManager not initialized');
    }
    this.logger.debug(`Creating stream: ${callToolStream.getName()} - ${callToolStream.getSubjects().join(', ')}`);
    await callToolStream.init(this.jetstream!, this.jetstreamManager!);
    this.logger.debug(`Creating stream: ${replyStream.getName()} - ${replyStream.getSubjects().join(', ')}`);
    await replyStream.init(this.jetstream!, this.jetstreamManager!);
  }

}