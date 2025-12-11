import { injectable } from 'inversify';
import pino from 'pino';
import {
  LoggerService,
  NatsService,
  NatsCacheService,
  NatsMessage,
  CACHE_BUCKETS,
  Service,
  dgraphResolversTypes,
  ErrorResponse,
  SkillListToolsPublish,
  SkillCallToolRequest,
  MCP_CALL_TOOL_TIMEOUT,
  RuntimeCallToolResponse,
  SmartSkillTool,
  type RawMessage,
  type CacheWatchSubscription,
} from '@skilder-ai/common';
import { BehaviorSubject, filter, firstValueFrom, map } from 'rxjs';

export interface SkillIdentity {
  workspaceId: string;
  skillId: string;
  skillName: string;
}

/**
 * Static init_skill tool definition that gets injected when Skills are consumed as MCP Servers.
 * This tool provides skill-specific instructions at the beginning of every conversation.
 */
const INIT_SKILL_TOOL = {
  name: 'init_skill',
  title: 'init_skill',
  description: 'call this tool at the beginning of every conversation',
  inputSchema: {
    type: 'object',
    properties: {
      original_prompt: {
        type: 'string',
        description: 'Original user message',
      },
    },
    required: ['original_prompt'],
  },
  annotations: {},
} as const;

/**
 * Implicit input schema for smart skill tools.
 * Smart skills accept a single message string.
 */
const SMART_SKILL_INPUT_SCHEMA = {
  type: 'object',
  properties: {
    message: {
      type: 'string',
      description: 'Message to send to the smart skill',
    },
  },
  required: ['message'],
} as const;

/**
 * SkillService manages the skill subscriptions and tool management.
 * This service can be instantiated per-session in remote mode or as a singleton in stdio mode.
 */
@injectable()
export class SkillService extends Service {
  name = 'skill';
  private logger: pino.Logger;
  private tools = new BehaviorSubject<dgraphResolversTypes.McpTool[] | null>(null);
  private skillDescription: string | null = null;
  private smartSkillTool: SmartSkillTool | null = null;
  private cacheSubscriptions: CacheWatchSubscription[] = [];

  constructor(
    private loggerService: LoggerService,
    private natsService: NatsService,
    private cacheService: NatsCacheService,
    private identity: SkillIdentity,
  ) {
    super();
    this.logger = this.loggerService.getLogger(`${this.name}`);
  }

  protected async initialize() {
    this.logger.info(`Starting skill service for ${this.identity.skillName}`);
    await this.subscribeToCapabilities();
  }

  protected async shutdown() {
    this.logger.info(`Stopping skill service for ${this.identity.skillName}`);

    // Unsubscribe from cache subscriptions
    for (const subscription of this.cacheSubscriptions) {
      try {
        subscription.unsubscribe();
      } catch (error) {
        this.logger.warn(`Failed to unsubscribe from cache: ${error}`);
      }
    }
    this.cacheSubscriptions = [];
  }

  private async subscribeToCapabilities() {
    const skillSubject = SkillListToolsPublish.subscribeToSkill(this.identity.workspaceId, this.identity.skillId);
    this.logger.info(`Subscribing to List Tools for skill: ${skillSubject}`);
    const subscription = await this.cacheService.watch<RawMessage<SkillListToolsPublish['data']>>(
      CACHE_BUCKETS.EPHEMERAL,
      { key: skillSubject }
    );
    this.cacheSubscriptions.push(subscription);

    (async () => {
      for await (const event of subscription) {
        if (event.operation !== 'PUT' || !event.value) {
          continue;
        }

        const message = NatsMessage.fromRawData(event.value);
        if (message instanceof SkillListToolsPublish) {
          this.skillDescription = message.data.description || null;

          // Handle smart skill tool (SMART mode)
          if (message.data.smartSkillTool) {
            this.smartSkillTool = message.data.smartSkillTool;
            this.tools.next([]);  // No regular tools in SMART mode
            this.logger.debug(`Received smart skill tool for skill ${this.identity.skillId}: ${this.smartSkillTool.name}`);
          } else {
            this.smartSkillTool = null;
            this.tools.next(message.data.mcpTools);
            this.logger.debug(`Received ${message.data.mcpTools.length} mcp tools for skill ${this.identity.skillId}`);
          }
        } else if (message instanceof ErrorResponse) {
          this.logger.error(`Error subscribing to tools: ${message.data.error}`);
        }
      }
    })();
  }

  /**
   * Get the current tools (may be null if not yet loaded)
   */
  public getTools(): dgraphResolversTypes.McpTool[] | null {
    return this.tools.getValue();
  }

