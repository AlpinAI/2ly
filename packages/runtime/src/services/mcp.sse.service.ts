import { inject, injectable } from 'inversify';
import { FastifyRequest, FastifyReply } from 'fastify';
import { LoggerService, NatsService, Service } from '@2ly/common';
import { HealthService } from './runtime.health.service';
import { FastifyManagerService } from './fastify.manager.service';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { injectCorsHeaders } from '../helpers/cors.helper';
import { extractSessionIdFromQuery, isValidSessionId } from '../helpers/session.helper';
import {
  validateOriginHeaderForRequest,
  validateProtocolVersionHeaderForRequest,
  loadSecurityConfig,
  logSecurityConfig,
} from '../helpers/validation.helper';
import {
  SessionContext,
  authenticateSession,
  createToolsetService,
  completeSessionContext,
  cleanupSession,
  cleanupAllSessions,
} from '../helpers/mcp-session.helper';
import { registerMcpHandlers } from '../helpers/mcp-handlers.helper';
import pino from 'pino';

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
export class McpSseService extends Service {
  name = 'mcp-sse';
  private logger!: pino.Logger;
  private sessions: Map<string, SessionContext> = new Map();

  /**
   * Allowed origins for remote access (configurable via environment variable)
   */
  private allowedOrigins: string[] = [];

  /**
   * Whether to validate Origin header to prevent DNS rebinding attacks
   */
  private preventDnsRebindingAttack = false;

  constructor(
    @inject(LoggerService) private loggerService: LoggerService,
    @inject(NatsService) private natsService: NatsService,
    @inject(HealthService) private healthService: HealthService,
    @inject(FastifyManagerService) private fastifyManager: FastifyManagerService,
  ) {
    super();
  }

  protected async initialize() {
    // Initialize logger
    this.logger = this.loggerService.getLogger(this.name);

    // Load security configuration from environment
    const securityConfig = loadSecurityConfig();
    this.allowedOrigins = securityConfig.allowedOrigins;
    this.preventDnsRebindingAttack = securityConfig.preventDnsRebindingAttack;

    // Start dependent services
    this.logger.info(`Starting ${this.name} service`);
    await this.startService(this.natsService);
    await this.startService(this.healthService);
    await this.startService(this.fastifyManager);

    // Setup transport
    await this.setupTransport();

    // Log security configuration
    logSecurityConfig(this.logger, this.preventDnsRebindingAttack, this.allowedOrigins);
  }

  protected async shutdown() {
    this.logger.info(`Stopping ${this.name} service`);
    await cleanupAllSessions(this.sessions, this.healthService, this.logger);
    await this.stopService(this.natsService);
    await this.stopService(this.healthService);
    await this.stopService(this.fastifyManager);
  }

  /**
   * Setup transport by registering routes and MCP handlers
   */
  private async setupTransport() {
    const remotePort = process.env.REMOTE_PORT;
    if (!remotePort) {
      this.logger.warn('REMOTE_PORT is not set, transport will not be configured');
      return;
    }

    this.logger.info(`Setting up ${this.name} transport`);

    // Register transport-specific routes on shared Fastify instance
    this.registerRoutes();

    // Register MCP request handlers on shared MCP Server
    registerMcpHandlers(this.fastifyManager.getServer(), this.sessions, this.logger);

    this.logger.info(`${this.name} transport configured`);
  }

  /**
   * Register SSE-specific routes
   */
  private registerRoutes() {
    this.registerSseRoute();
  }

