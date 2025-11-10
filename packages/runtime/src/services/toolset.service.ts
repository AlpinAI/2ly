import { injectable } from 'inversify';
import pino from 'pino';
import {
  LoggerService,
  NatsService,
  Service,
  dgraphResolversTypes,
  ErrorResponse,
  ToolsetListToolsPublish,
  ToolSetCallToolRequest,
  MCP_CALL_TOOL_TIMEOUT,
  RuntimeCallToolResponse,
} from '@2ly/common';
import { BehaviorSubject, filter, firstValueFrom, map } from 'rxjs';

export interface ToolsetIdentity {
  workspaceId: string;
  toolsetId: string;
  toolsetName: string;
}

/**
 * ToolsetService manages the toolset subscriptions and tool management.
 * This service can be instantiated per-session in remote mode or as a singleton in stdio mode.
 */
@injectable()
export class ToolsetService extends Service {
  name = 'toolset';
  private logger: pino.Logger;
  private tools = new BehaviorSubject<dgraphResolversTypes.McpTool[] | null>(null);
  private subscriptions: { unsubscribe: () => void; drain: () => Promise<void>; isClosed?: () => boolean }[] = [];

  constructor(
    private loggerService: LoggerService,
    private natsService: NatsService,
    private identity: ToolsetIdentity,
  ) {
    super();
    this.logger = this.loggerService.getLogger(`${this.name}`);
  }

  protected async initialize() {
    this.logger.info(`Starting toolset service for ${this.identity.toolsetName}`);
    await this.subscribeToCapabilities();
  }

  protected async shutdown() {
    this.logger.info(`Stopping toolset service for ${this.identity.toolsetName}`);

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
    this.logger.info(`Subscribing to List Tools for toolset: ${this.identity.workspaceId} - ${this.identity.toolsetId}`);
    const subscription = await this.natsService.observeEphemeral(
      ToolsetListToolsPublish.subscribeToToolSet(this.identity.workspaceId, this.identity.toolsetId),
    );
    this.subscriptions.push(subscription);

    (async () => {
      for await (const message of subscription) {
        if (message instanceof ToolsetListToolsPublish) {
          this.tools.next(message.data.mcpTools);
          this.logger.debug(`Received ${message.data.mcpTools.length} mcp tools for toolset ${this.identity.toolsetId}`);
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

  /**
   * Wait for tools to be available and return them
   */
  public async waitForTools(): Promise<dgraphResolversTypes.McpTool[]> {
    if (!this.tools.getValue()) {
      return await firstValueFrom(
        this.tools.pipe(filter((tools): tools is dgraphResolversTypes.McpTool[] => tools !== null)),
      );
    }
    return this.tools.getValue()!;
  }

  public async getToolsForMCP() {
    const tools = await this.waitForTools();
    return tools.map((tool) => this.parseToolProperties(tool));
  }

  public async callTool(name: string, args: Record<string, unknown>) {
    const tools = await this.waitForTools();
    const tool = tools.find((tool) => tool.name === name);
    if (!tool) {
      throw new Error(`Tool ${name} not found in toolset: ${this.identity.toolsetName}`);
    }

    this.logger.debug(
      `Calling tool: ${name} (${tool.id}), arguments: ${JSON.stringify(args)}`,
    );

    const message = ToolSetCallToolRequest.create({
      from: this.identity.toolsetId,
      toolId: tool.id,
      arguments: args,
    }) as ToolSetCallToolRequest;

    const response = await this.natsService.request(message, { timeout: MCP_CALL_TOOL_TIMEOUT });

    if (response instanceof ErrorResponse) {
      throw new Error(`Tool call (${name}) failed: ${response.data.error}`);
    } else if (response instanceof RuntimeCallToolResponse) {
      return response.data.result;
    } else {
      throw new Error(`Invalid response: ${JSON.stringify(response)}`);
    }
  }

  /**
   * Get the identity associated with this toolset
   */
  public getIdentity(): ToolsetIdentity {
    return this.identity;
  }
}

/**
 * Factory type for creating ToolsetService instances
 */
export type ToolsetServiceFactory = (
  loggerService: LoggerService,
  natsService: NatsService,
  identity: ToolsetIdentity,
) => ToolsetService;
