/**
 * Token Estimation Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import { estimateTokens, formatTokenCount, formatTokenCountExact } from './tokenEstimation';

describe('estimateTokens', () => {
  it('should estimate tokens for a simple text', () => {
    // 12 characters / 4 = 3
    expect(estimateTokens('Hello World!')).toBe(3);
  });

  it('should round up for partial tokens', () => {
    // 13 characters / 4 = 3.25 -> rounds up to 4
    expect(estimateTokens('Hello World!!')).toBe(4);
  });

  it('should handle empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('should handle null', () => {
    expect(estimateTokens(null)).toBe(0);
  });

  it('should handle undefined', () => {
    expect(estimateTokens(undefined)).toBe(0);
  });

  it('should handle large text', () => {
    // 1000 characters / 4 = 250
    const text = 'a'.repeat(1000);
    expect(estimateTokens(text)).toBe(250);
  });

  it('should handle text with special characters', () => {
    // 16 characters / 4 = 4
    expect(estimateTokens('Hello\nWorld\t123!')).toBe(4);
  });
});

describe('formatTokenCount', () => {
  it('should format small numbers with ~ prefix', () => {
    expect(formatTokenCount(10)).toBe('~10');
    expect(formatTokenCount(100)).toBe('~100');
    expect(formatTokenCount(999)).toBe('~999');
  });

  it('should format thousands with k suffix', () => {
    expect(formatTokenCount(1000)).toBe('~1.0k');
    expect(formatTokenCount(1234)).toBe('~1.2k');
    expect(formatTokenCount(9876)).toBe('~9.9k');
  });

  it('should handle zero', () => {
    expect(formatTokenCount(0)).toBe('~0');
  });

  it('should handle large numbers', () => {
    expect(formatTokenCount(10000)).toBe('~10.0k');
    expect(formatTokenCount(123456)).toBe('~123.5k');
  });

  it('should round to one decimal place for thousands', () => {
    expect(formatTokenCount(1234)).toBe('~1.2k');
    expect(formatTokenCount(1250)).toBe('~1.3k');
  });
});

describe('formatTokenCountExact', () => {
  it('should format small numbers with ~ prefix and tokens suffix', () => {
    expect(formatTokenCountExact(10)).toBe('~10 tokens');
    expect(formatTokenCountExact(100)).toBe('~100 tokens');
  });

  it('should format with thousands separators', () => {
    // Use regex to handle locale-specific separators (comma, space, narrow no-break space)
    expect(formatTokenCountExact(1000)).toMatch(/^~1[,\s\u202f]000 tokens$/);
    expect(formatTokenCountExact(1234)).toMatch(/^~1[,\s\u202f]234 tokens$/);
    expect(formatTokenCountExact(123456)).toMatch(/^~123[,\s\u202f]456 tokens$/);
    expect(formatTokenCountExact(1234567)).toMatch(/^~1[,\s\u202f]234[,\s\u202f]567 tokens$/);
  });

  it('should handle zero', () => {
    expect(formatTokenCountExact(0)).toBe('~0 tokens');
  });

  it('should handle single digit', () => {
    expect(formatTokenCountExact(5)).toBe('~5 tokens');
  });
});

describe('token estimation integration', () => {
  it('should work with typical JSON input', () => {
    const jsonInput = JSON.stringify({ query: 'test', limit: 10 });
    const tokens = estimateTokens(jsonInput);
    expect(tokens).toBeGreaterThan(0);
    expect(formatTokenCount(tokens)).toMatch(/^~\d+/);
    expect(formatTokenCountExact(tokens)).toMatch(/^~[\d,]+ tokens$/);
  });

  it('should work with null output', () => {
    const inputTokens = estimateTokens('{"test": "input"}');
    const outputTokens = estimateTokens(null);
    const total = inputTokens + outputTokens;
    expect(total).toBe(inputTokens);
    expect(formatTokenCountExact(total)).toMatch(/^~[\d,]+ tokens$/);
  });
});
