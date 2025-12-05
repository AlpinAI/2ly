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
  RuntimeAgentsPublish,
  RuntimeSmartSkillsPublish,
  EXECUTION_TARGET,
  ErrorResponse,
  type RuntimeAgent,
  type RuntimeSmartSkill,
} from '@2ly/common';
import { AuthService } from './auth.service';
import { HealthService } from './runtime.health.service';
import { ToolServerService, type ToolServerServiceFactory } from './tool.mcp.server.service';
import { ToolAgentService, type ToolAgentServiceFactory } from './tool.agent.service';
import { ToolSmartSkillService, type ToolSmartSkillServiceFactory } from './tool.smart-skill.service';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { McpStdioService } from './mcp.stdio.service';
import { Subscription } from 'rxjs';
import { optional } from 'inversify';

@injectable()
export class ToolService extends Service {
  name = 'tool';
  private logger: pino.Logger;
  private natsSubscriptions: { unsubscribe: () => void; drain: () => Promise<void>; isClosed?: () => boolean }[] = [];
  private mcpServers: Map<string, ToolServerService> = new Map();
  private mcpTools: Map<string, dgraphResolversTypes.McpTool[]> = new Map();
  private toolSubscriptions: Map<string, Map<string, { unsubscribe: () => void }>> = new Map();
  private roots: { name: string; uri: string }[] = [];
  private rxSubscriptions: Subscription[] = [];

  // Agent management
  private agents: Map<string, ToolAgentService> = new Map();
  private agentSubscriptions: Map<string, { unsubscribe: () => void }> = new Map();

  // Smart Skill management
  private smartSkills: Map<string, ToolSmartSkillService> = new Map();
  private smartSkillSubscriptions: Map<string, { unsubscribe: () => void }> = new Map();

