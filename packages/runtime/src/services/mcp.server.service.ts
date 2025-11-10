import { inject, injectable } from 'inversify';
import pino from 'pino';
import {
  LoggerService,
  NatsService,
  Service,
  dgraphResolversTypes,
  NatsErrorMessage,
  AgentCapabilitiesMessage,
  AgentCallMCPToolMessage,
  AgentCallResponseMessage,
  SetMcpClientNameMessage,
  MCP_CALL_TOOL_TIMEOUT,
  RequestToolSetCapabilitiesMessage,
  AckMessage,
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
  private streamTransports: Map<string, StreamableHTTPServerTransport> = new Map();
  private sseTransports: Map<string, SSEServerTransport> = new Map();
  private onInitializeMCPServerCallbacks: (() => void)[] = [];
  private rxSubscriptions: Subscription[] = [];

  constructor(
    @inject(LoggerService) private loggerService: LoggerService,
    @inject(NatsService) private natsService: NatsService,
    @inject(HealthService) private healthService: HealthService,
    @inject(AuthService) private authService: AuthService,
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
    const toolSet = process.env.TOOL_SET;
    const remotePort = process.env.REMOTE_PORT;

    // Determine transport type based on environment variables
    const transport = toolSet ? 'stdio' : remotePort ? 'stream' : null;

    if (!transport) {
      throw new Error('Cannot start MCP server: neither TOOL_SET nor REMOTE_PORT is set');
    }

    this.logger.info(`Starting server with transport: ${transport}`);
    this.server = new Server(
      {
        name: this.authService.getIdentity().name,
        version: this.authService.getIdentity().version,
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
      allowedHeaders: ['Content-Type', 'mcp-session-id'],
    });

    // Handle all MCP requests on a single endpoint
    this.fastifyInstance.all('/mcp', async (request: FastifyRequest, reply: FastifyReply) => {
      this.logger.debug(`Received ${request.method} request to /mcp`);

      try {
        const sessionId = request.headers['mcp-session-id'] as string | undefined;
        let transport: StreamableHTTPServerTransport;

        if (sessionId && this.streamTransports.has(sessionId)) {
          // Reuse existing transport
          transport = this.streamTransports.get(sessionId)!;
        } else if (!sessionId && isInitializeRequest(request.body as unknown)) {
          // New initialization request
          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (sessionId) => {
              this.logger.debug(`Session initialized: ${sessionId}`);
              this.streamTransports.set(sessionId, transport);
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
          return reply.status(400).send({
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
        return reply.status(500).send({
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
        const transport = new SSEServerTransport('/messages', reply.raw);
        this.sseTransports.set(transport.sessionId, transport);

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

        const transport = this.sseTransports.get(sessionId);
        if (transport) {
          await transport.handlePostMessage(request.raw, reply.raw, request.body as unknown);
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

  private async setServerHandlers() {
    if (!this.server) {
      throw new Error('Server not initialized');
    }

    this.server.setRequestHandler(InitializeRequestSchema, async (request) => {
      this.logger.info('Initialize handler');
      this.onInitializeMCPServerCallbacks.forEach((callback) => callback());
      this.logger.debug(
        `Initializing client: ${JSON.stringify(request.params.clientInfo)}, protocol version: ${request.params.protocolVersion}`,
      );
      this.clientInfo = {
        name: request.params.clientInfo.name,
        version: request.params.clientInfo.version,
      };
      this.logger.info(`Setting MCP client name to ${request.params.clientInfo.name}`);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const setMcpClientNameMessage = SetMcpClientNameMessage.create({
        RID: this.authService.getToolsetId()!,
        mcpClientName: request.params.clientInfo.name,
      }) as SetMcpClientNameMessage;
      // TODO: set the client name at the "right time" in the lifecycle
      // await this.natsService.request(setMcpClientNameMessage);
      if (request.params.capabilities.roots) {
        this.clientCapabilities.roots = { listChanged: request.params.capabilities.roots.listChanged ?? false };
        // reset the client roots, will be checked upon initialized notification
        // TODO: should the request for roots be done during initialize or after initialized notification?
        this.clientRoots.next([]);
      }
      const response = {
        serverInfo: {
          name: this.authService.getIdentity().name,
          version: this.authService.getIdentity().version,
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
      const message = AgentCallMCPToolMessage.create({
        from: this.authService.getToolsetId()!,
        toolId: toolCapability.id,
        arguments: request.params.arguments,
      }) as AgentCallMCPToolMessage;
      // TODO: evaluate if jetstream usage can increase robustness here
      const response = await this.natsService.request(message, { timeout: MCP_CALL_TOOL_TIMEOUT });
      if (response instanceof NatsErrorMessage) {
        throw new Error(`Error calling tool: ${response.data.error}`);
      } else if (response instanceof AgentCallResponseMessage) {
        return response.data.result;
      } else {
        throw new Error(`Invalid response: ${JSON.stringify(response)}`);
      }
    });
  }

  private async stopServer() {
    // Close all stream transports
    for (const [sessionId, transport] of this.streamTransports) {
      this.logger.debug(`Closing stream transport for session: ${sessionId}`);
      await transport.close();
    }
    this.streamTransports.clear();

    // Close all SSE transports
    for (const [sessionId, transport] of this.sseTransports) {
      this.logger.debug(`Closing SSE transport for session: ${sessionId}`);
      await transport.close();
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

  private async subscribeToCapabilities() {
    const toolSetName = process.env.TOOL_SET;
    if (!toolSetName) {
      throw new Error('Cannot subscribe to capabilities: TOOL_SET environment variable not set');
    }

    this.logger.info(`Subscribing to capabilities for toolset: ${toolSetName}`);
    const subscription = await this.natsService.observeEphemeral(AgentCapabilitiesMessage.subscribeToName(toolSetName));
    this.subscriptions.push(subscription);

    // Check if there's an initial value in ephemeral storage
    let hasInitialValue = false;
    const initialValueTimeout = new Promise<void>((resolve) => setTimeout(resolve, 1000));

    const checkInitialValue = (async () => {
      for await (const message of subscription) {
        if (message instanceof AgentCapabilitiesMessage) {
          hasInitialValue = true;
          this.tools.next(message.data.capabilities);
          this.logger.debug(`Received capabilities for toolset ${toolSetName}: ${message.data.capabilities.length} tools`);
        } else if (message instanceof NatsErrorMessage) {
          this.logger.error(`Error subscribing to tools: ${message.data.error}`);
        }
      }
    })();

    // Wait for either initial value or timeout
    await Promise.race([
      (async () => {
        await initialValueTimeout;
        if (!hasInitialValue) {
          this.logger.info(`No initial capabilities found in ephemeral storage for toolset ${toolSetName}, requesting...`);
          // Send request to backend to publish capabilities for this toolset
          const requestMessage = new RequestToolSetCapabilitiesMessage({
            toolSetName: toolSetName,
          });
          const response = await this.natsService.request(requestMessage);
          if (response instanceof AckMessage) {
            this.logger.debug(`Successfully requested capabilities for toolset ${toolSetName}`);
          } else if (response instanceof NatsErrorMessage) {
            this.logger.error(`Error requesting capabilities: ${response.data.error}`);
          }
        }
      })(),
      checkInitialValue,
    ]);

    // Continue listening for updates
    await checkInitialValue;
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
