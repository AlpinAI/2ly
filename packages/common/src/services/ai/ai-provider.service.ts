import { inject, injectable } from 'inversify';
import { generateText, streamText, type LanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOllama } from 'ollama-ai-provider-v2';
import pino from 'pino';
import { LoggerService } from '../logger.service';
import { DEFAULT_OLLAMA_BASE_URL, AI_PROVIDER_API_URLS } from '../../constants';
import type { AIProviderType, ProviderConfig, ParsedModelString } from './ai-provider.types';
import {
  VALID_PROVIDERS,
  AIProviderError,
  InvalidAPIKeyError,
  RateLimitError,
  TokenLimitError,
} from './ai-provider.types';

/**
 * AIProviderService - Stateless core service for AI provider operations.
 * Accepts configuration directly - no workspace awareness.
 * Can be used by both backend and runtime.
 */
@injectable()
export class AIProviderService {
  private readonly logger: pino.Logger;

  constructor(@inject(LoggerService) loggerService: LoggerService) {
    this.logger = loggerService.getLogger('ai.provider');
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

      // Parse and classify errors
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

      // Check for authentication errors
      if (
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('invalid api key') ||
        errorMessage.includes('authentication') ||
        errorMessage.includes('401') ||
        errorMessage.includes('403')
      ) {
        throw new InvalidAPIKeyError(provider);
      }

      // Check for rate limit errors
      if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        throw new RateLimitError(provider);
      }

      // Check for token limit errors
      if (
        errorMessage.includes('token limit') ||
        errorMessage.includes('context length') ||
        errorMessage.includes('maximum context') ||
        errorMessage.includes('too many tokens')
      ) {
        throw new TokenLimitError(provider);
      }

      // Re-throw as generic AIProviderError if not classified
      if (error instanceof Error) {
        throw new AIProviderError(error.message, provider);
      }
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
   * List available models from a provider via API call.
   * This makes external HTTP requests to the provider's API.
   */
  async listProviderModels(provider: AIProviderType, config: ProviderConfig): Promise<string[]> {
    switch (provider) {
      case 'openai': {
        if (!config.apiKey) {
          throw new InvalidAPIKeyError(provider);
        }
        try {
          const res = await fetch(AI_PROVIDER_API_URLS.OPENAI, {
            headers: {
              Authorization: `Bearer ${config.apiKey}`,
            },
          });

          if (res.status === 401 || res.status === 403) {
            throw new InvalidAPIKeyError(provider);
          }
          if (res.status === 429) {
            throw new RateLimitError(provider);
          }
          if (!res.ok) {
            throw new AIProviderError(`OpenAI API error: ${await res.text()}`, provider);
          }

          const data: { data: { id: string }[] } = await res.json();
          const TEXT_MODEL_PREFIXES = ['gpt-', 'o1', 'o3', 'chatgpt'];
          return data.data.map((m) => m.id).filter((id) => TEXT_MODEL_PREFIXES.some((prefix) => id.startsWith(prefix)));
        } catch (error) {
          if (
            error instanceof InvalidAPIKeyError ||
            error instanceof RateLimitError ||
            error instanceof AIProviderError
          ) {
            throw error;
          }
          throw new AIProviderError(
            error instanceof Error ? error.message : 'Unknown error',
            provider
          );
        }
      }
      case 'anthropic': {
        if (!config.apiKey) {
          throw new InvalidAPIKeyError(provider);
        }
        try {
          const res = await fetch(AI_PROVIDER_API_URLS.ANTHROPIC, {
            headers: {
              'x-api-key': config.apiKey,
              'anthropic-version': '2023-06-01',
            },
          });

          if (res.status === 401 || res.status === 403) {
            throw new InvalidAPIKeyError(provider);
          }
          if (res.status === 429) {
            throw new RateLimitError(provider);
          }
          if (!res.ok) {
            throw new AIProviderError(`Anthropic API error: ${await res.text()}`, provider);
          }

          const data: { data: { id: string }[] } = await res.json();
          return data.data.map((m) => m.id);
        } catch (error) {
          if (
            error instanceof InvalidAPIKeyError ||
            error instanceof RateLimitError ||
            error instanceof AIProviderError
          ) {
            throw error;
          }
          throw new AIProviderError(
            error instanceof Error ? error.message : 'Unknown error',
            provider
          );
        }
      }
      case 'google': {
        if (!config.apiKey) {
          throw new InvalidAPIKeyError(provider);
        }
        try {
          const host = config.baseUrl || AI_PROVIDER_API_URLS.GOOGLE;
          const res = await fetch(`${host}/models?key=${config.apiKey}`);

          if (res.status === 401 || res.status === 403) {
            throw new InvalidAPIKeyError(provider);
          }
          if (res.status === 429) {
            throw new RateLimitError(provider);
          }
          if (!res.ok) {
            throw new AIProviderError(`Google Gemini API error: ${await res.text()}`, provider);
          }

          const data: { models: { name: string }[] } = await res.json();
          const result: string[] = data.models.map((m) => m.name);
          return result.filter((m) => m.includes('gemini')).map((m) => m.replace('models/', ''));
        } catch (error) {
          if (
            error instanceof InvalidAPIKeyError ||
            error instanceof RateLimitError ||
            error instanceof AIProviderError
          ) {
            throw error;
          }
          throw new AIProviderError(
            error instanceof Error ? error.message : 'Unknown error',
            provider
          );
        }
      }
      case 'ollama': {
        try {
          const host = config.baseUrl || DEFAULT_OLLAMA_BASE_URL;
          const res = await fetch(`${host}/tags`);

          if (!res.ok) {
            throw new AIProviderError(`Ollama API error: ${await res.text()}`, provider);
          }

          const data: { models: { name: string }[] } = await res.json();
          return data.models.map((m) => m.name);
        } catch (error) {
          if (error instanceof AIProviderError) {
            throw error;
          }
          throw new AIProviderError(
            error instanceof Error ? error.message : 'Unknown error',
            provider
          );
        }
      }
      default:
        throw new Error(`Unknown provider: ${provider}`);
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
