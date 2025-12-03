import { apolloResolversTypes, dgraphResolversTypes } from '@2ly/common';
import { Container } from 'inversify';
import { AIProviderService, AIProviderType } from '../services/ai/ai-provider.service';
import { AIProviderRepository } from '../repositories';

/**
 * Factory function to create resolver functions for GraphQL schema.
 */
export function createAIProviderResolvers(container: Container) {

  const aiProviderService = container.get(AIProviderService);
  const aiProviderRepository = container.get(AIProviderRepository);

  return {
    Query: {
      getAIProviders: (_: unknown, { workspaceId }: { workspaceId: string }) => aiProviderRepository.getByWorkspace(workspaceId),
      getAIProvider: (_: unknown, { provider, workspaceId }: { provider: apolloResolversTypes.AiProviderType; workspaceId: string }) => aiProviderRepository.findByType(workspaceId, provider.toUpperCase() as dgraphResolversTypes.AiProviderType),
      getAIModels: (_: unknown, { workspaceId }: { workspaceId: string }) => aiProviderRepository.listAllModels(workspaceId),
    },
    Mutation: {
      configureAIProvider: (
        _: unknown,
        {
          workspaceId,
          provider,
          apiKey,
          baseUrl,
        }: {
          workspaceId: string;
          provider: apolloResolversTypes.AiProviderType;
          apiKey?: string | null;
          baseUrl?: string | null;
        }
      ) => aiProviderService.configure(workspaceId, provider.toLowerCase() as AIProviderType, apiKey ?? undefined, baseUrl ?? undefined),

      removeAIProvider: (
        _: unknown,
        { providerId }: { providerId: string }
      ) => aiProviderRepository.delete(providerId),

      setDefaultAIModel: (
        _: unknown,
        { workspaceId, defaultModel }: { workspaceId: string; defaultModel: string }
      ) => aiProviderRepository.setDefaultModel(workspaceId, defaultModel),

      chatWithModel: (
        _: unknown,
        { workspaceId, model, message }: { workspaceId: string; model: string; message: string }
      ) => aiProviderService.chat(workspaceId, model, message),
    },
  };
}
