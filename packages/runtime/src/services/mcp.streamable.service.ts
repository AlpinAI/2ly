import { inject, injectable } from 'inversify';
import { FastifyRequest, FastifyReply } from 'fastify';
import { LoggerService, NatsService } from '@2ly/common';
import { HealthService } from './runtime.health.service';
import { FastifyManagerService } from './fastify.manager.service';
import { McpRemoteBaseService } from './mcp.remote.base.service';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { injectCorsHeaders } from '../helpers/cors.helper';
import { sendJsonRpcError, JsonRpcErrorCode } from '../helpers/jsonrpc.helper';
import { extractSessionId, isValidSessionId } from '../helpers/session.helper';
import {
  validateOrigin,
  validateProtocolVersion,
  getJsonRpcMessageType,
  JsonRpcMessageType,
} from '../helpers/security.helper';

/**
 * McpStreamableService handles MCP server with Streamable HTTP transport.
 * This service manages the /mcp endpoint following the MCP Streamable HTTP specification.
 *
 * Spec: https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#streamable-http
 */
@injectable()
export class McpStreamableService extends McpRemoteBaseService {
  name = 'mcp-streamable';

  /**
   * Allowed origins for remote access (configurable via environment variable)
   */
  private allowedOrigins: string[] = [];

  /**
   * Whether to validate Origin header to prevent DNS rebinding attacks
   */
  private preventDnsRebindingAttack = false;

  constructor(
    @inject(LoggerService) loggerService: LoggerService,
    @inject(NatsService) natsService: NatsService,
    @inject(HealthService) healthService: HealthService,
    @inject(FastifyManagerService) fastifyManager: FastifyManagerService,
  ) {
    super(loggerService, natsService, healthService, fastifyManager);
  }

  protected async initialize() {
    // Load allowed origins from environment before starting
    const originsEnv = process.env.MCP_ALLOWED_ORIGINS;
    if (originsEnv) {
      this.allowedOrigins = originsEnv.split(',').map((o) => o.trim());
    }

    // Check if DNS rebinding attack prevention is enabled
    const preventDnsRebinding = process.env.PREVENT_DNS_REBINDING_ATTACK;
    this.preventDnsRebindingAttack = preventDnsRebinding === 'true' || preventDnsRebinding === '1';

    // Call parent initialize (which will initialize logger and start services)
    await super.initialize();

    // Log configuration after logger is initialized
    if (this.preventDnsRebindingAttack) {
      this.logger.info('DNS rebinding attack prevention ENABLED');
      if (this.allowedOrigins.length > 0) {
        this.logger.info(`Configured allowed origins: ${this.allowedOrigins.join(', ')}`);
      } else {
        this.logger.info('Only localhost origins will be allowed');
      }
    } else {
      this.logger.warn('DNS rebinding attack prevention DISABLED - Origin header validation skipped');
    }
  }

  /**
   * Register Streamable HTTP-specific routes
   */
  protected registerRoutes() {
    this.registerMcpRoute();
  }

