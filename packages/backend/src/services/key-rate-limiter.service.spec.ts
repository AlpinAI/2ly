import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { KeyRateLimiterService } from './key-rate-limiter.service';
import { LoggerService } from '@skilder-ai/common';

// Mock LoggerService
vi.mock('@skilder-ai/common', async () => {
  const actual = await vi.importActual('@skilder-ai/common');
  return {
    ...actual,
    LoggerService: vi.fn().mockImplementation(() => ({
      getLogger: vi.fn().mockReturnValue({
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      }),
    })),
  };
});

describe('KeyRateLimiterService', () => {
  let service: KeyRateLimiterService;
  let mockLoggerService: LoggerService;

  beforeEach(() => {
    mockLoggerService = {
      getLogger: vi.fn().mockReturnValue({
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      }),
    } as unknown as LoggerService;

    service = new KeyRateLimiterService(mockLoggerService);
  });

  afterEach(() => {
    service.destroy();
  });

  describe('checkKeyAttempt', () => {
    it('should allow the first validation attempt', () => {
      const result = service.checkKeyAttempt('WSK12345', '192.168.1.1');
      expect(result).toBe(true);
    });

    it('should allow multiple attempts under the per-key limit', () => {
      const keyPrefix = 'WSK12345';
      const ip = '192.168.1.1';

      // Try 9 times (under the limit of 10)
      for (let i = 0; i < 9; i++) {
        service.recordFailedAttempt(keyPrefix, ip);
      }

      // 10th attempt should still be allowed
      const result = service.checkKeyAttempt(keyPrefix, ip);
      expect(result).toBe(true);
    });

    it('should block after exceeding per-key limit', () => {
      const keyPrefix = 'WSK12345';
      const ip = '192.168.1.1';

      // Make 10 failed attempts
      for (let i = 0; i < 10; i++) {
        service.recordFailedAttempt(keyPrefix, ip);
      }

      // 11th attempt should be blocked
      const result = service.checkKeyAttempt(keyPrefix, ip);
      expect(result).toBe(false);
    });

    it('should allow multiple attempts under the per-IP limit', () => {
      const ip = '192.168.1.1';

      // Try 49 times with different keys (under the IP limit of 50)
      for (let i = 0; i < 49; i++) {
        service.recordFailedAttempt(`WSK${i}`, ip);
      }

      // 50th attempt should still be allowed
      const result = service.checkKeyAttempt('WSK50', ip);
      expect(result).toBe(true);
    });

    it('should block after exceeding per-IP limit', () => {
      const ip = '192.168.1.1';

      // Make 50 failed attempts with different keys
      for (let i = 0; i < 50; i++) {
        service.recordFailedAttempt(`WSK${i}`, ip);
      }

      // 51st attempt should be blocked
      const result = service.checkKeyAttempt('WSK51', ip);
      expect(result).toBe(false);
    });

    it('should track different keys independently', () => {
      const ip = '192.168.1.1';

      // Key 1: Make 10 failed attempts (should be blocked)
      for (let i = 0; i < 10; i++) {
        service.recordFailedAttempt('WSK11111', ip);
      }

      // Key 2: Make 5 failed attempts (should be allowed)
      for (let i = 0; i < 5; i++) {
        service.recordFailedAttempt('WSK22222', ip);
      }

      expect(service.checkKeyAttempt('WSK11111', ip)).toBe(false);
      expect(service.checkKeyAttempt('WSK22222', ip)).toBe(true);
    });

    it('should track different IPs independently', () => {
      // Use different keys for each IP to avoid key-level blocking
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';

      // IP 1: Make 50 failed attempts with different keys (should hit IP limit)
      for (let i = 0; i < 50; i++) {
        service.recordFailedAttempt(`WSK${i}`, ip1);
      }

      // IP 2: Make 30 failed attempts with different keys (should still be allowed)
      for (let i = 50; i < 80; i++) {
        service.recordFailedAttempt(`WSK${i}`, ip2);
      }

      expect(service.checkKeyAttempt('WSK999', ip1)).toBe(false); // IP1 blocked
      expect(service.checkKeyAttempt('WSK998', ip2)).toBe(true);  // IP2 allowed
    });
  });

  describe('recordFailedAttempt', () => {
    it('should increment the counter for failed attempts', () => {
      const keyPrefix = 'WSK12345';
      const ip = '192.168.1.1';

      expect(service.checkKeyAttempt(keyPrefix, ip)).toBe(true);

      service.recordFailedAttempt(keyPrefix, ip);
      service.recordFailedAttempt(keyPrefix, ip);

      // Still allowed after 2 attempts
      expect(service.checkKeyAttempt(keyPrefix, ip)).toBe(true);
    });
  });

  describe('recordSuccessfulAttempt', () => {
    it('should reset the counter for a key on success', () => {
      const keyPrefix = 'WSK12345';
      const ip = '192.168.1.1';

      // Make 9 failed attempts
      for (let i = 0; i < 9; i++) {
        service.recordFailedAttempt(keyPrefix, ip);
      }

      // Record successful attempt (resets key counter)
      service.recordSuccessfulAttempt(keyPrefix);

      // Should be allowed again (counter was reset)
      expect(service.checkKeyAttempt(keyPrefix, ip)).toBe(true);

      // Make 10 more failed attempts
      for (let i = 0; i < 10; i++) {
        service.recordFailedAttempt(keyPrefix, ip);
      }

      // Should be blocked now
      expect(service.checkKeyAttempt(keyPrefix, ip)).toBe(false);
    });

    it('should not reset IP counter on successful attempt', () => {
      const ip = '192.168.1.1';

      // Make 48 failed attempts with different keys
      for (let i = 0; i < 48; i++) {
        service.recordFailedAttempt(`WSK${i}`, ip);
      }

      // Record successful attempt for one key
      service.recordSuccessfulAttempt('WSK0');

      // IP counter should still be at 48, so 2 more attempts should be allowed before hitting limit
      service.recordFailedAttempt('WSK100', ip);
      expect(service.checkKeyAttempt('WSK101', ip)).toBe(true); // 49 attempts, still under 50

      service.recordFailedAttempt('WSK101', ip);
      expect(service.checkKeyAttempt('WSK102', ip)).toBe(false); // 50 attempts, now blocked
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', async () => {
      const keyPrefix = 'WSK12345';
      const ip = '192.168.1.1';

      // Make some failed attempts
      for (let i = 0; i < 5; i++) {
        service.recordFailedAttempt(keyPrefix, ip);
      }

      // Fast-forward time by 20 minutes (past the 15-minute window)
      vi.useFakeTimers();
      vi.advanceTimersByTime(20 * 60 * 1000);

      // Trigger cleanup manually (normally runs every 10 minutes)
      // Access private method via any cast for testing
      (service as unknown as { cleanup: () => void }).cleanup();

      vi.useRealTimers();

      // After cleanup, counters should be reset
      expect(service.checkKeyAttempt(keyPrefix, ip)).toBe(true);
    });

    it('should track active entries in stats', () => {
      // Make attempts with 3 different keys and 2 different IPs
      service.recordFailedAttempt('WSK11111', '192.168.1.1');
      service.recordFailedAttempt('WSK22222', '192.168.1.1');
      service.recordFailedAttempt('WSK33333', '192.168.1.2');

      const stats = service.getStats();

      expect(stats.keyTracked).toBe(3);
      expect(stats.ipTracked).toBe(2);
    });
  });

  describe('getStats', () => {
    it('should return zero when no attempts have been made', () => {
      const stats = service.getStats();

      expect(stats.keyTracked).toBe(0);
      expect(stats.ipTracked).toBe(0);
    });

    it('should return correct counts after recording attempts', () => {
      service.recordFailedAttempt('WSK11111', '192.168.1.1');
      service.recordFailedAttempt('WSK22222', '192.168.1.1');
      service.recordFailedAttempt('WSK33333', '192.168.1.2');

      const stats = service.getStats();

      expect(stats.keyTracked).toBe(3);
      expect(stats.ipTracked).toBe(2);
    });

    it('should update counts after successful attempts', () => {
      service.recordFailedAttempt('WSK11111', '192.168.1.1');
      service.recordFailedAttempt('WSK22222', '192.168.1.1');

      // Reset one key
      service.recordSuccessfulAttempt('WSK11111');

      const stats = service.getStats();

      expect(stats.keyTracked).toBe(1); // Only WSK22222 left
      expect(stats.ipTracked).toBe(1); // IP still tracked
    });
  });

  describe('destroy', () => {
    it('should stop the cleanup interval', () => {
      const interval = (service as unknown as { cleanupInterval: NodeJS.Timeout }).cleanupInterval;
      expect(interval).toBeDefined();

      service.destroy();

      expect((service as unknown as { cleanupInterval: NodeJS.Timeout }).cleanupInterval).toBeUndefined();
    });

    it('should be safe to call destroy multiple times', () => {
      service.destroy();
      service.destroy(); // Should not throw

      expect((service as unknown as { cleanupInterval: NodeJS.Timeout }).cleanupInterval).toBeUndefined();
    });
  });
});
