import { injectable, inject } from 'inversify';
import { DGraphService } from '../services/dgraph.service';
import {
  dgraphResolversTypes,
  LoggerService,
  EncryptionService,
  AIProviderService,
  type AIProviderType,
  type ProviderConfig,
  type AIProviderValidationResult,
  PROVIDER_REQUIRES_KEY,
} from '@2ly/common';
import pino from 'pino';
import {
  GET_AI_PROVIDERS_BY_WORKSPACE,
  FIND_AI_PROVIDER_BY_TYPE,
  CREATE_AI_PROVIDER,
  UPDATE_AI_PROVIDER,
  DELETE_AI_PROVIDER,
  GET_AI_PROVIDER_BY_ID,
  SET_DEFAULT_MODEL,
} from './ai-provider.operations';

export interface AIProviderConfigData {
  provider: dgraphResolversTypes.AiProviderType;
  encryptedApiKey?: string | null;
  baseUrl?: string | null;
  availableModels?: string[] | null;
}

@injectable()
export class AIProviderRepository {
  private logger: pino.Logger;

  constructor(
    @inject(DGraphService) private readonly dgraphService: DGraphService,
    @inject(LoggerService) private readonly loggerService: LoggerService,
    @inject(EncryptionService) private readonly encryption: EncryptionService,
    @inject(AIProviderService) private readonly aiProviderCore: AIProviderService
  ) {
    this.logger = this.loggerService.getLogger('ai.provider.repository');
  }

  async getByWorkspace(workspaceId: string): Promise<dgraphResolversTypes.AiProviderConfig[]> {
    try {
      const res = await this.dgraphService.query<{
        getWorkspace: { aiProviders: dgraphResolversTypes.AiProviderConfig[] } | null;
      }>(GET_AI_PROVIDERS_BY_WORKSPACE, { workspaceId });

      return res.getWorkspace?.aiProviders || [];
    } catch (error) {
      this.logger.error(`Failed to get AI providers for workspace ${workspaceId}: ${error}`);
      throw new Error('Failed to get AI providers');
    }
  }

  async findByType(
    workspaceId: string,
    provider: dgraphResolversTypes.AiProviderType
  ): Promise<dgraphResolversTypes.AiProviderConfig | null> {
    try {
      const res = await this.dgraphService.query<{
        getWorkspace: { aiProviders: dgraphResolversTypes.AiProviderConfig[] } | null;
      }>(FIND_AI_PROVIDER_BY_TYPE, { workspaceId, provider });

      const providers = res.getWorkspace?.aiProviders || [];
      return providers.length > 0 ? providers[0] : null;
    } catch (error) {
      this.logger.error(`Failed to find AI provider for workspace ${workspaceId} and provider ${provider}: ${error}`);
      throw new Error('Failed to find AI provider');
    }
  }

  async findById(id: string): Promise<{ id: string; provider: string; workspaceId: string } | null> {
    try {
      const res = await this.dgraphService.query<{
        getAIProviderConfig: { id: string; provider: string; workspace: { id: string } } | null;
      }>(GET_AI_PROVIDER_BY_ID, { id });

      if (!res.getAIProviderConfig) return null;
      return {
        id: res.getAIProviderConfig.id,
        provider: res.getAIProviderConfig.provider,
        workspaceId: res.getAIProviderConfig.workspace.id,
      };
    } catch (error) {
      this.logger.error(`Failed to find AI provider by id ${id}: ${error}`);
      throw new Error('Failed to find AI provider');
    }
  }

  async create(workspaceId: string, data: AIProviderConfigData): Promise<dgraphResolversTypes.AiProviderConfig> {
    try {
      const now = new Date().toISOString();

      const res = await this.dgraphService.mutation<{
        addAIProviderConfig: { aIProviderConfig: dgraphResolversTypes.AiProviderConfig[] };
      }>(CREATE_AI_PROVIDER, {
        workspaceId,
        provider: data.provider,
        encryptedApiKey: data.encryptedApiKey,
        baseUrl: data.baseUrl,
        availableModels: data.availableModels,
        now,
      });

      this.logger.info(`Created AI provider for workspace ${workspaceId} and provider ${data.provider}`);
      return res.addAIProviderConfig.aIProviderConfig[0];
    } catch (error) {
      this.logger.error(`Failed to create AI provider for workspace ${workspaceId} and provider ${data.provider}: ${error}`);
      throw new Error('Failed to create AI provider');
    }
  }

  async update(
    id: string,
    data: Partial<Omit<AIProviderConfigData, 'provider'>>
  ): Promise<dgraphResolversTypes.AiProviderConfig> {
    try {
      const now = new Date().toISOString();

      const res = await this.dgraphService.mutation<{
        updateAIProviderConfig: { aIProviderConfig: dgraphResolversTypes.AiProviderConfig[] };
      }>(UPDATE_AI_PROVIDER, {
        id,
        encryptedApiKey: data.encryptedApiKey,
        baseUrl: data.baseUrl,
        availableModels: data.availableModels,
        now,
      });

      this.logger.info(`Updated AI provider ${id}`);
      return res.updateAIProviderConfig.aIProviderConfig[0];
    } catch (error) {
      this.logger.error(`Failed to update AI provider ${id}: ${error}`);
      throw new Error('Failed to update AI provider');
    }
  }

