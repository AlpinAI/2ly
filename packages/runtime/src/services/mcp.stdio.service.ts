import { inject, injectable } from 'inversify';
import pino from 'pino';
import {
  LoggerService,
  NatsService,
  Service,
} from '@2ly/common';
import { HealthService } from './runtime.health.service';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
  InitializedNotificationSchema,
  RootsListChangedNotificationSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { AuthService } from './auth.service';
import { BehaviorSubject, Subscription, tap } from 'rxjs';
import { SkillService } from './skill.service';

/**
 * McpStdioService handles MCP server with stdio transport.
 * This service has a 1:1 relationship with a single skill.
 */
@injectable()
export class McpStdioService extends Service {
  name = 'mcp.stdio';
  private logger: pino.Logger;
  private server: Server | undefined;
  private transport: StdioServerTransport | undefined;
  private clientInfo: { name: string; version: string } | undefined;
  private clientCapabilities: { roots?: { listChanged: boolean } } = {};
  private clientRoots: BehaviorSubject<{ name: string; uri: string }[]> = new BehaviorSubject<
    { name: string; uri: string }[]
  >([]);
  private skillService: SkillService | undefined;
  private rxjsSubscriptions: Subscription[] = [];

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
    this.logger.info('Starting MCP stdio service');
    await this.startService(this.authService);
    await this.startService(this.natsService);
    await this.startService(this.healthService);
    await this.startServer();
  }

  protected async shutdown() {
    this.logger.info('Stopping MCP stdio service');
    await this.stopServer();
    await this.stopService(this.natsService);
    await this.stopService(this.authService);
    await this.stopService(this.healthService);
  }

  private async startServer() {
    const identity = this.authService.getIdentity();
    if (!identity || !identity.name) {
      throw new Error('Cannot start MCP stdio server: identity not found or incomplete');
    }

    this.logger.info('Starting stdio MCP server');

    this.server = new Server(
      {
        name: identity.name,
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

    // TODO: we probably should start the server in the initialize phase
    // Create and start the skill service
    this.skillService = new SkillService(this.loggerService, this.natsService, {
      workspaceId: identity.workspaceId!,
      skillId: identity.id!,
      skillName: identity.name,
    });
    await this.startService(this.skillService);

    // Setup transport
    this.transport = new StdioServerTransport();
    await this.server.connect(this.transport);

    // Setup handlers
    await this.setServerHandlers();

    // Notify changes
    const sub = this.skillService.observeTools().pipe(tap(() => this.server?.sendToolListChanged())).subscribe();
    this.rxjsSubscriptions.push(sub);
  }

  private async setServerHandlers() {
    if (!this.server) {
      throw new Error('Server not initialized');
    }

    this.server.setRequestHandler(InitializeRequestSchema, async (request) => {
      this.logger.info('Initialize handler');
      this.logger.debug(
        `Initializing client: ${JSON.stringify(request.params.clientInfo)}, protocol version: ${request.params.protocolVersion}`,
      );

      const identity = this.authService.getIdentity();
      if (!identity || !identity.name) {
        throw new Error('Cannot start MCP server: identity not found or incomplete');
      }

      this.clientInfo = {
        name: request.params.clientInfo.name,
        version: request.params.clientInfo.version,
      };
      this.logger.info(`Setting MCP client name to ${request.params.clientInfo.name}`);

      if (request.params.capabilities.roots) {
        this.clientCapabilities.roots = { listChanged: request.params.capabilities.roots.listChanged ?? false };
        this.clientRoots.next([]);
      }

      const response = {
        serverInfo: {
          name: identity.name,
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
      // TODO: I suppose we don't need to wait for tools to be available here
      await this.skillService!.waitForTools();

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
      try {
        const tools = await this.skillService!.getToolsForMCP();
        this.logger.debug(`List tools, responding with ${tools.length} tools`);
        return {tools};
      } catch (error) {
        this.logger.error(`Error listing tools: ${error instanceof Error ? error.message : String(error)}`);
        throw new Error(`Error listing tools: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        if (!request.params.arguments) {
          throw new Error('Arguments are required');
        }
        const result = await this.skillService!.callTool(request.params.name, request.params.arguments);
        return result;
      } catch (error) {
        this.logger.error(`Error listing tools: ${error instanceof Error ? error.message : String(error)}`);
        throw new Error(`Error listing tools: ${error instanceof Error ? error.message : String(error)}`);
      }      
    });
  }

  private async stopServer() {
    this.rxjsSubscriptions.forEach(sub => sub.unsubscribe());
    await this.transport?.close();
    await this.server?.close();

    if (this.skillService) {
      await this.stopService(this.skillService);
    }

    this.server = undefined;
    this.transport = undefined;
    this.clientInfo = undefined;
  }

  public getClientRoots() {
    return this.clientRoots.getValue();
  }

  public observeClientRoots() {
    return this.clientRoots.asObservable();
  }
}
