/**
 * NATS KV-backed Cache Service
 *
 * Implements ICacheService using NATS JetStream KV stores.
 * Can be swapped for a Redis implementation by implementing ICacheService.
 */

import { injectable, inject } from 'inversify';
import { Kvm, KV, KvEntry, KvWatchOptions } from '@nats-io/kv';
import pino from 'pino';
import { LoggerService } from '../logger.service';
import { NatsService } from '../nats.service';
import { Service } from '../service.interface';
import type {
  ICacheService,
  CacheBucketConfig,
  CacheEntry,
  CacheWatchOptions,
  CacheWatchSubscription,
  CacheWatchEvent,
  CacheWatchOperation,
  CacheServiceConfig,
} from './cache.interface';
import { CACHE_SERVICE_CONFIG } from './cache.constants';

@injectable()
export class NatsCacheService extends Service implements ICacheService {
  name = 'cache';
  private logger: pino.Logger;
  private kvManager: Kvm | null = null;
  private buckets: Map<string, KV> = new Map();
  private bucketConfigs: Map<string, CacheBucketConfig> = new Map();

  constructor(
    @inject(LoggerService) private loggerService: LoggerService,
    @inject(NatsService) private natsService: NatsService,
    @inject(CACHE_SERVICE_CONFIG) private config: CacheServiceConfig,
  ) {
    super();
    this.logger = this.loggerService.getLogger(this.name);
  }

  protected async initialize(): Promise<void> {
    this.logger.info('Starting CacheService');

    // Wait for NatsService to be connected
    await this.natsService.waitForStarted();

    // Get the KV manager from NatsService
    this.kvManager = this.natsService.getKvManager();

    if (!this.kvManager) {
      throw new Error('Failed to get KV manager from NatsService');
    }

    // Create all initial buckets from config
    for (const bucketConfig of this.config.initialBuckets ?? []) {
      await this.createBucket(bucketConfig);
    }

    this.logger.info('CacheService started');
  }

  protected async shutdown(): Promise<void> {
    this.logger.info('Stopping CacheService');
    this.buckets.clear();
    this.bucketConfigs.clear();
    this.logger.info('CacheService stopped');
  }

  async createBucket(config: CacheBucketConfig): Promise<void> {
    if (!this.kvManager) {
      throw new Error('CacheService not initialized');
    }
    if (this.buckets.has(config.name)) {
      this.logger.debug(`Bucket ${config.name} already exists`);
      return;
    }

    const kv = await this.kvManager.create(config.name, {
      ttl: config.ttlMs,
      max_bytes: config.maxEntries ? config.maxEntries * 1024 : undefined,
    });

    this.buckets.set(config.name, kv);
    this.bucketConfigs.set(config.name, config);
    this.logger.info(`Created bucket: ${config.name} with TTL: ${config.ttlMs}ms`);
  }

  async deleteBucket(name: string): Promise<void> {
    const kv = this.buckets.get(name);
    if (kv) {
      try {
        await kv.destroy();
      } catch (error) {
        this.logger.warn(`Failed to destroy bucket ${name}: ${error}`);
      }
    }
    this.buckets.delete(name);
    this.bucketConfigs.delete(name);
  }

  async getBuckets(): Promise<string[]> {
    return Array.from(this.buckets.keys());
  }

  async get<T>(bucket: string, key: string): Promise<CacheEntry<T> | null> {
    const kv = this.getBucket(bucket);
    try {
      const entry = await kv.get(key);
      if (!entry || entry.operation === 'DEL' || entry.operation === 'PURGE') {
        return null;
      }
      const bucketConfig = this.bucketConfigs.get(bucket);
      return {
        value: entry.json() as T,
        revision: entry.revision,
        createdAt: entry.created.getTime(),
        expiresAt: bucketConfig?.ttlMs ? entry.created.getTime() + bucketConfig.ttlMs : undefined,
      };
    } catch (_error) {
      this.logger.debug(`Key ${key} not found in bucket ${bucket}`);
      return null;
    }
  }

  async put<T>(bucket: string, key: string, value: T): Promise<number> {
    const kv = this.getBucket(bucket);
    const data = JSON.stringify(value);
    const revision = await kv.put(key, data);
    return revision;
  }

  async delete(bucket: string, key: string): Promise<void> {
    const kv = this.getBucket(bucket);
    try {
      await kv.delete(key);
    } catch (error) {
      this.logger.warn(`Failed to delete key ${key} from bucket ${bucket}: ${error}`);
    }
  }

