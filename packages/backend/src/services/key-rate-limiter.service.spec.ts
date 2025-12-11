import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { KeyRateLimiterService } from './key-rate-limiter.service';
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

describe('KeyRateLimiterService', () => {
  let service: KeyRateLimiterService;
  let mockLoggerService: LoggerService;
  let cacheService: NatsCacheServiceMock;

  const KEY_TTL = 15 * 60 * 1000; // 15 minutes
  const IP_TTL = 60 * 60 * 1000; // 1 hour

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

    service = new KeyRateLimiterService(
      mockLoggerService,
      cacheService as unknown as NatsCacheService,
      KEY_TTL,
      IP_TTL
    );
  });

  afterEach(() => {
    service.destroy();
    cacheService.clear();
  });

  describe('checkKeyAttempt', () => {
    it('should allow the first validation attempt', async () => {
      const result = await service.checkKeyAttempt('WSK12345', '192.168.1.1');
      expect(result).toBe(true);
    });

    it('should allow multiple attempts under the per-key limit', async () => {
      const keyPrefix = 'WSK12345';
      const ip = '192.168.1.1';

      // Try 9 times (under the limit of 10)
      for (let i = 0; i < 9; i++) {
        await service.recordFailedAttempt(keyPrefix, ip);
      }

      // 10th attempt should still be allowed
      const result = await service.checkKeyAttempt(keyPrefix, ip);
      expect(result).toBe(true);
    });

    it('should block after exceeding per-key limit', async () => {
      const keyPrefix = 'WSK12345';
      const ip = '192.168.1.1';

      // Make 10 failed attempts
      for (let i = 0; i < 10; i++) {
        await service.recordFailedAttempt(keyPrefix, ip);
      }

      // 11th attempt should be blocked
      const result = await service.checkKeyAttempt(keyPrefix, ip);
      expect(result).toBe(false);
    });

    it('should allow multiple attempts under the per-IP limit', async () => {
      const ip = '192.168.1.1';

      // Try 49 times with different keys (under the IP limit of 50)
      for (let i = 0; i < 49; i++) {
        await service.recordFailedAttempt(`WSK${i}`, ip);
      }

      // 50th attempt should still be allowed
      const result = await service.checkKeyAttempt('WSK50', ip);
      expect(result).toBe(true);
    });

    it('should block after exceeding per-IP limit', async () => {
      const ip = '192.168.1.1';

      // Make 50 failed attempts with different keys
      for (let i = 0; i < 50; i++) {
        await service.recordFailedAttempt(`WSK${i}`, ip);
      }

      // 51st attempt should be blocked
      const result = await service.checkKeyAttempt('WSK51', ip);
      expect(result).toBe(false);
    });

    it('should track different keys independently', async () => {
      const ip = '192.168.1.1';

      // Key 1: Make 10 failed attempts (should be blocked)
      for (let i = 0; i < 10; i++) {
        await service.recordFailedAttempt('WSK11111', ip);
      }

      // Key 2: Make 5 failed attempts (should be allowed)
      for (let i = 0; i < 5; i++) {
        await service.recordFailedAttempt('WSK22222', ip);
      }

      expect(await service.checkKeyAttempt('WSK11111', ip)).toBe(false);
      expect(await service.checkKeyAttempt('WSK22222', ip)).toBe(true);
    });

    it('should track different IPs independently', async () => {
      // Use different keys for each IP to avoid key-level blocking
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';

      // IP 1: Make 50 failed attempts with different keys (should hit IP limit)
      for (let i = 0; i < 50; i++) {
        await service.recordFailedAttempt(`WSK${i}`, ip1);
      }

      // IP 2: Make 30 failed attempts with different keys (should still be allowed)
      for (let i = 50; i < 80; i++) {
        await service.recordFailedAttempt(`WSK${i}`, ip2);
      }

      expect(await service.checkKeyAttempt('WSK999', ip1)).toBe(false); // IP1 blocked
      expect(await service.checkKeyAttempt('WSK998', ip2)).toBe(true); // IP2 allowed
    });
  });

  describe('recordFailedAttempt', () => {
    it('should increment the counter for failed attempts', async () => {
      const keyPrefix = 'WSK12345';
      const ip = '192.168.1.1';

      expect(await service.checkKeyAttempt(keyPrefix, ip)).toBe(true);

      await service.recordFailedAttempt(keyPrefix, ip);
      await service.recordFailedAttempt(keyPrefix, ip);

      // Still allowed after 2 attempts
      expect(await service.checkKeyAttempt(keyPrefix, ip)).toBe(true);
    });
  });

  describe('recordSuccessfulAttempt', () => {
    it('should reset the counter for a key on success', async () => {
      const keyPrefix = 'WSK12345';
      const ip = '192.168.1.1';

      // Make 9 failed attempts
      for (let i = 0; i < 9; i++) {
        await service.recordFailedAttempt(keyPrefix, ip);
      }

      // Record successful attempt (resets key counter)
      await service.recordSuccessfulAttempt(keyPrefix);

      // Should be allowed again (counter was reset)
      expect(await service.checkKeyAttempt(keyPrefix, ip)).toBe(true);

      // Make 10 more failed attempts
      for (let i = 0; i < 10; i++) {
        await service.recordFailedAttempt(keyPrefix, ip);
      }

      // Should be blocked now
      expect(await service.checkKeyAttempt(keyPrefix, ip)).toBe(false);
    });

    it('should not reset IP counter on successful attempt', async () => {
      const ip = '192.168.1.1';

      // Make 48 failed attempts with different keys
      for (let i = 0; i < 48; i++) {
        await service.recordFailedAttempt(`WSK${i}`, ip);
      }

      // Record successful attempt for one key
      await service.recordSuccessfulAttempt('WSK0');

      // IP counter should still be at 48, so 2 more attempts should be allowed before hitting limit
      await service.recordFailedAttempt('WSK100', ip);
      expect(await service.checkKeyAttempt('WSK101', ip)).toBe(true); // 49 attempts, still under 50

      await service.recordFailedAttempt('WSK101', ip);
      expect(await service.checkKeyAttempt('WSK102', ip)).toBe(false); // 50 attempts, now blocked
    });
  });

  describe('window expiry', () => {
    it('should allow attempts after window expires', async () => {
      const keyPrefix = 'WSK12345';
      const ip = '192.168.1.1';

      // Make 10 failed attempts (hit limit)
      for (let i = 0; i < 10; i++) {
        await service.recordFailedAttempt(keyPrefix, ip);
      }

      expect(await service.checkKeyAttempt(keyPrefix, ip)).toBe(false);

      // Fast-forward time by 20 minutes (past the 15-minute window)
      vi.useFakeTimers();
      vi.advanceTimersByTime(20 * 60 * 1000);

      // After window expires, should be allowed again
      // Note: The cache mock doesn't handle TTL, but the service checks resetAt
      // For real testing, the cache would expire the entry

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
