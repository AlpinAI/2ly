import type { FastifyRequest } from 'fastify';

/**
 * Extracts the session ID from request headers.
 *
 * @param request - The Fastify request object
 * @returns The session ID if present, undefined otherwise
 */
export function extractSessionId(request: FastifyRequest): string | undefined {
  const sessionId = request.headers['mcp-session-id'];
  return typeof sessionId === 'string' ? sessionId : undefined;
}

/**
 * Extracts the session ID from query parameters.
 *
 * @param query - The query parameters object
 * @returns The session ID if present, undefined otherwise
 */
export function extractSessionIdFromQuery(query: unknown): string | undefined {
  if (typeof query !== 'object' || query === null) {
    return undefined;
  }

  const sessionId = (query as Record<string, unknown>).sessionId;
  return typeof sessionId === 'string' ? sessionId : undefined;
}

/**
 * Validates that a session ID is present.
 *
 * @param sessionId - The session ID to validate
 * @returns True if the session ID is present and non-empty
 */
export function isValidSessionId(sessionId: string | undefined): sessionId is string {
  return typeof sessionId === 'string' && sessionId.length > 0;
}
