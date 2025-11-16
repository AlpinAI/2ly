import type { FastifyReply } from 'fastify';

/**
 * JSON-RPC 2.0 error response structure
 */
interface JsonRpcErrorResponse {
  jsonrpc: '2.0';
  error: {
    code: number;
    message: string;
  };
  id: null;
}

/**
 * Sends a JSON-RPC 2.0 error response.
 *
 * @param reply - The Fastify reply object
 * @param code - The JSON-RPC error code
 * @param message - The error message
 * @param statusCode - Optional HTTP status code (if not provided, uses 200)
 */
export function sendJsonRpcError(
  reply: FastifyReply,
  code: number,
  message: string,
  statusCode?: number
): void {
  const response: JsonRpcErrorResponse = {
    jsonrpc: '2.0',
    error: {
      code,
      message,
    },
    id: null,
  };

  if (statusCode) {
    reply.status(statusCode).send(response);
  } else {
    reply.send(response);
  }
}

/**
 * Common JSON-RPC error codes
 */
export const JsonRpcErrorCode = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  SERVER_ERROR: -32000,
} as const;
