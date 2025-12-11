import { injectable, inject } from 'inversify';
import {
  LoggerService,
  NatsCacheService,
  CACHE_BUCKETS,
  RATE_LIMIT_KEY_CACHE_TTL,
  RATE_LIMIT_IP_CACHE_TTL,
} from '@skilder-ai/common';
import pino from 'pino';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Distributed rate limiter for key validation attempts.
 * Prevents brute force attacks on API keys.
 * Uses NATS KV for distributed storage, supporting horizontal scaling.
 *
 * Limits:
 * - Per key: 10 failed attempts per 15 minutes
 * - Per IP: 50 validation attempts per hour
 */
@injectable()
export class KeyRateLimiterService {
  private logger: pino.Logger;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  // Configuration
  private readonly KEY_MAX_ATTEMPTS = 10;
  private readonly IP_MAX_ATTEMPTS = 50;

  constructor(
    @inject(LoggerService) private readonly loggerService: LoggerService,
    @inject(NatsCacheService) private readonly cacheService: NatsCacheService,
    @inject(RATE_LIMIT_KEY_CACHE_TTL) private readonly keyTTL: number,
    @inject(RATE_LIMIT_IP_CACHE_TTL) private readonly ipTTL: number
  ) {
    this.logger = this.loggerService.getLogger('key.rate.limiter');
  }

  /**
   * Ensure the service is initialized before use.
   * Uses lazy initialization pattern for resilience.
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    if (!this.initPromise) {
      this.initPromise = (async () => {
        await this.cacheService.createBucket({
          name: CACHE_BUCKETS.RATE_LIMIT_KEY,
          ttlMs: this.keyTTL,
        });
        await this.cacheService.createBucket({
          name: CACHE_BUCKETS.RATE_LIMIT_IP,
          ttlMs: this.ipTTL,
        });
        this.initialized = true;
        this.logger.info('Rate limiter cache buckets initialized');
      })();
    }
    await this.initPromise;
  }

  /**
   * Check if a key validation attempt is allowed.
   * Returns true if allowed, false if rate limited.
   *
   * @param keyPrefix - First 8 characters of the key (for tracking without storing full key)
   * @param ipAddress - IP address of the requester
   * @returns true if attempt is allowed, false if rate limited
   */
  async checkKeyAttempt(keyPrefix: string, ipAddress: string): Promise<boolean> {
    await this.ensureInitialized();
    const now = Date.now();

    // Check per-key limit
    const keyLimited = await this.isRateLimited(
      CACHE_BUCKETS.RATE_LIMIT_KEY,
      keyPrefix,
      this.KEY_MAX_ATTEMPTS,
      this.keyTTL,
      now
    );

    if (keyLimited) {
      this.logger.warn(`Rate limit exceeded for key prefix: ${keyPrefix}`);
      return false;
    }

    // Check per-IP limit
    const ipLimited = await this.isRateLimited(
      CACHE_BUCKETS.RATE_LIMIT_IP,
      ipAddress,
      this.IP_MAX_ATTEMPTS,
      this.ipTTL,
      now
    );

    if (ipLimited) {
      this.logger.warn(`Rate limit exceeded for IP: ${ipAddress}`);
      return false;
    }

    return true;
  }

  /**
   * Record a failed key validation attempt.
   * Increments counters for both key and IP.
   *
   * @param keyPrefix - First 8 characters of the key
   * @param ipAddress - IP address of the requester
   */
  async recordFailedAttempt(keyPrefix: string, ipAddress: string): Promise<void> {
    await this.ensureInitialized();
    const now = Date.now();

    await Promise.all([
      this.incrementCounter(CACHE_BUCKETS.RATE_LIMIT_KEY, keyPrefix, this.keyTTL, now),
      this.incrementCounter(CACHE_BUCKETS.RATE_LIMIT_IP, ipAddress, this.ipTTL, now),
    ]);

    this.logger.info(`Failed key validation attempt - key prefix: ${keyPrefix}, IP: ${ipAddress}`);
  }

  /**
   * Record a successful key validation attempt.
   * Resets the counter for the key (but not IP, to prevent enumeration).
   *
   * @param keyPrefix - First 8 characters of the key
   */
  async recordSuccessfulAttempt(keyPrefix: string): Promise<void> {
    await this.ensureInitialized();
    // Reset key counter on success
    await this.cacheService.delete(CACHE_BUCKETS.RATE_LIMIT_KEY, keyPrefix);
  }

  /**
   * Check if a specific identifier is rate limited.
   */
  private async isRateLimited(
    bucket: string,
    identifier: string,
    maxAttempts: number,
    windowMs: number,
    now: number
  ): Promise<boolean> {
    const entry = await this.cacheService.get<RateLimitEntry>(bucket, identifier);

    if (!entry) {
      return false; // No attempts yet
    }

    // Check if window has expired (TTL should handle this, but double-check)
    if (now > entry.value.resetAt) {
      await this.cacheService.delete(bucket, identifier);
      return false;
    }

    // Check if limit exceeded
    return entry.value.count >= maxAttempts;
  }

  /**
   * Increment the attempt counter for an identifier.
   */
  private async incrementCounter(bucket: string, identifier: string, windowMs: number, now: number): Promise<void> {
    const entry = await this.cacheService.get<RateLimitEntry>(bucket, identifier);

    if (!entry || now > entry.value.resetAt) {
      // Create new entry or reset expired entry
      await this.cacheService.put<RateLimitEntry>(bucket, identifier, {
        count: 1,
        resetAt: now + windowMs,
      });
    } else {
      // Increment existing entry
      await this.cacheService.put<RateLimitEntry>(bucket, identifier, {
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
