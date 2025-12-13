import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { NatsCacheService } from '@skilder-ai/common';
import { RateLimitMiddleware } from './rate-limit.middleware';

/**
 * Mock CacheService for testing rate limiting.
 */
class CacheServiceMock {
  private buckets: Map<string, Map<string, { value: unknown }>> = new Map();

  async get<T>(bucket: string, key: string): Promise<{ value: T; revision: number } | null> {
    const bucketMap = this.buckets.get(bucket);
    if (!bucketMap) return null;
    const entry = bucketMap.get(key);
    if (!entry) return null;
    return { value: entry.value as T, revision: 1 };
  }

  async put<T>(bucket: string, key: string, value: T): Promise<number> {
    if (!this.buckets.has(bucket)) {
      this.buckets.set(bucket, new Map());
    }
    this.buckets.get(bucket)!.set(key, { value });
    return 1;
  }

  clear(): void {
    this.buckets.clear();
  }
}

describe('RateLimitMiddleware', () => {
  let fastify: FastifyInstance;
  let rateLimitMiddleware: RateLimitMiddleware;
  let cacheService: CacheServiceMock;

  beforeEach(async () => {
    // Silence console errors in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});

    fastify = Fastify({ logger: false });
    cacheService = new CacheServiceMock();
    rateLimitMiddleware = new RateLimitMiddleware(cacheService as unknown as NatsCacheService);
  });

  afterEach(async () => {
    if (fastify) {
      await fastify.close();
    }
    cacheService.clear();
    vi.restoreAllMocks();
  });

  describe('Simple Rate Limiting', () => {
    it('should register rate limiting middleware', async () => {
      await rateLimitMiddleware.register(fastify);

      // Add a test route
      fastify.get('/test', async () => ({ message: 'test' }));

      await fastify.ready();

      const response = await fastify.inject({
        method: 'GET',
        url: '/test',
      });

      expect(response.statusCode).toBe(200);
    });

    it('should include rate limit headers', async () => {
      await rateLimitMiddleware.register(fastify);

      fastify.get('/test', async () => ({ message: 'test' }));

      await fastify.ready();

      const response = await fastify.inject({
        method: 'GET',
        url: '/test',
      });

      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    });

    it('should return proper error response when rate limit is exceeded', async () => {
      // Set very low rate limit for testing
      process.env.RATE_LIMIT_MAX = '1';
      process.env.RATE_LIMIT_WINDOW = '60000';

      await rateLimitMiddleware.register(fastify);

      fastify.get('/test', async () => ({ message: 'test' }));

      await fastify.ready();

      // First request should succeed
      const response1 = await fastify.inject({
        method: 'GET',
        url: '/test',
      });
      expect(response1.statusCode).toBe(200);

      // Second request should be rate limited
      const response2 = await fastify.inject({
        method: 'GET',
        url: '/test',
      });
      expect(response2.statusCode).toBe(429);

      const body = JSON.parse(response2.payload);
      expect(body.error).toBe('Too Many Requests');
      expect(body.message).toBe('Rate limit exceeded. Please try again later.');

      // Clean up
      delete process.env.RATE_LIMIT_MAX;
      delete process.env.RATE_LIMIT_WINDOW;
    });
  });
});