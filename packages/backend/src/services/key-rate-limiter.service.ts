import { injectable, inject } from 'inversify';
import { LoggerService } from '@skilder-ai/common';
import pino from 'pino';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * In-memory rate limiter for key validation attempts.
 * Prevents brute force attacks on API keys.
 *
 * Limits:
 * - Per key: 10 failed attempts per 15 minutes
 * - Per IP: 50 validation attempts per hour
 *
 * TODO: Consider Redis for distributed rate limiting in production
 */
@injectable()
export class KeyRateLimiterService {
  private logger: pino.Logger;
  private keyAttempts: Map<string, RateLimitEntry> = new Map();
  private ipAttempts: Map<string, RateLimitEntry> = new Map();

  // Configuration
  private readonly KEY_MAX_ATTEMPTS = 10;
  private readonly KEY_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  private readonly IP_MAX_ATTEMPTS = 50;
  private readonly IP_WINDOW_MS = 60 * 60 * 1000; // 1 hour

  // Cleanup interval
  private cleanupInterval?: NodeJS.Timeout;

  constructor(@inject(LoggerService) private readonly loggerService: LoggerService) {
    this.logger = this.loggerService.getLogger('key.rate.limiter');

    // Start periodic cleanup (every 10 minutes)
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 10 * 60 * 1000);
  }

  /**
   * Check if a key validation attempt is allowed.
   * Returns true if allowed, false if rate limited.
   *
   * @param keyPrefix - First 8 characters of the key (for tracking without storing full key)
   * @param ipAddress - IP address of the requester
   * @returns true if attempt is allowed, false if rate limited
   */
  checkKeyAttempt(keyPrefix: string, ipAddress: string): boolean {
    const now = Date.now();

    // Check per-key limit
    const keyLimited = this.isRateLimited(
      this.keyAttempts,
      keyPrefix,
      this.KEY_MAX_ATTEMPTS,
      this.KEY_WINDOW_MS,
      now
    );

    if (keyLimited) {
      this.logger.warn(`Rate limit exceeded for key prefix: ${keyPrefix}`);
      return false;
    }

    // Check per-IP limit
    const ipLimited = this.isRateLimited(
      this.ipAttempts,
      ipAddress,
      this.IP_MAX_ATTEMPTS,
      this.IP_WINDOW_MS,
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
  recordFailedAttempt(keyPrefix: string, ipAddress: string): void {
    const now = Date.now();

    this.incrementCounter(this.keyAttempts, keyPrefix, this.KEY_WINDOW_MS, now);
    this.incrementCounter(this.ipAttempts, ipAddress, this.IP_WINDOW_MS, now);

    this.logger.info(`Failed key validation attempt - key prefix: ${keyPrefix}, IP: ${ipAddress}`);
  }

  /**
   * Record a successful key validation attempt.
   * Resets the counter for the key (but not IP, to prevent enumeration).
   *
   * @param keyPrefix - First 8 characters of the key
   */
  recordSuccessfulAttempt(keyPrefix: string): void {
    // Reset key counter on success
    this.keyAttempts.delete(keyPrefix);
  }

  /**
   * Check if a specific identifier is rate limited.
   */
  private isRateLimited(
    store: Map<string, RateLimitEntry>,
    identifier: string,
    maxAttempts: number,
    windowMs: number,
    now: number
  ): boolean {
    const entry = store.get(identifier);

    if (!entry) {
      return false; // No attempts yet
    }

    // Check if window has expired
    if (now > entry.resetAt) {
      store.delete(identifier);
      return false;
    }

    // Check if limit exceeded
    return entry.count >= maxAttempts;
  }

  /**
   * Increment the attempt counter for an identifier.
   */
  private incrementCounter(
    store: Map<string, RateLimitEntry>,
    identifier: string,
    windowMs: number,
    now: number
  ): void {
    const entry = store.get(identifier);

    if (!entry || now > entry.resetAt) {
      // Create new entry or reset expired entry
      store.set(identifier, {
        count: 1,
        resetAt: now + windowMs,
      });
    } else {
      // Increment existing entry
      entry.count++;
    }
  }

  /**
   * Clean up expired entries to prevent memory leaks.
   */
  private cleanup(): void {
    const now = Date.now();
    let removedKey = 0;
    let removedIp = 0;

    // Clean up key attempts
    for (const [key, entry] of this.keyAttempts.entries()) {
      if (now > entry.resetAt) {
        this.keyAttempts.delete(key);
        removedKey++;
      }
    }

    // Clean up IP attempts
    for (const [ip, entry] of this.ipAttempts.entries()) {
      if (now > entry.resetAt) {
        this.ipAttempts.delete(ip);
        removedIp++;
      }
    }

    if (removedKey > 0 || removedIp > 0) {
      this.logger.debug(`Cleaned up ${removedKey} key entries and ${removedIp} IP entries`);
    }
  }

  /**
   * Stop the cleanup interval (for testing or shutdown).
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  /**
   * Get current stats for monitoring.
   */
  getStats(): { keyTracked: number; ipTracked: number } {
    return {
      keyTracked: this.keyAttempts.size,
      ipTracked: this.ipAttempts.size,
    };
  }
}
