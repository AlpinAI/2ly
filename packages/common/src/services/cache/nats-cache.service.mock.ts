import { ICacheService, CacheBucketConfig, CacheEntry, CacheWatchOptions, CacheWatchSubscription } from './cache.interface';

/**
 * Mock implementation of ICacheService for testing.
 * Provides an in-memory cache with all the same operations as the real service.
 */
export class NatsCacheServiceMock implements ICacheService {
  private buckets: Map<string, Map<string, { value: unknown; revision: number; createdAt: number }>> = new Map();
  private bucketConfigs: Map<string, CacheBucketConfig> = new Map();
  private revisionCounter = 0;

  async createBucket(config: CacheBucketConfig): Promise<void> {
    if (!this.buckets.has(config.name)) {
      this.buckets.set(config.name, new Map());
    }
    this.bucketConfigs.set(config.name, config);
  }

  async deleteBucket(name: string): Promise<void> {
    this.buckets.delete(name);
    this.bucketConfigs.delete(name);
  }

  async getBuckets(): Promise<string[]> {
    return Array.from(this.buckets.keys());
  }

  async get<T>(bucket: string, key: string): Promise<CacheEntry<T> | null> {
    const bucketMap = this.buckets.get(bucket);
    if (!bucketMap) return null;

    const entry = bucketMap.get(key);
    if (!entry) return null;

    // Check TTL expiration (mock doesn't auto-clean, but we can check)
    const config = this.bucketConfigs.get(bucket);
    if (config?.ttlMs) {
      const age = Date.now() - entry.createdAt;
      if (age > config.ttlMs) {
        bucketMap.delete(key);
        return null;
      }
    }

    return {
      value: entry.value as T,
      revision: entry.revision,
      createdAt: entry.createdAt,
      expiresAt: config?.ttlMs ? entry.createdAt + config.ttlMs : undefined,
    };
  }

  async put<T>(bucket: string, key: string, value: T): Promise<number> {
    if (!this.buckets.has(bucket)) {
      this.buckets.set(bucket, new Map());
    }

    this.revisionCounter++;
    this.buckets.get(bucket)!.set(key, {
      value,
      revision: this.revisionCounter,
      createdAt: Date.now(),
    });

    return this.revisionCounter;
  }

  async delete(bucket: string, key: string): Promise<void> {
    const bucketMap = this.buckets.get(bucket);
    if (bucketMap) {
      bucketMap.delete(key);
    }
  }

  async keys(bucket: string, pattern?: string): Promise<string[]> {
    const bucketMap = this.buckets.get(bucket);
    if (!bucketMap) return [];

    const allKeys = Array.from(bucketMap.keys());

    if (!pattern) return allKeys;

    // Simple pattern matching (> for prefix)
    if (pattern.startsWith('>')) {
      const prefix = pattern.slice(1);
      return allKeys.filter((k) => k.startsWith(prefix));
    }

    // Wildcard matching
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return allKeys.filter((k) => regex.test(k));
  }

  async clear(bucket: string): Promise<number> {
    const bucketMap = this.buckets.get(bucket);
    if (!bucketMap) return 0;

    const count = bucketMap.size;
    bucketMap.clear();
    return count;
  }

  async watch<T>(_bucket: string, _options?: CacheWatchOptions): Promise<CacheWatchSubscription<T>> {
    // Create a simple mock watcher that doesn't actually watch
    // Tests should call yield manually if needed
    let stopped = false;

    return {
      // eslint-disable-next-line require-yield
      [Symbol.asyncIterator]: async function* () {
        // Mock watcher doesn't yield anything by default
        // Tests can override this behavior
        while (!stopped) {
          // Wait forever (or until stopped)
          await new Promise<void>((resolve) => {
            if (stopped) resolve();
          });
        }
      },
      unsubscribe: () => {
        stopped = true;
      },
      drain: async () => {
        stopped = true;
      },
    };
  }

  async increment(bucket: string, key: string, delta: number = 1): Promise<number> {
    const entry = await this.get<number>(bucket, key);
    const currentValue = entry?.value ?? 0;
    const newValue = currentValue + delta;
    await this.put(bucket, key, newValue);
    return newValue;
  }

  async getOrSet<T>(bucket: string, key: string, factory: () => T | Promise<T>): Promise<CacheEntry<T>> {
    const existing = await this.get<T>(bucket, key);
    if (existing) return existing;

    const value = await factory();
    const createdAt = Date.now();
    const revision = await this.put(bucket, key, value);
    const bucketConfig = this.bucketConfigs.get(bucket);
    return {
      value,
      revision,
      createdAt,
      expiresAt: bucketConfig?.ttlMs ? createdAt + bucketConfig.ttlMs : undefined,
    };
  }

  /**
   * Clear all buckets (for test cleanup).
   */
  clearAll(): void {
    this.buckets.clear();
    this.bucketConfigs.clear();
    this.revisionCounter = 0;
  }

  /**
   * Get raw bucket data for test assertions.
   */
  getBucketData(bucket: string): Map<string, unknown> | undefined {
    const bucketMap = this.buckets.get(bucket);
    if (!bucketMap) return undefined;

    const result = new Map<string, unknown>();
    for (const [key, entry] of bucketMap) {
      result.set(key, entry.value);
    }
    return result;
  }
}
