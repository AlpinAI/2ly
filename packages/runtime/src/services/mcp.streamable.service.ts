import { inject, injectable } from 'inversify';
import { FastifyRequest, FastifyReply } from 'fastify';
import { LoggerService, NatsService, Service } from '@2ly/common';
import { HealthService } from './runtime.health.service';
import { FastifyManagerService } from './fastify.manager.service';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { injectCorsHeaders } from '../helpers/cors.helper';
import { sendJsonRpcError, JsonRpcErrorCode } from '../helpers/jsonrpc.helper';
import { extractSessionId, isValidSessionId } from '../helpers/session.helper';
import { getJsonRpcMessageType, JsonRpcMessageType } from '../helpers/security.helper';
import {
  validateOriginHeaderForRequest,
  validateProtocolVersionHeaderForRequest,
  validateAcceptHeaderForRequest,
  loadSecurityConfig,
  logSecurityConfig,
} from '../helpers/validation.helper';
import {
  SessionContext,
  authenticateSession,
  createSkillService,
  completeSessionContext,
  cleanupSession,
  cleanupAllSessions,
} from '../helpers/mcp-session.helper';
import { registerMcpHandlers } from '../helpers/mcp-handlers.helper';
import { randomUUID } from 'node:crypto';
import pino from 'pino';

/**
 * McpStreamableService handles MCP server with Streamable HTTP transport.
 * This service manages the /mcp endpoint following the MCP Streamable HTTP specification.
 *
 * Spec: https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#streamable-http
 */
@injectable()
export class McpStreamableService extends Service {
  name = 'mcp.streamable';
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
    this.logger.info(`Setting up ${this.name} transport`);

    // Register transport-specific routes on shared Fastify instance
    this.registerRoutes();

    // Register MCP request handlers on shared MCP Server
    registerMcpHandlers(this.getFastifyManager().getServer(), this.sessions, this.logger);

    this.logger.info(`${this.name} transport configured`);
  }

  /**
   * Register Streamable HTTP-specific routes
   */
  private registerRoutes() {
    this.registerMcpRoute();
  }

  /**
   * Get the Fastify manager service
   */
  private getFastifyManager() {
    return this.fastifyManager;
  }

  /**
   * Register the /mcp route handler for streamable HTTP transport.
   * Handles GET (listen streams), POST (JSON-RPC messages), and DELETE (session termination).
   */
  private registerMcpRoute() {
    const fastify = this.fastifyManager.getInstance();

    // GET handler for listen-only SSE streams
    fastify.get('/mcp', async (request: FastifyRequest, reply: FastifyReply) => {
      this.logger.debug('Received GET request to /mcp (listen stream)');
      this.logger.debug(`Request headers: ${JSON.stringify(request.headers, null, 2)}`);

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

        // Validate Accept header for SSE
        if (
          !validateAcceptHeaderForRequest(request, reply, this.logger, 'text/event-stream', 'Accept header must include text/event-stream')
        ) {
          return;
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

        // Validate Accept header for POST
        if (
          !validateAcceptHeaderForRequest(
            request,
            reply,
            this.logger,
            ['application/json', 'text/event-stream'],
            'Accept header must include application/json and/or text/event-stream',
          )
        ) {
          return;
        }

        const sessionId = extractSessionId(request);
        let session = this.sessions.get(sessionId || '');

        // Determine message type to handle responses/notifications correctly
        const messageType = getJsonRpcMessageType(request.body);

        if (session && isValidSessionId(sessionId)) {
          // Existing session - validate session ID header is present
          this.logger.debug(`Reusing session ${sessionId} for skill: ${session.skillService.getIdentity().skillName}`);

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
          const newSession = await this.createNewSession(request, reply);
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
        this.logger.info(`Terminating session ${sessionId} for skill: ${session.skillService.getIdentity().skillName}`);

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
   * Create a StreamableHTTP transport with session lifecycle callbacks
   */
  private async createStreamableTransport(): Promise<{
    transport: StreamableHTTPServerTransport;
    sessionId: string;
    partialSession: Partial<SessionContext>;
  }> {
    const sessionId = randomUUID();
    const partialSession: Partial<SessionContext> = {};

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => sessionId,
      onsessioninitialized: (sid) => {
        this.sessions.set(sid, partialSession as SessionContext);
        this.logger.debug(`Session initialized: ${sid}`);
      },
      onsessionclosed: (sid) => {
        this.logger.debug(`Session closed: ${sid}`);
        this.handleSessionClosed(sid!);
      },
    });

    await this.fastifyManager.getServer().connect(transport);

    return { transport, sessionId, partialSession };
  }

  /**
   * Creates a new session for an authenticated request
   */
  private async createNewSession(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<SessionContext | null> {
    try {
      // Authenticate the request
      const identity = await authenticateSession(request, this.loggerService, this.natsService);
      this.logger.info(`Authenticated new stream connection for skill: ${identity.skillName}`);

      // Create the skill service first
      const skillService = await createSkillService(
        identity,
        this.loggerService,
        this.natsService,
        this.healthService,
      );

      // Create the transport (which may trigger protocol initialization)
      const { transport, sessionId, partialSession } = await this.createStreamableTransport();

      // Complete the session context by mutating the partial session
      completeSessionContext(transport, skillService, partialSession);

      this.logger.info(`Created session ${sessionId} for skill: ${identity.skillName}`);

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
