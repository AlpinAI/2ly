import { inject, injectable } from 'inversify';
import pino from 'pino';
import { LoggerService, NatsService, NatsCacheService, Service } from '@skilder-ai/common';
import { HealthService } from './runtime.health.service';
import { FastifyManagerService } from './fastify.manager.service';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { FastifyRequest, FastifyReply } from 'fastify';
import { injectCorsHeaders } from '../helpers/cors.helper';
import { sendJsonRpcError, JsonRpcErrorCode } from '../helpers/jsonrpc.helper';
import { extractSessionIdFromQuery, isValidSessionId } from '../helpers/session.helper';
import {
  SessionContext,
  authenticateSession,
  createSkillService,
  completeSessionContext,
  cleanupSession,
  cleanupAllSessions,
} from '../helpers/mcp-session.helper';
import { registerMcpHandlers } from '../helpers/mcp-handlers.helper';
import {
  validateOriginHeaderForRequest,
  validateProtocolVersionHeaderForRequest,
  loadSecurityConfig,
  logSecurityConfig,
} from '../helpers/validation.helper';

/**
 * McpSseService handles MCP server with SSE (Server-Sent Events) transport.
 *
 * Architecture:
 * - Uses shared Fastify instance from FastifyManagerService (shared port with STREAM transport)
 * - Manages own MCP Server instance for SSE-specific session handling
 * - Uses shared helper functions for authentication, session management, and security validation
 *
 * SSE Transport Flow:
 * 1. Client connects via GET /sse with auth headers → server authenticates and establishes SSE stream
 * 2. Client sends messages via POST /messages?sessionId=... → server processes JSON-RPC requests
 * 3. Server sends responses and notifications via SSE stream
 * 4. Client disconnects → server cleans up session resources
 *
 * Security:
 * - Origin header validation for DNS rebinding protection (configurable)
 * - Protocol version validation
 * - Workspace key or skill key authentication
 *
 * Spec: https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#server-sent-events-sse
 */
