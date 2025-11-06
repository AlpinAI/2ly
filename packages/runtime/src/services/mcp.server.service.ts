import { inject, injectable } from 'inversify';
import pino from 'pino';
import {
  LoggerService,
  NatsService,
  Service,
  dgraphResolversTypes,
  ErrorResponse,
  ToolsetListToolsPublish,
  ToolSetCallToolRequest,
  RuntimeCallToolResponse,
  MCP_CALL_TOOL_TIMEOUT,
} from '@2ly/common';
import { HealthService } from './runtime.health.service';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
  InitializedNotificationSchema,
  RootsListChangedNotificationSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { AuthService } from './auth.service';
import { BehaviorSubject, filter, firstValueFrom, Subscription } from 'rxjs';
import { randomUUID } from 'node:crypto';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import { RUNTIME_MODE, type RuntimeMode } from '../di/symbols';
import { HandshakeRequest, HandshakeResponse } from '@2ly/common';
import os from 'os';
import { getHostIP } from '../utils';

interface SessionIdentity {
  workspaceId: string;
  toolsetId: string;
  toolsetName: string;
}

interface AuthHeaders {
  masterKey?: string;
  toolsetKey?: string;
  toolsetName?: string;
}

@injectable()
export class McpServerService extends Service {
  name = 'mcp-server';
  private logger: pino.Logger;
  private server: Server | undefined;
  private transport: StdioServerTransport | StreamableHTTPServerTransport | undefined;
  private clientInfo: { name: string; version: string } | undefined;
  private clientCapabilities: { roots?: { listChanged: boolean } } = {};
  private clientRoots: BehaviorSubject<{ name: string; uri: string }[]> = new BehaviorSubject<
    { name: string; uri: string }[]
  >([]);
  private tools = new BehaviorSubject<dgraphResolversTypes.McpTool[] | null>(null);
  private subscriptions: { unsubscribe: () => void; drain: () => Promise<void>; isClosed?: () => boolean }[] = [];
  private fastifyInstance: FastifyInstance | undefined;
  private streamTransports: Map<string, { transport: StreamableHTTPServerTransport; identity: SessionIdentity }> =
    new Map();
  private sseTransports: Map<string, { transport: SSEServerTransport; identity: SessionIdentity }> = new Map();
  private onInitializeMCPServerCallbacks: (() => void)[] = [];
  private rxSubscriptions: Subscription[] = [];

  constructor(
    @inject(LoggerService) private loggerService: LoggerService,
    @inject(NatsService) private natsService: NatsService,
    @inject(HealthService) private healthService: HealthService,
    @inject(AuthService) private authService: AuthService,
    @inject(RUNTIME_MODE) private runtimeMode: RuntimeMode,
  ) {
    super();
    this.logger = this.loggerService.getLogger(this.name);
  }

  protected async initialize() {
    this.logger.info('Starting');
    await this.startService(this.authService);
    await this.startService(this.natsService);
    await this.startService(this.healthService);
    await this.startServer();
  }

  protected async shutdown() {
    this.logger.info('Stopping');
    await this.stopServer();
    this.rxSubscriptions.forEach((subscription) => subscription.unsubscribe());
    this.rxSubscriptions = [];
    await this.stopService(this.natsService);
    await this.stopService(this.authService);
    await this.stopService(this.healthService);
  }

