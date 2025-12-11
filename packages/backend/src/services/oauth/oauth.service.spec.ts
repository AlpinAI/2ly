import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { OAuthService } from './oauth.service';
import { LoggerService, EncryptionService, dgraphResolversTypes } from '@skilder-ai/common';
import { LoggerServiceMock } from '@skilder-ai/common/test/vitest';
import { OAuthStateService, OAuthStatePayload } from './oauth-state.service';
import { OAuthProviderRepository, UserOAuthConnectionRepository, DecryptedTokens } from '../../repositories';
import { OAuthTokenResponse, OAuthUserInfo } from './providers';

/**
 * Mock EncryptionService for testing OAuth service
 */
class EncryptionServiceMock {
  encrypt(plaintext: string): string {
    return `encrypted:${plaintext}`;
  }

  decrypt(ciphertext: string): string {
    if (!ciphertext.startsWith('encrypted:')) {
      throw new Error('Invalid ciphertext format');
    }
    return ciphertext.replace('encrypted:', '');
  }
}

/**
 * Mock OAuthStateService for testing OAuth flow
 */
class OAuthStateServiceMock {
  generateState = vi.fn();
  validateState = vi.fn();
}

/**
 * Mock OAuthProviderRepository for testing provider configuration
 */
class OAuthProviderRepositoryMock {
  findByType = vi.fn();
  getByWorkspace = vi.fn();
  create = vi.fn();
  update = vi.fn();
  delete = vi.fn();
}

/**
 * Mock UserOAuthConnectionRepository for testing connection management
 */
class UserOAuthConnectionRepositoryMock {
  findById = vi.fn();
  findByUserAndWorkspace = vi.fn();
  findByUserWorkspaceAndProvider = vi.fn();
  create = vi.fn();
  update = vi.fn();
  delete = vi.fn();
  upsert = vi.fn();
  getDecryptedTokens = vi.fn();
  getDecryptedTokensByProvider = vi.fn();
  updateLastUsed = vi.fn();
}