  async keys(bucket: string, pattern?: string): Promise<string[]> {
    const kv = this.getBucket(bucket);
    const keysIterator = await kv.keys();
    const result: string[] = [];
    for await (const key of keysIterator) {
      if (!pattern || this.matchPattern(key, pattern)) {
        result.push(key);
      }
    }
    return result;
  }

  async clear(bucket: string): Promise<number> {
    const kv = this.getBucket(bucket);
    const allKeys = await this.keys(bucket);
    for (const key of allKeys) {
      await kv.delete(key);
    }
    this.logger.info(`Cleared ${allKeys.length} keys from bucket ${bucket}`);
    return allKeys.length;
  }

  async watch<T>(bucket: string, options?: CacheWatchOptions): Promise<CacheWatchSubscription<T>> {
    const kv = this.getBucket(bucket);
    const watchOptions: KvWatchOptions = {};

    if (options?.key) {
      watchOptions.key = options.key;
    }

    const watcher = await kv.watch(watchOptions);
    const TTL = options?.timeoutMs;
    const activeTimeouts = new Set<NodeJS.Timeout>();
    const logger = this.logger;

    const clearTimeoutId = (timeoutId: NodeJS.Timeout) => {
      clearTimeout(timeoutId);
      activeTimeouts.delete(timeoutId);
    };

    const TIMEOUT_ERROR_MSG = 'CACHE_WATCH_TIMEOUT';

    return {
      [Symbol.asyncIterator]: async function* () {
        const iterator = watcher[Symbol.asyncIterator]();
        let timeoutId: NodeJS.Timeout | null = null;

        const createTimeoutPromise = (): Promise<never> | null => {
          if (!TTL) return null;
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
            clearTimeoutId(timeoutId);
            timeoutId = null;
          }
        };

        try {
          while (true) {
            const timeoutPromise = createTimeoutPromise();

            try {
              const racePromises: Promise<unknown>[] = [iterator.next()];
              if (timeoutPromise) {
                racePromises.push(timeoutPromise);
              }

              const result = (await Promise.race(racePromises)) as IteratorResult<KvEntry>;
              cleanup();

              if (result.done) {
                return;
              }

              const entry = result.value;
              const operation: CacheWatchOperation =
                entry.operation === 'DEL' || entry.operation === 'PURGE' ? 'DELETE' : 'PUT';

              if (operation === 'DELETE') {
                yield {
                  key: entry.key,
                  operation,
                  revision: entry.revision,
                  timestamp: Date.now(),
                } as CacheWatchEvent<T>;
              } else {
                yield {
                  key: entry.key,
                  operation,
                  value: entry.json() as T,
                  revision: entry.revision,
                  timestamp: entry.created.getTime(),
                } as CacheWatchEvent<T>;
              }
            } catch (error) {
              cleanup();
              if (error instanceof Error && error.message === TIMEOUT_ERROR_MSG) {
                logger.debug(`Watch timeout on bucket, terminating watcher`);
                watcher?.stop?.();
                return;
              }
              throw error;
            }
          }
        } finally {
          cleanup();
        }
      },

      unsubscribe: () => {
        watcher?.stop?.();
        activeTimeouts.forEach(clearTimeoutId);
        activeTimeouts.clear();
      },

      drain: () => Promise.resolve(),
    };
  }

  async increment(bucket: string, key: string, delta: number = 1): Promise<number> {
    const entry = await this.get<number>(bucket, key);
    const newValue = (entry?.value ?? 0) + delta;
    await this.put(bucket, key, newValue);
    return newValue;
  }

  async getOrSet<T>(bucket: string, key: string, factory: () => T | Promise<T>): Promise<CacheEntry<T>> {
    const existing = await this.get<T>(bucket, key);
    if (existing) {
      return existing;
    }
    const value = await factory();
    const revision = await this.put(bucket, key, value);
    const bucketConfig = this.bucketConfigs.get(bucket);
    return {
      value,
      revision,
      createdAt: Date.now(),
      expiresAt: bucketConfig?.ttlMs ? Date.now() + bucketConfig.ttlMs : undefined,
    };
  }

  private getBucket(name: string): KV {
    const kv = this.buckets.get(name);
    if (!kv) {
      throw new Error(`Bucket ${name} not found. Call createBucket() first.`);
    }
    return kv;
  }

  private matchPattern(key: string, pattern: string): boolean {
    // Simple glob matching: * matches any sequence, ? matches single char
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    return regex.test(key);
  }
}