  private async startServer() {
    const identity = this.authService.getIdentity();
    const remotePort = process.env.REMOTE_PORT;

    let transport: 'stdio' | 'stream' | null = null;

    if (this.runtimeMode === 'MCP_STDIO') {
      transport = 'stdio';
    } else if (this.runtimeMode === 'EDGE_MCP_STREAM' || this.runtimeMode === 'STANDALONE_MCP_STREAM') {
      if (!remotePort) {
        this.logger.warn(`REMOTE_PORT is not set for edge MCP stream mode, Remote MCP server will not start`);
        return;
      }
      transport = 'stream';
    } else {
      throw new Error(`Invalid runtime mode: ${this.runtimeMode}`);
    }

    

    if (!transport) {
      throw new Error('Cannot start MCP server: neither TOOL_SET nor REMOTE_PORT is set');
    }

    this.logger.info(`Starting server with transport: ${transport}`);
    
    this.server = new Server(
      {
        name: identity?.name ?? 'Remote 2LY Server',
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

    await this.setTransport(transport, remotePort);
    await this.setServerHandlers();
    this.subscribeToCapabilities();
  }

  private async setTransport(transport: 'stdio' | 'stream', remotePort?: string) {
    if (!this.server) {
      throw new Error('Server not initialized');
    }
    if (transport === 'stdio') {
      this.transport = new StdioServerTransport();
      this.server.connect(this.transport);
    } else if (transport === 'stream') {
      await this.setupStreamableHttpTransport(remotePort!);
    } else {
      throw new Error(`Invalid transport: ${transport}, must be either "stdio" or "stream"`);
    }
  }

  private async setupStreamableHttpTransport(portString: string) {
    this.logger.info('Setting up Streamable HTTP transport');

    this.fastifyInstance = fastify({
      logger: false, // We use our own logger
    });

    // Configure CORS
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
        let transport: StreamableHTTPServerTransport;
        let identity: SessionIdentity;

        if (sessionId && this.streamTransports.has(sessionId)) {
          // Reuse existing transport and identity
          const session = this.streamTransports.get(sessionId)!;
          transport = session.transport;
          identity = session.identity;
          this.logger.debug(`Reusing session ${sessionId} for toolset: ${identity.toolsetName}`);
        } else if (!sessionId && isInitializeRequest(request.body as unknown)) {
          // New initialization request - authenticate first
          try {
            const authHeaders = this.extractAuthHeaders(request);
            this.validateAuthHeaders(authHeaders);
            identity = await this.authenticateViaHandshake(authHeaders);
            this.logger.info(`Authenticated new MCP connection for toolset: ${identity.toolsetName}`);
          } catch (authError) {
            this.logger.error(`Authentication failed: ${authError}`);
            return reply.send({
              jsonrpc: '2.0',
              error: {
                code: -32000,
                message: `Authentication failed: ${authError instanceof Error ? authError.message : String(authError)}`,
              },
              id: null,
            });
          }

          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (sessionId) => {
              this.logger.debug(`Session initialized: ${sessionId}`);
              this.streamTransports.set(sessionId, { transport, identity });
            },
          });

          // Clean up transport when closed
          transport.onclose = () => {
            if (transport.sessionId) {
              this.logger.debug(`Session closed: ${transport.sessionId}`);
              this.streamTransports.delete(transport.sessionId);
            }
          };

          // Connect to the MCP server
          await this.server!.connect(transport);
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
        await transport.handleRequest(request.raw, reply.raw, request.body as unknown);
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

    // SSE endpoint for backward compatibility
    this.fastifyInstance.get('/sse', async (request: FastifyRequest, reply: FastifyReply) => {
      this.logger.debug('Received GET request to /sse');
      try {
        // Authenticate before creating transport
        let identity: SessionIdentity;
        try {
          const authHeaders = this.extractAuthHeaders(request);
          this.validateAuthHeaders(authHeaders);
          identity = await this.authenticateViaHandshake(authHeaders);
          this.logger.info(`Authenticated new SSE connection for toolset: ${identity.toolsetName}`);
        } catch (authError) {
          this.logger.error(`Authentication failed: ${authError}`);
          return reply.status(401).send({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: `Authentication failed: ${authError instanceof Error ? authError.message : String(authError)}`,
            },
            id: null,
          });
        }

        const transport = new SSEServerTransport('/messages', reply.raw);
        this.sseTransports.set(transport.sessionId, { transport, identity });

        reply.raw.on('close', () => {
          this.logger.debug(`SSE session closed: ${transport.sessionId}`);
          this.sseTransports.delete(transport.sessionId);
        });

        await this.server!.connect(transport);
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

        const session = this.sseTransports.get(sessionId);
        if (session) {
          await session.transport.handlePostMessage(request.raw, reply.raw, request.body as unknown);
          return;
        }

        return reply.status(400).send('No transport found for sessionId');
      } catch (error) {
        this.logger.error(`Error handling SSE message: ${error}`);
        return reply.status(500).send('Internal error');
      }
    });

    // Start the Fastify server
    const port = parseInt(portString) || 3000;

    try {
      await this.fastifyInstance.listen({ port, host: '0.0.0.0' });
      this.logger.info(`Streamable HTTP MCP server listening on port ${port}`);
    } catch (error) {
      this.logger.error(`Failed to start Fastify server: ${error}`);
      throw error;
    }
  }

  private getRequestIdentity(sessionId: string): SessionIdentity | undefined {
    if (this.streamTransports.has(sessionId)) {
      return this.streamTransports.get(sessionId)!.identity;
    } else if (this.sseTransports.has(sessionId)) {
      return this.sseTransports.get(sessionId)!.identity;
    }
    return undefined;
  }

