/**
 * Cache Service Constants
 *
 * Predefined bucket names, TTLs, and DI symbols for the CacheService.
 */

// Predefined bucket names
export const CACHE_BUCKETS = {
  HEARTBEAT: 'heartbeat',
  EPHEMERAL: 'ephemeral',
  OAUTH_NONCE: 'oauth-nonce',
  RATE_LIMIT_KEY: 'rate-limit-key',
  RATE_LIMIT_IP: 'rate-limit-ip',
} as const;

// Default TTLs for each bucket (in milliseconds)
export const CACHE_BUCKET_TTLS = {
  HEARTBEAT: 30 * 1000, // 30 seconds
  EPHEMERAL: 60 * 1000, // 60 seconds
  OAUTH_NONCE: 10 * 60 * 1000, // 10 minutes
  RATE_LIMIT_KEY: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_IP: 60 * 60 * 1000, // 1 hour
} as const;

// DI injection symbols
export const CACHE_SERVICE = 'cache.service';
export const HEARTBEAT_CACHE_TTL = 'cache.heartbeat.ttl';
export const EPHEMERAL_CACHE_TTL = 'cache.ephemeral.ttl';
export const OAUTH_NONCE_CACHE_TTL = 'cache.oauth-nonce.ttl';
export const RATE_LIMIT_KEY_CACHE_TTL = 'cache.rate-limit-key.ttl';
export const RATE_LIMIT_IP_CACHE_TTL = 'cache.rate-limit-ip.ttl';

// Type for bucket names
export type CacheBucketName = (typeof CACHE_BUCKETS)[keyof typeof CACHE_BUCKETS];
