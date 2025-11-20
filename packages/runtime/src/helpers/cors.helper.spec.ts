import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ServerResponse } from 'node:http';
import { injectCorsHeaders } from './cors.helper';

describe('cors.helper', () => {
  describe('injectCorsHeaders', () => {
    let mockRequest: Partial<FastifyRequest>;
    let mockReply: Partial<FastifyReply>;
    let mockRawResponse: Partial<ServerResponse>;
    let originalWriteHead: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      originalWriteHead = vi.fn();

      mockRawResponse = {
        writeHead: originalWriteHead,
      };

      mockRequest = {
        headers: {},
      };

      mockReply = {
        raw: mockRawResponse as ServerResponse,
      };
    });

    it('should intercept writeHead and inject CORS headers with origin from request', () => {
      mockRequest.headers = { origin: 'https://example.com' };

      injectCorsHeaders(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // Call the intercepted writeHead
      mockRawResponse.writeHead!(200, { 'Content-Type': 'application/json' });

      expect(originalWriteHead).toHaveBeenCalledWith(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://example.com',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Expose-Headers': 'mcp-session-id',
      });
    });

    it('should use wildcard when origin header is missing', () => {
      mockRequest.headers = {};

      injectCorsHeaders(mockRequest as FastifyRequest, mockReply as FastifyReply);

      mockRawResponse.writeHead!(200, { 'Content-Type': 'application/json' });

      expect(originalWriteHead).toHaveBeenCalledWith(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Expose-Headers': 'mcp-session-id',
      });
    });

    it('should handle writeHead with status message parameter', () => {
      mockRequest.headers = { origin: 'https://example.com' };

      injectCorsHeaders(mockRequest as FastifyRequest, mockReply as FastifyReply);

      mockRawResponse.writeHead!(200, 'OK', { 'Content-Type': 'text/plain' });

      expect(originalWriteHead).toHaveBeenCalledWith(200, 'OK', {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': 'https://example.com',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Expose-Headers': 'mcp-session-id',
      });
    });

    it('should preserve existing headers while adding CORS headers', () => {
      mockRequest.headers = { origin: 'https://test.com' };

      injectCorsHeaders(mockRequest as FastifyRequest, mockReply as FastifyReply);

      mockRawResponse.writeHead!(200, {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'custom-value',
      });

      expect(originalWriteHead).toHaveBeenCalledWith(200, {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'custom-value',
        'Access-Control-Allow-Origin': 'https://test.com',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Expose-Headers': 'mcp-session-id',
      });
    });

    it('should handle empty headers object', () => {
      mockRequest.headers = { origin: 'https://example.com' };

      injectCorsHeaders(mockRequest as FastifyRequest, mockReply as FastifyReply);

      mockRawResponse.writeHead!(204);

      expect(originalWriteHead).toHaveBeenCalledWith(204, {
        'Access-Control-Allow-Origin': 'https://example.com',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Expose-Headers': 'mcp-session-id',
      });
    });

    it('should maintain the binding of the original writeHead', () => {
      mockRequest.headers = { origin: 'https://example.com' };

      const contextCheck = vi.fn();
      originalWriteHead.mockImplementation(function(this: unknown) {
        contextCheck(this);
      });

      injectCorsHeaders(mockRequest as FastifyRequest, mockReply as FastifyReply);

      mockRawResponse.writeHead!(200, {});

      // Verify the original writeHead was called with the correct context
      expect(contextCheck).toHaveBeenCalledWith(mockRawResponse);
    });
  });
});