  private async setServerHandlers() {
    if (!this.server) {
      throw new Error('Server not initialized');
    }

    this.server.setRequestHandler(InitializeRequestSchema, async (request, extra) => {
      this.logger.info('Initialize handler');
      this.onInitializeMCPServerCallbacks.forEach((callback) => callback());
      this.logger.debug(
        `Initializing client: ${JSON.stringify(request.params.clientInfo)}, protocol version: ${request.params.protocolVersion}`,
      );
      const identity = this.getRequestIdentity(extra.sessionId!);

      if (!identity || !identity.toolsetName) {
        throw new Error('Cannot start MCP server: identity not found or incomplete');
      }

      this.clientInfo = {
        name: request.params.clientInfo.name,
        version: request.params.clientInfo.version,
      };
      this.logger.info(`Setting MCP client name to ${request.params.clientInfo.name}`);
      if (request.params.capabilities.roots) {
        this.clientCapabilities.roots = { listChanged: request.params.capabilities.roots.listChanged ?? false };
        // reset the client roots, will be checked upon initialized notification
        // TODO: should the request for roots be done during initialize or after initialized notification?
        this.clientRoots.next([]);
      }
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
      if (!this.tools.getValue()) {
        await firstValueFrom(
          this.tools.pipe(filter((tools): tools is dgraphResolversTypes.McpTool[] => tools !== null)),
        );
      }

      return response;
    });

    const getRoots = async () => {
      const response = await this.server!.listRoots();
      this.logger.debug(`MCP Client roots: ${JSON.stringify(response.roots)}`);
      this.clientRoots.next(response.roots as unknown as { name: string; uri: string }[]);
    };

    this.server.setNotificationHandler(InitializedNotificationSchema, async () => {
      this.logger.debug('MCP Client initialized');
      if (this.clientCapabilities.roots) {
        this.logger.debug('MCP Client has roots capability, getting roots');
        await getRoots();
      }
    });

    this.server.setNotificationHandler(RootsListChangedNotificationSchema, async () => {
      this.logger.debug('Clients notified roots changed');
      await getRoots();
    });

    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.logger.debug('Listing tools');

      // Wait for tools to be available before responding
      if (!this.tools.getValue()) {
        await firstValueFrom(
          this.tools.pipe(filter((tools): tools is dgraphResolversTypes.McpTool[] => tools !== null)),
        );
        this.logger.debug('Tools available');
      }

      const tools = this.tools.getValue()!;

      this.logger.debug(`Tools: ${JSON.stringify(tools)}`);
      return {
        tools: tools.map((tool) => ({
          name: tool.name,
          title: tool.name,
          description: tool.description,
          inputSchema: JSON.parse(tool.inputSchema),
          annotations: JSON.parse(tool.annotations),
        })),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (!request.params.arguments) {
        throw new Error('Arguments are required');
      }

      // Wait for tools to be available before responding
      if (!this.tools.getValue()) {
        await firstValueFrom(
          this.tools.pipe(filter((tools): tools is dgraphResolversTypes.McpTool[] => tools !== null)),
        );
      }

      // Find the tool capability linked to the tool name
      const toolCapability = this.tools.getValue()!.find((tool) => tool.name === request.params.name);
      if (!toolCapability) {
        throw new Error(`Tool capability not found for tool: ${request.params.name}`);
      }

      this.logger.debug(
        `Calling tool: ${toolCapability.name} (${toolCapability.id}), arguments: ${JSON.stringify(request.params.arguments)}`,
      );
      const message = ToolSetCallToolRequest.create({
        from: this.authService.getIdentity()!.id!,
        toolId: toolCapability.id,
        arguments: request.params.arguments,
      }) as ToolSetCallToolRequest;
      // TODO: evaluate if jetstream usage can increase robustness here
      const response = await this.natsService.request(message, { timeout: MCP_CALL_TOOL_TIMEOUT });
      if (response instanceof ErrorResponse) {
        throw new Error(`Error calling tool: ${response.data.error}`);
      } else if (response instanceof RuntimeCallToolResponse) {
        return response.data.result;
      } else {
        throw new Error(`Invalid response: ${JSON.stringify(response)}`);
      }
    });
  }

  private async stopServer() {
    // Close all stream transports
    for (const [sessionId, session] of this.streamTransports) {
      this.logger.debug(`Closing stream transport for session: ${sessionId}`);
      await session.transport.close();
    }
    this.streamTransports.clear();

    // Close all SSE transports
    for (const [sessionId, session] of this.sseTransports) {
      this.logger.debug(`Closing SSE transport for session: ${sessionId}`);
      await session.transport.close();
    }
    this.sseTransports.clear();

    await this.transport?.close();
    await this.server?.close();

    // Properly drain all subscriptions with await and error handling
    const drainPromises = this.subscriptions.map(async (subscription) => {
      try {
        if (!subscription.isClosed?.()) {
          await subscription.drain();
        }
      } catch (error) {
        this.logger.warn(`Failed to drain subscription: ${error}`);
      }
    });

    await Promise.allSettled(drainPromises);
    this.subscriptions = [];

    this.server = undefined;
    this.transport = undefined;
    this.clientInfo = undefined;

    // Close the Fastify instance
    if (this.fastifyInstance) {
      await this.fastifyInstance.close();
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

  private validateAuthHeaders(headers: AuthHeaders): void {
    const { masterKey, toolsetKey, toolsetName } = headers;

    // Rule 1: MASTER_KEY and TOOLSET_KEY are mutually exclusive
    if (masterKey && toolsetKey) {
      throw new Error('MASTER_KEY and TOOLSET_KEY are mutually exclusive');
    }

    // Rule 2: At least one key must be provided
    if (!masterKey && !toolsetKey) {
      throw new Error('Either MASTER_KEY or TOOLSET_KEY is required');
    }

    // Rule 3: MASTER_KEY requires TOOLSET_NAME
    if (masterKey && !toolsetName) {
      throw new Error('MASTER_KEY requires TOOLSET_NAME');
    }

    // Rule 4: TOOLSET_KEY must not have TOOLSET_NAME
    if (toolsetKey && toolsetName) {
      throw new Error('TOOLSET_KEY must not be used with TOOLSET_NAME');
    }
  }

  private async authenticateViaHandshake(headers: AuthHeaders): Promise<SessionIdentity> {
    const { masterKey, toolsetKey, toolsetName } = headers;
    const key = masterKey || toolsetKey!;

    this.logger.debug(`Authenticating via handshake with key type: ${masterKey ? 'MASTER_KEY' : 'TOOLSET_KEY'}`);

    // Create handshake request
    const handshakeRequest = HandshakeRequest.create({
      key,
      nature: 'toolset',
      name: toolsetName,
      pid: process.pid.toString(),
      hostIP: getHostIP(),
      hostname: os.hostname(),
    }) as HandshakeRequest;

    // Send handshake request to backend via NATS
    const response = await this.natsService.request(handshakeRequest, { timeout: 5000 });

    if (response instanceof ErrorResponse) {
      this.logger.error(`Handshake failed: ${response.data.error}`);
      throw new Error(`Authentication failed: ${response.data.error}`);
    }

    if (!(response instanceof HandshakeResponse)) {
      this.logger.error(`Invalid handshake response: ${JSON.stringify(response)}`);
      throw new Error('Authentication failed: invalid response from backend');
    }

    if (response.data.nature !== 'toolset') {
      throw new Error(`Authentication failed: expected toolset nature, got ${response.data.nature}`);
    }

    this.logger.info(`Successfully authenticated toolset: ${response.data.name} (${response.data.id})`);

    return {
      workspaceId: response.data.workspaceId,
      toolsetId: response.data.id,
      toolsetName: response.data.name,
    };
  }

  private async subscribeToCapabilities() {
    const identity = this.authService.getIdentity();
    if (!identity || !identity.workspaceId || !identity.id) {
      throw new Error('Cannot subscribe to capabilities: identity not found or incomplete');
    }

    this.logger.info(`Subscribing to List Tools for toolset: ${identity.workspaceId} - ${identity.id}`);
    const subscription = await this.natsService.observeEphemeral(ToolsetListToolsPublish.subscribeToToolSet(identity.workspaceId, identity.id));
    this.subscriptions.push(subscription);

    (async () => {
      for await (const message of subscription) {
        if (message instanceof ToolsetListToolsPublish) {
          this.tools.next(message.data.mcpTools);
          this.logger.debug(`Received ${message.data.mcpTools.length} mcp tools for toolset ${identity.id}`);
        } else if (message instanceof ErrorResponse) {
          this.logger.error(`Error subscribing to tools: ${message.data.error}`);
        }
      }
    })();
  }

  public onInitializeMCPServer(callback: () => void) {
    this.onInitializeMCPServerCallbacks.push(callback);
  }

  public getClientRoots() {
    return this.clientRoots.getValue();
  }

  public observeClientRoots() {
    return this.clientRoots.asObservable();
  }
}
