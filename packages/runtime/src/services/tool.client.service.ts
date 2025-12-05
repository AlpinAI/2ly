import { inject, injectable } from 'inversify';
import pino from 'pino';
import {
  LoggerService,
  NatsService,
  Service,
  dgraphResolversTypes,
  RuntimeDiscoveredToolsPublish,
  SkillCallToolRequest,
  RuntimeCallToolResponse,
  RuntimeMCPServersPublish,
  EXECUTION_TARGET,
  ErrorResponse,
} from '@2ly/common';
import { AuthService } from './auth.service';
import { HealthService } from './runtime.health.service';
import { ToolServerService, type ToolServerServiceFactory } from './tool.server.service';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { McpStdioService } from './mcp.stdio.service';
import { Subscription } from 'rxjs';
import { optional } from 'inversify';

@injectable()
export class ToolClientService extends Service {
  name = 'tool-client';
  private logger: pino.Logger;
  private natsSubscriptions: { unsubscribe: () => void; drain: () => Promise<void>; isClosed?: () => boolean }[] = [];
  private mcpServers: Map<string, ToolServerService> = new Map();
  private mcpTools: Map<string, dgraphResolversTypes.McpTool[]> = new Map();
  private toolSubscriptions: Map<string, Map<string, { unsubscribe: () => void }>> = new Map();
  private roots: { name: string; uri: string }[] = [];
  private rxSubscriptions: Subscription[] = [];

  constructor(
    @inject(LoggerService) private loggerService: LoggerService,
    @inject(NatsService) private natsService: NatsService,
    @inject(AuthService) private authService: AuthService,
    @inject(HealthService) private healthService: HealthService,
    @inject(ToolServerService) private toolServerServiceFactory: ToolServerServiceFactory,
    @inject(McpStdioService) @optional() private mcpStdioService: McpStdioService | undefined,
  ) {
    super();
    this.logger = this.loggerService.getLogger(this.name);
  }

  protected async initialize() {
    this.logger.info('Starting');
    await this.authService.waitForStarted();
    await this.natsService.waitForStarted();
    await this.healthService.waitForStarted();
    this.startObserveMCPServers();

    // Only subscribe to client roots if mcpStdioService is available
    if (this.mcpStdioService) {
      this.rxSubscriptions.push(
        this.mcpStdioService.observeClientRoots().subscribe(async (value) => {
          this.logger.debug(`Agent server client roots changed: ${JSON.stringify(value)}`);
          const roots = this.getRoots();
          for (const mcpServer of this.mcpServers.values()) {
            this.logger.debug(`Updating ${mcpServer.getName()} roots: ${JSON.stringify(roots)}`);
            mcpServer.updateRoots(roots);
          }
        }),
      );
    }
  }

  private getRoots() {
    return this.mcpStdioService?.getClientRoots().length ? this.mcpStdioService.getClientRoots() : this.roots;
  }

  protected async shutdown() {
    this.logger.info('Stopping');
    await this.stopObserveMCPServers();
    this.rxSubscriptions.forEach((subscription) => subscription?.unsubscribe());
    this.rxSubscriptions = [];
  }

  private async startObserveMCPServers() {
    const identity = this.authService.getIdentity();
    if (!identity?.id) {
      throw new Error('Cannot observe configured MCPServers for tool runtime: workspaceId or id not found');
    }
    const subject = RuntimeMCPServersPublish.subscribeToRuntime(identity.workspaceId, identity.id);
    this.logger.debug(`Observing configured MCPServers for tool runtime: ${subject}`);
    const subscription = await this.natsService.observeEphemeral(subject);
    this.natsSubscriptions.push(subscription);
    for await (const msg of subscription) {
      if (msg instanceof RuntimeMCPServersPublish) {
        this.logger.debug(
          `Received update-configured-mcp-server. roots: ${JSON.stringify(msg.data.roots)}, mcpServers: ${msg.data.mcpServers.map((mcpServer) => mcpServer.name).join(', ')}`,
        );
        this.roots = msg.data.roots;
        const mcpServerIds = msg.data.mcpServers.map((mcpServer) => mcpServer.id);
        const mcpServersToStop = Array.from(this.mcpServers.keys()).filter(
          (mcpServerId) => !mcpServerIds.includes(mcpServerId),
        );

        // stop mcp servers that are not in the message
        for (const mcpServerId of mcpServersToStop) {
          const service = this.mcpServers.get(mcpServerId)!;
          await this.stopMCPServer({ id: mcpServerId, name: service.getName() });
        }

        // start or restart mcp servers that are in the message
        for (const mcpServer of msg.data.mcpServers) {
          await this.spawnMCPServer(mcpServer).catch(async (error) => {
            this.logger.error(`Failed to spawn MCP Server ${mcpServer.name}: ${error}`);
            const service = this.mcpServers.get(mcpServer.id);
            if (service) {
              await this.stopService(service);
            }
            this.mcpServers.delete(mcpServer.id);
            // TODO: surface error to the user
          });
        }
      }
    }
  }

