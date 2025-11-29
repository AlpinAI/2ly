import { injectable, inject } from 'inversify';
import { DGraphService } from '../services/dgraph.service';
import { dgraphResolversTypes, LoggerService } from '@2ly/common';
import {
  GET_AI_PROVIDERS_BY_WORKSPACE,
  GET_ACTIVE_AI_PROVIDER,
  CREATE_AI_PROVIDER,
  UPDATE_AI_PROVIDER,
  DELETE_AI_PROVIDER,
  FIND_AI_PROVIDER_BY_TYPE,
  DEACTIVATE_ALL_AI_PROVIDERS,
} from './ai-provider.operations';
import pino from 'pino';

export interface AIProviderConfigData {
  provider: dgraphResolversTypes.AiProviderType;
  encryptedApiKey?: string | null;
  baseUrl?: string | null;
  defaultModel?: string | null;
  availableModels?: string[] | null;
  isActive: boolean;
}

@injectable()
export class AIProviderRepository {
  private logger: pino.Logger;

  constructor(
    @inject(DGraphService) private readonly dgraphService: DGraphService,
    @inject(LoggerService) private readonly loggerService: LoggerService
  ) {
    this.logger = this.loggerService.getLogger('ai-provider-repository');
  }

  /**
   * Get all AI provider configurations for a workspace.
   */
  async getByWorkspace(workspaceId: string): Promise<dgraphResolversTypes.AiProviderConfig[]> {
    try {
      const res = await this.dgraphService.query<{
        getWorkspace: { aiProviders: dgraphResolversTypes.AiProviderConfig[] } | null;
      }>(GET_AI_PROVIDERS_BY_WORKSPACE, { workspaceId });

      return res.getWorkspace?.aiProviders || [];
    } catch (error) {
      this.logger.error({ error, workspaceId }, 'Failed to get AI providers by workspace');
      throw new Error('Failed to get AI providers');
    }
  }

  /**
   * Get the active AI provider for a workspace.
   */
  async getActiveProvider(workspaceId: string): Promise<dgraphResolversTypes.AiProviderConfig | null> {
    try {
      const res = await this.dgraphService.query<{
        getWorkspace: { aiProviders: dgraphResolversTypes.AiProviderConfig[] } | null;
      }>(GET_ACTIVE_AI_PROVIDER, { workspaceId });

      const providers = res.getWorkspace?.aiProviders || [];
      return providers.length > 0 ? providers[0] : null;
    } catch (error) {
      this.logger.error({ error, workspaceId }, 'Failed to get active AI provider');
      throw new Error('Failed to get active AI provider');
    }
  }

  /**
   * Find a specific provider type for a workspace.
   */
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
      this.logger.error({ error, workspaceId, provider }, 'Failed to find AI provider by type');
      throw new Error('Failed to find AI provider');
    }
  }

  /**
   * Create a new AI provider configuration.
   */
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
        defaultModel: data.defaultModel,
        availableModels: data.availableModels,
        isActive: data.isActive,
        now,
      });

      this.logger.info({ workspaceId, provider: data.provider }, 'Created AI provider configuration');
      return res.addAIProviderConfig.aIProviderConfig[0];
    } catch (error) {
      this.logger.error({ error, workspaceId, provider: data.provider }, 'Failed to create AI provider');
      throw new Error('Failed to create AI provider');
    }
  }

  /**
   * Update an existing AI provider configuration.
   */
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
        defaultModel: data.defaultModel,
        availableModels: data.availableModels,
        isActive: data.isActive,
        now,
      });

      this.logger.info({ id }, 'Updated AI provider configuration');
      return res.updateAIProviderConfig.aIProviderConfig[0];
    } catch (error) {
      this.logger.error({ error, id }, 'Failed to update AI provider');
      throw new Error('Failed to update AI provider');
    }
  }

  /**
   * Create or update an AI provider configuration (upsert).
   */
  async upsert(workspaceId: string, data: AIProviderConfigData): Promise<dgraphResolversTypes.AiProviderConfig> {
    const existing = await this.findByType(workspaceId, data.provider);

    if (existing) {
      return this.update(existing.id, data);
    }

    return this.create(workspaceId, data);
  }

  /**
   * Delete an AI provider configuration.
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.dgraphService.mutation<{
        deleteAIProviderConfig: { aIProviderConfig: { id: string }[] };
      }>(DELETE_AI_PROVIDER, { id });

      this.logger.info({ id }, 'Deleted AI provider configuration');
      return true;
    } catch (error) {
      this.logger.error({ error, id }, 'Failed to delete AI provider');
      throw new Error('Failed to delete AI provider');
    }
  }

  /**
   * Set a provider as active (deactivating all others).
   */
  async setActive(workspaceId: string, providerId: string): Promise<dgraphResolversTypes.AiProviderConfig> {
    try {
      const now = new Date().toISOString();

      // First deactivate all providers
      await this.dgraphService.mutation(DEACTIVATE_ALL_AI_PROVIDERS, { workspaceId, now });

      // Then activate the specified provider
      const res = await this.dgraphService.mutation<{
        updateAIProviderConfig: { aIProviderConfig: dgraphResolversTypes.AiProviderConfig[] };
      }>(UPDATE_AI_PROVIDER, {
        id: providerId,
        isActive: true,
        now,
      });

      this.logger.info({ workspaceId, providerId }, 'Set AI provider as active');
      return res.updateAIProviderConfig.aIProviderConfig[0];
    } catch (error) {
      this.logger.error({ error, workspaceId, providerId }, 'Failed to set AI provider as active');
      throw new Error('Failed to set AI provider as active');
    }
  }

  /**
   * Remove a provider configuration for a workspace by type.
   */
  async removeByType(workspaceId: string, provider: dgraphResolversTypes.AiProviderType): Promise<boolean> {
    const existing = await this.findByType(workspaceId, provider);

    if (!existing) {
      return false;
    }

    return this.delete(existing.id);
  }
}
