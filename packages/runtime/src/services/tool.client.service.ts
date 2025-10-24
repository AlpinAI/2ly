import { inject, injectable } from 'inversify';
import pino from 'pino';
import {
  LoggerService,
  NatsService,
  Service,
  dgraphResolversTypes,
  UpdateMcpToolsMessage,
  AgentCallMCPToolMessage,
  AgentCallResponseMessage,
  UpdateConfiguredMCPServerMessage,
  MCP_SERVER_RUN_ON,
} from '@2ly/common';
import { IdentityService } from './identity.service';
import { HealthService } from './runtime.health.service';
import { ToolServerService, type ToolServerServiceFactory } from './tool.server.service';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { AgentServerService } from './agent.server.service';
import { Subscription } from 'rxjs';

@injectable()
export class ToolClientService extends Service {
  name = 'tool-client';
  private logger: pino.Logger;
  private natsSubscriptions: { unsubscribe: () => void; drain: () => Promise<void>; isClosed?: () => boolean }[] = [];
  private mcpServers: Map<string, ToolServerService> = new Map();
  private mcpTools: Map<string, dgraphResolversTypes.McpTool[]> = new Map();
  private roots: { name: string; uri: string }[] = [];
  private rxSubscriptions: Subscription[] = [];

  constructor(
    @inject(LoggerService) private loggerService: LoggerService,
    @inject(NatsService) private natsService: NatsService,
    @inject(IdentityService) private identityService: IdentityService,
    @inject(HealthService) private healthService: HealthService,
    @inject(ToolServerService) private toolServerServiceFactory: ToolServerServiceFactory,
    @inject(AgentServerService) private agentServerService: AgentServerService,
  ) {
    super();
    this.logger = this.loggerService.getLogger(this.name);
  }

  protected async initialize() {
    this.logger.info('Starting');
    await this.identityService.waitForStarted();
    await this.natsService.waitForStarted();
    await this.healthService.waitForStarted();
    this.startObserveMCPServers();
    this.rxSubscriptions.push(
      this.agentServerService.observeClientRoots().subscribe(async (value) => {
        this.logger.debug(`Agent server client roots changed: ${JSON.stringify(value)}`);
        const roots = this.getRoots();
        for (const mcpServer of this.mcpServers.values()) {
          this.logger.debug(`Updating ${mcpServer.getName()} roots: ${JSON.stringify(roots)}`);
          mcpServer.updateRoots(roots);
        }
      }),
    );
  }

  private getRoots() {
    return this.agentServerService.getClientRoots().length ? this.agentServerService.getClientRoots() : this.roots;
  }

  protected async shutdown() {
    this.logger.info('Stopping');
    await this.stopObserveMCPServers();
    this.rxSubscriptions.forEach((subscription) => subscription.unsubscribe());
    this.rxSubscriptions = [];
  }

  private async startObserveMCPServers() {
    const identity = this.identityService.getIdentity();
    if (!identity?.RID) {
      throw new Error('Cannot observe configured MCPServers for tool runtime: RID not found');
    }
    this.logger.debug(`Observing configured MCPServers for tool runtime ${identity.RID}`);
    const subject = UpdateConfiguredMCPServerMessage.subscribeToRID(identity.RID);
    const subscription = await this.natsService.observeEphemeral(subject);
    this.natsSubscriptions.push(subscription);
    for await (const msg of subscription) {
      if (msg instanceof UpdateConfiguredMCPServerMessage) {
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
    const identity = this.identityService.getIdentity();
    this.logger.debug(`Stopping to observe configured MCPServers for tool runtime ${identity?.RID ?? 'unknown RID'}`);
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
        this.logger.debug(`MCPServer ${mcpServer.name} already running -> skipping`);
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
      const message = UpdateMcpToolsMessage.create({ mcpServerId: mcpServer.id, tools }) as UpdateMcpToolsMessage;

      // TODO: Publish with jetstream in a way that activate a retry in case the backend did not pick up the message
      // target to the backend, doesn't need to be linked to a specific runtime instance
      this.natsService.publish(message);
    });

    const tools = mcpServer.tools ?? [];
    this.mcpTools.set(
      mcpServer.id,
      tools.filter((tool) => !!tool),
    );

    for (const tool of tools) {
      if (tool) {
        this.logger.info(`Subscribing to tool ${tool.name} (${tool.id})`);
        this.subscribeToTool(tool.id, mcpServer.runOn!);
      }
    }

    // When the MCP Server is stopped, we need to unsubscribe from the capabilities and clear the subscriptions
    mcpServerService.onShutdown(async () => {});
    this.logger.info(`MCPServer ${mcpServer.name} spawned`);
  }

  // Subscribe to a capability and return the subscription
  private subscribeToTool(toolId: string, runOn: MCP_SERVER_RUN_ON) {
    const runtimeId = this.identityService.getId();
    if (!runtimeId) {
      throw new Error('Cannot subscribe to tool without runtimeId');
    }
    const subject =
      runOn === 'AGENT'
        ? AgentCallMCPToolMessage.subscribeToOneRuntime(toolId, runtimeId)
        : AgentCallMCPToolMessage.subscribeToAll(toolId);
    const subscription = this.natsService.subscribe(subject);
    this.handleAgentCallCapabilityMessages(subscription);
    return subscription;
  }

  // Handle Agent Call Capability Messages
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleAgentCallCapabilityMessages(subscription: any) {
    for await (const msg of subscription) {
      if (msg instanceof AgentCallMCPToolMessage) {
        this.logger.info(`Received agent-call-capability: ${JSON.stringify(msg.data)}`);
        // find the capability
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
          const result = await mcpServer.callCapability(toolCall);
          this.logger.debug(`Result: ${JSON.stringify(result)}`);
          msg.respond(
            new AgentCallResponseMessage({
              result: result as CallToolResult,
              executedById: this.identityService.getId()!,
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
    this.mcpTools.delete(mcpServer.id);
    const service = this.mcpServers.get(mcpServer.id);
    if (service) {
      await this.stopService(service);
    }
    this.mcpServers.delete(mcpServer.id);
    this.logger.info(`MCPServer ${mcpServer.name} stopped`);
  }
}
