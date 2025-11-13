import { inject, injectable } from 'inversify';
import { FastifyRequest, FastifyReply } from 'fastify';
import { LoggerService, NatsService } from '@2ly/common';
import { HealthService } from './runtime.health.service';
import { FastifyManagerService } from './fastify.manager.service';
import { McpRemoteBaseService } from './mcp.remote.base.service';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { injectCorsHeaders } from '../helpers/cors.helper';
import { extractSessionIdFromQuery, isValidSessionId } from '../helpers/session.helper';
import { validateOrigin, validateProtocolVersion } from '../helpers/security.helper';

/**
 * McpSseService handles MCP server with SSE transport.
 * This service manages the /sse endpoint for Server-Sent Events communication.
 *
 * Note: SSE transport is deprecated in favor of Streamable HTTP transport.
 * This implementation is maintained for backward compatibility.
 *
 * Spec: https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#http-with-sse
 */
@injectable()
export class McpSseService extends McpRemoteBaseService {
  name = 'mcp-sse';

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
   * Register SSE-specific routes
   */
  protected registerRoutes() {
    this.registerSseRoute();
  }

  /**
   * Register the /sse route handler for SSE transport.
   * Handles GET (establish SSE stream), POST (JSON-RPC messages), and DELETE (session termination).
   */
  private registerSseRoute() {
    const fastify = this.getFastifyInstance();

    // GET handler for establishing SSE stream
    fastify.get('/sse', (request: FastifyRequest, reply: FastifyReply) => {
      this.logger.debug('Received GET request to /sse');

      // CRITICAL: Tell Fastify we're managing the response ourselves
      // Without this, Fastify will close the response when the handler completes,
      // which would terminate the SSE stream before the client can send messages
      // reply.hijack();

      // Handle SSE connection asynchronously
      this.handleSseConnection(request, reply).catch((error) => {
        this.logger.error(`Error handling SSE connection: ${error}`);
        // Only send error if headers haven't been sent yet
        if (!reply.raw.headersSent) {
          reply.raw.writeHead(500, { 'Content-Type': 'application/json' });
          reply.raw.end(JSON.stringify({
            error: 'Internal Server Error',
            message: 'Failed to establish SSE connection',
          }));
        }
      });
    });

    // POST handler for receiving JSON-RPC messages
    fastify.post('/messages', async (request: FastifyRequest, reply: FastifyReply) => {
      this.logger.debug('Received POST request to /messages');

      try {
        // Validate Origin header (security requirement)
        if (!this.validateOriginHeader(request, reply)) {
          console.log('invalid origin header');
          return;
        }

        // Validate protocol version header
        if (!this.validateProtocolVersionHeader(request, reply)) {
          console.log('invalid protocol version header');
          return;
        }

        // Validate Accept header
        const accept = request.headers['accept'];
        if (process.env.VALIDATE_ACCEPT_HEADER === 'true' && (!accept || !accept.includes('application/json'))) {
          console.log('invalid accept header');
          this.logger.warn('POST request missing Accept: application/json header');
          return reply.status(406).send({
            error: 'Not Acceptable',
            message: 'Accept header must include application/json',
          });
        }

        const sessionId = extractSessionIdFromQuery(request.query);

        console.log('POST /messages sessionId extracted from query', sessionId);
        if (!isValidSessionId(sessionId)) {
          console.log('invalid sessionId');
          this.logger.warn('POST request missing valid sessionId query parameter');
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Missing or invalid sessionId query parameter',
          });
        }
        console.log('sessionId is valid');

        const session = this.sessions.get(sessionId);
        if (!session) {
          console.log('session not found');
          this.logger.warn(`POST request for non-existent session: ${sessionId}`);
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Session not found or expired',
          });
        }

        console.log('session found');

        if (!(session.transport instanceof SSEServerTransport)) {
          console.log('session does not have SSE transport');
          this.logger.error(`Session ${sessionId} does not have SSE transport`);
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Invalid transport type for session',
          });
        }

        console.log('session has SSE transport');

        // Inject CORS headers for SSE messages
        // handlePostMessage uses reply.raw which bypasses Fastify's CORS plugin
        injectCorsHeaders(request, reply);

        await session.transport.handlePostMessage(request.raw, reply.raw, request.body as unknown);
        return;
      } catch (error) {
        this.logger.error(`Error handling SSE message: ${error}`);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to process message',
        });
      }
    });

    // DELETE handler for session termination
    fastify.delete('/messages', async (request: FastifyRequest, reply: FastifyReply) => {
      this.logger.info('Received DELETE request to /messages (terminate session)');

      try {
        // Validate Origin header (security requirement)
        if (!this.validateOriginHeader(request, reply)) {
          return;
        }

        // Validate protocol version header
        if (!this.validateProtocolVersionHeader(request, reply)) {
          return;
        }

        const sessionId = extractSessionIdFromQuery(request.query);

        // Validate session ID is provided
        if (!isValidSessionId(sessionId)) {
          this.logger.warn('DELETE request missing valid sessionId query parameter');
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Missing or invalid sessionId query parameter',
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

        // Close the transport
        await session.transport.close();

        // Cleanup the session
        await this.cleanupSession(sessionId);

        return reply.status(200).send({ success: true });
      } catch (error) {
        this.logger.error(`Error handling DELETE /sse request: ${error}`);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to terminate session',
        });
      }
    });
  }

  /**
   * Async handler for SSE connection establishment.
   * Separated from the route handler to allow proper error handling with hijacked response.
   */
  private async handleSseConnection(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    // Validate Origin header (security requirement)
    if (!this.validateOriginHeader(request, reply)) {
      throw new Error('Invalid origin header');
    }

    // Validate protocol version header
    if (!this.validateProtocolVersionHeader(request, reply)) {
      throw new Error('Invalid protocol version header');
    }

    // Validate Accept header for SSE
    const accept = request.headers['accept'];
    if (process.env.VALIDATE_ACCEPT_HEADER === 'true' && (!accept || !accept.includes('text/event-stream'))) {
      this.logger.warn('GET request missing Accept: text/event-stream header');
      reply.raw.writeHead(406, { 'Content-Type': 'application/json' });
      reply.raw.end(JSON.stringify({
        error: 'Not Acceptable',
        message: 'Accept header must include text/event-stream',
      }));
      return;
    }

    const session = await this.createNewSession(request, reply, 'sse');
    if (!session) {
      return; // Error response already sent
    }

    // IMPORTANT: Connection stays open!
    // The SSE stream is now active via the transport. Don't close the response.
    // The 'close' event handler will cleanup when the client disconnects.
    this.logger.info(`SSE connection established, session: ${session.transport.sessionId}`);
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
