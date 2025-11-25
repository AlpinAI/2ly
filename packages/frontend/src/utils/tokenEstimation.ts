/**
 * Token Estimation Utilities
 *
 * Provides simple character-based token estimation without external dependencies.
 * Uses a 4:1 character-to-token ratio as a proxy calculation.
 *
 * NOTE: This is an approximation and not exact token counting.
 */

/**
 * Estimates the number of tokens in a text string
 * @param text - The text to estimate tokens for
 * @returns Estimated token count (ceiling of characters / 4)
 */
export function estimateTokens(text: string | null | undefined): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Formats token count with thousands abbreviation
 * @param count - The token count to format
 * @returns Formatted string with ~ prefix (e.g., "~1.2k" or "~450")
 */
export function formatTokenCount(count: number): string {
  if (count >= 1000) {
    return `~${(count / 1000).toFixed(1)}k`;
  }
  return `~${count}`;
}

/**
 * Formats token count with exact value and comma separators
 * @param count - The token count to format
 * @returns Formatted string with "tokens" suffix (e.g., "1,234 tokens")
 */
export function formatTokenCountExact(count: number): string {
  return `${count.toLocaleString()} tokens`;
}