  /**
   * Register the /mcp route handler for streamable HTTP transport.
   * Handles GET (listen streams), POST (JSON-RPC messages), and DELETE (session termination).
   */
  private registerMcpRoute() {
    const fastify = this.getFastifyInstance();

    // GET handler for listen-only SSE streams
    fastify.get('/mcp', async (request: FastifyRequest, reply: FastifyReply) => {
      this.logger.debug('Received GET request to /mcp (listen stream)');
      this.logger.debug(`Request headers: ${JSON.stringify(request.headers, null, 2)}`);

      try {
        // Validate Origin header (security requirement)
        if (!this.validateOriginHeader(request, reply)) {
          return;
        }

        // Validate protocol version header
        if (!this.validateProtocolVersionHeader(request, reply)) {
          return;
        }

        // Validate Accept header for SSE
        const accept = request.headers['accept'];
        if (!accept || !accept.includes('text/event-stream')) {
          this.logger.warn('GET request missing Accept: text/event-stream header');
          return reply.status(406).send({
            error: 'Not Acceptable',
            message: 'Accept header must include text/event-stream',
          });
        }

        // Check if session ID is provided for existing session
        const sessionId = extractSessionId(request);

        if (sessionId && isValidSessionId(sessionId)) {
          // Reuse existing session for listen stream
          const session = this.sessions.get(sessionId);
          if (!session) {
            this.logger.warn(`GET request for non-existent session: ${sessionId}`);
            return reply.status(404).send({
              error: 'Not Found',
              message: 'Session not found or expired',
            });
          }

          this.logger.debug(`Opening listen stream for existing session: ${sessionId}`);

          // Inject CORS headers
          injectCorsHeaders(request, reply);

          // Open a new SSE stream for this session
          // Note: StreamableHTTPServerTransport may not support multiple simultaneous GET streams
          // This is a limitation of the current SDK implementation
          await (session.transport as StreamableHTTPServerTransport).handleRequest(
            request.raw,
            reply.raw,
            {} as unknown, // Empty body for GET
          );
          return;
        }

        // No valid session - cannot establish listen-only stream without initialization
        this.logger.warn('GET request without valid session ID - listen streams require initialized session');
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Session ID required for listen streams. Initialize session first via POST.',
        });
      } catch (error) {
        this.logger.error(`Error handling GET /mcp request: ${error}`);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to establish listen stream',
        });
      }
    });

    // POST handler for JSON-RPC messages
    fastify.post('/mcp', async (request: FastifyRequest, reply: FastifyReply) => {
      this.logger.debug('Received POST request to /mcp');
      this.logger.debug(`Request headers: ${JSON.stringify(request.headers, null, 2)}`);

      try {
        // Validate Origin header (security requirement)
        if (!this.validateOriginHeader(request, reply)) {
          return;
        }

        // Validate protocol version header
        if (!this.validateProtocolVersionHeader(request, reply)) {
          return;
        }

        // Validate Accept header for POST
        const accept = request.headers['accept'];
        if (!accept || (!accept.includes('application/json') && !accept.includes('text/event-stream'))) {
          this.logger.warn('POST request missing proper Accept header');
          return reply.status(406).send({
            error: 'Not Acceptable',
            message: 'Accept header must include application/json and/or text/event-stream',
          });
        }

        const sessionId = extractSessionId(request);
        let session = this.sessions.get(sessionId || '');

        // Determine message type to handle responses/notifications correctly
        const messageType = getJsonRpcMessageType(request.body);

        if (session && isValidSessionId(sessionId)) {
          // Existing session - validate session ID header is present
          this.logger.debug(`Reusing session ${sessionId} for toolset: ${session.toolsetService.getIdentity().toolsetName}`);

          // For responses and notifications, return HTTP 202 Accepted (per spec)
          if (messageType === JsonRpcMessageType.RESPONSE || messageType === JsonRpcMessageType.NOTIFICATION) {
            this.logger.debug(`Received ${messageType} message for session ${sessionId}`);

            // Inject CORS headers
            injectCorsHeaders(request, reply);

            // Delegate to transport to handle the message
            await (session.transport as StreamableHTTPServerTransport).handleRequest(
              request.raw,
              reply.raw,
              request.body as unknown,
            );

            // Note: The transport should handle setting the 202 status code
            // If not, we would set it here: reply.status(202).send()
            return;
          }

          // For requests, continue with normal handling
          this.logger.debug(`Processing request message for session ${sessionId}`);
        } else if (!sessionId && isInitializeRequest(request.body as unknown)) {
          // New initialization request - authenticate and create session
          this.logger.info('Processing new initialization request');
          const newSession = await this.createNewSession(request, reply, 'stream');
          if (!newSession) {
            return; // Error response already sent
          }
          session = newSession;
        } else if (sessionId && !isValidSessionId(sessionId)) {
          // Invalid session ID format
          this.logger.warn(`Invalid session ID format: ${sessionId}`);
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Invalid session ID format',
          });
        } else if (sessionId && !this.sessions.has(sessionId)) {
          // Session not found or expired - return HTTP 404 (per spec)
          this.logger.warn(`Session not found or expired: ${sessionId}`);
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Session not found or expired. Please initialize a new session.',
          });
        } else {
          // No session ID and not an initialize request
          this.logger.warn('POST request without valid session ID and not an initialize request');
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Session ID required for non-initialize requests',
          });
        }

        // Inject CORS headers for StreamableHTTPServerTransport
        // StreamableHTTPServerTransport.handleRequest() calls writeHead() directly,
        // bypassing Fastify's CORS plugin.
        injectCorsHeaders(request, reply);

        // Handle the request
        await (session.transport as StreamableHTTPServerTransport).handleRequest(
          request.raw,
          reply.raw,
          request.body as unknown,
        );
      } catch (error) {
        this.logger.error(`Error handling POST /mcp request: ${error}`);
        return sendJsonRpcError(reply, JsonRpcErrorCode.INTERNAL_ERROR, 'Internal error');
      }
    });

    // DELETE handler for session termination
    fastify.delete('/mcp', async (request: FastifyRequest, reply: FastifyReply) => {
      this.logger.info('Received DELETE request to /mcp (terminate session)');

      try {
        // Validate Origin header (security requirement)
        if (!this.validateOriginHeader(request, reply)) {
          return;
        }

        // Validate protocol version header
        if (!this.validateProtocolVersionHeader(request, reply)) {
          return;
        }

        const sessionId = extractSessionId(request);

        // Validate session ID is provided
        if (!isValidSessionId(sessionId)) {
          this.logger.warn('DELETE request missing valid mcp-session-id header');
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Missing or invalid mcp-session-id header',
          });
        }

        // Validate session exists
        if (!this.sessions.has(sessionId)) {
          this.logger.warn(`DELETE request for non-existent session: ${sessionId}`);
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Session not found',
          });
        }

        const session = this.sessions.get(sessionId)!;
        this.logger.info(`Terminating session ${sessionId} for toolset: ${session.toolsetService.getIdentity().toolsetName}`);

        // Inject CORS headers for DELETE response
        injectCorsHeaders(request, reply);

        // Delegate to transport's DELETE handler
        await (session.transport as StreamableHTTPServerTransport).handleRequest(
          request.raw,
          reply.raw,
          request.body as unknown,
        );

        return;
      } catch (error) {
        this.logger.error(`Error handling DELETE /mcp request: ${error}`);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to terminate session',
        });
      }
    });
  }

  /**
   * Validates the Origin header to prevent DNS rebinding attacks.
   * Returns false and sends error response if validation fails.
   * Skips validation if PREVENT_DNS_REBINDING_ATTACK is not enabled.
   */
  private validateOriginHeader(request: FastifyRequest, reply: FastifyReply): boolean {
    // Skip validation if DNS rebinding attack prevention is disabled
    if (!this.preventDnsRebindingAttack) {
      return true;
    }

    const origin = request.headers['origin'] as string | undefined;

    if (!validateOrigin(origin, this.allowedOrigins)) {
      this.logger.warn(`Invalid or missing Origin header: ${origin || 'none'}`);
      reply.status(403).send({
        error: 'Forbidden',
        message: 'Invalid origin. Please check CORS configuration.',
      });
      return false;
    }

    return true;
  }

  /**
   * Validates the MCP protocol version header.
   * Returns false and sends error response if validation fails.
   *
   * Per spec: "For backwards compatibility, if the server does not receive an
   * MCP-Protocol-Version header, and has no other way to identify the version -
   * for example, by relying on the protocol version negotiated during initialization -
   * the server SHOULD assume protocol version 2025-03-26."
   */
  private validateProtocolVersionHeader(request: FastifyRequest, reply: FastifyReply): boolean {
    const protocolVersion = request.headers['mcp-protocol-version'] as string | undefined;

    // If no protocol version header is present, assume backwards compatible version per spec
    if (!protocolVersion) {
      this.logger.debug('No mcp-protocol-version header provided, assuming backwards compatible version 2025-03-26');
      return true;
    }

    // Validate the provided protocol version
    if (!validateProtocolVersion(protocolVersion)) {
      this.logger.warn(`Unsupported protocol version: ${protocolVersion}. Supported versions: 2024-11-05`);

      reply.status(400).send({
        error: 'Bad Request',
        message: 'Unsupported mcp-protocol-version header. Supported versions: 2024-11-05',
      });
      return false;
    }

    // Log protocol version for debugging
    this.logger.debug(`Request using protocol version: ${protocolVersion}`);

    return true;
  }
}
