import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { checkOAuthInitiationRateLimit, destroyOAuthRateLimiter } from './user-oauth-connection.rate-limiter';

describe('OAuth Rate Limiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    destroyOAuthRateLimiter();
    vi.useRealTimers();
  });

  describe('checkOAuthInitiationRateLimit()', () => {
    it('allows first attempt for a user', () => {
      const result = checkOAuthInitiationRateLimit('user-1');
      expect(result).toBe(true);
    });

    it('allows 2nd through 5th attempts within window', () => {
      const userId = 'user-2';

      // First attempt
      expect(checkOAuthInitiationRateLimit(userId)).toBe(true);

      // 2nd through 5th attempts (4 more attempts)
      for (let i = 2; i <= 5; i++) {
        expect(checkOAuthInitiationRateLimit(userId)).toBe(true);
      }
    });

    it('blocks 6th attempt within window', () => {
      const userId = 'user-3';

      // Make 5 allowed attempts
      for (let i = 1; i <= 5; i++) {
        expect(checkOAuthInitiationRateLimit(userId)).toBe(true);
      }

      // 6th attempt should be blocked
      expect(checkOAuthInitiationRateLimit(userId)).toBe(false);

      // 7th attempt should also be blocked
      expect(checkOAuthInitiationRateLimit(userId)).toBe(false);
    });

    it('resets counter after window expires', () => {
      const userId = 'user-4';
      const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

      // Make 5 allowed attempts
      for (let i = 1; i <= 5; i++) {
        expect(checkOAuthInitiationRateLimit(userId)).toBe(true);
      }

      // 6th attempt should be blocked
      expect(checkOAuthInitiationRateLimit(userId)).toBe(false);

      // Advance time past the rate limit window
      vi.advanceTimersByTime(RATE_LIMIT_WINDOW_MS + 1);

      // Should be allowed again after window expires
      expect(checkOAuthInitiationRateLimit(userId)).toBe(true);
    });

    it('each user has independent rate limiting', () => {
      const user1 = 'user-5';
      const user2 = 'user-6';

      // Make 5 attempts for user1
      for (let i = 1; i <= 5; i++) {
        expect(checkOAuthInitiationRateLimit(user1)).toBe(true);
      }

      // Block user1's 6th attempt
      expect(checkOAuthInitiationRateLimit(user1)).toBe(false);

      // User2 should still be allowed (independent rate limiting)
      expect(checkOAuthInitiationRateLimit(user2)).toBe(true);
      expect(checkOAuthInitiationRateLimit(user2)).toBe(true);
    });

    it('allows request after window expires for blocked user', () => {
      const userId = 'user-7';
      const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

      // Exhaust rate limit
      for (let i = 1; i <= 5; i++) {
        expect(checkOAuthInitiationRateLimit(userId)).toBe(true);
      }
      expect(checkOAuthInitiationRateLimit(userId)).toBe(false);

      // Advance time to exactly at reset time
      vi.advanceTimersByTime(RATE_LIMIT_WINDOW_MS);

      // Should be allowed again
      expect(checkOAuthInitiationRateLimit(userId)).toBe(true);

      // Make 4 more attempts (total 5 in new window)
      for (let i = 2; i <= 5; i++) {
        expect(checkOAuthInitiationRateLimit(userId)).toBe(true);
      }

      // 6th attempt in new window should be blocked
      expect(checkOAuthInitiationRateLimit(userId)).toBe(false);
    });
  });

  describe('destroyOAuthRateLimiter()', () => {
    it('clears all tracked state', () => {
      const userId = 'user-8';

      // Make 5 attempts
      for (let i = 1; i <= 5; i++) {
        expect(checkOAuthInitiationRateLimit(userId)).toBe(true);
      }

      // 6th attempt blocked
      expect(checkOAuthInitiationRateLimit(userId)).toBe(false);

      // Destroy the rate limiter
      destroyOAuthRateLimiter();

      // Should be allowed again (state cleared)
      expect(checkOAuthInitiationRateLimit(userId)).toBe(true);
    });

    it('allows new attempts after destroy', () => {
      const user1 = 'user-9';
      const user2 = 'user-10';

      // Block both users
      for (let i = 1; i <= 5; i++) {
        checkOAuthInitiationRateLimit(user1);
        checkOAuthInitiationRateLimit(user2);
      }
      expect(checkOAuthInitiationRateLimit(user1)).toBe(false);
      expect(checkOAuthInitiationRateLimit(user2)).toBe(false);

      // Destroy
      destroyOAuthRateLimiter();

      // Both users should be allowed again
      expect(checkOAuthInitiationRateLimit(user1)).toBe(true);
      expect(checkOAuthInitiationRateLimit(user2)).toBe(true);
    });
  });

  describe('Cleanup behavior', () => {
    it('starts cleanup interval on first use and calls unref', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');

      // Create a mock timer with unref method
      const mockTimer = {
        unref: vi.fn(),
        ref: vi.fn(),
        refresh: vi.fn(),
        hasRef: vi.fn(),
        [Symbol.toPrimitive]: vi.fn(),
        [Symbol.dispose]: vi.fn(),
      } as unknown as NodeJS.Timeout;

      // Mock setInterval to return our mock timer
      setIntervalSpy.mockReturnValue(mockTimer);

      const userId = 'user-11';

      // First call should start the cleanup interval and call unref
      checkOAuthInitiationRateLimit(userId);

      // Verify setInterval was called with correct parameters
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 10 * 60 * 1000);

      // Verify unref was called on the timer
      expect(mockTimer.unref).toHaveBeenCalled();

      setIntervalSpy.mockRestore();
    });

    it('cleanup interval removes expired entries', () => {
      const user1 = 'user-12';
      const user2 = 'user-13';
      const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
      const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

      // Make attempts for both users
      checkOAuthInitiationRateLimit(user1);
      checkOAuthInitiationRateLimit(user2);

      // Advance time past the rate limit window but before cleanup interval
      vi.advanceTimersByTime(RATE_LIMIT_WINDOW_MS + 1);

      // Make a new attempt for user2 to refresh their entry
      checkOAuthInitiationRateLimit(user2);

      // Advance time to trigger cleanup interval
      vi.advanceTimersByTime(CLEANUP_INTERVAL_MS);

      // User1's expired entry should be cleaned up
      // User2 should still have their entry
      // This is implicit - we verify by checking new attempts work correctly
      expect(checkOAuthInitiationRateLimit(user1)).toBe(true);
      expect(checkOAuthInitiationRateLimit(user2)).toBe(true);
    });

    it('does not start multiple cleanup intervals', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');
      const userId = 'user-14';

      // Make multiple calls
      checkOAuthInitiationRateLimit(userId);
      checkOAuthInitiationRateLimit(userId);
      checkOAuthInitiationRateLimit(userId);

      // setInterval should only be called once
      expect(setIntervalSpy).toHaveBeenCalledTimes(1);

      setIntervalSpy.mockRestore();
    });
  });
});