  private async stopObserveMCPServers() {
    const identity = this.authService.getIdentity();
    if (!identity?.workspaceId || !identity?.id) {
      this.logger.warn(`Cannot stop observing configured MCPServers for tool runtime: workspaceId or id not found`);
      return;
    }
    this.logger.debug(`Stopping to observe configured MCPServers for tool runtime ${identity.workspaceId} - ${identity.id}`);
    
    // Drain NATS subscriptions before stopping services
    const drainPromises = this.natsSubscriptions.map(async (subscription) => {
      try {
        if (!subscription.isClosed?.()) {
          await subscription.drain();
        }
      } catch (error) {
        this.logger.warn(`Failed to drain subscription: ${error}`);
      }
    });

    await Promise.allSettled(drainPromises);
    this.natsSubscriptions = [];

    // Stop MCP servers
    // -> will also drain the capabilities subscriptions
    for (const mcpServer of this.mcpServers.values()) {
      await this.stopService(mcpServer);
    }
    this.mcpServers.clear();
  }

  /**
   * Spawn an MCP Server
   * - the mcpServer argument contains the list of tools and capabilities that the MCP Server advertises
   */
  private async spawnMCPServer(mcpServer: dgraphResolversTypes.McpServer) {
    // setting the roots to the client roots if the agent server has any, otherwise use the roots from the MCPServer config in the database
    // TODO: if the client roots is changed, we should update the roots of the mcp server service
    // also, how to reflect in the UI which roots are used ?
    const roots = this.getRoots();
    const mcpServerService = this.toolServerServiceFactory(mcpServer, roots);
    if (this.mcpServers.has(mcpServer.id)) {
      const existingMcpServer = this.mcpServers.get(mcpServer.id)!;
      if (existingMcpServer.getConfigSignature() === mcpServerService.getConfigSignature()) {
        this.logger.debug(`MCPServer ${mcpServer.name} already running -> skipping spawn`);

        // Even though we skip spawning, ensure tools are subscribed
        const tools = mcpServer.tools ?? [];
        this.ensureToolsSubscribed(mcpServer.id, tools, mcpServer.executionTarget!);

        return;
      }
    }
    this.logger.info(
      `Spawning MCPServer: ${mcpServer.name} with ${mcpServer.tools?.length ?? 0} tools, and roots: ${JSON.stringify(roots)}`,
    );

    if (this.mcpServers.has(mcpServer.id)) {
      this.logger.debug(`MCPServer ${mcpServer.name} already running -> shutting down`);
      await this.stopMCPServer(mcpServer);
    }

    await this.startService(mcpServerService);
    this.mcpServers.set(mcpServer.id, mcpServerService);

    // This getTools subscription will be completed when the MCP Server is stopped by the MCP Server Service
    mcpServerService.observeTools().subscribe((tools) => {
      this.logger.debug(`Updating tools for MCP Server ${mcpServer.id} with ${tools.length} tools`);
      const message = RuntimeDiscoveredToolsPublish.create({ 
        workspaceId: this.authService.getIdentity()!.workspaceId!,
        mcpServerId: mcpServer.id, 
        tools 
      }) as RuntimeDiscoveredToolsPublish;
      // TODO: Publish with jetstream in a way that activate a retry in case the backend did not pick up the message
      // target to the backend, doesn't need to be linked to a specific runtime instance
      this.natsService.publish(message);
    });

    const tools = mcpServer.tools ?? [];
    // Ensure all tools are subscribed
    this.ensureToolsSubscribed(mcpServer.id, tools, mcpServer.executionTarget!);

    // When the MCP Server is stopped, we need to unsubscribe from the capabilities and clear the subscriptions
    mcpServerService.onShutdown(async () => {});
    this.logger.info(`MCPServer ${mcpServer.name} spawned`);
  }

  // Subscribe to a capability and return the subscription
  private subscribeToTool(toolId: string, executionTarget: EXECUTION_TARGET) {
    const runtimeId = this.authService.getIdentity()!.id;
    const workspaceId = this.authService.getIdentity()!.workspaceId;
    if (!runtimeId || (executionTarget === 'AGENT' && !workspaceId)) {
      throw new Error('Cannot subscribe to tool: missing runtimeId or workspaceId');
    }
    const subject =
      executionTarget === 'AGENT'
        ? SkillCallToolRequest.subscribeToToolOnOneRuntime(toolId, workspaceId!, runtimeId)
        : SkillCallToolRequest.subscribeToTool(toolId);

    this.logger.debug(`Subscribing to tool ${toolId} on subject: ${subject}`);
    const subscription = this.natsService.subscribe(subject);
    this.handleToolCall(subscription);
    return subscription;
  }

