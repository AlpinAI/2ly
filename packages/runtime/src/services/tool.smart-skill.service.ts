import { injectable } from 'inversify';
import pino from 'pino';
import { Service, AIProviderCoreService, type RuntimeSmartSkill } from '@2ly/common';

@injectable()
export class ToolSmartSkillService extends Service {
  name = 'tool-smart-skill';

  constructor(
    private logger: pino.Logger,
    private config: RuntimeSmartSkill,
    private aiProviderCoreService: AIProviderCoreService,
  ) {
    super();
    this.logger.info(`Initializing smart skill service for ${this.config.name}`);
  }

  protected async initialize() {
    this.logger.info(`Starting smart skill: ${this.config.name}`);
    // Smart skill is ready to accept chat requests
  }

  protected async shutdown() {
    this.logger.info(`Stopping smart skill: ${this.config.name}`);
  }

  /**
   * Execute the smart skill with user messages.
   * Combines the skill's system prompt with user messages and calls the AI provider.
   */
  async chat(userMessages: string[]): Promise<string> {
    this.logger.info(`Smart skill ${this.config.name} chat called with ${userMessages.length} messages`);

    // Construct the complete message by combining system prompt with user messages
    const systemMessage = this.config.systemPrompt;
    const userMessageText = userMessages.join('\n\n');
    const fullMessage = `${systemMessage}\n\n${userMessageText}`;

    try {
      // Parse model string (format: "provider/model-name")
      const { provider, modelName } = this.aiProviderCoreService.parseModelString(this.config.model);

      // Call the AI provider with the smart skill's configuration
      const response = await this.aiProviderCoreService.chat(
        this.config.providerConfig,
        provider,
        modelName,
        fullMessage,
      );

      this.logger.info(`Smart skill ${this.config.name} chat completed successfully`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to call smart skill ${this.config.name}: ${error}`);
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
   * Used to determine if the smart skill needs to be restarted.
   */
  getConfigSignature(): string {
    return `${this.config.model}-${this.config.temperature}-${this.config.maxTokens}-${this.config.systemPrompt.substring(0, 100)}`;
  }
}

export type ToolSmartSkillServiceFactory = (config: RuntimeSmartSkill) => ToolSmartSkillService;
