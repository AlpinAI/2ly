import type { FastifyRateLimitOptions, FastifyRateLimitStore, FastifyRateLimitStoreCtor } from '@fastify/rate-limit';
import type { RouteOptions } from 'fastify';
import type { ICacheService } from '@skilder-ai/common';
import { CACHE_BUCKETS, CACHE_BUCKET_TTLS } from '@skilder-ai/common';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Factory function to create a cache-backed rate limit store constructor.
 * The @fastify/rate-limit plugin expects a store constructor, not an instance.
 *
 * @param cacheService - The cache service to use for distributed storage
 * @param timeWindow - The rate limit window in milliseconds
 * @returns A store constructor class that implements FastifyRateLimitStoreCtor
 */
export function createRateLimitStore(
  cacheService: ICacheService,
  timeWindow: number = CACHE_BUCKET_TTLS.FASTIFY_RATE_LIMIT,
): FastifyRateLimitStoreCtor {
  /**
   * Custom store for @fastify/rate-limit that uses a distributed cache for rate limiting.
   * Enables horizontal scaling by sharing rate limit state across multiple backend instances.
   */
  return class RateLimitStore implements FastifyRateLimitStore {
    private readonly timeWindow: number;

    constructor(_options: FastifyRateLimitOptions) {
      this.timeWindow = timeWindow;
    }

    /**
     * Increment the rate limit counter for a key.
     * This is called by @fastify/rate-limit for each request.
     */
    incr(
      key: string,
      callback: (error: Error | null, result?: { current: number; ttl: number }) => void,
    ): void {
      this.incrAsync(key)
        .then((result) => callback(null, result))
        .catch((error) => callback(error instanceof Error ? error : new Error(String(error))));
    }

    /**
     * Create a child store for route-specific rate limiting.
     * Returns a new store instance with the route-specific options.
     */
    child(_routeOptions: RouteOptions & { path: string; prefix: string }): FastifyRateLimitStore {
      // Return a new store instance - child stores share the same cache service
      return new RateLimitStore({});
    }

    /**
     * Async implementation of increment.
     */
    private async incrAsync(key: string): Promise<{ current: number; ttl: number }> {
      const now = Date.now();
      const entry = await cacheService.get<RateLimitEntry>(CACHE_BUCKETS.FASTIFY_RATE_LIMIT, key);

      if (!entry || now > entry.value.resetAt) {
        // Create new entry or reset expired entry
        const resetAt = now + this.timeWindow;
        await cacheService.put<RateLimitEntry>(CACHE_BUCKETS.FASTIFY_RATE_LIMIT, key, {
          count: 1,
          resetAt,
        });
        return { current: 1, ttl: this.timeWindow };
      }

      // Increment existing entry
      const newCount = entry.value.count + 1;
      await cacheService.put<RateLimitEntry>(CACHE_BUCKETS.FASTIFY_RATE_LIMIT, key, {
        count: newCount,
        resetAt: entry.value.resetAt,
      });

      const ttl = Math.max(0, entry.value.resetAt - now);
      return { current: newCount, ttl };
    }
  };
}