  async upsert(workspaceId: string, data: AIProviderConfigData): Promise<dgraphResolversTypes.AiProviderConfig> {
    const existing = await this.findByType(workspaceId, data.provider);

    if (existing) {
      const { encryptedApiKey, baseUrl, availableModels } = data;
      return this.update(existing.id, {
        encryptedApiKey: encryptedApiKey ?? existing.encryptedApiKey,
        baseUrl: baseUrl ?? existing.baseUrl,
        availableModels: availableModels ?? existing.availableModels,
      });
    }

    return this.create(workspaceId, data);
  }

  /**
   * Get all available models from all configured providers.
   * Returns format: "provider/model" (e.g., "openai/gpt-4o")
   */
  async listAllModels(workspaceId: string): Promise<string[]> {
    const configs = await this.getByWorkspace(workspaceId);
    const models: string[] = [];

    for (const config of configs) {
      if (config.availableModels && config.availableModels.length > 0) {
        const prefix = config.provider.toLowerCase();
        models.push(...config.availableModels.map((m) => `${prefix}/${m}`));
      }
    }

    return models;
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.dgraphService.mutation<{
        deleteAIProviderConfig: { aIProviderConfig: { id: string }[] };
      }>(DELETE_AI_PROVIDER, { id });

      this.logger.info(`Deleted AI provider ${id}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete AI provider ${id}: ${error}`);
      throw new Error('Failed to delete AI provider');
    }
  }

  async setDefaultModel(workspaceId: string, providerModel: string): Promise<boolean> {
    const [providerId, ...modelParts] = providerModel.split('/');
    const model = modelParts.join('/');
    if (!providerId || !model) {
      this.logger.error(`Invalid model format: ${providerModel}`);
      throw new Error(`Invalid model format: expected "provider/model", got "${providerModel}"`);
    }

    const providerType = providerId.toUpperCase() as dgraphResolversTypes.AiProviderType;
    const provider = await this.findByType(workspaceId, providerType);
    if (!provider) {
      this.logger.error(`Provider ${providerType} not found for workspace ${workspaceId}`);
      throw new Error(`Provider "${providerId}" is not configured for this workspace`);
    }

    if (!provider.availableModels?.includes(model)) {
      this.logger.error(`Model ${model} not available for provider ${providerId}`);
      throw new Error(`Model "${model}" is not available for provider "${providerId}"`);
    }

    try {
      await this.dgraphService.mutation<{
        updateWorkspace: { workspace: { id: string; defaultAIModel: string }[] };
      }>(SET_DEFAULT_MODEL, {
        workspaceId,
        providerModel,
      });

      this.logger.info(`Set default model for workspace ${workspaceId} to ${providerModel}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to set default model for workspace ${workspaceId} to ${providerModel}: ${error}`);
      throw new Error('Failed to update workspace default model');
    }
  }

  async removeByType(workspaceId: string, provider: dgraphResolversTypes.AiProviderType): Promise<boolean> {
    const existing = await this.findByType(workspaceId, provider);

    if (!existing) {
      return false;
    }

    return this.delete(existing.id);
  }

  /**
   * Test configuration WITHOUT persisting to database.
   * For frontend validation before saving.
   */
  async testConfiguration(
    provider: AIProviderType,
    apiKey?: string,
    baseUrl?: string
  ): Promise<AIProviderValidationResult> {
    this.logger.info(`Testing AI provider configuration for provider ${provider}`);

    if (PROVIDER_REQUIRES_KEY[provider] && !apiKey) {
      return { valid: false, error: `${provider} requires an API key` };
    }

    try {
      const availableModels = await this.aiProviderCore.listProviderModels(provider, { apiKey, baseUrl });
      if (availableModels.length === 0) {
        return { valid: false, error: 'No models available' };
      }
      return { valid: true, availableModels };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to test AI provider ${provider}: ${message}`);
      return { valid: false, error: message };
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
    this.logger.info(`Configuring AI provider for workspace ${workspaceId} with provider ${provider}`);

    // Test configuration first
    const test = await this.testConfiguration(provider, apiKey, baseUrl);
    if (!test.valid) {
      return test;
    }

    // Encrypt API key
    const encryptedKey = apiKey ? this.encryption.encrypt(apiKey) : null;

    // Upsert configuration
    await this.upsert(workspaceId, {
      provider: provider.toUpperCase() as dgraphResolversTypes.AiProviderType,
      encryptedApiKey: encryptedKey,
      baseUrl: baseUrl || null,
      availableModels: test.availableModels || null,
    });

    this.logger.info(`AI provider configured for workspace ${workspaceId} with provider ${provider}`);
    return test;
  }

  /**
   * Get decrypted configuration for a provider.
   */
  async getDecryptedConfig(workspaceId: string, provider: AIProviderType): Promise<ProviderConfig> {
    const providerUpper = provider.toUpperCase() as dgraphResolversTypes.AiProviderType;
    const config = await this.findByType(workspaceId, providerUpper);

    if (!config) {
      throw new Error(`Provider ${provider} is not configured`);
    }

    return {
      apiKey: config.encryptedApiKey ? this.encryption.decrypt(config.encryptedApiKey) : undefined,
      baseUrl: config.baseUrl || undefined,
    };
  }
}
