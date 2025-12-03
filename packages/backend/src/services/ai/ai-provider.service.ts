import { inject, injectable } from 'inversify';
import { LoggerService, dgraphResolversTypes, EncryptionService } from '@2ly/common';
import pino from 'pino';
import { generateText, streamText, type LanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOllama, ollama } from 'ollama-ai-provider-v2';
import { AIProviderRepository } from '../../repositories/ai-provider.repository';

export type AIProviderType = 'openai' | 'anthropic' | 'google' | 'ollama';

interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
}

export interface AIProviderValidationResult {
  valid: boolean;
  error?: string;
  availableModels?: string[];
}

// Provider configuration constants
const PROVIDER_REQUIRES_KEY: Record<AIProviderType, boolean> = {
  openai: true,
  anthropic: true,
  google: true,
  ollama: false,
};

const _STATIC_MODELS: Record<AIProviderType, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
  google: [],
  ollama: [],
};

/**
 * AIProviderService - Minimal service for multi-provider AI chat completion.
 * Uses Vercel AI SDK directly without additional abstraction layers.
 */
@injectable()
export class AIProviderService {
  private readonly logger: pino.Logger;

  constructor(
    @inject(LoggerService) loggerService: LoggerService,
    @inject(EncryptionService) private readonly encryption: EncryptionService,
    @inject(AIProviderRepository) private readonly repository: AIProviderRepository
  ) {
    this.logger = loggerService.getLogger('ai-provider-service');
  }

