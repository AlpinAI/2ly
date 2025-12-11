import { apolloResolversTypes, dgraphResolversTypes } from '@skilder-ai/common';
import { Container } from 'inversify';
import { GraphQLError } from 'graphql';
import { UserOAuthConnectionRepository, WorkspaceRepository } from '../repositories';
import { OAuthService } from '../services/oauth';
import { GraphQLContext } from '../types';
import { requireAuth, requireAuthAndWorkspaceAccess } from '../database/authorization.helpers';
import { checkOAuthInitiationRateLimit } from './user-oauth-connection.rate-limiter';

/**
 * Factory function to create resolver functions for User OAuth Connection GraphQL schema.
 */
export function createUserOAuthConnectionResolvers(container: Container) {
  const connectionRepo = container.get(UserOAuthConnectionRepository);
  const workspaceRepository = container.get(WorkspaceRepository);
  const oauthService = container.get(OAuthService);

  return {
    Query: {
      getUserOAuthConnections: async (
        _: unknown,
        { workspaceId }: { workspaceId: string },
        context: GraphQLContext
      ) => {
        const userId = await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return connectionRepo.findByUserAndWorkspace(userId, workspaceId);
      },

      hasUserOAuthConnection: async (
        _: unknown,
        { workspaceId, provider }: { workspaceId: string; provider: apolloResolversTypes.OAuthProviderType },
        context: GraphQLContext
      ) => {
        const userId = await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return connectionRepo.hasConnection(
          userId,
          workspaceId,
          provider.toUpperCase() as dgraphResolversTypes.OAuthProviderType
        );
      },
    },
    Mutation: {
      initiateOAuthConnection: async (
        _: unknown,
        {
          workspaceId,
          provider,
          redirectUri,
          scopes,
        }: {
          workspaceId: string;
          provider: apolloResolversTypes.OAuthProviderType;
          redirectUri: string;
          scopes?: string[] | null;
        },
        context: GraphQLContext
      ) => {
        const userId = await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);

        // Rate limit OAuth initiation to prevent abuse
        if (!checkOAuthInitiationRateLimit(userId)) {
          throw new GraphQLError('Too many OAuth initiation attempts. Please try again later.', {
            extensions: { code: 'RATE_LIMITED' },
          });
        }

        try {
          const result = await oauthService.initiateOAuthConnection(
            userId,
            workspaceId,
            provider.toUpperCase() as dgraphResolversTypes.OAuthProviderType,
            redirectUri,
            scopes ?? undefined
          );

          return {
            url: result.url,
            state: result.state,
          };
        } catch (error) {
          throw new GraphQLError(
            error instanceof Error ? error.message : 'Failed to initiate OAuth connection',
            { extensions: { code: 'OAUTH_ERROR' } }
          );
        }
      },

      disconnectOAuthProvider: async (
        _: unknown,
        { connectionId }: { connectionId: string },
        context: GraphQLContext
      ) => {
        const userId = requireAuth(context);

        // Verify ownership
        const connection = await connectionRepo.findById(connectionId);
        if (!connection) {
          throw new GraphQLError('Connection not found', { extensions: { code: 'NOT_FOUND' } });
        }
        if (connection.userId !== userId) {
          throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHORIZED' } });
        }

        try {
          await oauthService.disconnectProvider(connectionId, userId);
          return true;
        } catch (error) {
          throw new GraphQLError(
            error instanceof Error ? error.message : 'Failed to disconnect OAuth provider',
            { extensions: { code: 'OAUTH_ERROR' } }
          );
        }
      },
    },
  };
}