@injectable()
export class McpSseService extends Service {
  name = 'mcp.sse';
  private logger!: pino.Logger;
  private server: Server | undefined;
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
    @inject(NatsCacheService) private cacheService: NatsCacheService,
    @inject(HealthService) private healthService: HealthService,
    @inject(FastifyManagerService) private fastifyManager: FastifyManagerService,
  ) {
    super();
  }

  protected async initialize() {
    // Initialize logger
    this.logger = this.loggerService.getLogger(this.name);

    this.logger.info('Starting MCP SSE service');

    // Load security configuration from environment
    const securityConfig = loadSecurityConfig();
    this.allowedOrigins = securityConfig.allowedOrigins;
    this.preventDnsRebindingAttack = securityConfig.preventDnsRebindingAttack;

    // Create dedicated MCP Server for SSE transport
    // Each transport needs its own Server instance to manage its own sessions
    this.server = new Server(
      {
        name: 'Remote Skilder Server (SSE)',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {
            listChanged: true,
          },
        },
      },
    );

    // Register MCP handlers on this transport's server
    registerMcpHandlers(this.server, this.sessions, this.logger);

    // Register SSE routes on shared Fastify instance
    this.registerSseRoutes();

    // Log security configuration
    logSecurityConfig(this.logger, this.preventDnsRebindingAttack, this.allowedOrigins);

    this.logger.info('MCP SSE service started');
  }

  protected async shutdown() {
    this.logger.info('Stopping MCP SSE service');
    await cleanupAllSessions(this.sessions, this.healthService, this.logger);

    // Close MCP Server
    if (this.server) {
      await this.server.close();
      this.server = undefined;
    }

    this.logger.info('MCP SSE service stopped');
  }

  /**
   * Register SSE-specific routes on the shared Fastify instance
   */
  private registerSseRoutes() {
    const fastify = this.fastifyManager.getInstance();

    // GET /sse - Establishes SSE connection
    fastify.get('/sse', async (request: FastifyRequest, reply: FastifyReply) => {
      this.logger.debug('Received GET request to /sse');

      try {
        // Validate security headers (returns false and sends error response if validation fails)
        if (!this.validateSecurityHeaders(request, reply)) {
          return;
        }

        // Authenticate the request
        const identity = await authenticateSession(request, this.loggerService, this.natsService);
        this.logger.info(`Authenticated SSE connection for skill: ${identity.skillName}`);

        // Create the skill service
        const skillService = await createSkillService(
          identity,
          this.loggerService,
          this.natsService,
          this.cacheService,
          this.healthService,
        );

        // Inject CORS headers for SSE
        // SSEServerTransport.start() calls writeHead() with hardcoded headers,
        // replacing any headers set via reply.header() or setHeader().
        injectCorsHeaders(request, reply);

        // Create SSE transport
        const transport = new SSEServerTransport('/messages', reply.raw);
        const sessionId = transport.sessionId;

        // Create partial session and store it
        const partialSession: Partial<SessionContext> = {};
        this.sessions.set(sessionId, partialSession as SessionContext);

        // Handle connection close
        reply.raw.on('close', () => {
          this.logger.debug(`SSE session closed: ${sessionId}`);
          cleanupSession(sessionId, this.sessions, this.healthService, this.logger);
        });

        // Connect transport to server
        await this.server!.connect(transport);

        // Complete the session context
        completeSessionContext(transport, skillService, partialSession);

        this.logger.info(`Created SSE session ${sessionId} for skill: ${identity.skillName}`);
      } catch (error) {
        this.logger.error(`Error handling SSE connection: ${error}`);

        // Send appropriate error response
        if (error instanceof Error && error.message.includes('Authentication failed')) {
          sendJsonRpcError(reply, JsonRpcErrorCode.SERVER_ERROR, error.message, 401);
        } else if (error instanceof Error && error.message.includes('Invalid')) {
          sendJsonRpcError(reply, JsonRpcErrorCode.INVALID_REQUEST, error.message, 400);
        } else {
          sendJsonRpcError(reply, JsonRpcErrorCode.SERVER_ERROR, 'Internal error', 500);
        }
      }
    });

    // POST /messages - Handles SSE messages
    fastify.post('/messages', async (request: FastifyRequest, reply: FastifyReply) => {
      this.logger.debug('Received POST request to /messages');

      try {
        // Validate security headers (returns false and sends error response if validation fails)
        if (!this.validateSecurityHeaders(request, reply)) {
          return;
        }

        // Extract session ID from query
        const sessionId = extractSessionIdFromQuery(request.query);

        if (!isValidSessionId(sessionId)) {
          return reply.status(400).send('Missing or invalid sessionId');
        }

        // Get session
        const session = this.sessions.get(sessionId);

        if (!session) {
          return reply.status(404).send('Session not found');
        }

        if (!(session.transport instanceof SSEServerTransport)) {
          return reply.status(400).send('Invalid transport type for session');
        }

        // Inject CORS headers for SSE messages
        // handlePostMessage uses reply.raw which bypasses Fastify's CORS plugin
        injectCorsHeaders(request, reply);

        // Handle the message via the transport
        await session.transport.handlePostMessage(request.raw, reply.raw, request.body as unknown);
      } catch (error) {
        this.logger.error(`Error handling SSE message: ${error}`);

        // Return appropriate error response
        if (error instanceof Error && error.message.includes('Session not found')) {
          return reply.status(404).send('Session not found');
        } else if (error instanceof Error && error.message.includes('Invalid')) {
          return reply.status(400).send(error.message);
        } else {
          return reply.status(500).send('Internal error');
        }
      }
    });

    this.logger.info('SSE routes registered on shared Fastify instance');
  }

  /**
   * Validate security headers (Origin, Protocol)
   * Returns true if all validations pass, false otherwise
   */
  private validateSecurityHeaders(request: FastifyRequest, reply: FastifyReply): boolean {
    // Validate origin header (DNS rebinding protection)
    if (
      !validateOriginHeaderForRequest(request, reply, this.logger, this.preventDnsRebindingAttack, this.allowedOrigins)
    ) {
      return false;
    }

    // Validate protocol version
    if (!validateProtocolVersionHeaderForRequest(request, reply, this.logger)) {
      return false;
    }

    // Note: Accept header validation is primarily for STREAM transport
    // SSE transport doesn't require specific Accept headers

    return true;
  }
}
