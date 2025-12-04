import { injectable } from 'inversify';
import pino from 'pino';
import {
  LoggerService,
  NatsService,
  Service,
  dgraphResolversTypes,
  ErrorResponse,
  SkillListToolsPublish,
  SkillCallToolRequest,
  MCP_CALL_TOOL_TIMEOUT,
  RuntimeCallToolResponse,
} from '@2ly/common';
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
        description: 'Original user message'
      }
    },
    required: ['original_prompt']
  },
  annotations: {}
};

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
  private subscriptions: { unsubscribe: () => void; drain: () => Promise<void>; isClosed?: () => boolean }[] = [];

  constructor(
    private loggerService: LoggerService,
    private natsService: NatsService,
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

    // Drain all subscriptions
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
  }

  private async subscribeToCapabilities() {
    const skillSubject = SkillListToolsPublish.subscribeToSkill(this.identity.workspaceId, this.identity.skillId);
    this.logger.info(`Subscribing to List Tools for skill: ${skillSubject}`);
    const subscription = await this.natsService.observeEphemeral(skillSubject);
    this.subscriptions.push(subscription);

    (async () => {
      for await (const message of subscription) {
        if (message instanceof SkillListToolsPublish) {
          this.skillDescription = message.data.description || null;
          this.tools.next(message.data.mcpTools);
          this.logger.debug(`Received ${message.data.mcpTools.length} mcp tools for skill ${this.identity.skillId}`);
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
          text: JSON.stringify({
            skill_instructions: this.skillDescription || ''
          })
        }]
      };
    }

    const tools = await this.waitForTools();
    const tool = tools.find((tool) => tool.name === name);
    if (!tool) {
      throw new Error(`Tool ${name} not found in skill: ${this.identity.skillName}`);
    }

    this.logger.debug(
      `Calling tool: ${name} (${tool.id}), arguments: ${JSON.stringify(args)}`,
    );

    const message = SkillCallToolRequest.create({
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
  identity: SkillIdentity,
) => SkillService;
