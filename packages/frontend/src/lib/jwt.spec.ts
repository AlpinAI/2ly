/**
 * JWT Utility Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { decodeJWT, isTokenExpired, getTokenExpiry, getTimeUntilExpiry } from './jwt';

describe('JWT Utility Functions', () => {
  // Mock Date.now for consistent testing
  beforeEach(() => {
    vi.useFakeTimers();
  });

  describe('decodeJWT', () => {
    it('should decode a valid JWT token', () => {
      // This is a sample JWT with payload: { userId: "123", email: "test@example.com", exp: 1234567890 }
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoibWVtYmVyIiwiaWF0IjoxMjM0NTY3ODkwLCJleHAiOjEyMzQ1Njc4OTB9.signature';

      const payload = decodeJWT(token);

      expect(payload).toBeTruthy();
      expect(payload?.userId).toBe('123');
      expect(payload?.email).toBe('test@example.com');
      expect(payload?.role).toBe('member');
    });

    it('should return null for invalid JWT format', () => {
      const invalidToken = 'not.a.valid.jwt.token';
      const payload = decodeJWT(invalidToken);
      expect(payload).toBeNull();
    });

    it('should return null for malformed JWT', () => {
      const malformedToken = 'invalid-token';
      const payload = decodeJWT(malformedToken);
      expect(payload).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return true for expired token', () => {
      // Set current time to 2009-02-14 00:00:00 (timestamp: 1234569600000)
      vi.setSystemTime(new Date('2009-02-14T00:00:00Z'));

      // Token expires at 1234567890 (2009-02-13 23:31:30) - already expired
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoibWVtYmVyIiwiaWF0IjoxMjM0NTY3ODkwLCJleHAiOjEyMzQ1Njc4OTB9.signature';

      expect(isTokenExpired(expiredToken)).toBe(true);
    });

    it('should return false for valid token', () => {
      // Set current time to 2009-02-13 23:00:00 (timestamp: 1234566000000)
      vi.setSystemTime(new Date('2009-02-13T23:00:00Z'));

      // Token expires at 1234567890 (2009-02-13 23:31:30) - still valid
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoibWVtYmVyIiwiaWF0IjoxMjM0NTY3ODkwLCJleHAiOjEyMzQ1Njc4OTB9.signature';

      expect(isTokenExpired(validToken)).toBe(false);
    });

    it('should consider buffer time when checking expiry', () => {
      // Set current time to 2009-02-13 23:31:00 (30 seconds before expiry)
      vi.setSystemTime(new Date('2009-02-13T23:31:00Z'));

      // Token expires at 1234567890 (2009-02-13 23:31:30)
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoibWVtYmVyIiwiaWF0IjoxMjM0NTY3ODkwLCJleHAiOjEyMzQ1Njc4OTB9.signature';

      // With default 60s buffer, token should be considered expired
      expect(isTokenExpired(token)).toBe(true);

      // With 0s buffer, token should still be valid
      expect(isTokenExpired(token, 0)).toBe(false);
    });

    it('should return true for token without expiry', () => {
      const tokenWithoutExp = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMifQ.signature';
      expect(isTokenExpired(tokenWithoutExp)).toBe(true);
    });
  });

  describe('getTokenExpiry', () => {
    it('should return expiry date for valid token', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoibWVtYmVyIiwiaWF0IjoxMjM0NTY3ODkwLCJleHAiOjEyMzQ1Njc4OTB9.signature';

      const expiry = getTokenExpiry(token);

      expect(expiry).toBeInstanceOf(Date);
      expect(expiry?.getTime()).toBe(1234567890000);
    });

    it('should return null for token without expiry', () => {
      const tokenWithoutExp = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMifQ.signature';
      expect(getTokenExpiry(tokenWithoutExp)).toBeNull();
    });
  });

  describe('getTimeUntilExpiry', () => {
    it('should return seconds until expiry for valid token', () => {
      // Set current time to 2009-02-13 23:00:00
      vi.setSystemTime(new Date('2009-02-13T23:00:00Z'));

      // Token expires at 1234567890 (2009-02-13 23:31:30) - 1890 seconds from now
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoibWVtYmVyIiwiaWF0IjoxMjM0NTY3ODkwLCJleHAiOjEyMzQ1Njc4OTB9.signature';

      const timeUntilExpiry = getTimeUntilExpiry(token);

      expect(timeUntilExpiry).toBe(1890);
    });

    it('should return 0 for expired token', () => {
      // Set current time to 2009-02-14 00:00:00 (after expiry)
      vi.setSystemTime(new Date('2009-02-14T00:00:00Z'));

      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoibWVtYmVyIiwiaWF0IjoxMjM0NTY3ODkwLCJleHAiOjEyMzQ1Njc4OTB9.signature';

      expect(getTimeUntilExpiry(token)).toBe(0);
    });

    it('should return null for token without expiry', () => {
      const tokenWithoutExp = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMifQ.signature';
      expect(getTimeUntilExpiry(tokenWithoutExp)).toBeNull();
    });
  });
});