  private async listProviderModels(provider: AIProviderType, config: ProviderConfig): Promise<string[]> {
    switch (provider) {
      case 'openai': {
          if (!config.apiKey) {
            throw new Error('OpenAI API key is required');
          }
          const res = await fetch("https://api.openai.com/v1/models", {
            headers: {
              "Authorization": `Bearer ${config.apiKey}`,
            },
          });
        
          if (!res.ok) throw new Error(`OpenAI error: ${await res.text()}`);
        
          const data: { data: { id: string }[] } = await res.json();
          const TEXT_MODEL_PREFIXES = ['gpt-', 'o1', 'o3', 'chatgpt'];
          return data.data
            .map(m => m.id)
            .filter(id => TEXT_MODEL_PREFIXES.some(prefix => id.startsWith(prefix)));
        }
      case 'anthropic':
        {
          if (!config.apiKey) {
            throw new Error('Anthropic API key is required');
          }
          const res = await fetch("https://api.anthropic.com/v1/models", {
            headers: {
              "x-api-key": config.apiKey,
              "anthropic-version": "2023-06-01", // required
            },
          });
        
          if (!res.ok) throw new Error(`Anthropic error: ${await res.text()}`);
        
          const data: { data: { id: string }[] } = await res.json();
          return data.data.map(m => m.id);
        }
      case 'google':
        {
          if (!config.apiKey) {
            throw new Error('Google API key is required');
          }
          const host = config.baseUrl || 'https://generativelanguage.googleapis.com/v1';
          const res = await fetch(`${host}/models?key=${config.apiKey}`);
          if (!res.ok) throw new Error(`Google Gemini error: ${await res.text()}`);
          const data: { models: { name: string }[] } = await res.json();
          const result: string[] = data.models.map(m => m.name);
          return result.filter(m => m.includes('gemini')).map(m => m.replace('models/', ''));
        }
      case 'ollama':
        {
          const host = config.baseUrl || 'http://localhost:11434/api';
          const res = await fetch(`${host}/tags`);
          if (!res.ok) throw new Error(`Ollama error: ${await res.text()}`);
          const data: { models: { name: string }[] } = await res.json();
          return data.models.map(m => m.name);
        }
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Get a model instance for a provider.
   * Uses Vercel AI SDK provider factories directly.
   */
  private getProviderModel(provider: AIProviderType, modelName: string, config: ProviderConfig): LanguageModel {
    switch (provider) {
      case 'openai':
        return createOpenAI({ apiKey: config.apiKey, baseURL: config.baseUrl })(modelName);
      case 'anthropic':
        return createAnthropic({ apiKey: config.apiKey, baseURL: config.baseUrl })(modelName);
      case 'google':
        return createGoogleGenerativeAI({ apiKey: config.apiKey, baseURL: config.baseUrl })(modelName);
      case 'ollama':
        return config.baseUrl ? createOllama({ baseURL: config.baseUrl })(modelName) : ollama(modelName);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Test configuration WITHOUT persisting to database.
   * For frontend validation before saving.
   */
  private async testConfiguration(
    provider: AIProviderType,
    apiKey?: string,
    baseUrl?: string
  ): Promise<AIProviderValidationResult> {
    this.logger.info({ provider }, 'Testing AI provider configuration');

    // Validate required fields
    if (PROVIDER_REQUIRES_KEY[provider] && !apiKey) {
      return { valid: false, error: `${provider} requires an API key` };
    }

    if (provider === 'ollama' && !baseUrl) {
      baseUrl = 'http://localhost:11434';
    }

    try {
      const availableModels = await this.listProviderModels(provider, { apiKey, baseUrl });
      this.logger.info({ availableModels }, 'Available models');
      if (availableModels.length === 0) {
        return { valid: false, error: 'No models available' };
      }
      return { valid: true, availableModels };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error({ error, provider }, 'AI provider test failed');
      return { valid: false, error: message };
    }
  }

  /**
   * Chat with a specific model (sync).
   * @param modelString - Format: "provider/model-name" (e.g., "openai/gpt-4o")
   */
  async chat(workspaceId: string, modelString: string, message: string): Promise<string> {
    const { provider, modelName } = this.parseModelString(modelString);
    const config = await this.getDecryptedConfig(workspaceId, provider);

    const model = this.getProviderModel(provider, modelName, config);
    try {
      const result = await generateText({
        model,
        messages: [{ role: 'user', content: message }],
      });
      return result.text;  
    } catch (error) {
      this.logger.error(`Failed to chat with model ${modelString}: ${error}`);
      throw error;
    }
  }

  /**
   * Stream chat with a specific model.
   * @param modelString - Format: "provider/model-name" (e.g., "openai/gpt-4o")
   */
  async *stream(workspaceId: string, modelString: string, message: string): AsyncIterable<string> {
    const { provider, modelName } = this.parseModelString(modelString);
    const config = await this.getDecryptedConfig(workspaceId, provider);
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
   * Configure an AI provider for a workspace.
   * Validates credentials before saving.
   */
  async configure(
    workspaceId: string,
    provider: AIProviderType,
    apiKey?: string,
    baseUrl?: string
  ): Promise<AIProviderValidationResult> {
    this.logger.info({ workspaceId, provider }, 'Configuring AI provider');

    // Test configuration first
    const test = await this.testConfiguration(provider, apiKey, baseUrl);
    if (!test.valid) {
      return test;
    }

    // Encrypt API key
    const encryptedKey = apiKey ? this.encryption.encrypt(apiKey) : null;

    // Upsert configuration
    await this.repository.upsert(workspaceId, {
      provider: provider.toUpperCase() as dgraphResolversTypes.AiProviderType,
      encryptedApiKey: encryptedKey,
      baseUrl: baseUrl || null,
      availableModels: test.availableModels || null,
    });

    this.logger.info({ workspaceId, provider }, 'AI provider configured');
    return test;
  }


  private parseModelString(modelString: string): { provider: AIProviderType; modelName: string } {
    const [provider, modelName] = modelString.split('/');

    if (!provider) {
      throw new Error('Invalid model format. Provider cannot be empty');
    }

    if (!modelName) {
      throw new Error('Invalid model format. Model name cannot be empty');
    }

    if (!['openai', 'anthropic', 'google', 'ollama'].includes(provider)) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    return { provider: provider.toLowerCase() as AIProviderType, modelName };
  }

  private async getDecryptedConfig(workspaceId: string, provider: AIProviderType): Promise<ProviderConfig> {
    const providerUpper = provider.toUpperCase() as dgraphResolversTypes.AiProviderType;
    const config = await this.repository.findByType(workspaceId, providerUpper);

    if (!config) {
      throw new Error(`Provider ${provider} is not configured`);
    }

    return {
      apiKey: config.encryptedApiKey ? this.encryption.decrypt(config.encryptedApiKey) : undefined,
      baseUrl: config.baseUrl || undefined,
    };
  }
}
