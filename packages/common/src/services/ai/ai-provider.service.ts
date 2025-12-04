import { inject, injectable } from 'inversify';
import { generateText, streamText, type LanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOllama } from 'ollama-ai-provider-v2';
import pino from 'pino';
import { LoggerService } from '../logger.service';
import { DEFAULT_OLLAMA_BASE_URL } from '../../constants';
import type { AIProviderType, ProviderConfig, ParsedModelString } from './ai-provider.types';
import { VALID_PROVIDERS } from './ai-provider.types';

/**
 * AIProviderCoreService - Stateless core service for AI provider operations.
 * Accepts configuration directly - no workspace awareness.
 * Can be used by both backend and runtime.
 */
@injectable()
export class AIProviderCoreService {
  private readonly logger: pino.Logger;

  constructor(@inject(LoggerService) loggerService: LoggerService) {
    this.logger = loggerService.getLogger('ai-provider-core');
  }

  /**
   * Get a model instance for a provider.
   * Uses Vercel AI SDK provider factories directly.
   */
  getProviderModel(provider: AIProviderType, modelName: string, config: ProviderConfig): LanguageModel {
    switch (provider) {
      case 'openai':
        return createOpenAI({ apiKey: config.apiKey, baseURL: config.baseUrl })(modelName);
      case 'anthropic':
        return createAnthropic({ apiKey: config.apiKey, baseURL: config.baseUrl })(modelName);
      case 'google':
        return createGoogleGenerativeAI({ apiKey: config.apiKey, baseURL: config.baseUrl })(modelName);
      case 'ollama':
        return config.baseUrl
          ? createOllama({ baseURL: config.baseUrl })(modelName)
          : createOllama({ baseURL: DEFAULT_OLLAMA_BASE_URL })(modelName);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Chat with a specific model (sync).
   * Accepts config directly - caller is responsible for providing decrypted config.
   */
  async chat(config: ProviderConfig, provider: AIProviderType, modelName: string, message: string): Promise<string> {
    const model = this.getProviderModel(provider, modelName, config);
    try {
      const result = await generateText({
        model,
        messages: [{ role: 'user', content: message }],
      });
      return result.text;
    } catch (error) {
      this.logger.error(`Failed to chat with model ${provider}/${modelName}: ${error}`);
      throw error;
    }
  }

  /**
   * Stream chat with a specific model.
   * Accepts config directly - caller is responsible for providing decrypted config.
   */
  async *stream(
    config: ProviderConfig,
    provider: AIProviderType,
    modelName: string,
    message: string
  ): AsyncIterable<string> {
    const model = this.getProviderModel(provider, modelName, config);
    const result = streamText({
      model,
      messages: [{ role: 'user', content: message }],
    });

    for await (const chunk of result.textStream) {
      yield chunk;
    }
  }

  /**
   * Parse model string format: "provider/model-name"
   */
  parseModelString(modelString: string): ParsedModelString {
    const [provider, modelName] = modelString.split('/');

    if (!provider) {
      throw new Error('Invalid model format. Provider cannot be empty');
    }

    if (!modelName) {
      throw new Error('Invalid model format. Model name cannot be empty');
    }

    if (!VALID_PROVIDERS.includes(provider as AIProviderType)) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    return { provider: provider.toLowerCase() as AIProviderType, modelName };
  }
}
