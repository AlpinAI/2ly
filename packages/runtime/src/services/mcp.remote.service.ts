import { inject, injectable } from 'inversify';
import pino from 'pino';
import {
  LoggerService,
  NatsService,
  Service,
} from '@2ly/common';
import { HealthService } from './runtime.health.service';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { randomUUID } from 'node:crypto';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import { SessionAuthService, AuthHeaders } from './session.auth.service';
import { ToolsetService, ToolsetIdentity } from './toolset.service';
import { tap } from 'rxjs';
import { injectCorsHeaders } from '../helpers/cors.helper';
import { sendJsonRpcError, JsonRpcErrorCode } from '../helpers/jsonrpc.helper';
import { extractSessionId, extractSessionIdFromQuery, isValidSessionId } from '../helpers/session.helper';

interface SessionContext {
  transport: StreamableHTTPServerTransport | SSEServerTransport;
  toolsetService: ToolsetService;
  drain: () => void;
}

/**
 * McpRemoteService handles MCP server with stream/sse transports.
 * This service manages multiple sessions, each with their own identity and toolset.
 */
@injectable()
export class McpRemoteService extends Service {
  name = 'mcp-remote';
  private logger: pino.Logger;
  private server: Server | undefined;
  private fastifyInstance: FastifyInstance | undefined;
  private sessions: Map<string, SessionContext> = new Map();

  constructor(
    @inject(LoggerService) private loggerService: LoggerService,
    @inject(NatsService) private natsService: NatsService,
    @inject(HealthService) private healthService: HealthService,
  ) {
    super();
    this.logger = this.loggerService.getLogger(this.name);
  }

  protected async initialize() {
    this.logger.info('Starting MCP remote service');
    await this.startService(this.natsService);
    await this.startService(this.healthService);
    await this.startServer();
  }

  protected async shutdown() {
    this.logger.info('Stopping MCP remote service');
    await this.stopServer();
    await this.stopService(this.natsService);
    await this.stopService(this.healthService);
  }

  private async startServer() {
    const remotePort = process.env.REMOTE_PORT;
    if (!remotePort) {
      this.logger.warn('REMOTE_PORT is not set, Remote MCP server will not start');
      return;
    }

    this.logger.info('Starting remote MCP server');

    this.server = new Server(
      {
        name: 'Remote 2LY Server',
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

    await this.setupStreamableHttpTransport(remotePort);
  }

  private async setupStreamableHttpTransport(portString: string) {
    this.logger.info('Setting up Streamable HTTP transport');

    this.fastifyInstance = fastify({
      logger: false,
      // Allow empty JSON bodies for DELETE requests (MCP Inspector sends Content-Type: application/json with empty body)
      bodyLimit: 1048576,
    });

    // Override JSON parser to allow empty bodies
    this.fastifyInstance.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
      try {
        const json = body === '' ? {} : JSON.parse(body as string);
        done(null, json);
      } catch (err: unknown) {
        done(err instanceof Error ? err : new Error(String(err)), undefined);
      }
    });

    await this.fastifyInstance.register(cors, {
      origin: true, // Reflects the request origin back, allowing any origin with credentials
      credentials: true, // Allow credentials (cookies, authorization headers, etc.)
      methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'], // Explicitly allow methods including GET for SSE
      exposedHeaders: ['mcp-session-id'],
      allowedHeaders: ['Content-Type', 'mcp-session-id', 'mcp-protocol-version', 'master_key', 'toolset_key', 'toolset_name', 'x-custom-auth-headers'],
    });

    // Register route handlers
    this.registerMcpRoute();
    this.registerSseRoute();
    this.registerMessagesRoute();

    const port = parseInt(portString);

    try {
      await this.fastifyInstance.listen({ port, host: '0.0.0.0' });
      this.logger.info(`Streamable HTTP and SSE MCP server listening on port ${port}`);
    } catch (error) {
      this.logger.error(`Failed to start Fastify server: ${error}`);
      throw error;
    }

    // Setup server handlers
    await this.setServerHandlers();
  }

