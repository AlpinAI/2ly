import { apolloResolversTypes, dgraphResolversTypes, AIProviderCoreService, type AIProviderType } from '@2ly/common';
import { Container } from 'inversify';
import { GraphQLError } from 'graphql';
import { AIProviderRepository, WorkspaceRepository } from '../repositories';
import { GraphQLContext } from '../types';
import { requireAuth, requireWorkspaceAccess, requireAuthAndWorkspaceAccess } from '../database/authorization.helpers';

/**
 * Factory function to create resolver functions for GraphQL schema.
 */
export function createAIProviderResolvers(container: Container) {
  const aiProviderRepository = container.get(AIProviderRepository);
  const aiProviderCoreService = container.get(AIProviderCoreService);
  const workspaceRepository = container.get(WorkspaceRepository);

  return {
    Query: {
      getAIProviders: async (
        _: unknown,
        { workspaceId }: { workspaceId: string },
        context: GraphQLContext
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return aiProviderRepository.getByWorkspace(workspaceId);
      },

      getAIProvider: async (
        _: unknown,
        { provider, workspaceId }: { provider: apolloResolversTypes.AiProviderType; workspaceId: string },
        context: GraphQLContext
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return aiProviderRepository.findByType(workspaceId, provider.toUpperCase() as dgraphResolversTypes.AiProviderType);
      },

      getAIModels: async (
        _: unknown,
        { workspaceId }: { workspaceId: string },
        context: GraphQLContext
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return aiProviderRepository.listAllModels(workspaceId);
      },
    },
    Mutation: {
      configureAIProvider: async (
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
        },
        context: GraphQLContext
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return aiProviderRepository.configure(workspaceId, provider.toLowerCase() as AIProviderType, apiKey ?? undefined, baseUrl ?? undefined);
      },

      removeAIProvider: async (
        _: unknown,
        { providerId }: { providerId: string },
        context: GraphQLContext
      ) => {
        const userId = requireAuth(context);
        const provider = await aiProviderRepository.findById(providerId);
        if (!provider) {
          throw new GraphQLError('AI provider not found', { extensions: { code: 'NOT_FOUND' } });
        }
        await requireWorkspaceAccess(workspaceRepository, userId, provider.workspaceId);
        return aiProviderRepository.delete(providerId);
      },

      setDefaultAIModel: async (
        _: unknown,
        { workspaceId, defaultModel }: { workspaceId: string; defaultModel: string },
        context: GraphQLContext
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return aiProviderRepository.setDefaultModel(workspaceId, defaultModel);
      },

      chatWithModel: async (
        _: unknown,
        { workspaceId, model, message }: { workspaceId: string; model: string; message: string },
        context: GraphQLContext
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        const { provider, modelName } = aiProviderCoreService.parseModelString(model);
        const config = await aiProviderRepository.getDecryptedConfig(workspaceId, provider);
        return aiProviderCoreService.chat(config, provider, modelName, message);
      },
    },
  };
}
