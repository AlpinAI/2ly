import { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { injectable, inject } from 'inversify';
import { NatsCacheService } from '@skilder-ai/common';
import { createRateLimitStore } from './rate-limit-store';

/**
 * Distributed rate limiting middleware for the entire application.
 * Uses a distributed cache for state storage, supporting horizontal scaling.
 *
 * TODO: Future improvements could include:
 * - Different limits for different endpoint types
 * - User-based rate limiting
 * - IP whitelisting
 * - More sophisticated rate limiting algorithms
 */
@injectable()
export class RateLimitMiddleware {
  constructor(
    @inject(NatsCacheService) private readonly cacheService: NatsCacheService,
  ) {}

  async register(fastify: FastifyInstance): Promise<void> {
    const timeWindow = parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10);

    await fastify.register(rateLimit, {
      // 100 requests per minute per IP - generous for POC
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      timeWindow,
      // Use distributed cache store for horizontal scaling
      store: createRateLimitStore(this.cacheService, timeWindow),
      errorResponseBuilder: () => ({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        statusCode: 429,
      }),
    });
  }
}