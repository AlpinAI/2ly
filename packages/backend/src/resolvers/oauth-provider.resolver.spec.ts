import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Container } from 'inversify';
import { GraphQLError } from 'graphql';
import { createOAuthProviderResolvers } from './oauth-provider.resolver';
import { OAuthProviderRepository } from '../repositories/oauth-provider.repository';
import { WorkspaceRepository } from '../repositories/workspace.repository';
import { GraphQLContext } from '../types';
import { apolloResolversTypes, dgraphResolversTypes } from '@skilder-ai/common';
import * as authHelpers from '../database/authorization.helpers';

describe('OAuthProviderResolver', () => {
  let container: Container;
  let mockProviderRepo: OAuthProviderRepository;
  let mockWorkspaceRepo: WorkspaceRepository;
  let resolvers: ReturnType<typeof createOAuthProviderResolvers>;

  const mockUserId = '0x123';
  const mockWorkspaceId = '0xabc';
  const mockProviderId = '0xprovider';

  // Mock OAuth provider config data
  const mockProviderConfig: dgraphResolversTypes.OAuthProviderConfig = {
    id: mockProviderId,
    provider: dgraphResolversTypes.OAuthProviderType.Google,
    enabled: true,
    clientId: 'test-client-id',
    encryptedClientSecret: 'encrypted-secret',
    workspace: { id: mockWorkspaceId } as dgraphResolversTypes.Workspace,
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
    mockProviderRepo = {
      getByWorkspace: vi.fn(),
      findByType: vi.fn(),
      findById: vi.fn(),
      configure: vi.fn(),
      updateEnabled: vi.fn(),
      delete: vi.fn(),
    } as unknown as OAuthProviderRepository;

    mockWorkspaceRepo = {
      hasUserAccess: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    } as unknown as WorkspaceRepository;

    // Bind mocks to container
    container.bind(OAuthProviderRepository).toConstantValue(mockProviderRepo);
    container.bind(WorkspaceRepository).toConstantValue(mockWorkspaceRepo);

    // Create resolvers with mocked container
    resolvers = createOAuthProviderResolvers(container);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Query: getOAuthProviders', () => {
    it('should return providers when authenticated with workspace access', async () => {
      // Arrange
      const context: GraphQLContext = {
        user: { userId: mockUserId, email: 'test@example.com' },
      } as GraphQLContext;
      const providers = [mockProviderConfig];

      vi.spyOn(authHelpers, 'requireAuthAndWorkspaceAccess').mockResolvedValue(mockUserId);
      vi.spyOn(mockProviderRepo, 'getByWorkspace').mockResolvedValue(providers);

      // Act
      const result = await resolvers.Query.getOAuthProviders(
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
      expect(mockProviderRepo.getByWorkspace).toHaveBeenCalledWith(mockWorkspaceId);
      expect(result).toEqual(providers);
    });

    it('should throw when not authenticated', async () => {
      // Arrange
      const context: GraphQLContext = {} as GraphQLContext;

      vi.spyOn(authHelpers, 'requireAuthAndWorkspaceAccess').mockRejectedValue(
        new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      );

      // Act & Assert
      await expect(
        resolvers.Query.getOAuthProviders({}, { workspaceId: mockWorkspaceId }, context)
      ).rejects.toThrow(GraphQLError);
      await expect(
        resolvers.Query.getOAuthProviders({}, { workspaceId: mockWorkspaceId }, context)
      ).rejects.toThrow('Authentication required');
    });

    it('should throw when user lacks workspace access', async () => {
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
        resolvers.Query.getOAuthProviders({}, { workspaceId: mockWorkspaceId }, context)
      ).rejects.toThrow(GraphQLError);
      await expect(
        resolvers.Query.getOAuthProviders({}, { workspaceId: mockWorkspaceId }, context)
      ).rejects.toThrow('Access denied to this workspace');
    });
  });

  describe('Query: getOAuthProvider', () => {
    it('should return provider config when found', async () => {
      // Arrange
      const context: GraphQLContext = {
        user: { userId: mockUserId, email: 'test@example.com' },
      } as GraphQLContext;
      const provider: apolloResolversTypes.OAuthProviderType = apolloResolversTypes.OAuthProviderType.Google;

      vi.spyOn(authHelpers, 'requireAuthAndWorkspaceAccess').mockResolvedValue(mockUserId);
      vi.spyOn(mockProviderRepo, 'findByType').mockResolvedValue(mockProviderConfig);

      // Act
      const result = await resolvers.Query.getOAuthProvider(
        {},
        { provider, workspaceId: mockWorkspaceId },
        context
      );

      // Assert
      expect(authHelpers.requireAuthAndWorkspaceAccess).toHaveBeenCalledWith(
        mockWorkspaceRepo,
        context,
        mockWorkspaceId
      );
      expect(mockProviderRepo.findByType).toHaveBeenCalledWith(mockWorkspaceId, 'GOOGLE');
      expect(result).toEqual(mockProviderConfig);
    });

    it('should return null when provider not found', async () => {
      // Arrange
      const context: GraphQLContext = {
        user: { userId: mockUserId, email: 'test@example.com' },
      } as GraphQLContext;
      const provider: apolloResolversTypes.OAuthProviderType = apolloResolversTypes.OAuthProviderType.Google;

      vi.spyOn(authHelpers, 'requireAuthAndWorkspaceAccess').mockResolvedValue(mockUserId);
      vi.spyOn(mockProviderRepo, 'findByType').mockResolvedValue(null);

      // Act
      const result = await resolvers.Query.getOAuthProvider(
        {},
        { provider, workspaceId: mockWorkspaceId },
        context
      );

      // Assert
      expect(mockProviderRepo.findByType).toHaveBeenCalledWith(mockWorkspaceId, 'GOOGLE');
      expect(result).toBeNull();
    });

    it('should require authentication and workspace access', async () => {
      // Arrange
      const context: GraphQLContext = {} as GraphQLContext;
      const provider: apolloResolversTypes.OAuthProviderType = apolloResolversTypes.OAuthProviderType.Google;

      vi.spyOn(authHelpers, 'requireAuthAndWorkspaceAccess').mockRejectedValue(
        new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      );

      // Act & Assert
      await expect(
        resolvers.Query.getOAuthProvider({}, { provider, workspaceId: mockWorkspaceId }, context)
      ).rejects.toThrow(GraphQLError);

      expect(mockProviderRepo.findByType).not.toHaveBeenCalled();
    });
  });

  describe('Mutation: configureOAuthProvider', () => {
    it('should configure provider successfully', async () => {
      // Arrange
      const context: GraphQLContext = {
        user: { userId: mockUserId, email: 'test@example.com' },
      } as GraphQLContext;
      const provider: apolloResolversTypes.OAuthProviderType = apolloResolversTypes.OAuthProviderType.Google;
      const clientId = 'test-client-id';
      const clientSecret = 'test-client-secret';
      const validationResult = { valid: true };

      vi.spyOn(authHelpers, 'requireAuthAndWorkspaceAccess').mockResolvedValue(mockUserId);
      vi.spyOn(mockProviderRepo, 'configure').mockResolvedValue(validationResult);

      // Act
      const result = await resolvers.Mutation.configureOAuthProvider(
        {},
        { workspaceId: mockWorkspaceId, provider, clientId, clientSecret },
        context
      );

      // Assert
      expect(authHelpers.requireAuthAndWorkspaceAccess).toHaveBeenCalledWith(
        mockWorkspaceRepo,
        context,
        mockWorkspaceId
      );
      expect(mockProviderRepo.configure).toHaveBeenCalledWith(
        mockWorkspaceId,
        'google',
        clientId,
        clientSecret,
        undefined
      );
      expect(result).toEqual(validationResult);
    });

    it('should pass tenantId when provided', async () => {
      // Arrange
      const context: GraphQLContext = {
        user: { userId: mockUserId, email: 'test@example.com' },
      } as GraphQLContext;
      const provider: apolloResolversTypes.OAuthProviderType = apolloResolversTypes.OAuthProviderType.Microsoft;
      const clientId = 'test-client-id';
      const clientSecret = 'test-client-secret';
      const tenantId = 'test-tenant-id';
      const validationResult = { valid: true };

      vi.spyOn(authHelpers, 'requireAuthAndWorkspaceAccess').mockResolvedValue(mockUserId);
      vi.spyOn(mockProviderRepo, 'configure').mockResolvedValue(validationResult);

      // Act
      await resolvers.Mutation.configureOAuthProvider(
        {},
        { workspaceId: mockWorkspaceId, provider, clientId, clientSecret, tenantId },
        context
      );

      // Assert
      expect(mockProviderRepo.configure).toHaveBeenCalledWith(
        mockWorkspaceId,
        'microsoft',
        clientId,
        clientSecret,
        tenantId
      );
    });

    it('should pass undefined tenantId when null', async () => {
      // Arrange
      const context: GraphQLContext = {
        user: { userId: mockUserId, email: 'test@example.com' },
      } as GraphQLContext;
      const provider: apolloResolversTypes.OAuthProviderType = apolloResolversTypes.OAuthProviderType.Google;
      const clientId = 'test-client-id';
      const clientSecret = 'test-client-secret';
      const validationResult = { valid: true };

      vi.spyOn(authHelpers, 'requireAuthAndWorkspaceAccess').mockResolvedValue(mockUserId);
      vi.spyOn(mockProviderRepo, 'configure').mockResolvedValue(validationResult);

      // Act
      await resolvers.Mutation.configureOAuthProvider(
        {},
        { workspaceId: mockWorkspaceId, provider, clientId, clientSecret, tenantId: null },
        context
      );

      // Assert
      expect(mockProviderRepo.configure).toHaveBeenCalledWith(
        mockWorkspaceId,
        'google',
        clientId,
        clientSecret,
        undefined
      );
    });

    it('should require authentication and workspace access', async () => {
      // Arrange
      const context: GraphQLContext = {} as GraphQLContext;
      const provider: apolloResolversTypes.OAuthProviderType = apolloResolversTypes.OAuthProviderType.Google;
      const clientId = 'test-client-id';
      const clientSecret = 'test-client-secret';

      vi.spyOn(authHelpers, 'requireAuthAndWorkspaceAccess').mockRejectedValue(
        new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      );

      // Act & Assert
      await expect(
        resolvers.Mutation.configureOAuthProvider(
          {},
          { workspaceId: mockWorkspaceId, provider, clientId, clientSecret },
          context
        )
      ).rejects.toThrow(GraphQLError);

      expect(mockProviderRepo.configure).not.toHaveBeenCalled();
    });
  });

  describe('Mutation: updateOAuthProviderEnabled', () => {
    it('should update enabled status successfully', async () => {
      // Arrange
      const context: GraphQLContext = {
        user: { userId: mockUserId, email: 'test@example.com' },
      } as GraphQLContext;
      const enabled = false;
      const updatedConfig = { ...mockProviderConfig, enabled: false };

      vi.spyOn(authHelpers, 'requireAuth').mockReturnValue(mockUserId);
      vi.spyOn(mockProviderRepo, 'findById').mockResolvedValue({
        id: mockProviderId,
        provider: 'GOOGLE',
        workspaceId: mockWorkspaceId,
      });
      vi.spyOn(authHelpers, 'requireWorkspaceAccess').mockResolvedValue(undefined);
      vi.spyOn(mockProviderRepo, 'updateEnabled').mockResolvedValue(updatedConfig);

      // Act
      const result = await resolvers.Mutation.updateOAuthProviderEnabled(
        {},
        { providerId: mockProviderId, enabled },
        context
      );

      // Assert
      expect(authHelpers.requireAuth).toHaveBeenCalledWith(context);
      expect(mockProviderRepo.findById).toHaveBeenCalledWith(mockProviderId);
      expect(authHelpers.requireWorkspaceAccess).toHaveBeenCalledWith(
        mockWorkspaceRepo,
        mockUserId,
        mockWorkspaceId
      );
      expect(mockProviderRepo.updateEnabled).toHaveBeenCalledWith(mockProviderId, enabled);
      expect(result).toEqual(updatedConfig);
    });

    it('should throw NOT_FOUND when provider does not exist', async () => {
      // Arrange
      const context: GraphQLContext = {
        user: { userId: mockUserId, email: 'test@example.com' },
      } as GraphQLContext;
      const enabled = false;

      vi.spyOn(authHelpers, 'requireAuth').mockReturnValue(mockUserId);
      vi.spyOn(mockProviderRepo, 'findById').mockResolvedValue(null);
      const requireWorkspaceAccessSpy = vi.spyOn(authHelpers, 'requireWorkspaceAccess');

      // Act & Assert
      await expect(
        resolvers.Mutation.updateOAuthProviderEnabled(
          {},
          { providerId: mockProviderId, enabled },
          context
        )
      ).rejects.toMatchObject({
        message: 'OAuth provider not found',
        extensions: { code: 'NOT_FOUND' },
      });

      expect(requireWorkspaceAccessSpy).not.toHaveBeenCalled();
      expect(mockProviderRepo.updateEnabled).not.toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      // Arrange
      const context: GraphQLContext = {} as GraphQLContext;
      const enabled = false;

      vi.spyOn(authHelpers, 'requireAuth').mockImplementation(() => {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      });

      // Act & Assert
      await expect(
        resolvers.Mutation.updateOAuthProviderEnabled(
          {},
          { providerId: mockProviderId, enabled },
          context
        )
      ).rejects.toThrow(GraphQLError);

      expect(mockProviderRepo.findById).not.toHaveBeenCalled();
      expect(mockProviderRepo.updateEnabled).not.toHaveBeenCalled();
    });

    it('should verify workspace access via provider lookup', async () => {
      // Arrange
      const context: GraphQLContext = {
        user: { userId: mockUserId, email: 'test@example.com' },
      } as GraphQLContext;
      const enabled = true;

      vi.spyOn(authHelpers, 'requireAuth').mockReturnValue(mockUserId);
      vi.spyOn(mockProviderRepo, 'findById').mockResolvedValue({
        id: mockProviderId,
        provider: 'GOOGLE',
        workspaceId: mockWorkspaceId,
      });
      vi.spyOn(authHelpers, 'requireWorkspaceAccess').mockRejectedValue(
        new GraphQLError('Access denied to this workspace', {
          extensions: { code: 'FORBIDDEN', reason: 'WORKSPACE_ACCESS_DENIED' },
        })
      );

      // Act & Assert
      await expect(
        resolvers.Mutation.updateOAuthProviderEnabled(
          {},
          { providerId: mockProviderId, enabled },
          context
        )
      ).rejects.toThrow('Access denied to this workspace');

      expect(mockProviderRepo.findById).toHaveBeenCalledWith(mockProviderId);
      expect(authHelpers.requireWorkspaceAccess).toHaveBeenCalledWith(
        mockWorkspaceRepo,
        mockUserId,
        mockWorkspaceId
      );
      expect(mockProviderRepo.updateEnabled).not.toHaveBeenCalled();
    });
  });

  describe('Mutation: removeOAuthProvider', () => {
    it('should remove provider successfully', async () => {
      // Arrange
      const context: GraphQLContext = {
        user: { userId: mockUserId, email: 'test@example.com' },
      } as GraphQLContext;

      vi.spyOn(authHelpers, 'requireAuth').mockReturnValue(mockUserId);
      vi.spyOn(mockProviderRepo, 'findById').mockResolvedValue({
        id: mockProviderId,
        provider: 'GOOGLE',
        workspaceId: mockWorkspaceId,
      });
      vi.spyOn(authHelpers, 'requireWorkspaceAccess').mockResolvedValue(undefined);
      vi.spyOn(mockProviderRepo, 'delete').mockResolvedValue(true);

      // Act
      const result = await resolvers.Mutation.removeOAuthProvider(
        {},
        { providerId: mockProviderId },
        context
      );

      // Assert
      expect(authHelpers.requireAuth).toHaveBeenCalledWith(context);
      expect(mockProviderRepo.findById).toHaveBeenCalledWith(mockProviderId);
      expect(authHelpers.requireWorkspaceAccess).toHaveBeenCalledWith(
        mockWorkspaceRepo,
        mockUserId,
        mockWorkspaceId
      );
      expect(mockProviderRepo.delete).toHaveBeenCalledWith(mockProviderId);
      expect(result).toBe(true);
    });

    it('should throw NOT_FOUND when provider does not exist', async () => {
      // Arrange
      const context: GraphQLContext = {
        user: { userId: mockUserId, email: 'test@example.com' },
      } as GraphQLContext;

      vi.spyOn(authHelpers, 'requireAuth').mockReturnValue(mockUserId);
      vi.spyOn(mockProviderRepo, 'findById').mockResolvedValue(null);
      const requireWorkspaceAccessSpy = vi.spyOn(authHelpers, 'requireWorkspaceAccess');

      // Act & Assert
      await expect(
        resolvers.Mutation.removeOAuthProvider({}, { providerId: mockProviderId }, context)
      ).rejects.toMatchObject({
        message: 'OAuth provider not found',
        extensions: { code: 'NOT_FOUND' },
      });

      expect(requireWorkspaceAccessSpy).not.toHaveBeenCalled();
      expect(mockProviderRepo.delete).not.toHaveBeenCalled();
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
        resolvers.Mutation.removeOAuthProvider({}, { providerId: mockProviderId }, context)
      ).rejects.toThrow(GraphQLError);

      expect(mockProviderRepo.findById).not.toHaveBeenCalled();
      expect(mockProviderRepo.delete).not.toHaveBeenCalled();
    });

    it('should verify workspace access via provider lookup', async () => {
      // Arrange
      const context: GraphQLContext = {
        user: { userId: mockUserId, email: 'test@example.com' },
      } as GraphQLContext;

      vi.spyOn(authHelpers, 'requireAuth').mockReturnValue(mockUserId);
      vi.spyOn(mockProviderRepo, 'findById').mockResolvedValue({
        id: mockProviderId,
        provider: 'GOOGLE',
        workspaceId: mockWorkspaceId,
      });
      vi.spyOn(authHelpers, 'requireWorkspaceAccess').mockRejectedValue(
        new GraphQLError('Access denied to this workspace', {
          extensions: { code: 'FORBIDDEN', reason: 'WORKSPACE_ACCESS_DENIED' },
        })
      );

      // Act & Assert
      await expect(
        resolvers.Mutation.removeOAuthProvider({}, { providerId: mockProviderId }, context)
      ).rejects.toThrow('Access denied to this workspace');

      expect(mockProviderRepo.findById).toHaveBeenCalledWith(mockProviderId);
      expect(authHelpers.requireWorkspaceAccess).toHaveBeenCalledWith(
        mockWorkspaceRepo,
        mockUserId,
        mockWorkspaceId
      );
      expect(mockProviderRepo.delete).not.toHaveBeenCalled();
    });
  });
});
