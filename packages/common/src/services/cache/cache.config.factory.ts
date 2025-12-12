import { CACHE_BUCKETS, CACHE_BUCKET_TTLS } from './cache.constants';
import type { CacheServiceConfig } from './cache.interface';

/**
 * Creates the default CacheServiceConfig with all standard buckets.
 * Reads TTL overrides from environment variables.
 *
 * Used by both backend and runtime DI containers.
 */
export function createCacheServiceConfig(): CacheServiceConfig {
  const parseTTL = (envVar: string, defaultTTL: number): number =>
    parseInt(process.env[envVar] || '') || defaultTTL;

  return {
    initialBuckets: [
      { name: CACHE_BUCKETS.HEARTBEAT, ttlMs: parseTTL('HEARTBEAT_CACHE_TTL', CACHE_BUCKET_TTLS.HEARTBEAT) },
      { name: CACHE_BUCKETS.EPHEMERAL, ttlMs: parseTTL('EPHEMERAL_CACHE_TTL', CACHE_BUCKET_TTLS.EPHEMERAL) },
      { name: CACHE_BUCKETS.OAUTH_NONCE, ttlMs: parseTTL('OAUTH_NONCE_CACHE_TTL', CACHE_BUCKET_TTLS.OAUTH_NONCE) },
      { name: CACHE_BUCKETS.RATE_LIMIT_KEY, ttlMs: parseTTL('RATE_LIMIT_KEY_CACHE_TTL', CACHE_BUCKET_TTLS.RATE_LIMIT_KEY) },
      { name: CACHE_BUCKETS.RATE_LIMIT_IP, ttlMs: parseTTL('RATE_LIMIT_IP_CACHE_TTL', CACHE_BUCKET_TTLS.RATE_LIMIT_IP) },
    ],
  };
}
