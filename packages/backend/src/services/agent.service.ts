import { inject, injectable } from 'inversify';
import { LoggerService, AIProviderCoreService } from '@2ly/common';
import pino from 'pino';
import { AgentRepository } from '../repositories/agent.repository';
import { AIProviderRepository } from '../repositories/ai-provider.repository';

@injectable()
export class AgentService {
  private logger: pino.Logger;

  constructor(
    @inject(LoggerService) private loggerService: LoggerService,
    @inject(AgentRepository) private agentRepository: AgentRepository,
    @inject(AIProviderRepository) private aiProviderRepository: AIProviderRepository,
    @inject(AIProviderCoreService) private aiProviderCoreService: AIProviderCoreService,
  ) {
    this.logger = this.loggerService.getLogger('agent-service');
  }

  /**
   * Execute an agent with user messages.
   * Constructs messages from the agent's system prompt and user messages,
   * then calls the AI provider to generate a response.
   *
   * Skills integration is deferred to future iteration.
   */
  async call(agentId: string, userMessages: string[]): Promise<string> {
    this.logger.info(`Calling agent ${agentId} with ${userMessages.length} user messages`);

    // Fetch the agent
    const agent = await this.agentRepository.findById(agentId);
    if (!agent) {
      this.logger.error(`Agent ${agentId} not found`);
      throw new Error(`Agent with ID ${agentId} not found`);
    }

    if (!agent.workspace?.id) {
      this.logger.error(`Agent ${agentId} has no workspace`);
      throw new Error(`Agent ${agentId} has no associated workspace`);
    }

    this.logger.debug(`Agent ${agentId} found: ${agent.name}, model: ${agent.model}`);

    // Construct the complete message by combining system prompt with user messages
    const systemMessage = agent.systemPrompt;
    const userMessageText = userMessages.join('\n\n');
    const fullMessage = `${systemMessage}\n\n${userMessageText}`;

    this.logger.debug(`Calling AI provider with model ${agent.model}`);

    try {
      // Parse model string and get decrypted config
      const { provider, modelName } = this.aiProviderCoreService.parseModelString(agent.model);
      const config = await this.aiProviderRepository.getDecryptedConfig(agent.workspace.id, provider);

      // Call the AI provider with the agent's configuration
      const response = await this.aiProviderCoreService.chat(config, provider, modelName, fullMessage);

      this.logger.info(`Agent ${agentId} call completed successfully`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to call agent ${agentId}: ${error}`);
      throw error;
    }
  }
}
