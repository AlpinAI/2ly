import { inject, injectable } from 'inversify';
import pino from 'pino';
import {
  LoggerService,
  NatsService,
  Service,
} from '@2ly/common';
import { HealthService } from './runtime.health.service';
import { FastifyManagerService } from './fastify.manager.service';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { randomUUID } from 'node:crypto';
import { FastifyRequest, FastifyReply } from 'fastify';
import { SessionAuthService, AuthHeaders } from './session.auth.service';
import { ToolsetService, ToolsetIdentity } from './toolset.service';
import { tap } from 'rxjs';
import { injectCorsHeaders } from '../helpers/cors.helper';

/**
 * Session context for MCP transports
 */
export interface SessionContext {
  transport: StreamableHTTPServerTransport | SSEServerTransport;
  toolsetService: ToolsetService;
  drain: () => void;
}

/**
 * Abstract base service for MCP remote transports.
 * Provides shared functionality for SSE and Streamable HTTP transports.
 */
@injectable()
export abstract class McpRemoteBaseService extends Service {
  protected logger!: pino.Logger;
  protected sessions: Map<string, SessionContext> = new Map();

  constructor(
    @inject(LoggerService) protected loggerService: LoggerService,
    @inject(NatsService) protected natsService: NatsService,
    @inject(HealthService) protected healthService: HealthService,
    @inject(FastifyManagerService) protected fastifyManager: FastifyManagerService,
  ) {
    super();
    // Logger will be initialized in subclass after name is set
  }

  /**
   * Initialize logger after name is set
   */
  protected initializeLogger() {
    this.logger = this.loggerService.getLogger(this.name);
  }

  protected async initialize() {
    // Ensure logger is initialized (in case subclass forgot to call initializeLogger)
    if (!this.logger) {
      this.initializeLogger();
    }

    this.logger.info(`Starting ${this.name} service`);
    await this.startService(this.natsService);
    await this.startService(this.healthService);
    await this.startService(this.fastifyManager);
    await this.setupTransport();
  }

  protected async shutdown() {
    if (this.logger) {
      this.logger.info(`Stopping ${this.name} service`);
    }
    await this.cleanupAllSessions();
    await this.stopService(this.natsService);
    await this.stopService(this.healthService);
    // Note: FastifyManager is stopped by MainService, not by individual transport services
  }

  /**
   * Abstract method to register transport-specific routes.
   * Must be implemented by subclasses.
   */
  protected abstract registerRoutes(): void;

  /**
   * Setup transport by registering routes and MCP handlers
   */
  protected async setupTransport() {
    const remotePort = process.env.REMOTE_PORT;
    if (!remotePort) {
      this.logger.warn('REMOTE_PORT is not set, transport will not be configured');
      return;
    }

    this.logger.info(`Setting up ${this.name} transport`);

    // Register transport-specific routes on shared Fastify instance
    this.registerRoutes();

    // Setup MCP request handlers on shared MCP Server
    await this.setServerHandlers();

    this.logger.info(`${this.name} transport configured`);
  }

  /**
   * Get the shared Fastify instance from manager
   */
  protected getFastifyInstance() {
    return this.fastifyManager.getInstance();
  }

  /**
   * Get the shared MCP Server from manager
   */
  protected getServer() {
    return this.fastifyManager.getServer();
  }

  /**
   * Cleanup all sessions for this transport
   */
  protected async cleanupAllSessions() {
    for (const [sessionId, session] of this.sessions) {
      this.logger.debug(`Closing session: ${sessionId}`);
      await session.transport.close();
      await this.stopService(session.toolsetService);
    }
    this.sessions.clear();
  }

  /**
   * Creates a new session for an authenticated request
   */
  protected async createNewSession(
    request: FastifyRequest,
    reply: FastifyReply,
    transportType: 'stream' | 'sse',
  ): Promise<SessionContext | null> {
    try {
      // Authenticate the request
      const identity = await this.authenticateSession(request);
      this.logger.info(`Authenticated new ${transportType} connection for toolset: ${identity.toolsetName}`);

      // Create the toolset service first
      const toolsetService = await this.createToolsetService(identity);

      // Create the transport (which may trigger protocol initialization)
      const { transport, sessionId, partialSession } = await this.createTransport(transportType, request, reply);

      // Complete the session context by mutating the partial session
      this.completeSessionContext(transport, toolsetService, sessionId, partialSession);

      this.logger.info(`Created session ${sessionId} for toolset: ${identity.toolsetName}`);

      return partialSession as SessionContext;
    } catch (authError) {
      this.logger.error(`Authentication failed: ${authError}`);
      const errorMessage = `Authentication failed: ${authError instanceof Error ? authError.message : String(authError)}`;

      // For both transports, return 401 status
      return reply.status(401).send({
        error: 'Unauthorized',
        message: errorMessage
      }) as never;
    }
  }

  /**
   * Authenticates a session by extracting and validating auth headers
   */
  protected async authenticateSession(request: FastifyRequest): Promise<ToolsetIdentity> {
    const authHeaders = this.extractAuthHeaders(request);
    const sessionAuthService = new SessionAuthService(
      this.loggerService,
      this.natsService,
    );

    sessionAuthService.validateAuthHeaders(authHeaders);
    return await sessionAuthService.authenticateViaHandshake(authHeaders);
  }