  // Handle Agent Call Capability Messages
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleToolCall(subscription: any) {
    const identity = this.authService.getIdentity();
    const executedByIdOrAgent = identity?.nature === 'runtime' ? identity.id! : 'AGENT';
    for await (const msg of subscription) {
      if (msg instanceof SkillCallToolRequest) {
        this.logger.info(`Tool call request: ${JSON.stringify(msg.data)}`);
        // find the capability
        let toolCalled = false;
        for (const [mcpServerId, tools] of this.mcpTools.entries()) {
          const tool = tools.find((tool) => tool.id === msg.data.toolId);
          if (!tool) {
            continue;
          }
          this.logger.debug(`Found tool ${tool.name} in MCP Server ${mcpServerId}`);
          // find the MCP Server
          const mcpServer = this.mcpServers.get(mcpServerId);
          if (!mcpServer) {
            this.logger.warn(`MCP Server ${mcpServerId} not found`);
            continue;
          }
          const toolCall = {
            name: tool.name,
            arguments: msg.data.arguments,
          };
          // call the capability
          this.logger.debug(`Calling tool ${tool.name} with arguments ${JSON.stringify(toolCall)}`);
          const result = await mcpServer.callTool(toolCall);
          this.logger.debug(`Result: ${JSON.stringify(result)}`);

          msg.respond(
            new RuntimeCallToolResponse({
              result: result as CallToolResult,
              executedByIdOrAgent: executedByIdOrAgent,
            }),
          );
          toolCalled = true;
        }
        if (!toolCalled) {
          this.logger.warn(`Tool ${msg.data.toolId} not found in any MCP Server`);
          msg.respond(
            new ErrorResponse({
              error: `Tool ${msg.data.toolId} not found in any MCP Server`,
            }),
          );
        }
      }
    }
  }

  private async stopMCPServer(mcpServer: { id: string; name: string }) {
    this.logger.info(`Stopping MCPServer: ${JSON.stringify(mcpServer, null, 2)?.slice(0, 100)}...`);
    if (!this.mcpServers.has(mcpServer.id)) {
      this.logger.debug(`MCPServer ${mcpServer.name} not running -> skipping`);
      return;
    }

    // Unsubscribe from all tool subscriptions for this MCP server
    const serverToolSubs = this.toolSubscriptions.get(mcpServer.id);
    if (serverToolSubs) {
      this.logger.debug(`Unsubscribing from ${serverToolSubs.size} tool subscriptions for MCP server ${mcpServer.name}`);
      for (const [toolId, subscription] of serverToolSubs.entries()) {
        try {
          subscription.unsubscribe();
          this.logger.debug(`Unsubscribed from tool ${toolId}`);
        } catch (error) {
          this.logger.warn(`Failed to unsubscribe from tool ${toolId}: ${error}`);
        }
      }
      this.toolSubscriptions.delete(mcpServer.id);
    }

    this.mcpTools.delete(mcpServer.id);
    const service = this.mcpServers.get(mcpServer.id);
    if (service) {
      await this.stopService(service);
    }
    this.mcpServers.delete(mcpServer.id);
    this.logger.info(`MCPServer ${mcpServer.name} stopped`);
  }

  /**
   * Ensure all tools for an MCP server are subscribed.
   * This method is idempotent - it only subscribes to tools that don't have subscriptions yet.
   */
  private ensureToolsSubscribed(mcpServerId: string, tools: dgraphResolversTypes.McpTool[], executionTarget: EXECUTION_TARGET) {

    this.mcpTools.set(
      mcpServerId,
      tools.filter((tool) => !!tool),
    );
    
    // Get or create the subscriptions map for this MCP server
    if (!this.toolSubscriptions.has(mcpServerId)) {
      this.toolSubscriptions.set(mcpServerId, new Map());
    }
    const serverToolSubs = this.toolSubscriptions.get(mcpServerId)!;

    // Subscribe to tools that don't have subscriptions yet
    for (const tool of tools) {
      if (tool && !serverToolSubs.has(tool.id)) {
        this.logger.debug(`Subscribing to tool ${tool.name} (${tool.id})`);
        const subscription = this.subscribeToTool(tool.id, executionTarget);
        serverToolSubs.set(tool.id, subscription);
      } else if (tool) {
        this.logger.debug(`Tool ${tool.name} (${tool.id}) already subscribed -> skipping`);
      }
    }
  }
}
