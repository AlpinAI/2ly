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
  OAUTH_INITIATION: 'oauth-initiation',
  RATE_LIMIT_KEY: 'rate-limit-key',
  RATE_LIMIT_IP: 'rate-limit-ip',
  FASTIFY_RATE_LIMIT: 'fastify-rate-limit',
} as const;

// Default TTLs for each bucket (in milliseconds)
export const CACHE_BUCKET_TTLS = {
  HEARTBEAT: 30 * 1000, // 30 seconds
  EPHEMERAL: 60 * 1000, // 60 seconds
  OAUTH_NONCE: 10 * 60 * 1000, // 10 minutes
  OAUTH_INITIATION: 5 * 60 * 1000, // 5 minutes
  RATE_LIMIT_KEY: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_IP: 60 * 60 * 1000, // 1 hour
  FASTIFY_RATE_LIMIT: 60 * 1000, // 1 minute
} as const;

// DI injection symbols
export const CACHE_SERVICE = 'cache.service';
export const CACHE_SERVICE_CONFIG = 'cache.service.config';
export const HEARTBEAT_CACHE_TTL = 'cache.heartbeat.ttl';
export const EPHEMERAL_CACHE_TTL = 'cache.ephemeral.ttl';
export const OAUTH_NONCE_CACHE_TTL = 'cache.oauth-nonce.ttl';
export const OAUTH_INITIATION_CACHE_TTL = 'cache.oauth-initiation.ttl';
export const RATE_LIMIT_KEY_CACHE_TTL = 'cache.rate-limit-key.ttl';
export const RATE_LIMIT_IP_CACHE_TTL = 'cache.rate-limit-ip.ttl';
export const FASTIFY_RATE_LIMIT_CACHE_TTL = 'cache.fastify-rate-limit.ttl';

// Type for bucket names
export type CacheBucketName = (typeof CACHE_BUCKETS)[keyof typeof CACHE_BUCKETS];