  /**
   * Creates a transport based on the transport type
   */
  protected async createTransport(
    transportType: 'stream' | 'sse',
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<{
    transport: StreamableHTTPServerTransport | SSEServerTransport;
    sessionId: string;
    partialSession: Partial<SessionContext>;
  }> {
    let transport: StreamableHTTPServerTransport | SSEServerTransport;
    let sessionId: string;
    const partialSession: Partial<SessionContext> = {};

    if (transportType === 'stream') {
      sessionId = randomUUID();
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => sessionId,
        onsessioninitialized: (sid) => {
          sessionId = sid;
          this.sessions.set(sid, partialSession as SessionContext);
          this.logger.debug(`Session initialized: ${sid}`);
        },
        onsessionclosed: (sid) => {
          this.logger.debug(`Session closed: ${sid}`);
          this.cleanupSession(sid!);
        },
      });

      await this.getServer().connect(transport);
    } else {
      // Inject CORS headers for SSE
      // SSEServerTransport.start() calls writeHead() with hardcoded headers,
      // replacing any headers set via reply.header() or setHeader().
      injectCorsHeaders(request, reply);

      transport = new SSEServerTransport('/messages', reply.raw);
      console.log('transport created with sessionId', transport.sessionId);
      sessionId = transport.sessionId;
      this.sessions.set(sessionId, partialSession as SessionContext);

      reply.raw.on('close', (sid:string ) => {
        this.logger.debug(`SSE session closed: ${sessionId} // ${sid}`);
        this.cleanupSession(sessionId);
      });

      // Note: Server.connect() calls transport.start() automatically
      // Do not call transport.start() explicitly or it will fail with "already started"
      await this.getServer().connect(transport);
    }

    return { transport, sessionId, partialSession };
  }

  /**
   * Creates and starts a toolset service for a session
   */
  protected async createToolsetService(identity: ToolsetIdentity): Promise<ToolsetService> {
    const toolsetService = new ToolsetService(this.loggerService, this.natsService, identity);
    await this.startService(toolsetService);
    return toolsetService;
  }

  /**
   * Completes a partial session context by adding all required components.
   * This mutates the partial session object to ensure any stored references remain valid.
   */
  protected completeSessionContext(
    transport: StreamableHTTPServerTransport | SSEServerTransport,
    toolsetService: ToolsetService,
    sessionId: string,
    partialSession: Partial<SessionContext>,
  ): void {
    // Listen for tool changes and notify clients
    const subscription = toolsetService.observeTools().pipe(tap(() => {
      transport.send({
        jsonrpc: '2.0',
        method: 'notifications/tools/list_changed',
      });
    })).subscribe();

    // Mutate the partial session to complete it
    // This is important because the partial session may already be stored in this.sessions
    // and accessed by other code paths (e.g., from onsessioninitialized callback)
    partialSession.transport = transport;
    partialSession.toolsetService = toolsetService;
    partialSession.drain = () => subscription?.unsubscribe();
  }

  protected async cleanupSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.logger.info(`Cleaning up session ${sessionId}`);
      session.drain();
      await this.stopService(session.toolsetService);
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Retrieves a session for a request handler, throwing if not found
   */
  protected getSessionForRequest(sessionId: string): SessionContext {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    return session;
  }

  protected async setServerHandlers() {
    const server = this.getServer();

    server.setRequestHandler(InitializeRequestSchema, async (request, extra) => {
      return this.handleInitialize(request, extra);
    });

    server.setRequestHandler(ListToolsRequestSchema, async (request, extra) => {
      return this.handleListTools(request, extra);
    });

    server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
      return this.handleCallTool(request, extra);
    });
  }

  /**
   * Handle initialize request
   */
  protected async handleInitialize(request: unknown, extra: { sessionId?: string }) {
    this.logger.info('Initialize handler');
    const initRequest = request as { params: { clientInfo: unknown; protocolVersion: string } };
    this.logger.debug(
      `Initializing client: ${JSON.stringify(initRequest.params.clientInfo)}, protocol version: ${initRequest.params.protocolVersion}`,
    );

    const session = this.getSessionForRequest(extra.sessionId!);
    const identity = session.toolsetService.getIdentity();

    const response = {
      serverInfo: {
        name: identity.toolsetName,
        version: '1.0.0',
      },
      protocolVersion: '2024-11-05',
      capabilities: {
        experimental: {},
        tools: {
          listChanged: true,
        },
      },
    };

    // Wait for tools to be available before responding
    await session.toolsetService.waitForTools();

    return response;
  }

  /**
   * Handle list tools request
   */
  protected async handleListTools(request: unknown, extra: { sessionId?: string }) {
    this.logger.debug('Listing tools');

    const session = this.getSessionForRequest(extra.sessionId!);

    try {
      const tools = await session.toolsetService.getToolsForMCP();
      this.logger.debug(`List tools, responding with ${tools.length} tools`);
      this.logger.debug(`Tools: ${JSON.stringify(tools, null, 2)}`);
      return { tools };
    } catch (error) {
      this.logger.error(`Error listing tools: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Error listing tools: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handle call tool request
   */
  protected async handleCallTool(request: unknown, extra: { sessionId?: string }) {
    const callRequest = request as { params: { name: string; arguments?: unknown } };

    if (!callRequest.params.arguments) {
      throw new Error('Arguments are required');
    }

    const session = this.getSessionForRequest(extra.sessionId!);

    try {
      const result = await session.toolsetService.callTool(
        callRequest.params.name,
        callRequest.params.arguments as Record<string, unknown>
      );
      return result;
    } catch (error) {
      this.logger.error(`Error calling tool: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Error calling tool: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  protected extractAuthHeaders(request: FastifyRequest): AuthHeaders {
    const headers = request.headers;
    return {
      masterKey: typeof headers['master_key'] === 'string' ? headers['master_key'] : undefined,
      toolsetKey: typeof headers['toolset_key'] === 'string' ? headers['toolset_key'] : undefined,
      toolsetName: typeof headers['toolset_name'] === 'string' ? headers['toolset_name'] : undefined,
    };
  }

}
