import { inject, injectable } from 'inversify';
import { LoggerService, dgraphResolversTypes } from '@2ly/common';
import pino from 'pino';
import { AIClientFactory } from './ai-client.factory';
import { EncryptionService } from './encryption.service';
import { AIProviderRepository } from '../../repositories/ai-provider.repository';
import type { IAIClient, AIProviderType, AICredentialValidation } from './ai-client.interface';
import { PROVIDER_REQUIRES_KEY, DEFAULT_BASE_URLS } from './ai-client.interface';

export interface ConfigureProviderInput {
  apiKey?: string | null;
  baseUrl?: string | null;
  defaultModel?: string | null;
}

export interface AIProviderConfigResult {
  valid: boolean;
  error?: string;
  availableModels?: string[];
}

/**
 * AIProviderService - Business logic for AI provider configuration and usage.
 *
 * Handles:
 * - Provider configuration with encrypted API key storage
 * - Credential validation
 * - Client creation for chat/streaming
 */
@injectable()
export class AIProviderService {
  private readonly logger: pino.Logger;

  constructor(
    @inject(LoggerService) loggerService: LoggerService,
    @inject(AIClientFactory) private readonly clientFactory: AIClientFactory,
    @inject(EncryptionService) private readonly encryption: EncryptionService,
    @inject(AIProviderRepository) private readonly repository: AIProviderRepository
  ) {
    this.logger = loggerService.getLogger('ai-provider-service');
  }

  /**
   * Get all configured AI providers for a workspace.
   */
  async getProviders(workspaceId: string): Promise<dgraphResolversTypes.AiProviderConfig[]> {
    return this.repository.getByWorkspace(workspaceId);
  }

  /**
   * Get an AI client for a specific provider (or the active one).
   */
  async getClient(workspaceId: string, provider?: AIProviderType): Promise<IAIClient> {
    let config: dgraphResolversTypes.AiProviderConfig | null;

    if (provider) {
      config = await this.repository.findByType(
        workspaceId,
        provider.toUpperCase() as dgraphResolversTypes.AiProviderType
      );
    } else {
      config = await this.repository.getActiveProvider(workspaceId);
    }

    if (!config) {
      throw new Error('No AI provider configured');
    }

    return this.createClientFromConfig(config);
  }

  /**
   * Configure an AI provider for a workspace.
   * Validates credentials before saving.
   */
  async configureProvider(
    workspaceId: string,
    provider: AIProviderType,
    input: ConfigureProviderInput
  ): Promise<AIProviderConfigResult> {
    this.logger.info({ workspaceId, provider }, 'Configuring AI provider');

    // Validate that required fields are provided
    const requiresKey = PROVIDER_REQUIRES_KEY[provider];
    if (requiresKey && !input.apiKey) {
      return {
        valid: false,
        error: `${provider} requires an API key`,
      };
    }

    // For Ollama, ensure baseUrl is provided or use default
    const baseUrl = input.baseUrl || DEFAULT_BASE_URLS[provider];
    if (provider === 'ollama' && !baseUrl) {
      return {
        valid: false,
        error: 'Ollama requires a base URL',
      };
    }

    // Create a temporary client to validate credentials
    let validation: AICredentialValidation;
    try {
      const tempClient = this.clientFactory.create(provider, {
        apiKey: input.apiKey || undefined,
        baseUrl: baseUrl || undefined,
        defaultModel: input.defaultModel || undefined,
      });

      validation = await tempClient.validateCredentials();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error({ error, workspaceId, provider }, 'Failed to validate AI provider credentials');
      return {
        valid: false,
        error: `Validation failed: ${message}`,
      };
    }

    if (!validation.valid) {
      return {
        valid: false,
        error: validation.error,
      };
    }

    // Encrypt the API key before storing
    const encryptedApiKey = input.apiKey ? this.encryption.encrypt(input.apiKey) : null;

    // Check if any other provider is already active
    const existingProviders = await this.repository.getByWorkspace(workspaceId);
    const hasActiveProvider = existingProviders.some((p) => p.isActive);

    // Upsert the configuration
    await this.repository.upsert(workspaceId, {
      provider: provider.toUpperCase() as dgraphResolversTypes.AiProviderType,
      encryptedApiKey,
      baseUrl: baseUrl || null,
      defaultModel: input.defaultModel || null,
      availableModels: validation.availableModels || null,
      isActive: !hasActiveProvider, // Make active if no other provider is active
    });

    this.logger.info({ workspaceId, provider, modelsCount: validation.availableModels?.length }, 'AI provider configured successfully');

    return {
      valid: true,
      availableModels: validation.availableModels,
    };
  }

  /**
   * Set a provider as the active one for a workspace.
   */
  async setActiveProvider(
    workspaceId: string,
    provider: AIProviderType
  ): Promise<dgraphResolversTypes.AiProviderConfig> {
    const config = await this.repository.findByType(
      workspaceId,
      provider.toUpperCase() as dgraphResolversTypes.AiProviderType
    );

    if (!config) {
      throw new Error(`Provider ${provider} is not configured`);
    }

    return this.repository.setActive(workspaceId, config.id);
  }

  /**
   * Remove a provider configuration from a workspace.
   */
  async removeProvider(workspaceId: string, provider: AIProviderType): Promise<boolean> {
    return this.repository.removeByType(
      workspaceId,
      provider.toUpperCase() as dgraphResolversTypes.AiProviderType
    );
  }

  /**
   * Test an AI provider with a sample prompt.
   */
  async testProvider(workspaceId: string, provider: AIProviderType, prompt?: string): Promise<string> {
    const client = await this.getClient(workspaceId, provider);

    const testPrompt = prompt || 'Hello! Please respond with a brief greeting to confirm the connection is working.';

    const response = await client.chat({
      messages: [{ role: 'user', content: testPrompt }],
      maxTokens: 100,
    });

    return response.content;
  }

  /**
   * Get available models for a provider.
   */
  async getProviderModels(workspaceId: string, provider: AIProviderType): Promise<string[]> {
    const config = await this.repository.findByType(
      workspaceId,
      provider.toUpperCase() as dgraphResolversTypes.AiProviderType
    );

    if (!config) {
      throw new Error(`Provider ${provider} is not configured`);
    }

    // Return cached models if available
    if (config.availableModels && config.availableModels.length > 0) {
      return config.availableModels;
    }

    // Otherwise, fetch fresh models
    const client = await this.createClientFromConfig(config);
    const models = await client.listModels();
    return models.map((m) => m.id);
  }

  /**
   * Create an AI client from a stored configuration.
   */
  private async createClientFromConfig(config: dgraphResolversTypes.AiProviderConfig): Promise<IAIClient> {
    const provider = config.provider.toLowerCase() as AIProviderType;

    // Decrypt the API key if present
    const apiKey = config.encryptedApiKey ? this.encryption.decrypt(config.encryptedApiKey) : undefined;

    return this.clientFactory.create(provider, {
      apiKey,
      baseUrl: config.baseUrl || undefined,
      defaultModel: config.defaultModel || undefined,
    });
  }
}
