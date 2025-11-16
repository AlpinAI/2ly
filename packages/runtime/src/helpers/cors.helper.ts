import type { FastifyRequest, FastifyReply } from 'fastify';
import type { OutgoingHttpHeaders, OutgoingHttpHeader } from 'node:http';

/**
 * Injects CORS headers into the response by intercepting writeHead.
 *
 * This is necessary because some MCP SDK transports (StreamableHTTPServerTransport,
 * SSEServerTransport) call writeHead() directly on the raw response object,
 * bypassing Fastify's CORS plugin. We intercept writeHead to merge in required
 * CORS headers.
 *
 * @param request - The Fastify request object
 * @param reply - The Fastify reply object
 */
export function injectCorsHeaders(request: FastifyRequest, reply: FastifyReply): void {
  const origin = request.headers.origin || '*';
  const originalWriteHead = reply.raw.writeHead.bind(reply.raw);

  reply.raw.writeHead = function(
    statusCode: number,
    statusMessage?: string | OutgoingHttpHeaders | OutgoingHttpHeader[],
    headers?: OutgoingHttpHeaders | OutgoingHttpHeader[]
  ) {
    // Handle both overload signatures of writeHead
    let finalHeaders: OutgoingHttpHeaders;
    let finalStatusMessage: string | undefined;

    if (typeof statusMessage === 'string') {
      finalStatusMessage = statusMessage;
      finalHeaders = { ...(headers as OutgoingHttpHeaders) };
    } else {
      finalHeaders = { ...(statusMessage as OutgoingHttpHeaders) };
    }

    // Merge CORS headers
    finalHeaders['Access-Control-Allow-Origin'] = origin;
    finalHeaders['Access-Control-Allow-Credentials'] = 'true';
    finalHeaders['Access-Control-Expose-Headers'] = 'mcp-session-id';

    // Call original with merged headers
    if (finalStatusMessage) {
      return originalWriteHead(statusCode, finalStatusMessage, finalHeaders);
    } else {
      return originalWriteHead(statusCode, finalHeaders);
    }
  };
}