  /**
   * Register the /sse route handler for SSE transport.
   * Handles GET (establish SSE stream), POST (JSON-RPC messages), and DELETE (session termination).
   */
  private registerSseRoute() {
    const fastify = this.fastifyManager.getInstance();

    // GET handler for establishing SSE stream
    fastify.get('/sse', (request: FastifyRequest, reply: FastifyReply) => {
      this.logger.debug('Received GET request to /sse');

      // Handle SSE connection asynchronously
      this.handleSseConnection(request, reply).catch((error) => {
        this.logger.error(`Error handling SSE connection: ${error}`);
        // Only send error if headers haven't been sent yet
        if (!reply.raw.headersSent) {
          reply.raw.writeHead(500, { 'Content-Type': 'application/json' });
          reply.raw.end(
            JSON.stringify({
              error: 'Internal Server Error',
              message: 'Failed to establish SSE connection',
            }),
          );
        }
      });
    });

    // POST handler for receiving JSON-RPC messages
    fastify.post('/messages', async (request: FastifyRequest, reply: FastifyReply) => {
      this.logger.debug('Received POST request to /messages');

      try {
        // Validate Origin header (security requirement)
        if (
          !validateOriginHeaderForRequest(
            request,
            reply,
            this.logger,
            this.preventDnsRebindingAttack,
            this.allowedOrigins,
          )
        ) {
          console.log('invalid origin header');
          return;
        }

        // Validate protocol version header
        if (!validateProtocolVersionHeaderForRequest(request, reply, this.logger)) {
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
        if (
          !validateOriginHeaderForRequest(
            request,
            reply,
            this.logger,
            this.preventDnsRebindingAttack,
            this.allowedOrigins,
          )
        ) {
          return;
        }

        // Validate protocol version header
        if (!validateProtocolVersionHeaderForRequest(request, reply, this.logger)) {
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
        await cleanupSession(sessionId, this.sessions, this.healthService, this.logger);

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
   * Create an SSE transport with session lifecycle callbacks
   */
  private async createSseTransport(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<{
    transport: SSEServerTransport;
    sessionId: string;
    partialSession: Partial<SessionContext>;
  }> {
    const partialSession: Partial<SessionContext> = {};

    // Inject CORS headers for SSE
    // SSEServerTransport.start() calls writeHead() with hardcoded headers,
    // replacing any headers set via reply.header() or setHeader().
    injectCorsHeaders(request, reply);

    const transport = new SSEServerTransport('/messages', reply.raw);
    const sessionId = transport.sessionId;
    this.sessions.set(sessionId, partialSession as SessionContext);

    reply.raw.on('close', () => {
      this.logger.debug(`SSE session closed: ${sessionId}`);
      this.handleSessionClosed(sessionId);
    });

    // Note: Server.connect() calls transport.start() automatically
    // Do not call transport.start() explicitly or it will fail with "already started"
    await this.fastifyManager.getServer().connect(transport);

    return { transport, sessionId, partialSession };
  }

  /**
   * Async handler for SSE connection establishment.
   * Separated from the route handler to allow proper error handling with hijacked response.
   */
  private async handleSseConnection(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    // Validate Origin header (security requirement)
    if (
      !validateOriginHeaderForRequest(
        request,
        reply,
        this.logger,
        this.preventDnsRebindingAttack,
        this.allowedOrigins,
      )
    ) {
      throw new Error('Invalid origin header');
    }

    // Validate protocol version header
    if (!validateProtocolVersionHeaderForRequest(request, reply, this.logger)) {
      throw new Error('Invalid protocol version header');
    }

    // Validate Accept header for SSE
    const accept = request.headers['accept'];
    if (process.env.VALIDATE_ACCEPT_HEADER === 'true' && (!accept || !accept.includes('text/event-stream'))) {
      this.logger.warn('GET request missing Accept: text/event-stream header');
      reply.raw.writeHead(406, { 'Content-Type': 'application/json' });
      reply.raw.end(
        JSON.stringify({
          error: 'Not Acceptable',
          message: 'Accept header must include text/event-stream',
        }),
      );
      return;
    }

    const session = await this.createNewSession(request, reply);
    if (!session) {
      return; // Error response already sent
    }

    // IMPORTANT: Connection stays open!
    // The SSE stream is now active via the transport. Don't close the response.
    // The 'close' event handler will cleanup when the client disconnects.
    this.logger.info(`SSE connection established, session: ${session.transport.sessionId}`);
  }

  /**
   * Creates a new session for an authenticated request
   */
  private async createNewSession(request: FastifyRequest, reply: FastifyReply): Promise<SessionContext | null> {
    try {
      // Authenticate the request
      const identity = await authenticateSession(request, this.loggerService, this.natsService);
      this.logger.info(`Authenticated new sse connection for toolset: ${identity.toolsetName}`);

      // Create the toolset service first
      const toolsetService = await createToolsetService(
        identity,
        this.loggerService,
        this.natsService,
        this.healthService,
      );

      // Create the transport (which may trigger protocol initialization)
      const { transport, sessionId, partialSession } = await this.createSseTransport(request, reply);

      // Complete the session context by mutating the partial session
      completeSessionContext(transport, toolsetService, partialSession);

      this.logger.info(`Created session ${sessionId} for toolset: ${identity.toolsetName}`);

      return partialSession as SessionContext;
    } catch (authError) {
      this.logger.error(`Authentication failed: ${authError}`);
      const errorMessage = `Authentication failed: ${authError instanceof Error ? authError.message : String(authError)}`;

      // Return 401 status
      return reply.status(401).send({
        error: 'Unauthorized',
        message: errorMessage,
      }) as never;
    }
  }

  /**
   * Handle session closed callback
   */
  private handleSessionClosed(sessionId: string): void {
    cleanupSession(sessionId, this.sessions, this.healthService, this.logger);
  }
}
