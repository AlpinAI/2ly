import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OAuthRateLimiterService } from './oauth-rate-limiter.service';
import { LoggerService, NatsCacheService } from '@skilder-ai/common';

/**
 * Mock NatsCacheService for testing rate limiting.
 */
class NatsCacheServiceMock {
  private buckets: Map<string, Map<string, { value: unknown }>> = new Map();

  async createBucket(): Promise<void> {
    // No-op for mock
  }

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

  async delete(bucket: string, key: string): Promise<void> {
    const bucketMap = this.buckets.get(bucket);
    if (bucketMap) {
      bucketMap.delete(key);
    }
  }

  clear(): void {
    this.buckets.clear();
  }
}

describe('OAuthRateLimiterService', () => {
  let service: OAuthRateLimiterService;
  let mockLoggerService: LoggerService;
  let cacheService: NatsCacheServiceMock;

  beforeEach(async () => {
    mockLoggerService = {
      getLogger: vi.fn().mockReturnValue({
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      }),
    } as unknown as LoggerService;

    cacheService = new NatsCacheServiceMock();

    service = new OAuthRateLimiterService(mockLoggerService, cacheService as unknown as NatsCacheService);
  });

  afterEach(() => {
    service.destroy();
    cacheService.clear();
  });

  describe('checkAttempt', () => {
    it('should allow the first OAuth initiation attempt', async () => {
      const result = await service.checkAttempt('user-123');
      expect(result).toBe(true);
    });

    it('should allow multiple attempts under the limit', async () => {
      const userId = 'user-123';

      // Make 4 attempts (under the limit of 5)
      for (let i = 0; i < 4; i++) {
        await service.recordAttempt(userId);
      }

      // 5th attempt should still be allowed
      const result = await service.checkAttempt(userId);
      expect(result).toBe(true);
    });

    it('should block after exceeding the limit', async () => {
      const userId = 'user-123';

      // Make 5 attempts
      for (let i = 0; i < 5; i++) {
        await service.recordAttempt(userId);
      }

      // 6th attempt should be blocked
      const result = await service.checkAttempt(userId);
      expect(result).toBe(false);
    });

    it('should track different users independently', async () => {
      const user1 = 'user-1';
      const user2 = 'user-2';

      // User 1: Make 5 attempts (should be blocked)
      for (let i = 0; i < 5; i++) {
        await service.recordAttempt(user1);
      }

      // User 2: Make 3 attempts (should be allowed)
      for (let i = 0; i < 3; i++) {
        await service.recordAttempt(user2);
      }

      expect(await service.checkAttempt(user1)).toBe(false);
      expect(await service.checkAttempt(user2)).toBe(true);
    });
  });

  describe('recordAttempt', () => {
    it('should increment the counter for attempts', async () => {
      const userId = 'user-123';

      expect(await service.checkAttempt(userId)).toBe(true);

      await service.recordAttempt(userId);
      await service.recordAttempt(userId);

      // Still allowed after 2 attempts
      expect(await service.checkAttempt(userId)).toBe(true);
    });

    it('should create new entry for first attempt', async () => {
      const userId = 'user-123';

      await service.recordAttempt(userId);

      // Check should still pass (1 attempt, limit is 5)
      expect(await service.checkAttempt(userId)).toBe(true);
    });
  });

  describe('window expiry', () => {
    it('should allow attempts after window expires', async () => {
      vi.useFakeTimers();
      const userId = 'user-123';

      // Make 5 attempts (hit limit)
      for (let i = 0; i < 5; i++) {
        await service.recordAttempt(userId);
      }

      expect(await service.checkAttempt(userId)).toBe(false);

      // Fast-forward time by 6 minutes (past the 5-minute window)
      vi.advanceTimersByTime(6 * 60 * 1000);

      // After window expires, should be allowed again
      expect(await service.checkAttempt(userId)).toBe(true);

      vi.useRealTimers();
    });

    it('should reset counter after window expires and new attempt is made', async () => {
      vi.useFakeTimers();
      const userId = 'user-123';

      // Make 4 attempts
      for (let i = 0; i < 4; i++) {
        await service.recordAttempt(userId);
      }

      // Fast-forward time by 6 minutes (past the 5-minute window)
      vi.advanceTimersByTime(6 * 60 * 1000);

      // New attempt should reset the counter
      await service.recordAttempt(userId);

      // Should be allowed (counter was reset to 1)
      expect(await service.checkAttempt(userId)).toBe(true);

      // Can make 4 more attempts before hitting limit
      for (let i = 0; i < 4; i++) {
        await service.recordAttempt(userId);
      }

      // Now should be blocked
      expect(await service.checkAttempt(userId)).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('destroy', () => {
    it('should be safe to call destroy multiple times', () => {
      service.destroy();
      service.destroy(); // Should not throw
    });
  });
});