describe('OAuthService', () => {
  let service: OAuthService;
  let loggerService: LoggerServiceMock;
  let encryptionService: EncryptionServiceMock;
  let stateService: OAuthStateServiceMock;
  let providerConfigRepo: OAuthProviderRepositoryMock;
  let connectionRepo: UserOAuthConnectionRepositoryMock;

  const mockUserId = 'user-123';
  const mockWorkspaceId = 'workspace-456';
  const mockProvider = dgraphResolversTypes.OAuthProviderType.Google;
  const mockRedirectUri = 'https://app.example.com/oauth/callback';
  const mockScopes = ['email', 'profile'];
  const mockState = 'encrypted-state-token-xyz';

  const mockProviderConfig: dgraphResolversTypes.OAuthProviderConfig = {
    id: 'config-1',
    provider: mockProvider,
    enabled: true,
    clientId: 'test-client-id',
    encryptedClientSecret: 'encrypted:test-client-secret',
    tenantId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    workspace: { id: mockWorkspaceId } as dgraphResolversTypes.Workspace,
  };

  const mockTokenResponse: OAuthTokenResponse = {
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-456',
    expiresIn: 3600,
    tokenType: 'Bearer',
    scope: 'email profile',
  };

  const mockUserInfo: OAuthUserInfo = {
    id: 'google-user-123',
    email: 'user@example.com',
    name: 'Test User',
    avatarUrl: 'https://example.com/avatar.jpg',
  };

  const mockConnection: dgraphResolversTypes.UserOAuthConnection = {
    id: 'connection-1',
    provider: mockProvider,
    accountEmail: mockUserInfo.email,
    accountName: mockUserInfo.name,
    accountAvatarUrl: mockUserInfo.avatarUrl,
    providerAccountId: mockUserInfo.id,
    scopes: mockScopes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
    encryptedAccessToken: 'encrypted-access-token',
    user: { id: mockUserId } as dgraphResolversTypes.User,
    workspace: { id: mockWorkspaceId } as dgraphResolversTypes.Workspace,
  };

  beforeEach(() => {
    // Silence console logs in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    loggerService = new LoggerServiceMock();
    encryptionService = new EncryptionServiceMock();
    stateService = new OAuthStateServiceMock();
    providerConfigRepo = new OAuthProviderRepositoryMock();
    connectionRepo = new UserOAuthConnectionRepositoryMock();

    service = new OAuthService(
      loggerService as unknown as LoggerService,
      encryptionService as unknown as EncryptionService,
      stateService as unknown as OAuthStateService,
      providerConfigRepo as unknown as OAuthProviderRepository,
      connectionRepo as unknown as UserOAuthConnectionRepository
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initiateOAuthConnection()', () => {
    it('generates authorization URL successfully', async () => {
      // Setup mocks
      providerConfigRepo.findByType.mockResolvedValue(mockProviderConfig);
      stateService.generateState.mockReturnValue(mockState);

      // Execute
      const result = await service.initiateOAuthConnection(
        mockUserId,
        mockWorkspaceId,
        mockProvider,
        mockRedirectUri,
        mockScopes
      );

      // Verify
      expect(result).toBeDefined();
      expect(result.url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(result.url).toContain(`client_id=${mockProviderConfig.clientId}`);
      expect(result.url).toContain(`redirect_uri=${encodeURIComponent(mockRedirectUri)}`);
      expect(result.url).toContain(`state=${mockState}`);
      expect(result.state).toBe(mockState);

      expect(providerConfigRepo.findByType).toHaveBeenCalledWith(mockWorkspaceId, mockProvider);
      expect(stateService.generateState).toHaveBeenCalledWith(
        mockUserId,
        mockWorkspaceId,
        mockProvider,
        mockRedirectUri,
        mockScopes
      );
    });

    it('uses default scopes when none provided', async () => {
      // Setup mocks
      providerConfigRepo.findByType.mockResolvedValue(mockProviderConfig);
      stateService.generateState.mockReturnValue(mockState);

      // Execute without scopes
      const result = await service.initiateOAuthConnection(
        mockUserId,
        mockWorkspaceId,
        mockProvider,
        mockRedirectUri
      );

      // Verify - stateService.generateState should be called with default scopes
      expect(stateService.generateState).toHaveBeenCalledWith(
        mockUserId,
        mockWorkspaceId,
        mockProvider,
        mockRedirectUri,
        expect.arrayContaining(['email', 'profile', 'openid'])
      );
      expect(result.url).toBeDefined();
    });

    it('uses provided scopes when specified', async () => {
      // Setup mocks
      providerConfigRepo.findByType.mockResolvedValue(mockProviderConfig);
      stateService.generateState.mockReturnValue(mockState);

      const customScopes = ['email', 'https://www.googleapis.com/auth/drive.readonly'];

      // Execute with custom scopes
      const result = await service.initiateOAuthConnection(
        mockUserId,
        mockWorkspaceId,
        mockProvider,
        mockRedirectUri,
        customScopes
      );

      // Verify
      expect(stateService.generateState).toHaveBeenCalledWith(
        mockUserId,
        mockWorkspaceId,
        mockProvider,
        mockRedirectUri,
        customScopes
      );
      expect(result.url).toBeDefined();
    });

    it('throws when provider not configured', async () => {
      // Setup mocks
      providerConfigRepo.findByType.mockResolvedValue(null);

      // Execute & Verify
      await expect(
        service.initiateOAuthConnection(mockUserId, mockWorkspaceId, mockProvider, mockRedirectUri, mockScopes)
      ).rejects.toThrow(`OAuth provider ${mockProvider} is not configured for this workspace`);

      expect(providerConfigRepo.findByType).toHaveBeenCalledWith(mockWorkspaceId, mockProvider);
    });

    it('throws when provider not enabled', async () => {
      // Setup mocks - provider exists but is disabled
      const disabledConfig = { ...mockProviderConfig, enabled: false };
      providerConfigRepo.findByType.mockResolvedValue(disabledConfig);

      // Execute & Verify
      await expect(
        service.initiateOAuthConnection(mockUserId, mockWorkspaceId, mockProvider, mockRedirectUri, mockScopes)
      ).rejects.toThrow(`OAuth provider ${mockProvider} is not enabled for this workspace`);

      expect(providerConfigRepo.findByType).toHaveBeenCalledWith(mockWorkspaceId, mockProvider);
    });
  });

  describe('handleOAuthCallback()', () => {
    const mockCode = 'auth-code-789';

    const mockStatePayload: OAuthStatePayload = {
      userId: mockUserId,
      workspaceId: mockWorkspaceId,
      provider: mockProvider,
      redirectUri: mockRedirectUri,
      scopes: mockScopes,
      nonce: 'nonce-123',
      createdAt: Date.now(),
    };

    beforeEach(() => {
      // Setup default fetch mock for each test
      global.fetch = vi.fn();
    });

    it('returns error for invalid state', async () => {
      // Setup mocks
      stateService.validateState.mockReturnValue(null);

      // Execute
      const result = await service.handleOAuthCallback(mockCode, 'invalid-state');

      // Verify
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or expired OAuth state');
      expect(result.connection).toBeUndefined();
      expect(stateService.validateState).toHaveBeenCalledWith('invalid-state');
    });

    it('returns error when provider not configured', async () => {
      // Setup mocks
      stateService.validateState.mockReturnValue(mockStatePayload);
      providerConfigRepo.findByType.mockResolvedValue(null);

      // Execute
      const result = await service.handleOAuthCallback(mockCode, mockState);

      // Verify
      expect(result.success).toBe(false);
      expect(result.error).toBe('OAuth provider not configured');
      expect(result.workspaceId).toBe(mockWorkspaceId);
      expect(providerConfigRepo.findByType).toHaveBeenCalledWith(mockWorkspaceId, mockProvider);
    });

    it('exchanges code for tokens successfully', async () => {
      // Setup mocks
      stateService.validateState.mockReturnValue(mockStatePayload);
      providerConfigRepo.findByType.mockResolvedValue(mockProviderConfig);
      connectionRepo.upsert.mockResolvedValue(mockConnection);

      // Mock fetch to return token exchange response, then user info response
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: mockTokenResponse.accessToken,
          refresh_token: mockTokenResponse.refreshToken,
          expires_in: mockTokenResponse.expiresIn,
          token_type: mockTokenResponse.tokenType,
          scope: mockTokenResponse.scope,
        }),
      } as Response).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockUserInfo.id,
          email: mockUserInfo.email,
          name: mockUserInfo.name,
          picture: mockUserInfo.avatarUrl,
        }),
      } as Response);

      // Execute
      const result = await service.handleOAuthCallback(mockCode, mockState);

      // Verify
      expect(result.success).toBe(true);
      expect(result.connection).toBeDefined();
      expect(result.connection?.id).toBe(mockConnection.id);
      expect(result.workspaceId).toBe(mockWorkspaceId);
      expect(connectionRepo.upsert).toHaveBeenCalled();
    });

    it('gets user info and stores connection', async () => {
      // Setup mocks
      stateService.validateState.mockReturnValue(mockStatePayload);
      providerConfigRepo.findByType.mockResolvedValue(mockProviderConfig);
      connectionRepo.upsert.mockResolvedValue(mockConnection);

      // Mock fetch to return token exchange response, then user info response
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: mockTokenResponse.accessToken,
          refresh_token: mockTokenResponse.refreshToken,
          expires_in: mockTokenResponse.expiresIn,
          token_type: mockTokenResponse.tokenType,
          scope: mockTokenResponse.scope,
        }),
      } as Response).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockUserInfo.id,
          email: mockUserInfo.email,
          name: mockUserInfo.name,
          picture: mockUserInfo.avatarUrl,
        }),
      } as Response);

      // Execute
      const result = await service.handleOAuthCallback(mockCode, mockState);

      // Verify
      expect(result.success).toBe(true);
      expect(connectionRepo.upsert).toHaveBeenCalledWith(
        mockUserId,
        mockWorkspaceId,
        expect.objectContaining({
          provider: mockProvider,
          accessToken: mockTokenResponse.accessToken,
          refreshToken: mockTokenResponse.refreshToken,
          scopes: mockScopes,
          accountEmail: mockUserInfo.email,
          accountName: mockUserInfo.name,
          accountAvatarUrl: mockUserInfo.avatarUrl,
          providerAccountId: mockUserInfo.id,
        })
      );
    });

    it('handles token exchange errors gracefully', async () => {
      // Setup mocks
      stateService.validateState.mockReturnValue(mockStatePayload);
      providerConfigRepo.findByType.mockResolvedValue(mockProviderConfig);

      // Mock fetch to fail on token exchange
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid authorization code',
      } as Response);

      // Execute
      const result = await service.handleOAuthCallback(mockCode, mockState);

      // Verify
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to exchange authorization code');
      expect(result.workspaceId).toBe(mockWorkspaceId);
      expect(connectionRepo.upsert).not.toHaveBeenCalled();
    });

    it('handles user info errors gracefully', async () => {
      // Setup mocks
      stateService.validateState.mockReturnValue(mockStatePayload);
      providerConfigRepo.findByType.mockResolvedValue(mockProviderConfig);

      // Mock fetch to succeed on token exchange, then fail on user info
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: mockTokenResponse.accessToken,
          refresh_token: mockTokenResponse.refreshToken,
          expires_in: mockTokenResponse.expiresIn,
          token_type: mockTokenResponse.tokenType,
          scope: mockTokenResponse.scope,
        }),
      } as Response).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid access token',
      } as Response);

      // Execute
      const result = await service.handleOAuthCallback(mockCode, mockState);

      // Verify
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get user info from provider');
      expect(result.workspaceId).toBe(mockWorkspaceId);
      expect(connectionRepo.upsert).not.toHaveBeenCalled();
    });
  });

  describe('disconnectProvider()', () => {
    const mockConnectionId = 'connection-1';

    it('disconnects successfully when user owns connection', async () => {
      // Setup mocks
      connectionRepo.findById.mockResolvedValue({
        id: mockConnectionId,
        provider: mockProvider,
        workspaceId: mockWorkspaceId,
        userId: mockUserId,
      });
      connectionRepo.delete.mockResolvedValue(true);

      // Execute
      const result = await service.disconnectProvider(mockConnectionId, mockUserId);

      // Verify
      expect(result).toBe(true);
      expect(connectionRepo.findById).toHaveBeenCalledWith(mockConnectionId);
      expect(connectionRepo.delete).toHaveBeenCalledWith(mockConnectionId);
    });

    it('throws when connection not found', async () => {
      // Setup mocks
      connectionRepo.findById.mockResolvedValue(null);

      // Execute & Verify
      await expect(service.disconnectProvider(mockConnectionId, mockUserId)).rejects.toThrow('Connection not found');

      expect(connectionRepo.findById).toHaveBeenCalledWith(mockConnectionId);
      expect(connectionRepo.delete).not.toHaveBeenCalled();
    });

    it('throws when user does not own connection', async () => {
      // Setup mocks - connection belongs to different user
      connectionRepo.findById.mockResolvedValue({
        id: mockConnectionId,
        provider: mockProvider,
        workspaceId: mockWorkspaceId,
        userId: 'different-user-id',
      });

      // Execute & Verify
      await expect(service.disconnectProvider(mockConnectionId, mockUserId)).rejects.toThrow(
        'Unauthorized to disconnect this connection'
      );

      expect(connectionRepo.findById).toHaveBeenCalledWith(mockConnectionId);
      expect(connectionRepo.delete).not.toHaveBeenCalled();
    });
  });

  describe('getDecryptedTokens()', () => {
    beforeEach(() => {
      // Setup default fetch mock for each test
      global.fetch = vi.fn();
    });

    it('returns tokens when not expired', async () => {
      // Setup mocks - token expires in 1 hour
      const futureExpiry = new Date(Date.now() + 60 * 60 * 1000);
      const tokens: DecryptedTokens = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        expiresAt: futureExpiry,
      };
      connectionRepo.getDecryptedTokensByProvider.mockResolvedValue(tokens);

      // Execute
      const result = await service.getDecryptedTokens(mockUserId, mockWorkspaceId, mockProvider);

      // Verify
      expect(result).toEqual(tokens);
      expect(connectionRepo.getDecryptedTokensByProvider).toHaveBeenCalledWith(
        mockUserId,
        mockWorkspaceId,
        mockProvider
      );
    });

    it('returns null when no connection exists', async () => {
      // Setup mocks
      connectionRepo.getDecryptedTokensByProvider.mockResolvedValue(null);

      // Execute
      const result = await service.getDecryptedTokens(mockUserId, mockWorkspaceId, mockProvider);

      // Verify
      expect(result).toBeNull();
      expect(connectionRepo.getDecryptedTokensByProvider).toHaveBeenCalledWith(
        mockUserId,
        mockWorkspaceId,
        mockProvider
      );
    });

    it('refreshes tokens when near expiry (within 5 minutes)', async () => {
      // Mock Date.now() for consistent time
      const now = 1000000000;
      const dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(now);

      // Setup mocks - token expires in 4 minutes (less than 5 minute threshold)
      const nearExpiry = new Date(now + 4 * 60 * 1000);
      const oldTokens: DecryptedTokens = {
        accessToken: 'old-access-token',
        refreshToken: 'refresh-token-456',
        expiresAt: nearExpiry,
      };
      connectionRepo.getDecryptedTokensByProvider.mockResolvedValue(oldTokens);

      const newTokens: DecryptedTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt: new Date(now + 3600 * 1000),
      };

      // Mock the refresh flow
      connectionRepo.findByUserWorkspaceAndProvider.mockResolvedValue(mockConnection);
      connectionRepo.getDecryptedTokens.mockResolvedValue(oldTokens);
      providerConfigRepo.findByType.mockResolvedValue(mockProviderConfig);

      // Mock HTTP call for token refresh
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: newTokens.accessToken,
          refresh_token: newTokens.refreshToken,
          expires_in: 3600,
          token_type: 'Bearer',
        }),
      } as Response);

      connectionRepo.update.mockResolvedValue(mockConnection);

      // Execute
      const result = await service.getDecryptedTokens(mockUserId, mockWorkspaceId, mockProvider);

      // Verify - should return refreshed tokens
      expect(result).toBeDefined();
      expect(result?.accessToken).toBe(newTokens.accessToken);
      expect(connectionRepo.update).toHaveBeenCalled();

      dateNowSpy.mockRestore();
    });

    it('returns existing tokens when refresh fails but still valid', async () => {
      // Mock Date.now() for consistent time
      const now = 1000000000;
      const dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(now);

      // Setup mocks - token expires in 4 minutes (less than 5 minute threshold)
      const nearExpiry = new Date(now + 4 * 60 * 1000);
      const oldTokens: DecryptedTokens = {
        accessToken: 'old-access-token',
        refreshToken: 'refresh-token-456',
        expiresAt: nearExpiry,
      };
      connectionRepo.getDecryptedTokensByProvider.mockResolvedValue(oldTokens);

      // Mock the refresh flow to fail
      connectionRepo.findByUserWorkspaceAndProvider.mockResolvedValue(mockConnection);
      connectionRepo.getDecryptedTokens.mockResolvedValue(oldTokens);
      providerConfigRepo.findByType.mockResolvedValue(mockProviderConfig);

      // Mock HTTP call for token refresh to fail
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid refresh token',
      } as Response);

      // Execute
      const result = await service.getDecryptedTokens(mockUserId, mockWorkspaceId, mockProvider);

      // Verify - should return old tokens since refresh failed but tokens still valid
      expect(result).toEqual(oldTokens);
      expect(result?.accessToken).toBe('old-access-token');

      dateNowSpy.mockRestore();
    });
  });
});
