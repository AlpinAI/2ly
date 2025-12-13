import { injectable, inject } from 'inversify';
import { LoggerService, NatsCacheService, CACHE_BUCKETS, CACHE_BUCKET_TTLS } from '@skilder-ai/common';
import pino from 'pino';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Distributed rate limiter for OAuth initiation attempts.
 * Limits users to 5 attempts per 5 minutes to prevent abuse.
 * Uses NATS KV for distributed storage, supporting horizontal scaling.
 */
@injectable()
export class OAuthRateLimiterService {
  private logger: pino.Logger;

  // Configuration
  private readonly MAX_ATTEMPTS = 5;
  private readonly windowMs = CACHE_BUCKET_TTLS.OAUTH_INITIATION;

  constructor(
    @inject(LoggerService) private readonly loggerService: LoggerService,
    @inject(NatsCacheService) private readonly cacheService: NatsCacheService,
  ) {
    this.logger = this.loggerService.getLogger('oauth.rate.limiter');
  }

  /**
   * Check if a user is allowed to initiate an OAuth flow.
   * Returns true if allowed, false if rate limited.
   *
   * @param userId - The user ID to check rate limit for
   * @returns true if attempt is allowed, false if rate limited
   */
  async checkAttempt(userId: string): Promise<boolean> {
    const now = Date.now();
    const entry = await this.cacheService.get<RateLimitEntry>(CACHE_BUCKETS.OAUTH_INITIATION, userId);

    if (!entry) {
      return true; // No attempts yet
    }

    // Check if window has expired (TTL should handle this, but double-check)
    if (now > entry.value.resetAt) {
      await this.cacheService.delete(CACHE_BUCKETS.OAUTH_INITIATION, userId);
      return true;
    }

    // Check if limit exceeded
    if (entry.value.count >= this.MAX_ATTEMPTS) {
      this.logger.warn(`OAuth rate limit exceeded for user: ${userId}`);
      return false;
    }

    return true;
  }

  /**
   * Record an OAuth initiation attempt.
   * Increments the counter for the user.
   *
   * @param userId - The user ID to record attempt for
   */
  async recordAttempt(userId: string): Promise<void> {
    const now = Date.now();
    const entry = await this.cacheService.get<RateLimitEntry>(CACHE_BUCKETS.OAUTH_INITIATION, userId);

    if (!entry || now > entry.value.resetAt) {
      // Create new entry or reset expired entry
      await this.cacheService.put<RateLimitEntry>(CACHE_BUCKETS.OAUTH_INITIATION, userId, {
        count: 1,
        resetAt: now + this.windowMs,
      });
    } else {
      // Increment existing entry
      await this.cacheService.put<RateLimitEntry>(CACHE_BUCKETS.OAUTH_INITIATION, userId, {
        count: entry.value.count + 1,
        resetAt: entry.value.resetAt,
      });
    }
  }

  /**
   * Stop the service (no-op, cleanup handled by TTL).
   */
  destroy(): void {
    // No cleanup interval needed - TTL handles expiration
  }
}
