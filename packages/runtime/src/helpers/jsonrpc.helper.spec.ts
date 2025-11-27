import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FastifyReply } from 'fastify';
import { sendJsonRpcError, JsonRpcErrorCode } from './jsonrpc.helper';

describe('jsonrpc.helper', () => {
  describe('sendJsonRpcError', () => {
    let mockReply: Partial<FastifyReply>;
    let sendSpy: ReturnType<typeof vi.fn>;
    let statusSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      sendSpy = vi.fn();
      statusSpy = vi.fn().mockReturnValue({ send: sendSpy });

      mockReply = {
        send: sendSpy,
        status: statusSpy,
      };
    });

    it('should send JSON-RPC error response without HTTP status code', () => {
      sendJsonRpcError(mockReply as FastifyReply, -32000, 'Server error');

      expect(sendSpy).toHaveBeenCalledWith({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Server error',
        },
        id: null,
      });
      expect(statusSpy).not.toHaveBeenCalled();
    });

    it('should send JSON-RPC error response with HTTP status code', () => {
      sendJsonRpcError(mockReply as FastifyReply, -32000, 'Authentication failed', 401);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(sendSpy).toHaveBeenCalledWith({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Authentication failed',
        },
        id: null,
      });
    });

    it('should handle internal error code', () => {
      sendJsonRpcError(
        mockReply as FastifyReply,
        JsonRpcErrorCode.INTERNAL_ERROR,
        'Internal error',
        500
      );

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(sendSpy).toHaveBeenCalledWith({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal error',
        },
        id: null,
      });
    });

    it('should handle parse error code', () => {
      sendJsonRpcError(
        mockReply as FastifyReply,
        JsonRpcErrorCode.PARSE_ERROR,
        'Parse error'
      );

      expect(sendSpy).toHaveBeenCalledWith({
        jsonrpc: '2.0',
        error: {
          code: -32700,
          message: 'Parse error',
        },
        id: null,
      });
    });

    it('should handle invalid request error code', () => {
      sendJsonRpcError(
        mockReply as FastifyReply,
        JsonRpcErrorCode.INVALID_REQUEST,
        'Invalid request',
        400
      );

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(sendSpy).toHaveBeenCalledWith({
        jsonrpc: '2.0',
        error: {
          code: -32600,
          message: 'Invalid request',
        },
        id: null,
      });
    });

    it('should handle custom error messages', () => {
      const customMessage = 'No valid session ID provided';
      sendJsonRpcError(
        mockReply as FastifyReply,
        JsonRpcErrorCode.SERVER_ERROR,
        customMessage
      );

      expect(sendSpy).toHaveBeenCalledWith({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: customMessage,
        },
        id: null,
      });
    });

    it('should handle empty message', () => {
      sendJsonRpcError(mockReply as FastifyReply, -32000, '');

      expect(sendSpy).toHaveBeenCalledWith({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: '',
        },
        id: null,
      });
    });
  });

  describe('JsonRpcErrorCode constants', () => {
    it('should have correct error code values', () => {
      expect(JsonRpcErrorCode.PARSE_ERROR).toBe(-32700);
      expect(JsonRpcErrorCode.INVALID_REQUEST).toBe(-32600);
      expect(JsonRpcErrorCode.METHOD_NOT_FOUND).toBe(-32601);
      expect(JsonRpcErrorCode.INVALID_PARAMS).toBe(-32602);
      expect(JsonRpcErrorCode.INTERNAL_ERROR).toBe(-32603);
      expect(JsonRpcErrorCode.SERVER_ERROR).toBe(-32000);
    });
  });
});
