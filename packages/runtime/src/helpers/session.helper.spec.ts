import { describe, it, expect } from 'vitest';
import type { FastifyRequest } from 'fastify';
import {
  extractSessionId,
  extractSessionIdFromQuery,
  isValidSessionId,
} from './session.helper';

describe('session.helper', () => {
  describe('extractSessionId', () => {
    it('should extract session ID from headers', () => {
      const mockRequest = {
        headers: {
          'mcp-session-id': 'test-session-123',
        },
      } as unknown as FastifyRequest;

      const result = extractSessionId(mockRequest);
      expect(result).toBe('test-session-123');
    });

    it('should return undefined when session ID header is missing', () => {
      const mockRequest = {
        headers: {},
      } as unknown as FastifyRequest;

      const result = extractSessionId(mockRequest);
      expect(result).toBeUndefined();
    });

    it('should return undefined when session ID is not a string', () => {
      const mockRequest = {
        headers: {
          'mcp-session-id': ['array-value'],
        },
      } as unknown as FastifyRequest;

      const result = extractSessionId(mockRequest);
      expect(result).toBeUndefined();
    });

    it('should handle empty string session ID', () => {
      const mockRequest = {
        headers: {
          'mcp-session-id': '',
        },
      } as unknown as FastifyRequest;

      const result = extractSessionId(mockRequest);
      expect(result).toBe('');
    });
  });

  describe('extractSessionIdFromQuery', () => {
    it('should extract session ID from query object', () => {
      const query = { sessionId: 'query-session-456' };
      const result = extractSessionIdFromQuery(query);
      expect(result).toBe('query-session-456');
    });

    it('should return undefined when query is null', () => {
      const result = extractSessionIdFromQuery(null);
      expect(result).toBeUndefined();
    });

    it('should return undefined when query is not an object', () => {
      const result = extractSessionIdFromQuery('string');
      expect(result).toBeUndefined();
    });

    it('should return undefined when sessionId is missing from query', () => {
      const query = { otherparam: 'value' };
      const result = extractSessionIdFromQuery(query);
      expect(result).toBeUndefined();
    });

    it('should return undefined when sessionId is not a string', () => {
      const query = { sessionId: 123 };
      const result = extractSessionIdFromQuery(query);
      expect(result).toBeUndefined();
    });

    it('should handle empty string session ID from query', () => {
      const query = { sessionId: '' };
      const result = extractSessionIdFromQuery(query);
      expect(result).toBe('');
    });

    it('should handle undefined query', () => {
      const result = extractSessionIdFromQuery(undefined);
      expect(result).toBeUndefined();
    });
  });

  describe('isValidSessionId', () => {
    it('should return true for valid session ID', () => {
      const result = isValidSessionId('valid-session-789');
      expect(result).toBe(true);
    });

    it('should return false for undefined', () => {
      const result = isValidSessionId(undefined);
      expect(result).toBe(false);
    });

    it('should return false for empty string', () => {
      const result = isValidSessionId('');
      expect(result).toBe(false);
    });

    it('should return true for single character session ID', () => {
      const result = isValidSessionId('a');
      expect(result).toBe(true);
    });

    it('should return true for UUID session ID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = isValidSessionId(uuid);
      expect(result).toBe(true);
    });

    it('should work as type guard', () => {
      const sessionId: string | undefined = 'test-123';

      if (isValidSessionId(sessionId)) {
        // TypeScript should recognize sessionId as string here
        const length: number = sessionId.length;
        expect(length).toBeGreaterThan(0);
      }
    });
  });
});
