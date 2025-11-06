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
import { ToolsetService } from './toolset.service';

interface SessionContext {
  transport: StreamableHTTPServerTransport | SSEServerTransport;
  toolsetService: ToolsetService;
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
    });

    await this.fastifyInstance.register(cors, {
      origin: '*',
      exposedHeaders: ['mcp-session-id'],
      allowedHeaders: ['Content-Type', 'mcp-session-id', 'master_key', 'toolset_key', 'toolset_name'],
    });

    // Handle all MCP requests on a single endpoint
    this.fastifyInstance.all('/mcp', async (request: FastifyRequest, reply: FastifyReply) => {
      this.logger.debug(`Received ${request.method} request to /mcp`);

      try {
        const sessionId = request.headers['mcp-session-id'] as string | undefined;
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
          return reply.send({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: 'Bad Request: No valid session ID provided',
            },
            id: null,
          });
        }

        // Handle the request
        await (session.transport as StreamableHTTPServerTransport).handleRequest(
          request.raw,
          reply.raw,
          request.body as unknown,
        );
      } catch (error) {
        this.logger.error(`Error handling MCP request: ${error}`);
        return reply.send({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal error',
          },
          id: null,
        });
      }
    });

    // SSE endpoint
    this.fastifyInstance.get('/sse', async (request: FastifyRequest, reply: FastifyReply) => {
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

    // Messages endpoint for SSE transport
    this.fastifyInstance.post('/messages', async (request: FastifyRequest, reply: FastifyReply) => {
      this.logger.debug('Received POST request to /messages');
      try {
        const query = request.query as { sessionId?: string };
        const sessionId = typeof query?.sessionId === 'string' ? query.sessionId : undefined;

        if (!sessionId) {
          return reply.status(400).send('Missing sessionId');
        }

        const session = this.sessions.get(sessionId);
        if (session && session.transport instanceof SSEServerTransport) {
          await session.transport.handlePostMessage(request.raw, reply.raw, request.body as unknown);
          return;
        }

        return reply.status(400).send('No transport found for sessionId');
      } catch (error) {
        this.logger.error(`Error handling SSE message: ${error}`);
        return reply.status(500).send('Internal error');
      }
    });

    const port = parseInt(portString) || 3000;

    try {
      await this.fastifyInstance.listen({ port, host: '0.0.0.0' });
      this.logger.info(`Streamable HTTP MCP server listening on port ${port}`);
    } catch (error) {
      this.logger.error(`Failed to start Fastify server: ${error}`);
      throw error;
    }

    // Setup server handlers
    await this.setServerHandlers();
  }

  private async createNewSession(
    request: FastifyRequest,
    reply: FastifyReply,
    transportType: 'stream' | 'sse',
  ): Promise<SessionContext | null> {
    try {
      // Extract and validate auth headers
      const authHeaders = this.extractAuthHeaders(request);
      const sessionAuthService = new SessionAuthService(
        this.loggerService,
        this.natsService,
      );

      sessionAuthService.validateAuthHeaders(authHeaders);
      const identity = await sessionAuthService.authenticateViaHandshake(authHeaders);

      this.logger.info(`Authenticated new ${transportType} connection for toolset: ${identity.toolsetName}`);

      // Create transport
      let transport: StreamableHTTPServerTransport | SSEServerTransport;
      let sessionId: string;
      const session: Partial<SessionContext> = {};

      if (transportType === 'stream') {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sid) => {
            sessionId = sid;
            this.sessions.set(sid, session as SessionContext);
            this.logger.debug(`Session initialized: ${sid}`);
          },
        });

        // Clean up transport when closed
        transport.onclose = () => {
          if (transport.sessionId) {
            this.logger.debug(`Session closed: ${transport.sessionId}`);
            this.cleanupSession(transport.sessionId);
          }
        };

        await this.server!.connect(transport);
        sessionId = transport.sessionId!;
      } else {
        transport = new SSEServerTransport('/messages', reply.raw);
        sessionId = transport.sessionId;
        this.sessions.set(sessionId, session as SessionContext);

        reply.raw.on('close', () => {
          this.logger.debug(`SSE session closed: ${sessionId}`);
          this.cleanupSession(sessionId);
        });

        await this.server!.connect(transport);
      }

      // Create toolset service for this session
      const toolsetService = new ToolsetService(this.loggerService, this.natsService, identity);
      await this.startService(toolsetService);

      // Store session context
      session.transport = transport;
      session.toolsetService = toolsetService;

      
      this.logger.info(`Created session ${sessionId} for toolset: ${identity.toolsetName}`);

      return session as SessionContext;
    } catch (authError) {
      this.logger.error(`Authentication failed: ${authError}`);
      if (transportType === 'stream') {
        reply.send({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: `Authentication failed: ${authError instanceof Error ? authError.message : String(authError)}`,
          },
          id: null,
        });
      } else {
        reply.status(401).send({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: `Authentication failed: ${authError instanceof Error ? authError.message : String(authError)}`,
          },
          id: null,
        });
      }
      return null;
    }
  }

  private async cleanupSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.logger.info(`Cleaning up session ${sessionId}`);
      await this.stopService(session.toolsetService);
      this.sessions.delete(sessionId);
    }
  }

  private getSession(sessionId: string): SessionContext | undefined {
    return this.sessions.get(sessionId);
  }

  private async setServerHandlers() {
    if (!this.server) {
      throw new Error('Server not initialized');
    }

    this.server.setRequestHandler(InitializeRequestSchema, async (request, extra) => {
      this.logger.info('Initialize handler');
      this.logger.debug(
        `Initializing client: ${JSON.stringify(request.params.clientInfo)}, protocol version: ${request.params.protocolVersion}`,
      );

      const session = this.getSession(extra.sessionId!);
      if (!session) {
        throw new Error('Session not found');
      }

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
    });

    this.server.setRequestHandler(ListToolsRequestSchema, async (request, extra) => {
      this.logger.debug('Listing tools');

      const session = this.getSession(extra.sessionId!);
      if (!session) {
        throw new Error('Session not found');
      }

      try {
        const tools = await session.toolsetService.getToolsForMCP();
        this.logger.debug(`List tools, responding with ${tools.length} tools`);
        return {tools};
      } catch (error) {
        this.logger.error(`Error listing tools: ${error instanceof Error ? error.message : String(error)}`);
        throw new Error(`Error listing tools: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
      if (!request.params.arguments) {
        throw new Error('Arguments are required');
      }

      const session = this.getSession(extra.sessionId!);
      if (!session) {
        throw new Error('Session not found');
      }

      try {
        if (!request.params.arguments) {
          throw new Error('Arguments are required');
        }
        const result = await session.toolsetService.callTool(request.params.name, request.params.arguments);
        return result;
      } catch (error) {
        this.logger.error(`Error listing tools: ${error instanceof Error ? error.message : String(error)}`);
        throw new Error(`Error listing tools: ${error instanceof Error ? error.message : String(error)}`);
      } 
    });
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