  constructor(
    @inject(LoggerService) private loggerService: LoggerService,
    @inject(NatsService) private natsService: NatsService,
    @inject(AuthService) private authService: AuthService,
    @inject(HealthService) private healthService: HealthService,
    @inject(ToolServerService) private toolServerServiceFactory: ToolServerServiceFactory,
    @inject(ToolAgentService) private toolAgentServiceFactory: ToolAgentServiceFactory,
    @inject(ToolSmartSkillService) private toolSmartSkillServiceFactory: ToolSmartSkillServiceFactory,
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
    this.startObserveAgents();
    this.startObserveSmartSkills();

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
    await this.stopObserveAgents();
    await this.stopObserveSmartSkills();
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

  // =====================
  // Agent Management
  // =====================

  private async startObserveAgents() {
    const identity = this.authService.getIdentity();
    if (!identity?.id) {
      throw new Error('Cannot observe agents for runtime: id not found');
    }
    const subject = RuntimeAgentsPublish.subscribeToRuntime(identity.workspaceId, identity.id);
    this.logger.debug(`Observing agents for runtime: ${subject}`);
    const subscription = await this.natsService.observeEphemeral(subject);
    this.natsSubscriptions.push(subscription);
    for await (const msg of subscription) {
      if (msg instanceof RuntimeAgentsPublish) {
        this.logger.debug(
          `Received agents update: ${msg.data.agents.map((agent) => agent.name).join(', ')}`,
        );
        const agentIds = msg.data.agents.map((agent) => agent.id);
        const agentsToStop = Array.from(this.agents.keys()).filter(
          (agentId) => !agentIds.includes(agentId),
        );

        // Stop agents that are not in the message
        for (const agentId of agentsToStop) {
          const service = this.agents.get(agentId)!;
          await this.stopAgent({ id: agentId, name: service.getName() });
        }

        // Start or restart agents that are in the message
        for (const agent of msg.data.agents) {
          await this.spawnAgent(agent).catch(async (error) => {
            this.logger.error(`Failed to spawn agent ${agent.name}: ${error}`);
            const service = this.agents.get(agent.id);
            if (service) {
              await this.stopService(service);
            }
            this.agents.delete(agent.id);
          });
        }
      }
    }
  }

  private async stopObserveAgents() {
    this.logger.debug('Stopping agent observation');

    // Unsubscribe from all agent tool subscriptions
    for (const [agentId, subscription] of this.agentSubscriptions.entries()) {
      try {
        subscription.unsubscribe();
        this.logger.debug(`Unsubscribed from agent ${agentId}`);
      } catch (error) {
        this.logger.warn(`Failed to unsubscribe from agent ${agentId}: ${error}`);
      }
    }
    this.agentSubscriptions.clear();

    // Stop all agents
    for (const agent of this.agents.values()) {
      await this.stopService(agent);
    }
    this.agents.clear();
  }

  private async spawnAgent(agent: RuntimeAgent) {
    const agentService = this.toolAgentServiceFactory(agent);
    if (this.agents.has(agent.id)) {
      const existingAgent = this.agents.get(agent.id)!;
      if (existingAgent.getConfigSignature() === agentService.getConfigSignature()) {
        this.logger.debug(`Agent ${agent.name} already running -> skipping spawn`);
        return;
      }
    }
    this.logger.info(`Spawning Agent: ${agent.name}`);

    if (this.agents.has(agent.id)) {
      this.logger.debug(`Agent ${agent.name} already running -> shutting down`);
      await this.stopAgent({ id: agent.id, name: agent.name });
    }

    await this.startService(agentService);
    this.agents.set(agent.id, agentService);

    // Subscribe to tool calls for this agent
    if (!this.agentSubscriptions.has(agent.id)) {
      this.logger.debug(`Subscribing to tool calls for agent ${agent.name} (${agent.id})`);
      const subscription = this.subscribeToAgentTool(agent.id, agent.workspaceId);
      this.agentSubscriptions.set(agent.id, subscription);
    }

    this.logger.info(`Agent ${agent.name} spawned`);
  }

  private async stopAgent(agent: { id: string; name: string }) {
    this.logger.info(`Stopping Agent: ${agent.name}`);
    if (!this.agents.has(agent.id)) {
      this.logger.debug(`Agent ${agent.name} not running -> skipping`);
      return;
    }

    // Unsubscribe from tool calls
    const subscription = this.agentSubscriptions.get(agent.id);
    if (subscription) {
      try {
        subscription.unsubscribe();
        this.logger.debug(`Unsubscribed from agent ${agent.id}`);
      } catch (error) {
        this.logger.warn(`Failed to unsubscribe from agent ${agent.id}: ${error}`);
      }
      this.agentSubscriptions.delete(agent.id);
    }

    const service = this.agents.get(agent.id);
    if (service) {
      await this.stopService(service);
    }
    this.agents.delete(agent.id);
    this.logger.info(`Agent ${agent.name} stopped`);
  }

  private subscribeToAgentTool(agentId: string, workspaceId: string) {
    const runtimeId = this.authService.getIdentity()!.id;
    if (!runtimeId) {
      throw new Error('Cannot subscribe to agent tool: missing runtimeId');
    }
    // Agents run on EDGE, use workspaceId from agent config (not from identity)
    const subject = SkillCallToolRequest.subscribeToToolOnOneRuntime(agentId, workspaceId, runtimeId);

    this.logger.debug(`Subscribing to agent tool ${agentId} on subject: ${subject}`);
    const subscription = this.natsService.subscribe(subject);
    this.handleAgentToolCall(subscription, agentId);
    return subscription;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleAgentToolCall(subscription: any, agentId: string) {
    const identity = this.authService.getIdentity();
    const executedByIdOrAgent = identity?.nature === 'runtime' ? identity.id! : 'AGENT';

    for await (const msg of subscription) {
      if (msg instanceof SkillCallToolRequest) {
        this.logger.info(`Agent tool call request for ${agentId}: ${JSON.stringify(msg.data)}`);

        const agent = this.agents.get(agentId);
        if (!agent) {
          this.logger.warn(`Agent ${agentId} not found`);
          msg.respond(
            new ErrorResponse({
              error: `Agent ${agentId} not found`,
            }),
          );
          continue;
        }

        try {
          // Extract user messages from arguments
          // The arguments should contain a 'messages' array or a 'message' string
          const args = msg.data.arguments;
          let userMessages: string[];
          if (Array.isArray(args.messages)) {
            userMessages = args.messages as string[];
          } else if (typeof args.message === 'string') {
            userMessages = [args.message];
          } else if (typeof args.input === 'string') {
            userMessages = [args.input];
          } else {
            // Fallback: stringify the entire arguments
            userMessages = [JSON.stringify(args)];
          }

          const result = await agent.chat(userMessages);
          this.logger.debug(`Agent ${agentId} result: ${result.substring(0, 100)}...`);

          msg.respond(
            new RuntimeCallToolResponse({
              result: {
                content: [{ type: 'text', text: result }],
                isError: false,
              } as CallToolResult,
              executedByIdOrAgent: executedByIdOrAgent,
            }),
          );
        } catch (error) {
          this.logger.error(`Failed to call agent ${agentId}: ${error}`);
          msg.respond(
            new RuntimeCallToolResponse({
              result: {
                content: [{ type: 'text', text: `Error: ${error}` }],
                isError: true,
              } as CallToolResult,
              executedByIdOrAgent: executedByIdOrAgent,
            }),
          );
        }
      }
    }
  }

  // =====================
  // Smart Skill Management
  // =====================

  private async startObserveSmartSkills() {
    const identity = this.authService.getIdentity();
    if (!identity?.id) {
      throw new Error('Cannot observe smart skills for runtime: id not found');
    }
    const subject = RuntimeSmartSkillsPublish.subscribeToRuntime(identity.workspaceId, identity.id);
    this.logger.debug(`Observing smart skills for runtime: ${subject}`);
    const subscription = await this.natsService.observeEphemeral(subject);
    this.natsSubscriptions.push(subscription);
    for await (const msg of subscription) {
      if (msg instanceof RuntimeSmartSkillsPublish) {
        this.logger.debug(
          `Received smart skills update: ${msg.data.smartSkills.map((skill) => skill.name).join(', ')}`,
        );
        const skillIds = msg.data.smartSkills.map((skill) => skill.id);
        const skillsToStop = Array.from(this.smartSkills.keys()).filter(
          (skillId) => !skillIds.includes(skillId),
        );

        // Stop smart skills that are not in the message
        for (const skillId of skillsToStop) {
          const service = this.smartSkills.get(skillId)!;
          await this.stopSmartSkill({ id: skillId, name: service.getName() });
        }

        // Start or restart smart skills that are in the message
        for (const skill of msg.data.smartSkills) {
          await this.spawnSmartSkill(skill).catch(async (error) => {
            this.logger.error(`Failed to spawn smart skill ${skill.name}: ${error}`);
            const service = this.smartSkills.get(skill.id);
            if (service) {
              await this.stopService(service);
            }
            this.smartSkills.delete(skill.id);
          });
        }
      }
    }
  }

  private async stopObserveSmartSkills() {
    this.logger.debug('Stopping smart skill observation');

    // Unsubscribe from all smart skill tool subscriptions
    for (const [skillId, subscription] of this.smartSkillSubscriptions.entries()) {
      try {
        subscription.unsubscribe();
        this.logger.debug(`Unsubscribed from smart skill ${skillId}`);
      } catch (error) {
        this.logger.warn(`Failed to unsubscribe from smart skill ${skillId}: ${error}`);
      }
    }
    this.smartSkillSubscriptions.clear();

    // Stop all smart skills
    for (const skill of this.smartSkills.values()) {
      await this.stopService(skill);
    }
    this.smartSkills.clear();
  }

  private async spawnSmartSkill(skill: RuntimeSmartSkill) {
    const skillService = this.toolSmartSkillServiceFactory(skill);
    if (this.smartSkills.has(skill.id)) {
      const existingSkill = this.smartSkills.get(skill.id)!;
      if (existingSkill.getConfigSignature() === skillService.getConfigSignature()) {
        this.logger.debug(`Smart skill ${skill.name} already running -> skipping spawn`);
        return;
      }
    }
    this.logger.info(`Spawning Smart Skill: ${skill.name}`);

    if (this.smartSkills.has(skill.id)) {
      this.logger.debug(`Smart skill ${skill.name} already running -> shutting down`);
      await this.stopSmartSkill({ id: skill.id, name: skill.name });
    }

    await this.startService(skillService);
    this.smartSkills.set(skill.id, skillService);

    // Subscribe to tool calls for this smart skill
    if (!this.smartSkillSubscriptions.has(skill.id)) {
      this.logger.debug(`Subscribing to tool calls for smart skill ${skill.name} (${skill.id})`);
      const subscription = this.subscribeToSmartSkillTool(skill.id, skill.workspaceId);
      this.smartSkillSubscriptions.set(skill.id, subscription);
    }

    this.logger.info(`Smart Skill ${skill.name} spawned`);
  }

  private async stopSmartSkill(skill: { id: string; name: string }) {
    this.logger.info(`Stopping Smart Skill: ${skill.name}`);
    if (!this.smartSkills.has(skill.id)) {
      this.logger.debug(`Smart skill ${skill.name} not running -> skipping`);
      return;
    }

    // Unsubscribe from tool calls
    const subscription = this.smartSkillSubscriptions.get(skill.id);
    if (subscription) {
      try {
        subscription.unsubscribe();
        this.logger.debug(`Unsubscribed from smart skill ${skill.id}`);
      } catch (error) {
        this.logger.warn(`Failed to unsubscribe from smart skill ${skill.id}: ${error}`);
      }
      this.smartSkillSubscriptions.delete(skill.id);
    }

    const service = this.smartSkills.get(skill.id);
    if (service) {
      await this.stopService(service);
    }
    this.smartSkills.delete(skill.id);
    this.logger.info(`Smart Skill ${skill.name} stopped`);
  }

  private subscribeToSmartSkillTool(skillId: string, workspaceId: string) {
    const runtimeId = this.authService.getIdentity()!.id;
    if (!runtimeId) {
      throw new Error('Cannot subscribe to smart skill tool: missing runtimeId');
    }
    // Smart skills run on EDGE, use workspaceId from skill config
    const subject = SkillCallToolRequest.subscribeToToolOnOneRuntime(skillId, workspaceId, runtimeId);

    this.logger.debug(`Subscribing to smart skill tool ${skillId} on subject: ${subject}`);
    const subscription = this.natsService.subscribe(subject);
    this.handleSmartSkillToolCall(subscription, skillId);
    return subscription;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleSmartSkillToolCall(subscription: any, skillId: string) {
    const identity = this.authService.getIdentity();
    const executedByIdOrAgent = identity?.nature === 'runtime' ? identity.id! : 'AGENT';

    for await (const msg of subscription) {
      if (msg instanceof SkillCallToolRequest) {
        this.logger.info(`Smart skill tool call request for ${skillId}: ${JSON.stringify(msg.data)}`);

        const skill = this.smartSkills.get(skillId);
        if (!skill) {
          this.logger.warn(`Smart skill ${skillId} not found`);
          msg.respond(
            new ErrorResponse({
              error: `Smart skill ${skillId} not found`,
            }),
          );
          continue;
        }

        try {
          // Extract user messages from arguments
          const args = msg.data.arguments;
          let userMessages: string[];
          if (Array.isArray(args.messages)) {
            userMessages = args.messages as string[];
          } else if (typeof args.message === 'string') {
            userMessages = [args.message];
          } else if (typeof args.input === 'string') {
            userMessages = [args.input];
          } else {
            // Fallback: stringify the entire arguments
            userMessages = [JSON.stringify(args)];
          }

          const result = await skill.chat(userMessages);
          this.logger.debug(`Smart skill ${skillId} result: ${result.substring(0, 100)}...`);

          msg.respond(
            new RuntimeCallToolResponse({
              result: {
                content: [{ type: 'text', text: result }],
                isError: false,
              } as CallToolResult,
              executedByIdOrAgent: executedByIdOrAgent,
            }),
          );
        } catch (error) {
          this.logger.error(`Failed to call smart skill ${skillId}: ${error}`);
          msg.respond(
            new RuntimeCallToolResponse({
              result: {
                content: [{ type: 'text', text: `Error: ${error}` }],
                isError: true,
              } as CallToolResult,
              executedByIdOrAgent: executedByIdOrAgent,
            }),
          );
        }
      }
    }
  }
}