  /**
   * Register the /mcp route handler for streamable HTTP transport
   */
  private registerMcpRoute() {
    this.fastifyInstance!.all('/mcp', async (request: FastifyRequest, reply: FastifyReply) => {
      this.logger.debug(`Received ${request.method} request to /mcp`);

      try {
        const sessionId = extractSessionId(request);

        // Handle DELETE requests explicitly for better logging and error handling
        if (request.method === 'DELETE') {
          this.logger.info(`Received DELETE request to terminate session: ${sessionId || 'no session ID'}`);

          // Validate session ID is provided
          if (!isValidSessionId(sessionId)) {
            this.logger.warn('DELETE request missing valid mcp-session-id header');
            return reply.status(400).send({
              error: 'Bad Request',
              message: 'Missing or invalid mcp-session-id header'
            });
          }

          // Validate protocol version header
          const protocolVersion = request.headers['mcp-protocol-version'];
          if (!protocolVersion) {
            this.logger.warn(`DELETE request for session ${sessionId} missing mcp-protocol-version header`);
            return reply.status(400).send({
              error: 'Bad Request',
              message: 'Missing mcp-protocol-version header'
            });
          }

          // Validate session exists
          if (!this.sessions.has(sessionId)) {
            this.logger.warn(`DELETE request for non-existent session: ${sessionId}`);
            return reply.status(404).send({
              error: 'Not Found',
              message: 'Session not found'
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
        }

        let session: SessionContext;

        if (sessionId && this.sessions.has(sessionId)) {
          // Reuse existing session
          session = this.sessions.get(sessionId)!;
          this.logger.debug(`Reusing session ${sessionId} for toolset: ${session.toolsetService.getIdentity().toolsetName}`);
        } else if (!sessionId && isInitializeRequest(request.body as unknown)) {
          // New initialization request - authenticate and create session
          const newSession = await this.createNewSession(request, reply, 'stream');
          if (!newSession) {
            return; // Error response already sent
          }
          session = newSession;
        } else {
          // Invalid request
          return sendJsonRpcError(
            reply,
            JsonRpcErrorCode.SERVER_ERROR,
            'Bad Request: No valid session ID provided'
          );
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
        this.logger.error(`Error handling MCP request: ${error}`);
        return sendJsonRpcError(
          reply,
          JsonRpcErrorCode.INTERNAL_ERROR,
          'Internal error'
        );
      }
    });
  }

  /**
   * Register the /sse route handler for SSE transport
   */
  private registerSseRoute() {
    this.fastifyInstance!.get('/sse', async (request: FastifyRequest, reply: FastifyReply) => {
      this.logger.debug('Received GET request to /sse');

      try {
        const session = await this.createNewSession(request, reply, 'sse');
        if (!session) {
          return; // Error response already sent
        }
      } catch (error) {
        this.logger.error(`Error handling SSE connection: ${error}`);
        return reply.status(500).send('Internal error');
      }
    });
  }

  /**
   * Register the /messages route handler for SSE transport
   */
  private registerMessagesRoute() {
    this.fastifyInstance!.post('/messages', async (request: FastifyRequest, reply: FastifyReply) => {
      this.logger.debug('Received POST request to /messages');

      try {
        const sessionId = extractSessionIdFromQuery(request.query);

        if (!isValidSessionId(sessionId)) {
          return reply.status(400).send('Missing sessionId');
        }

        const session = this.sessions.get(sessionId);
        if (session && session.transport instanceof SSEServerTransport) {
          // Inject CORS headers for SSE messages
          // handlePostMessage uses reply.raw which bypasses Fastify's CORS plugin
          injectCorsHeaders(request, reply);

          await session.transport.handlePostMessage(request.raw, reply.raw, request.body as unknown);
          return;
        }

        return reply.status(400).send('No transport found for sessionId');
      } catch (error) {
        this.logger.error(`Error handling SSE message: ${error}`);
        return reply.status(500).send('Internal error');
      }
    });
  }

  /**
   * Creates a new session for an authenticated request
   */
  private async createNewSession(
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

      if (transportType === 'stream') {
        sendJsonRpcError(reply, JsonRpcErrorCode.SERVER_ERROR, errorMessage);
      } else {
        sendJsonRpcError(reply, JsonRpcErrorCode.SERVER_ERROR, errorMessage, 401);
      }

      return null;
    }
  }

  /**
   * Authenticates a session by extracting and validating auth headers
   */
  private async authenticateSession(request: FastifyRequest): Promise<ToolsetIdentity> {
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
  private async createTransport(
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

      await this.server!.connect(transport);
    } else {
      // Inject CORS headers for SSE
      // SSEServerTransport.start() calls writeHead() with hardcoded headers,
      // replacing any headers set via reply.header() or setHeader().
      injectCorsHeaders(request, reply);

      transport = new SSEServerTransport('/messages', reply.raw);
      sessionId = transport.sessionId;
      this.sessions.set(sessionId, partialSession as SessionContext);

      reply.raw.on('close', () => {
        this.logger.debug(`SSE session closed: ${sessionId}`);
        this.cleanupSession(sessionId);
      });

      await this.server!.connect(transport);
    }

    return { transport, sessionId, partialSession };
  }

  /**
   * Creates and starts a toolset service for a session
   */
  private async createToolsetService(identity: ToolsetIdentity): Promise<ToolsetService> {
    const toolsetService = new ToolsetService(this.loggerService, this.natsService, identity);
    await this.startService(toolsetService);
    return toolsetService;
  }

  /**
   * Completes a partial session context by adding all required components.
   * This mutates the partial session object to ensure any stored references remain valid.
   */
  private completeSessionContext(
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

  private async cleanupSession(sessionId: string) {
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
  private getSessionForRequest(sessionId: string): SessionContext {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    return session;
  }

  private async setServerHandlers() {
    if (!this.server) {
      throw new Error('Server not initialized');
    }

    this.server.setRequestHandler(InitializeRequestSchema, async (request, extra) => {
      return this.handleInitialize(request, extra);
    });

    this.server.setRequestHandler(ListToolsRequestSchema, async (request, extra) => {
      return this.handleListTools(request, extra);
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
      return this.handleCallTool(request, extra);
    });
  }

  /**
   * Handle initialize request
   */
  private async handleInitialize(request: unknown, extra: { sessionId?: string }) {
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
  private async handleListTools(request: unknown, extra: { sessionId?: string }) {
    this.logger.debug('Listing tools');

    const session = this.getSessionForRequest(extra.sessionId!);

    try {
      const tools = await session.toolsetService.getToolsForMCP();
      this.logger.debug(`List tools, responding with ${tools.length} tools`);
      return { tools };
    } catch (error) {
      this.logger.error(`Error listing tools: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Error listing tools: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handle call tool request
   */
  private async handleCallTool(request: unknown, extra: { sessionId?: string }) {
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

  private extractAuthHeaders(request: FastifyRequest): AuthHeaders {
    const headers = request.headers;
    return {
      masterKey: typeof headers['master_key'] === 'string' ? headers['master_key'] : undefined,
      toolsetKey: typeof headers['toolset_key'] === 'string' ? headers['toolset_key'] : undefined,
      toolsetName: typeof headers['toolset_name'] === 'string' ? headers['toolset_name'] : undefined,
    };
  }

  private async stopServer() {
    // Clean up all sessions
    for (const [sessionId, session] of this.sessions) {
      this.logger.debug(`Closing session: ${sessionId}`);
      await session.transport.close();
      await this.stopService(session.toolsetService);
    }
    this.sessions.clear();

    await this.server?.close();
    this.server = undefined;

    // Close the Fastify instance
    if (this.fastifyInstance) {
      await this.fastifyInstance.close();
    }
  }
}
