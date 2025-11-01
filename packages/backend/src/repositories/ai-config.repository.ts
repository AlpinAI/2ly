/**
 * AI Config Repository
 *
 * WHY: Data access layer for AI configuration operations.
 * Handles CRUD operations for workspace AI settings in Dgraph.
 */

import { injectable, inject } from 'inversify';
import { AiProvider } from '@2ly/common';
import { DGraphService } from '../services/dgraph.service';
import { GET_AI_CONFIG, ADD_AI_CONFIG, UPDATE_AI_CONFIG, DELETE_AI_CONFIG } from './ai-config.operations';

export interface AIConfig {
  id: string;
  provider: AiProvider;
  model: string;
  encryptedApiKey: string;
  createdAt: Date;
  updatedAt: Date;
}

@injectable()
export class AIConfigRepository {
  constructor(@inject(DGraphService) private readonly dgraphService: DGraphService) {}

  /**
   * Get AI configuration for a workspace
   */
  async getAIConfig(workspaceId: string): Promise<AIConfig | null> {
    const result = await this.dgraphService.query<{
      getWorkspace: { aiConfig?: AIConfig };
    }>(GET_AI_CONFIG, { workspaceId });

    const config = result.getWorkspace?.aiConfig;
    if (!config) return null;

    return {
      ...config,
      createdAt: new Date(config.createdAt),
      updatedAt: new Date(config.updatedAt),
    };
  }

  /**
   * Create AI configuration for a workspace
   */
  async createAIConfig(
    workspaceId: string,
    provider: AiProvider,
    model: string,
    encryptedApiKey: string,
  ): Promise<AIConfig> {
    const now = new Date().toISOString();

    const result = await this.dgraphService.mutation<{
      addAIConfig: { aIConfig: AIConfig[] };
    }>(ADD_AI_CONFIG, {
      provider,
      model,
      encryptedApiKey,
      now,
      workspaceId,
    });

    const config = result.addAIConfig.aIConfig[0];
    return {
      ...config,
      createdAt: new Date(config.createdAt),
      updatedAt: new Date(config.updatedAt),
    };
  }

  /**
   * Update AI configuration
   */
  async updateAIConfig(
    id: string,
    provider: AiProvider,
    model: string,
    encryptedApiKey: string,
  ): Promise<AIConfig> {
    const now = new Date().toISOString();

    const result = await this.dgraphService.mutation<{
      updateAIConfig: { aIConfig: AIConfig[] };
    }>(UPDATE_AI_CONFIG, {
      id,
      provider,
      model,
      encryptedApiKey,
      now,
    });

    const config = result.updateAIConfig.aIConfig[0];
    return {
      ...config,
      createdAt: new Date(config.createdAt),
      updatedAt: new Date(config.updatedAt),
    };
  }

  /**
   * Delete AI configuration
   */
  async deleteAIConfig(id: string): Promise<void> {
    await this.dgraphService.mutation(DELETE_AI_CONFIG, { id });
  }
}
