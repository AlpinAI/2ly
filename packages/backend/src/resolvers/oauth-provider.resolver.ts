import { apolloResolversTypes, dgraphResolversTypes } from '@skilder-ai/common';
import { Container } from 'inversify';
import { GraphQLError } from 'graphql';
import { OAuthProviderRepository, WorkspaceRepository } from '../repositories';
import type { OAuthProviderType } from '../repositories/oauth-provider/oauth-provider.repository';
import { GraphQLContext } from '../types';
import { requireAuth, requireWorkspaceAccess, requireAuthAndWorkspaceAccess } from '../database/authorization.helpers';

/**
 * Factory function to create resolver functions for OAuth Provider GraphQL schema.
 */
export function createOAuthProviderResolvers(container: Container) {
  const oauthProviderRepository = container.get(OAuthProviderRepository);
  const workspaceRepository = container.get(WorkspaceRepository);

  return {
    Query: {
      getOAuthProviders: async (
        _: unknown,
        { workspaceId }: { workspaceId: string },
        context: GraphQLContext
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return oauthProviderRepository.getByWorkspace(workspaceId);
      },

      getOAuthProvider: async (
        _: unknown,
        { provider, workspaceId }: { provider: apolloResolversTypes.OAuthProviderType; workspaceId: string },
        context: GraphQLContext
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return oauthProviderRepository.findByType(
          workspaceId,
          provider.toUpperCase() as dgraphResolversTypes.OAuthProviderType
        );
      },
    },
    Mutation: {
      configureOAuthProvider: async (
        _: unknown,
        {
          workspaceId,
          provider,
          clientId,
          clientSecret,
          tenantId,
        }: {
          workspaceId: string;
          provider: apolloResolversTypes.OAuthProviderType;
          clientId: string;
          clientSecret: string;
          tenantId?: string | null;
        },
        context: GraphQLContext
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return oauthProviderRepository.configure(
          workspaceId,
          provider.toLowerCase() as OAuthProviderType,
          clientId,
          clientSecret,
          tenantId ?? undefined
        );
      },

      updateOAuthProviderEnabled: async (
        _: unknown,
        { providerId, enabled }: { providerId: string; enabled: boolean },
        context: GraphQLContext
      ) => {
        const userId = requireAuth(context);
        const provider = await oauthProviderRepository.findById(providerId);
        if (!provider) {
          throw new GraphQLError('OAuth provider not found', { extensions: { code: 'NOT_FOUND' } });
        }
        await requireWorkspaceAccess(workspaceRepository, userId, provider.workspaceId);
        return oauthProviderRepository.updateEnabled(providerId, enabled);
      },

      removeOAuthProvider: async (
        _: unknown,
        { providerId }: { providerId: string },
        context: GraphQLContext
      ) => {
        const userId = requireAuth(context);
        const provider = await oauthProviderRepository.findById(providerId);
        if (!provider) {
          throw new GraphQLError('OAuth provider not found', { extensions: { code: 'NOT_FOUND' } });
        }
        await requireWorkspaceAccess(workspaceRepository, userId, provider.workspaceId);
        return oauthProviderRepository.delete(providerId);
      },
    },
  };
}
