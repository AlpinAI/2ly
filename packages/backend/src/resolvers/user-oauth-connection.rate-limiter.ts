/**
 * Simple rate limiter for OAuth initiation attempts.
 * Limits users to 5 attempts per 5 minutes to prevent abuse.
 *
 * NOTE: In-memory storage won't work with horizontal scaling (multiple backend instances).
 * Consider Redis for production deployments with multiple replicas.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

const rateLimitMap = new Map<string, RateLimitEntry>();
let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Checks if a user is allowed to initiate an OAuth flow.
 *
 * @param userId - The user ID to check rate limit for
 * @returns true if allowed, false if rate limited
 */
export function checkOAuthInitiationRateLimit(userId: string): boolean {
  // Start cleanup interval on first use (lazy initialization)
  if (!cleanupInterval) {
    cleanupInterval = setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL_MS);
    // Prevent interval from keeping process alive during shutdown
    cleanupInterval.unref();
  }

  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  // No previous attempts or window expired
  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(userId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }

  // Within rate limit window
  if (entry.count < MAX_ATTEMPTS) {
    entry.count++;
    return true;
  }

  // Rate limit exceeded
  return false;
}

/**
 * Cleans up expired rate limit entries to prevent memory leaks.
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [userId, entry] of rateLimitMap.entries()) {
    if (now >= entry.resetAt) {
      rateLimitMap.delete(userId);
    }
  }
}

/**
 * Stops the cleanup interval and clears state.
 * Call this for graceful shutdown or test cleanup.
 */
export function destroyOAuthRateLimiter(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
  rateLimitMap.clear();
}
