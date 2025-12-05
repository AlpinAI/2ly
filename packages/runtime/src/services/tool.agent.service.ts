import { injectable } from 'inversify';
import pino from 'pino';
import { Service, AIProviderCoreService, type RuntimeAgent } from '@2ly/common';

@injectable()
export class ToolAgentService extends Service {
  name = 'tool-agent';

  constructor(
    private logger: pino.Logger,
    private config: RuntimeAgent,
    private aiProviderCoreService: AIProviderCoreService,
  ) {
    super();
    this.logger.info(`Initializing agent service for ${this.config.name}`);
  }

  protected async initialize() {
    this.logger.info(`Starting agent: ${this.config.name}`);
    // Agent is ready to accept chat requests
  }

  protected async shutdown() {
    this.logger.info(`Stopping agent: ${this.config.name}`);
  }

  /**
   * Execute the agent with user messages.
   * Combines the agent's system prompt with user messages and calls the AI provider.
   */
  async chat(userMessages: string[]): Promise<string> {
    this.logger.info(`Agent ${this.config.name} chat called with ${userMessages.length} messages`);

    // Construct the complete message by combining system prompt with user messages
    const systemMessage = this.config.systemPrompt;
    const userMessageText = userMessages.join('\n\n');
    const fullMessage = `${systemMessage}\n\n${userMessageText}`;

    try {
      // Parse model string (format: "provider/model-name")
      const { provider, modelName } = this.aiProviderCoreService.parseModelString(this.config.model);

      // Call the AI provider with the agent's configuration
      const response = await this.aiProviderCoreService.chat(
        this.config.providerConfig,
        provider,
        modelName,
        fullMessage,
      );

      this.logger.info(`Agent ${this.config.name} chat completed successfully`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to call agent ${this.config.name}: ${error}`);
      throw error;
    }
  }

  getName(): string {
    return this.config.name;
  }

  getId(): string {
    return this.config.id;
  }

  /**
   * Generate a signature for detecting config changes.
   * Used to determine if the agent needs to be restarted.
   */
  getConfigSignature(): string {
    return `${this.config.model}-${this.config.temperature}-${this.config.maxTokens}-${this.config.systemPrompt.substring(0, 100)}`;
  }
}

export type ToolAgentServiceFactory = (config: RuntimeAgent) => ToolAgentService;
