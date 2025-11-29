import { inject, injectable } from 'inversify';
import { LoggerService } from '@2ly/common';
import type pino from 'pino';
import type { IAIClient, AIProviderType, AIClientConfig } from './ai-client.interface';
import { OpenAIAdapter, AnthropicAdapter, GoogleAdapter, OllamaAdapter } from './adapters';

/**
 * AIClientFactory - Creates AI client adapters based on provider type.
 *
 * This factory abstracts the creation of provider-specific adapters,
 * making it easy to add new providers or swap implementations.
 */
@injectable()
export class AIClientFactory {
  private readonly logger: pino.Logger;

  constructor(@inject(LoggerService) loggerService: LoggerService) {
    this.logger = loggerService.getLogger('ai-client-factory');
  }

  /**
   * Create an AI client for the specified provider.
   *
   * @param provider - The AI provider type
   * @param config - Configuration including API key, base URL, etc.
   * @returns An IAIClient implementation for the provider
   */
  create(provider: AIProviderType, config: AIClientConfig): IAIClient {
    this.logger.debug({ provider, hasApiKey: !!config.apiKey, baseUrl: config.baseUrl }, 'Creating AI client');

    switch (provider) {
      case 'openai':
        return new OpenAIAdapter(config);

      case 'anthropic':
        return new AnthropicAdapter(config);

      case 'google':
        return new GoogleAdapter(config);

      case 'ollama':
        return new OllamaAdapter(config);

      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  /**
   * Get the list of supported providers.
   */
  getSupportedProviders(): AIProviderType[] {
    return ['openai', 'anthropic', 'google', 'ollama'];
  }

  /**
   * Check if a provider is supported.
   */
  isProviderSupported(provider: string): provider is AIProviderType {
    return this.getSupportedProviders().includes(provider as AIProviderType);
  }
}
