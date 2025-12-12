import { Container } from 'inversify';
import { apolloResolversTypes } from '@skilder-ai/common';
import { AIConfigRepository } from '../repositories/ai-config/ai-config.repository';
import { WorkspaceRepository } from '../repositories/workspace/workspace.repository';
import { requireAuth, requireWorkspaceAccess, requireAuthAndWorkspaceAccess } from '../database/authorization.helpers';
import { GraphQLError } from 'graphql';
import { GraphQLContext } from '../types';
import { Observable } from 'rxjs';
import { latestValueFrom } from 'rxjs-for-await';

const observableToAsyncGenerator = <T, K extends string>(
  observable: Observable<T>,
  key: K,
): AsyncGenerator<Record<K, T>> => {
  return (async function* () {
    for await (const value of latestValueFrom(observable)) {
      yield { [key]: value } as Record<K, T>;
    }
  })();
};

export const createAIConfigResolvers = (container: Container) => {
  const aiConfigRepo = container.get(AIConfigRepository);
  const workspaceRepo = container.get(WorkspaceRepository);

  return {
    Query: {
      getAIConfigs: async (
        _parent: unknown,
        { workspaceId }: { workspaceId: string },
        context: GraphQLContext,
      ): Promise<apolloResolversTypes.AiConfig[]> => {
        await requireAuthAndWorkspaceAccess(workspaceRepo, context, workspaceId);
        return aiConfigRepo.getByWorkspace(workspaceId) as Promise<apolloResolversTypes.AiConfig[]>;
      },

      getAIConfig: async (
        _parent: unknown,
        { workspaceId, key }: { workspaceId: string; key: string },
        context: GraphQLContext,
      ): Promise<apolloResolversTypes.AiConfig | null> => {
        await requireAuthAndWorkspaceAccess(workspaceRepo, context, workspaceId);
        return aiConfigRepo.findByKey(workspaceId, key) as Promise<apolloResolversTypes.AiConfig | null>;
      },
    },

    Mutation: {
      setAIConfig: async (
        _parent: unknown,
        {
          workspaceId,
          key,
          value,
          description,
        }: { workspaceId: string; key: string; value: string; description?: string | null },
        context: GraphQLContext,
      ): Promise<apolloResolversTypes.AiConfig> => {
        await requireAuthAndWorkspaceAccess(workspaceRepo, context, workspaceId);
        return aiConfigRepo.upsert(workspaceId, { key, value, description: description || undefined }) as Promise<apolloResolversTypes.AiConfig>;
      },

      deleteAIConfig: async (
        _parent: unknown,
        { id }: { id: string },
        context: GraphQLContext,
      ): Promise<boolean> => {
        const userId = requireAuth(context);
        const config = await aiConfigRepo.findById(id);
        if (!config) {
          throw new GraphQLError('AI config not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        await requireWorkspaceAccess(workspaceRepo, userId, config.workspace.id);
        return aiConfigRepo.delete(id);
      },
    },

    Subscription: {
      aiConfigs: {
        subscribe: async (
          _parent: unknown,
          { workspaceId }: { workspaceId: string },
          context: GraphQLContext,
        ) => {
          await requireAuthAndWorkspaceAccess(workspaceRepo, context, workspaceId);
          return observableToAsyncGenerator(aiConfigRepo.observeAIConfigs(workspaceId), 'aiConfigs');
        },
      },
    },
  };
};
