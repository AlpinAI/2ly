/**
 * CacheService Interface
 *
 * Generic cache interface that abstracts KV store operations.
 * Initial implementation uses NATS KV, but can be swapped for Redis.
 */

// Cache entry with metadata
export interface CacheEntry<T = unknown> {
  value: T;
  revision: number; // For optimistic locking / conflict detection
  createdAt: number; // Unix timestamp ms
  expiresAt?: number; // Unix timestamp ms (optional)
}

// Watch event types
export type CacheWatchOperation = 'PUT' | 'DELETE' | 'EXPIRE';

export interface CacheWatchEvent<T = unknown> {
  key: string;
  operation: CacheWatchOperation;
  value?: T; // undefined for DELETE/EXPIRE
  revision: number;
  timestamp: number;
}

// Cache bucket configuration
export interface CacheBucketConfig {
  name: string;
  ttlMs: number; // Default TTL for entries
  maxEntries?: number; // Optional max entries (for rate limiting scenarios)
}

// Cache service configuration (passed at initialization)
export interface CacheServiceConfig {
  initialBuckets?: CacheBucketConfig[];
}

// Watch options
export interface CacheWatchOptions {
  key?: string; // Watch specific key
  keyPattern?: string; // Watch keys matching pattern (glob)
  includeHistory?: boolean; // Include historical values on start
  timeoutMs?: number; // Auto-terminate after timeout
}

// Observable subscription handle
export interface CacheWatchSubscription<T = unknown> {
  [Symbol.asyncIterator](): AsyncIterableIterator<CacheWatchEvent<T>>;
  unsubscribe(): void;
  drain(): Promise<void>;
}

/**
 * Core cache operations interface
 *
 * This interface is implementation-agnostic and can be backed by
 * NATS KV, Redis, or any other KV store.
 */
export interface ICacheService {
  // Bucket management
  createBucket(config: CacheBucketConfig): Promise<void>;
  deleteBucket(name: string): Promise<void>;
  getBuckets(): Promise<string[]>;

  // Basic operations
  get<T>(bucket: string, key: string): Promise<CacheEntry<T> | null>;
  put<T>(bucket: string, key: string, value: T): Promise<number>; // returns revision
  delete(bucket: string, key: string): Promise<void>;

  // Bulk operations
  keys(bucket: string, pattern?: string): Promise<string[]>;
  clear(bucket: string): Promise<number>; // returns count deleted

  // Watch operations (async iterators)
  watch<T>(bucket: string, options?: CacheWatchOptions): Promise<CacheWatchSubscription<T>>;

  // Atomic operations (for rate limiting)
  increment(bucket: string, key: string, delta?: number): Promise<number>;
  getOrSet<T>(bucket: string, key: string, factory: () => T | Promise<T>): Promise<CacheEntry<T>>;
}
