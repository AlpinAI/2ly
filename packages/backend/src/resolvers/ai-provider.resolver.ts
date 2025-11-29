import { apolloResolversTypes } from '@2ly/common';
import { AIProviderService } from '../services/ai/ai-provider.service';
import type { AIProviderType } from '../services/ai/ai-client.interface';

/**
 * AI Provider resolvers for GraphQL queries and mutations.
 */
export class AIProviderResolver {
  constructor(private readonly aiProviderService: AIProviderService) {}

  /**
   * Get all AI providers configured for a workspace.
   */
  async aiProviders(workspaceId: string): Promise<apolloResolversTypes.AiProviderConfig[]> {
    const providers = await this.aiProviderService.getProviders(workspaceId);

    // Map to Apollo types, adding computed isConfigured field
    return providers.map((p) => ({
      id: p.id,
      provider: p.provider,
      isConfigured: !!p.encryptedApiKey || p.provider === 'OLLAMA',
      isActive: p.isActive,
      defaultModel: p.defaultModel,
      baseUrl: p.baseUrl,
      availableModels: p.availableModels,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  }

  /**
   * Get available models for a specific provider.
   */
  async aiProviderModels(workspaceId: string, provider: apolloResolversTypes.AiProviderType): Promise<string[]> {
    const providerLower = provider.toLowerCase() as AIProviderType;
    return this.aiProviderService.getProviderModels(workspaceId, providerLower);
  }

  /**
   * Configure an AI provider with credentials.
   */
  async configureAIProvider(
    workspaceId: string,
    provider: apolloResolversTypes.AiProviderType,
    apiKey?: string | null,
    baseUrl?: string | null,
    defaultModel?: string | null
  ): Promise<apolloResolversTypes.AiProviderValidation> {
    const providerLower = provider.toLowerCase() as AIProviderType;

    const result = await this.aiProviderService.configureProvider(workspaceId, providerLower, {
      apiKey,
      baseUrl,
      defaultModel,
    });

    return {
      valid: result.valid,
      error: result.error,
      availableModels: result.availableModels,
    };
  }

  /**
   * Set a provider as the active one for the workspace.
   */
  async setActiveAIProvider(
    workspaceId: string,
    provider: apolloResolversTypes.AiProviderType
  ): Promise<apolloResolversTypes.AiProviderConfig> {
    const providerLower = provider.toLowerCase() as AIProviderType;
    const config = await this.aiProviderService.setActiveProvider(workspaceId, providerLower);

    return {
      id: config.id,
      provider: config.provider,
      isConfigured: !!config.encryptedApiKey || config.provider === 'OLLAMA',
      isActive: config.isActive,
      defaultModel: config.defaultModel,
      baseUrl: config.baseUrl,
      availableModels: config.availableModels,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Remove a provider configuration.
   */
  async removeAIProvider(workspaceId: string, provider: apolloResolversTypes.AiProviderType): Promise<boolean> {
    const providerLower = provider.toLowerCase() as AIProviderType;
    return this.aiProviderService.removeProvider(workspaceId, providerLower);
  }

  /**
   * Test an AI provider with a sample prompt.
   */
  async testAIProvider(
    workspaceId: string,
    provider: apolloResolversTypes.AiProviderType,
    prompt?: string | null
  ): Promise<string> {
    const providerLower = provider.toLowerCase() as AIProviderType;
    return this.aiProviderService.testProvider(workspaceId, providerLower, prompt ?? undefined);
  }
}

/**
 * Factory function to create resolver functions for GraphQL schema.
 */
export function createAIProviderResolvers(aiProviderService: AIProviderService) {
  const resolver = new AIProviderResolver(aiProviderService);

  return {
    Query: {
      aiProviders: (_: unknown, { workspaceId }: { workspaceId: string }) => resolver.aiProviders(workspaceId),

      aiProviderModels: (
        _: unknown,
        { workspaceId, provider }: { workspaceId: string; provider: apolloResolversTypes.AiProviderType }
      ) => resolver.aiProviderModels(workspaceId, provider),
    },
    Mutation: {
      configureAIProvider: (
        _: unknown,
        {
          workspaceId,
          provider,
          apiKey,
          baseUrl,
          defaultModel,
        }: {
          workspaceId: string;
          provider: apolloResolversTypes.AiProviderType;
          apiKey?: string | null;
          baseUrl?: string | null;
          defaultModel?: string | null;
        }
      ) => resolver.configureAIProvider(workspaceId, provider, apiKey, baseUrl, defaultModel),

      setActiveAIProvider: (
        _: unknown,
        { workspaceId, provider }: { workspaceId: string; provider: apolloResolversTypes.AiProviderType }
      ) => resolver.setActiveAIProvider(workspaceId, provider),

      removeAIProvider: (
        _: unknown,
        { workspaceId, provider }: { workspaceId: string; provider: apolloResolversTypes.AiProviderType }
      ) => resolver.removeAIProvider(workspaceId, provider),

      testAIProvider: (
        _: unknown,
        {
          workspaceId,
          provider,
          prompt,
        }: { workspaceId: string; provider: apolloResolversTypes.AiProviderType; prompt?: string | null }
      ) => resolver.testAIProvider(workspaceId, provider, prompt),
    },
  };
}
