import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Container } from 'inversify';
import { GraphQLError } from 'graphql';
import { createUserOAuthConnectionResolvers } from './user-oauth-connection.resolver';
import { UserOAuthConnectionRepository } from '../repositories/user-oauth-connection.repository';
import { WorkspaceRepository } from '../repositories/workspace.repository';
import { OAuthService } from '../services/oauth/oauth.service';
import { GraphQLContext } from '../types';
import { apolloResolversTypes, dgraphResolversTypes } from '@skilder-ai/common';
import * as authHelpers from '../database/authorization.helpers';

// Mock the rate limiter module
vi.mock('./user-oauth-connection.rate-limiter', () => ({
  checkOAuthInitiationRateLimit: vi.fn(),
}));

import { checkOAuthInitiationRateLimit } from './user-oauth-connection.rate-limiter';

describe('UserOAuthConnectionResolver', () => {
  let container: Container;
  let mockConnectionRepo: UserOAuthConnectionRepository;
  let mockWorkspaceRepo: WorkspaceRepository;
  let mockOAuthService: OAuthService;
  let resolvers: ReturnType<typeof createUserOAuthConnectionResolvers>;

  const mockUserId = '0x123';
  const mockWorkspaceId = '0xabc';
  const mockConnectionId = '0xconnection';

  // Mock OAuth connection data
  const mockConnection: dgraphResolversTypes.UserOAuthConnection = {
    id: mockConnectionId,
    provider: dgraphResolversTypes.OAuthProviderType.Google,
    user: { id: mockUserId } as dgraphResolversTypes.User,
    workspace: { id: mockWorkspaceId } as dgraphResolversTypes.Workspace,
    encryptedAccessToken: 'encrypted-token',
    accountEmail: 'user@example.com',
    accountName: 'Test User',
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
  };

  beforeEach(() => {
    // Silence console errors and warnings in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Create mock container
    container = new Container();

    // Create mock repository instances
    mockConnectionRepo = {
      findByUserAndWorkspace: vi.fn(),
      hasConnection: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as UserOAuthConnectionRepository;

    mockWorkspaceRepo = {
      hasUserAccess: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    } as unknown as WorkspaceRepository;

    mockOAuthService = {
      initiateOAuthConnection: vi.fn(),
      disconnectProvider: vi.fn(),
      handleCallback: vi.fn(),
    } as unknown as OAuthService;

    // Bind mocks to container
    container.bind(UserOAuthConnectionRepository).toConstantValue(mockConnectionRepo);
    container.bind(WorkspaceRepository).toConstantValue(mockWorkspaceRepo);
    container.bind(OAuthService).toConstantValue(mockOAuthService);

    // Reset rate limiter mock
    vi.mocked(checkOAuthInitiationRateLimit).mockReturnValue(true);

    // Create resolvers with mocked container
    resolvers = createUserOAuthConnectionResolvers(container);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Query: getUserOAuthConnections', () => {
    it('should return connections when authenticated with workspace access', async () => {
      // Arrange
      const context: GraphQLContext = {
        user: { userId: mockUserId, email: 'test@example.com' },
      } as GraphQLContext;
      const connections = [mockConnection];

      vi.spyOn(authHelpers, 'requireAuthAndWorkspaceAccess').mockResolvedValue(mockUserId);
      vi.spyOn(mockConnectionRepo, 'findByUserAndWorkspace').mockResolvedValue(connections);

      // Act
      const result = await resolvers.Query.getUserOAuthConnections(
        {},
        { workspaceId: mockWorkspaceId },
        context
      );

      // Assert
      expect(authHelpers.requireAuthAndWorkspaceAccess).toHaveBeenCalledWith(
        mockWorkspaceRepo,
        context,
        mockWorkspaceId
      );
      expect(mockConnectionRepo.findByUserAndWorkspace).toHaveBeenCalledWith(
        mockUserId,
        mockWorkspaceId
      );
      expect(result).toEqual(connections);
    });

    it('should throw UNAUTHENTICATED when no auth token', async () => {
      // Arrange
      const context: GraphQLContext = {} as GraphQLContext;

      vi.spyOn(authHelpers, 'requireAuthAndWorkspaceAccess').mockRejectedValue(
        new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      );

      // Act & Assert
      await expect(
        resolvers.Query.getUserOAuthConnections({}, { workspaceId: mockWorkspaceId }, context)
      ).rejects.toThrow(GraphQLError);
      await expect(
        resolvers.Query.getUserOAuthConnections({}, { workspaceId: mockWorkspaceId }, context)
      ).rejects.toThrow('Authentication required');
    });

    it('should throw UNAUTHORIZED when user lacks workspace access', async () => {
      // Arrange
      const context: GraphQLContext = {
        user: { userId: mockUserId, email: 'test@example.com' },
      } as GraphQLContext;

      vi.spyOn(authHelpers, 'requireAuthAndWorkspaceAccess').mockRejectedValue(
        new GraphQLError('Access denied to this workspace', {
          extensions: { code: 'FORBIDDEN', reason: 'WORKSPACE_ACCESS_DENIED' },
        })
      );

      // Act & Assert
      await expect(
        resolvers.Query.getUserOAuthConnections({}, { workspaceId: mockWorkspaceId }, context)
      ).rejects.toThrow(GraphQLError);
      await expect(
        resolvers.Query.getUserOAuthConnections({}, { workspaceId: mockWorkspaceId }, context)
      ).rejects.toThrow('Access denied to this workspace');
    });
  });

  describe('Query: hasUserOAuthConnection', () => {
    it('should return true when connection exists', async () => {
      // Arrange
      const context: GraphQLContext = {
        user: { userId: mockUserId, email: 'test@example.com' },
      } as GraphQLContext;
      const provider = apolloResolversTypes.OAuthProviderType.Google;

      vi.spyOn(authHelpers, 'requireAuthAndWorkspaceAccess').mockResolvedValue(mockUserId);
      vi.spyOn(mockConnectionRepo, 'hasConnection').mockResolvedValue(true);

      // Act
      const result = await resolvers.Query.hasUserOAuthConnection(
        {},
        { workspaceId: mockWorkspaceId, provider },
        context
      );

      // Assert
      expect(authHelpers.requireAuthAndWorkspaceAccess).toHaveBeenCalledWith(
        mockWorkspaceRepo,
        context,
        mockWorkspaceId
      );
      expect(mockConnectionRepo.hasConnection).toHaveBeenCalledWith(
        mockUserId,
        mockWorkspaceId,
        'GOOGLE'
      );
      expect(result).toBe(true);
    });

    it('should return false when no connection exists', async () => {
      // Arrange
      const context: GraphQLContext = {
        user: { userId: mockUserId, email: 'test@example.com' },
      } as GraphQLContext;
      const provider = apolloResolversTypes.OAuthProviderType.Google;

      vi.spyOn(authHelpers, 'requireAuthAndWorkspaceAccess').mockResolvedValue(mockUserId);
      vi.spyOn(mockConnectionRepo, 'hasConnection').mockResolvedValue(false);

      // Act
      const result = await resolvers.Query.hasUserOAuthConnection(
        {},
        { workspaceId: mockWorkspaceId, provider },
        context
      );

      // Assert
      expect(result).toBe(false);
    });

    it('should require authentication and workspace access', async () => {
      // Arrange
      const context: GraphQLContext = {} as GraphQLContext;
      const provider = apolloResolversTypes.OAuthProviderType.Google;

      vi.spyOn(authHelpers, 'requireAuthAndWorkspaceAccess').mockRejectedValue(
        new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      );

      // Act & Assert
      await expect(
        resolvers.Query.hasUserOAuthConnection(
          {},
          { workspaceId: mockWorkspaceId, provider },
          context
        )
      ).rejects.toThrow(GraphQLError);
    });

    it('should convert provider to uppercase when checking connection', async () => {
      // Arrange
      const context: GraphQLContext = {
        user: { userId: mockUserId, email: 'test@example.com' },
      } as GraphQLContext;
      const provider = apolloResolversTypes.OAuthProviderType.Microsoft;

      vi.spyOn(authHelpers, 'requireAuthAndWorkspaceAccess').mockResolvedValue(mockUserId);
      vi.spyOn(mockConnectionRepo, 'hasConnection').mockResolvedValue(true);

      // Act
      await resolvers.Query.hasUserOAuthConnection(
        {},
        { workspaceId: mockWorkspaceId, provider },
        context
      );

      // Assert
      expect(mockConnectionRepo.hasConnection).toHaveBeenCalledWith(
        mockUserId,
        mockWorkspaceId,
        'MICROSOFT'
      );
    });
  });

  describe('Mutation: initiateOAuthConnection', () => {
    const redirectUri = 'http://localhost:8888/oauth/callback';
    const scopes = ['email', 'profile'];

    it('should return authorization URL and state on success', async () => {
      // Arrange
      const context: GraphQLContext = {
        user: { userId: mockUserId, email: 'test@example.com' },
      } as GraphQLContext;
      const provider = apolloResolversTypes.OAuthProviderType.Google;
      const oauthResult = {
        url: 'https://accounts.google.com/o/oauth2/v2/auth?state=abc123',
        state: 'abc123',
      };

      vi.spyOn(authHelpers, 'requireAuthAndWorkspaceAccess').mockResolvedValue(mockUserId);
      vi.mocked(checkOAuthInitiationRateLimit).mockReturnValue(true);
      vi.spyOn(mockOAuthService, 'initiateOAuthConnection').mockResolvedValue(oauthResult);

      // Act
      const result = await resolvers.Mutation.initiateOAuthConnection(
        {},
        { workspaceId: mockWorkspaceId, provider, redirectUri, scopes },
        context
      );

      // Assert
      expect(authHelpers.requireAuthAndWorkspaceAccess).toHaveBeenCalledWith(
        mockWorkspaceRepo,
        context,
        mockWorkspaceId
      );
      expect(checkOAuthInitiationRateLimit).toHaveBeenCalledWith(mockUserId);
      expect(mockOAuthService.initiateOAuthConnection).toHaveBeenCalledWith(
        mockUserId,
        mockWorkspaceId,
        'GOOGLE',
        redirectUri,
        scopes
      );
      expect(result).toEqual({
        url: oauthResult.url,
        state: oauthResult.state,
      });
    });

    it('should handle null scopes parameter', async () => {
      // Arrange
      const context: GraphQLContext = {
        user: { userId: mockUserId, email: 'test@example.com' },
      } as GraphQLContext;
      const provider = apolloResolversTypes.OAuthProviderType.Google;
      const oauthResult = {
        url: 'https://accounts.google.com/o/oauth2/v2/auth?state=abc123',
        state: 'abc123',
      };

      vi.spyOn(authHelpers, 'requireAuthAndWorkspaceAccess').mockResolvedValue(mockUserId);
      vi.mocked(checkOAuthInitiationRateLimit).mockReturnValue(true);
      vi.spyOn(mockOAuthService, 'initiateOAuthConnection').mockResolvedValue(oauthResult);

      // Act
      await resolvers.Mutation.initiateOAuthConnection(
        {},
        { workspaceId: mockWorkspaceId, provider, redirectUri, scopes: null },
        context
      );

      // Assert
      expect(mockOAuthService.initiateOAuthConnection).toHaveBeenCalledWith(
        mockUserId,
        mockWorkspaceId,
        'GOOGLE',
        redirectUri,
        undefined
      );
    });

    it('should throw RATE_LIMITED when rate limit exceeded', async () => {
      // Arrange
      const context: GraphQLContext = {
        user: { userId: mockUserId, email: 'test@example.com' },
      } as GraphQLContext;
      const provider = apolloResolversTypes.OAuthProviderType.Google;

      vi.spyOn(authHelpers, 'requireAuthAndWorkspaceAccess').mockResolvedValue(mockUserId);
      vi.mocked(checkOAuthInitiationRateLimit).mockReturnValue(false);

      // Act & Assert
      await expect(
        resolvers.Mutation.initiateOAuthConnection(
          {},
          { workspaceId: mockWorkspaceId, provider, redirectUri, scopes },
          context
        )
      ).rejects.toThrow(GraphQLError);

      await expect(
        resolvers.Mutation.initiateOAuthConnection(
          {},
          { workspaceId: mockWorkspaceId, provider, redirectUri, scopes },
          context
        )
      ).rejects.toMatchObject({
        message: 'Too many OAuth initiation attempts. Please try again later.',
        extensions: { code: 'RATE_LIMITED' },
      });

      expect(mockOAuthService.initiateOAuthConnection).not.toHaveBeenCalled();
    });

    it('should throw OAUTH_ERROR when service fails', async () => {
      // Arrange
      const context: GraphQLContext = {
        user: { userId: mockUserId, email: 'test@example.com' },
      } as GraphQLContext;
      const provider = apolloResolversTypes.OAuthProviderType.Google;
      const errorMessage = 'Invalid OAuth configuration';

      vi.spyOn(authHelpers, 'requireAuthAndWorkspaceAccess').mockResolvedValue(mockUserId);
      vi.mocked(checkOAuthInitiationRateLimit).mockReturnValue(true);
      vi.spyOn(mockOAuthService, 'initiateOAuthConnection').mockRejectedValue(
        new Error(errorMessage)
      );

      // Act & Assert
      await expect(
        resolvers.Mutation.initiateOAuthConnection(
          {},
          { workspaceId: mockWorkspaceId, provider, redirectUri, scopes },
          context
        )
      ).rejects.toMatchObject({
        message: errorMessage,
        extensions: { code: 'OAUTH_ERROR' },
      });
    });

    it('should throw OAUTH_ERROR with fallback message for non-Error failures', async () => {
      // Arrange
      const context: GraphQLContext = {
        user: { userId: mockUserId, email: 'test@example.com' },
      } as GraphQLContext;
      const provider = apolloResolversTypes.OAuthProviderType.Google;

      vi.spyOn(authHelpers, 'requireAuthAndWorkspaceAccess').mockResolvedValue(mockUserId);
      vi.mocked(checkOAuthInitiationRateLimit).mockReturnValue(true);
      vi.spyOn(mockOAuthService, 'initiateOAuthConnection').mockRejectedValue('Unknown error');

      // Act & Assert
      await expect(
        resolvers.Mutation.initiateOAuthConnection(
          {},
          { workspaceId: mockWorkspaceId, provider, redirectUri, scopes },
          context
        )
      ).rejects.toMatchObject({
        message: 'Failed to initiate OAuth connection',
        extensions: { code: 'OAUTH_ERROR' },
      });
    });

    it('should require authentication and workspace access', async () => {
      // Arrange
      const context: GraphQLContext = {} as GraphQLContext;
      const provider = apolloResolversTypes.OAuthProviderType.Google;

      vi.spyOn(authHelpers, 'requireAuthAndWorkspaceAccess').mockRejectedValue(
        new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      );

      // Act & Assert
      await expect(
        resolvers.Mutation.initiateOAuthConnection(
          {},
          { workspaceId: mockWorkspaceId, provider, redirectUri },
          context
        )
      ).rejects.toThrow(GraphQLError);

      expect(checkOAuthInitiationRateLimit).not.toHaveBeenCalled();
      expect(mockOAuthService.initiateOAuthConnection).not.toHaveBeenCalled();
    });
  });

  describe('Mutation: disconnectOAuthProvider', () => {
    // Simplified connection returned by findById
    const mockFindByIdResult = {
      id: mockConnectionId,
      provider: dgraphResolversTypes.OAuthProviderType.Google,
      workspaceId: mockWorkspaceId,
      userId: mockUserId,
    };

    it('should return true on successful disconnect', async () => {
      // Arrange
      const context: GraphQLContext = {
        user: { userId: mockUserId, email: 'test@example.com' },
      } as GraphQLContext;

      vi.spyOn(authHelpers, 'requireAuth').mockReturnValue(mockUserId);
      vi.spyOn(mockConnectionRepo, 'findById').mockResolvedValue(mockFindByIdResult);
      vi.spyOn(mockOAuthService, 'disconnectProvider').mockResolvedValue(true);

      // Act
      const result = await resolvers.Mutation.disconnectOAuthProvider(
        {},
        { connectionId: mockConnectionId },
        context
      );

      // Assert
      expect(authHelpers.requireAuth).toHaveBeenCalledWith(context);
      expect(mockConnectionRepo.findById).toHaveBeenCalledWith(mockConnectionId);
      expect(mockOAuthService.disconnectProvider).toHaveBeenCalledWith(
        mockConnectionId,
        mockUserId
      );
      expect(result).toBe(true);
    });

    it('should throw NOT_FOUND when connection does not exist', async () => {
      // Arrange
      const context: GraphQLContext = {
        user: { userId: mockUserId, email: 'test@example.com' },
      } as GraphQLContext;

      vi.spyOn(authHelpers, 'requireAuth').mockReturnValue(mockUserId);
      vi.spyOn(mockConnectionRepo, 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(
        resolvers.Mutation.disconnectOAuthProvider({}, { connectionId: mockConnectionId }, context)
      ).rejects.toMatchObject({
        message: 'Connection not found',
        extensions: { code: 'NOT_FOUND' },
      });

      expect(mockOAuthService.disconnectProvider).not.toHaveBeenCalled();
    });

    it('should throw UNAUTHORIZED when user does not own connection', async () => {
      // Arrange
      const context: GraphQLContext = {
        user: { userId: mockUserId, email: 'test@example.com' },
      } as GraphQLContext;
      const differentUserConnection = {
        ...mockFindByIdResult,
        userId: '0xdifferent',
      };

      vi.spyOn(authHelpers, 'requireAuth').mockReturnValue(mockUserId);
      vi.spyOn(mockConnectionRepo, 'findById').mockResolvedValue(differentUserConnection);

      // Act & Assert
      await expect(
        resolvers.Mutation.disconnectOAuthProvider({}, { connectionId: mockConnectionId }, context)
      ).rejects.toMatchObject({
        message: 'Unauthorized',
        extensions: { code: 'UNAUTHORIZED' },
      });

      expect(mockOAuthService.disconnectProvider).not.toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      // Arrange
      const context: GraphQLContext = {} as GraphQLContext;

      vi.spyOn(authHelpers, 'requireAuth').mockImplementation(() => {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      });

      // Act & Assert
      await expect(
        resolvers.Mutation.disconnectOAuthProvider({}, { connectionId: mockConnectionId }, context)
      ).rejects.toThrow(GraphQLError);

      expect(mockConnectionRepo.findById).not.toHaveBeenCalled();
      expect(mockOAuthService.disconnectProvider).not.toHaveBeenCalled();
    });

    it('should throw OAUTH_ERROR when disconnect fails', async () => {
      // Arrange
      const context: GraphQLContext = {
        user: { userId: mockUserId, email: 'test@example.com' },
      } as GraphQLContext;
      const errorMessage = 'Failed to revoke token';

      vi.spyOn(authHelpers, 'requireAuth').mockReturnValue(mockUserId);
      vi.spyOn(mockConnectionRepo, 'findById').mockResolvedValue(mockFindByIdResult);
      vi.spyOn(mockOAuthService, 'disconnectProvider').mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(
        resolvers.Mutation.disconnectOAuthProvider({}, { connectionId: mockConnectionId }, context)
      ).rejects.toMatchObject({
        message: errorMessage,
        extensions: { code: 'OAUTH_ERROR' },
      });
    });

    it('should throw OAUTH_ERROR with fallback message for non-Error failures', async () => {
      // Arrange
      const context: GraphQLContext = {
        user: { userId: mockUserId, email: 'test@example.com' },
      } as GraphQLContext;

      vi.spyOn(authHelpers, 'requireAuth').mockReturnValue(mockUserId);
      vi.spyOn(mockConnectionRepo, 'findById').mockResolvedValue(mockFindByIdResult);
      vi.spyOn(mockOAuthService, 'disconnectProvider').mockRejectedValue('Unknown error');

      // Act & Assert
      await expect(
        resolvers.Mutation.disconnectOAuthProvider({}, { connectionId: mockConnectionId }, context)
      ).rejects.toMatchObject({
        message: 'Failed to disconnect OAuth provider',
        extensions: { code: 'OAUTH_ERROR' },
      });
    });
  });
});