  public observeTools() {
    return this.tools.asObservable().pipe(map(tools => tools?.map(tool => this.parseToolProperties(tool))));
  }

  private parseToolProperties(tool: dgraphResolversTypes.McpTool) {
    return {
      name: tool.name,
      title: tool.name,
      description: tool.description,
      inputSchema: JSON.parse(tool.inputSchema),
      annotations: JSON.parse(tool.annotations),
    };
  }

  public async waitForTools(): Promise<dgraphResolversTypes.McpTool[]> {
    return firstValueFrom(
      this.tools.pipe(
        filter((tools): tools is dgraphResolversTypes.McpTool[] => tools !== null),
      ),
    );
  }

  public async getToolsForMCP() {
    // If in SMART mode, return only init_skill and the smart skill tool
    if (this.smartSkillTool) {
      return [
        INIT_SKILL_TOOL,
        {
          name: this.smartSkillTool.name,
          title: this.smartSkillTool.name,
          description: this.smartSkillTool.description,
          inputSchema: SMART_SKILL_INPUT_SCHEMA,
          annotations: {},
        },
      ];
    }

    const tools = await this.waitForTools();
    const parsedTools = tools.map((tool) => this.parseToolProperties(tool));

    // Prepend init_skill as first tool
    return [INIT_SKILL_TOOL, ...parsedTools];
  }

  public async callTool(name: string, args: Record<string, unknown>) {
    // Handle static init_skill tool
    if (name === 'init_skill') {
      this.logger.debug(`Handling init_skill call for skill ${this.identity.skillId}`);
      return {
        content: [{
          type: 'text',
          text: this.skillDescription || ''
        }]
      };
    }

    // Check if this is a smart skill tool call
    if (this.smartSkillTool && name === this.smartSkillTool.name) {
      this.logger.debug(`Calling smart skill: ${name} (${this.smartSkillTool.id}), arguments: ${JSON.stringify(args)}`);

      console.log('creating smart skill call request for skill: ', this.smartSkillTool.id, 'on runtime: ', this.identity.skillId);

      const message = SkillCallToolRequest.create({
        type: 'smart-skill',
        workspaceId: this.identity.workspaceId,
        from: this.identity.skillId,
        skillId: this.smartSkillTool.id,
        arguments: args,
      }) as SkillCallToolRequest;

      this.logger.debug(`Sending smart skill call request to subject: ${message.getSubject()}`);

      const response = await this.natsService.request(message, { timeout: MCP_CALL_TOOL_TIMEOUT, retryOnTimeout: true });

      if (response instanceof ErrorResponse) {
        throw new Error(`Smart skill call (${name}) failed: ${response.data.error}`);
      } else if (response instanceof RuntimeCallToolResponse) {
        return response.data.result;
      } else {
        throw new Error(`Invalid response: ${JSON.stringify(response)}`);
      }
    }

    // Regular MCP tool call
    const tools = await this.waitForTools();
    const tool = tools.find((tool) => tool.name === name);
    if (!tool) {
      throw new Error(`Tool ${name} not found in skill: ${this.identity.skillName}`);
    }

    this.logger.debug(
      `Calling tool: ${name} (${tool.id}), arguments: ${JSON.stringify(args)}`,
    );

    const message = SkillCallToolRequest.create({
      type: 'mcp-tool',
      workspaceId: this.identity.workspaceId,
      from: this.identity.skillId,
      toolId: tool.id,
      arguments: args,
    }) as SkillCallToolRequest;

    this.logger.debug(`Sending tool call request to subject: ${message.getSubject()}`);

    // retry on timeout to give another chance to succeed if the tool is not available yet.
    // TODO: improve this by using a Jetstream queue.
    const response = await this.natsService.request(message, { timeout: MCP_CALL_TOOL_TIMEOUT, retryOnTimeout: true });

    if (response instanceof ErrorResponse) {
      throw new Error(`Tool call (${name}) failed: ${response.data.error}`);
    } else if (response instanceof RuntimeCallToolResponse) {
      return response.data.result;
    } else {
      throw new Error(`Invalid response: ${JSON.stringify(response)}`);
    }
  }

  /**
   * Get the identity associated with this skill
   */
  public getIdentity(): SkillIdentity {
    return this.identity;
  }
}

/**
 * Factory type for creating SkillService instances
 */
export type SkillServiceFactory = (
  loggerService: LoggerService,
  natsService: NatsService,
  cacheService: NatsCacheService,
  identity: SkillIdentity,
) => SkillService;
