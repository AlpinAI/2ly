import { injectable } from 'inversify';
import pino from 'pino';
import {
  Service,
  AIProviderService,
  AIProviderError,
  InvalidAPIKeyError,
  RateLimitError,
  TokenLimitError,
  ModelNotFoundError,
  type RuntimeSmartSkill,
} from '@2ly/common';

@injectable()
export class ToolSmartSkillService extends Service {
  name = 'tool-smart-skill';

  constructor(
    private logger: pino.Logger,
    private config: RuntimeSmartSkill,
    private aiProviderService: AIProviderService,
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
      const { provider, modelName } = this.aiProviderService.parseModelString(this.config.model);

      // Call the AI provider with the smart skill's configuration
      const response = await this.aiProviderService.chat(
        this.config.providerConfig,
        provider,
        modelName,
        fullMessage,
      );

      this.logger.info(`Smart skill ${this.config.name} chat completed successfully`);
      return response;
    } catch (error) {
      // Log structured error information with skill context
      if (error instanceof InvalidAPIKeyError) {
        this.logger.error({
          error: 'InvalidAPIKey',
          skill: this.config.name,
          model: this.config.model,
          provider: error.provider,
          message: error.message,
        });
        throw new Error(`Smart skill '${this.config.name}' failed: Invalid API key for ${error.provider}`);
      }

      if (error instanceof RateLimitError) {
        this.logger.error({
          error: 'RateLimit',
          skill: this.config.name,
          model: this.config.model,
          provider: error.provider,
          retryAfter: error.retryAfter,
          message: error.message,
        });
        throw new Error(`Smart skill '${this.config.name}' failed: Rate limit exceeded for ${error.provider}`);
      }

      if (error instanceof TokenLimitError) {
        this.logger.error({
          error: 'TokenLimit',
          skill: this.config.name,
          model: this.config.model,
          provider: error.provider,
          maxTokens: error.maxTokens,
          message: error.message,
        });
        throw new Error(`Smart skill '${this.config.name}' failed: Token limit exceeded for ${error.provider}`);
      }

      if (error instanceof ModelNotFoundError) {
        this.logger.error({
          error: 'ModelNotFound',
          skill: this.config.name,
          model: this.config.model,
          provider: error.provider,
          modelName: error.modelName,
          message: error.message,
        });
        throw new Error(`Smart skill '${this.config.name}' failed: Model '${error.modelName}' not found`);
      }

      if (error instanceof AIProviderError) {
        this.logger.error({
          error: 'AIProvider',
          skill: this.config.name,
          model: this.config.model,
          provider: error.provider,
          message: error.message,
        });
        throw new Error(`Smart skill '${this.config.name}' failed: ${error.message}`);
      }

      // Generic error handling
      this.logger.error({
        error: 'Unknown',
        skill: this.config.name,
        model: this.config.model,
        message: error instanceof Error ? error.message : String(error),
      });
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
