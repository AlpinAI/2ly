import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MicrosoftOAuthProvider } from './microsoft.provider';
import { OAuthTokenResponse, OAuthUserInfo } from './oauth-provider.interface';

describe('MicrosoftOAuthProvider', () => {
  let provider: MicrosoftOAuthProvider;
  let fetchMock: ReturnType<typeof vi.fn>;

  const mockClientId = 'test-client-id-123';
  const mockClientSecret = 'test-client-secret-456';
  const mockRedirectUri = 'https://app.example.com/oauth/callback';
  const mockCode = 'auth-code-xyz';
  const mockState = 'state-abc-123';
  const mockAccessToken = 'access-token-abc123';
  const mockRefreshToken = 'refresh-token-def456';
  const mockTenantId = 'test-tenant-id';

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('providerType', () => {
    it('has correct provider type identifier', () => {
      provider = new MicrosoftOAuthProvider();
      expect(provider.providerType).toBe('MICROSOFT');
    });
  });

  describe('defaultScopes', () => {
    it('has correct default scopes', () => {
      provider = new MicrosoftOAuthProvider();
      expect(provider.defaultScopes).toEqual([
        'openid',
        'email',
        'profile',
        'User.Read',
        'offline_access',
      ]);
    });
  });

  describe('Constructor', () => {
    it('sets tenantId from constructor parameter', () => {
      provider = new MicrosoftOAuthProvider(mockTenantId);
      const scopes = ['openid', 'email'];

      const url = provider.buildAuthorizationUrl(mockClientId, mockRedirectUri, scopes, mockState);

      expect(url).toContain(`login.microsoftonline.com/${mockTenantId}/oauth2/v2.0/authorize`);
    });

    it("uses 'common' as default tenantId", () => {
      provider = new MicrosoftOAuthProvider();
      const scopes = ['openid', 'email'];

      const url = provider.buildAuthorizationUrl(mockClientId, mockRedirectUri, scopes, mockState);

      expect(url).toContain('login.microsoftonline.com/common/oauth2/v2.0/authorize');
    });
  });

  describe('buildAuthorizationUrl()', () => {
    const scopes = ['openid', 'email', 'profile'];

    beforeEach(() => {
      provider = new MicrosoftOAuthProvider(mockTenantId);
    });

    it('includes tenant in authorization URL', () => {
      const url = provider.buildAuthorizationUrl(mockClientId, mockRedirectUri, scopes, mockState);

      expect(url).toMatch(
        new RegExp(`^https://login\\.microsoftonline\\.com/${mockTenantId}/oauth2/v2\\.0/authorize\\?`)
      );
    });

    it('includes client_id parameter', () => {
      const url = provider.buildAuthorizationUrl(mockClientId, mockRedirectUri, scopes, mockState);
      const urlObj = new URL(url);

      expect(urlObj.searchParams.get('client_id')).toBe(mockClientId);
    });

    it('includes redirect_uri parameter', () => {
      const url = provider.buildAuthorizationUrl(mockClientId, mockRedirectUri, scopes, mockState);
      const urlObj = new URL(url);

      expect(urlObj.searchParams.get('redirect_uri')).toBe(mockRedirectUri);
    });

    it('includes response_type=code', () => {
      const url = provider.buildAuthorizationUrl(mockClientId, mockRedirectUri, scopes, mockState);
      const urlObj = new URL(url);

      expect(urlObj.searchParams.get('response_type')).toBe('code');
    });

    it('includes response_mode=query (Microsoft-specific)', () => {
      const url = provider.buildAuthorizationUrl(mockClientId, mockRedirectUri, scopes, mockState);
      const urlObj = new URL(url);

      expect(urlObj.searchParams.get('response_mode')).toBe('query');
    });

    it('includes scopes joined by space', () => {
      const url = provider.buildAuthorizationUrl(mockClientId, mockRedirectUri, scopes, mockState);
      const urlObj = new URL(url);

      expect(urlObj.searchParams.get('scope')).toBe('openid email profile');
    });

    it('includes state parameter', () => {
      const url = provider.buildAuthorizationUrl(mockClientId, mockRedirectUri, scopes, mockState);
      const urlObj = new URL(url);

      expect(urlObj.searchParams.get('state')).toBe(mockState);
    });

    it('includes additional params when provided', () => {
      const additionalParams = {
        login_hint: 'user@example.com',
        domain_hint: 'organizations',
      };

      const url = provider.buildAuthorizationUrl(
        mockClientId,
        mockRedirectUri,
        scopes,
        mockState,
        additionalParams
      );
      const urlObj = new URL(url);

      expect(urlObj.searchParams.get('login_hint')).toBe('user@example.com');
      expect(urlObj.searchParams.get('domain_hint')).toBe('organizations');
    });

    it('handles custom scopes correctly', () => {
      const customScopes = ['openid', 'email', 'profile', 'User.Read', 'Files.Read'];

      const url = provider.buildAuthorizationUrl(mockClientId, mockRedirectUri, customScopes, mockState);
      const urlObj = new URL(url);

      expect(urlObj.searchParams.get('scope')).toBe(customScopes.join(' '));
    });
  });

  describe('exchangeCodeForTokens()', () => {
    beforeEach(() => {
      provider = new MicrosoftOAuthProvider(mockTenantId);
    });

    it('uses tenant-specific token endpoint', async () => {
      const mockResponse = {
        access_token: mockAccessToken,
        refresh_token: mockRefreshToken,
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'openid email profile',
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await provider.exchangeCodeForTokens(mockCode, mockClientId, mockClientSecret, mockRedirectUri);

      expect(fetchMock).toHaveBeenCalledWith(
        `https://login.microsoftonline.com/${mockTenantId}/oauth2/v2.0/token`,
        expect.any(Object)
      );
    });

    it('sends correct POST request', async () => {
      const mockResponse = {
        access_token: mockAccessToken,
        refresh_token: mockRefreshToken,
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'openid email profile',
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await provider.exchangeCodeForTokens(mockCode, mockClientId, mockClientSecret, mockRedirectUri);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        `https://login.microsoftonline.com/${mockTenantId}/oauth2/v2.0/token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: expect.any(URLSearchParams),
        }
      );

      // Verify body parameters
      const callArgs = fetchMock.mock.calls[0];
      const body = callArgs[1].body as URLSearchParams;

      expect(body.get('code')).toBe(mockCode);
      expect(body.get('client_id')).toBe(mockClientId);
      expect(body.get('client_secret')).toBe(mockClientSecret);
      expect(body.get('redirect_uri')).toBe(mockRedirectUri);
      expect(body.get('grant_type')).toBe('authorization_code');
    });

    it('parses successful response correctly', async () => {
      const mockResponse = {
        access_token: mockAccessToken,
        refresh_token: mockRefreshToken,
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'openid email profile User.Read',
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await provider.exchangeCodeForTokens(
        mockCode,
        mockClientId,
        mockClientSecret,
        mockRedirectUri
      );

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        expiresIn: 3600,
        tokenType: 'Bearer',
        scope: 'openid email profile User.Read',
      } as OAuthTokenResponse);
    });

    it('throws error on HTTP failure', async () => {
      const errorMessage = 'Invalid authorization code';

      fetchMock.mockResolvedValueOnce({
        ok: false,
        text: async () => errorMessage,
      });

      await expect(
        provider.exchangeCodeForTokens(mockCode, mockClientId, mockClientSecret, mockRedirectUri)
      ).rejects.toThrow(`Microsoft token exchange failed: ${errorMessage}`);
    });

    it('handles response with all token fields', async () => {
      const mockResponse = {
        access_token: 'token-abc',
        refresh_token: 'refresh-xyz',
        expires_in: 7200,
        token_type: 'Bearer',
        scope: 'openid email profile User.Read Files.Read',
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await provider.exchangeCodeForTokens(
        mockCode,
        mockClientId,
        mockClientSecret,
        mockRedirectUri
      );

      expect(result.accessToken).toBe('token-abc');
      expect(result.refreshToken).toBe('refresh-xyz');
      expect(result.expiresIn).toBe(7200);
      expect(result.tokenType).toBe('Bearer');
      expect(result.scope).toBe('openid email profile User.Read Files.Read');
    });

    it('handles response without optional fields', async () => {
      const mockResponse = {
        access_token: mockAccessToken,
        token_type: 'Bearer',
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await provider.exchangeCodeForTokens(
        mockCode,
        mockClientId,
        mockClientSecret,
        mockRedirectUri
      );

      expect(result.accessToken).toBe(mockAccessToken);
      expect(result.tokenType).toBe('Bearer');
      expect(result.refreshToken).toBeUndefined();
      expect(result.expiresIn).toBeUndefined();
      expect(result.scope).toBeUndefined();
    });
  });

  describe('refreshAccessToken()', () => {
    beforeEach(() => {
      provider = new MicrosoftOAuthProvider(mockTenantId);
    });

    it('uses tenant-specific token endpoint', async () => {
      const mockResponse = {
        access_token: 'new-access-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'openid email profile',
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await provider.refreshAccessToken(mockRefreshToken, mockClientId, mockClientSecret);

      expect(fetchMock).toHaveBeenCalledWith(
        `https://login.microsoftonline.com/${mockTenantId}/oauth2/v2.0/token`,
        expect.any(Object)
      );
    });

    it('sends correct refresh request', async () => {
      const mockResponse = {
        access_token: 'new-access-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'openid email profile',
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await provider.refreshAccessToken(mockRefreshToken, mockClientId, mockClientSecret);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        `https://login.microsoftonline.com/${mockTenantId}/oauth2/v2.0/token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: expect.any(URLSearchParams),
        }
      );

      // Verify body parameters
      const callArgs = fetchMock.mock.calls[0];
      const body = callArgs[1].body as URLSearchParams;

      expect(body.get('refresh_token')).toBe(mockRefreshToken);
      expect(body.get('client_id')).toBe(mockClientId);
      expect(body.get('client_secret')).toBe(mockClientSecret);
      expect(body.get('grant_type')).toBe('refresh_token');
    });

    it('parses response correctly', async () => {
      const mockResponse = {
        access_token: 'new-access-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'openid email profile',
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await provider.refreshAccessToken(mockRefreshToken, mockClientId, mockClientSecret);

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: mockRefreshToken, // Should preserve old refresh token
        expiresIn: 3600,
        tokenType: 'Bearer',
        scope: 'openid email profile',
      } as OAuthTokenResponse);
    });

    it('preserves old refresh token when not returned in response', async () => {
      const mockResponse = {
        access_token: 'new-access-token',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await provider.refreshAccessToken(mockRefreshToken, mockClientId, mockClientSecret);

      expect(result.refreshToken).toBe(mockRefreshToken);
    });

    it('uses new refresh token when returned in response', async () => {
      const newRefreshToken = 'new-refresh-token-xyz';
      const mockResponse = {
        access_token: 'new-access-token',
        refresh_token: newRefreshToken,
        expires_in: 3600,
        token_type: 'Bearer',
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await provider.refreshAccessToken(mockRefreshToken, mockClientId, mockClientSecret);

      expect(result.refreshToken).toBe(newRefreshToken);
    });

    it('throws error on HTTP failure', async () => {
      const errorMessage = 'Invalid refresh token';

      fetchMock.mockResolvedValueOnce({
        ok: false,
        text: async () => errorMessage,
      });

      await expect(
        provider.refreshAccessToken(mockRefreshToken, mockClientId, mockClientSecret)
      ).rejects.toThrow(`Microsoft token refresh failed: ${errorMessage}`);
    });

    it('handles network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        provider.refreshAccessToken(mockRefreshToken, mockClientId, mockClientSecret)
      ).rejects.toThrow('Network error');
    });
  });

  describe('getUserInfo()', () => {
    beforeEach(() => {
      provider = new MicrosoftOAuthProvider();
    });

    it('sends request to Microsoft Graph API', async () => {
      const mockUserData = {
        id: 'microsoft-user-123',
        mail: 'user@example.com',
        displayName: 'Test User',
      };

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUserData,
        })
        .mockResolvedValueOnce({
          ok: false, // Photo not available
        });

      await provider.getUserInfo(mockAccessToken);

      expect(fetchMock).toHaveBeenCalledWith('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
      });
    });

    it('parses user data correctly', async () => {
      const mockUserData = {
        id: 'microsoft-user-123',
        mail: 'user@example.com',
        displayName: 'Test User',
      };

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUserData,
        })
        .mockResolvedValueOnce({
          ok: false, // Photo not available
        });

      const result = await provider.getUserInfo(mockAccessToken);

      expect(result).toEqual({
        id: 'microsoft-user-123',
        email: 'user@example.com',
        name: 'Test User',
        avatarUrl: undefined,
      } as OAuthUserInfo);
    });

    it('uses userPrincipalName when mail is missing', async () => {
      const mockUserData = {
        id: 'microsoft-user-456',
        userPrincipalName: 'user.principal@example.com',
        displayName: 'Principal User',
      };

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUserData,
        })
        .mockResolvedValueOnce({
          ok: false, // Photo not available
        });

      const result = await provider.getUserInfo(mockAccessToken);

      expect(result).toEqual({
        id: 'microsoft-user-456',
        email: 'user.principal@example.com',
        name: 'Principal User',
        avatarUrl: undefined,
      } as OAuthUserInfo);
    });

    it('handles missing avatar gracefully (photo fetch fails)', async () => {
      const mockUserData = {
        id: 'microsoft-user-789',
        mail: 'user@example.com',
        displayName: 'User Without Photo',
      };

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUserData,
        })
        .mockResolvedValueOnce({
          ok: false, // Photo fetch fails
        });

      const result = await provider.getUserInfo(mockAccessToken);

      expect(result.avatarUrl).toBeUndefined();
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock).toHaveBeenNthCalledWith(2, 'https://graph.microsoft.com/v1.0/me/photo/$value', {
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
      });
    });

    it('handles photo fetch network error gracefully', async () => {
      const mockUserData = {
        id: 'microsoft-user-999',
        mail: 'user@example.com',
        displayName: 'User With Error',
      };

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUserData,
        })
        .mockRejectedValueOnce(new Error('Network error')); // Photo fetch throws

      const result = await provider.getUserInfo(mockAccessToken);

      expect(result).toEqual({
        id: 'microsoft-user-999',
        email: 'user@example.com',
        name: 'User With Error',
        avatarUrl: undefined,
      } as OAuthUserInfo);
    });

    it('throws error on HTTP failure', async () => {
      const errorMessage = 'Invalid access token';

      fetchMock.mockResolvedValueOnce({
        ok: false,
        text: async () => errorMessage,
      });

      await expect(provider.getUserInfo(mockAccessToken)).rejects.toThrow(
        `Microsoft Graph request failed: ${errorMessage}`
      );
    });

    it('handles network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Connection timeout'));

      await expect(provider.getUserInfo(mockAccessToken)).rejects.toThrow('Connection timeout');
    });

    it('handles response with all user fields', async () => {
      const mockUserData = {
        id: 'microsoft-user-complete',
        mail: 'complete@example.com',
        userPrincipalName: 'complete.principal@example.com',
        displayName: 'Complete User',
        givenName: 'Complete',
        surname: 'User',
        jobTitle: 'Developer',
        officeLocation: 'Building 1',
      };

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUserData,
        })
        .mockResolvedValueOnce({
          ok: false, // Photo not available
        });

      const result = await provider.getUserInfo(mockAccessToken);

      // Only mapped fields should be in the result
      expect(result).toEqual({
        id: 'microsoft-user-complete',
        email: 'complete@example.com', // mail takes precedence over userPrincipalName
        name: 'Complete User',
        avatarUrl: undefined,
      } as OAuthUserInfo);
    });

    it('handles user info without optional fields', async () => {
      const mockUserData = {
        id: 'microsoft-user-minimal',
      };

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUserData,
        })
        .mockResolvedValueOnce({
          ok: false, // Photo not available
        });

      const result = await provider.getUserInfo(mockAccessToken);

      expect(result).toEqual({
        id: 'microsoft-user-minimal',
        email: undefined,
        name: undefined,
        avatarUrl: undefined,
      } as OAuthUserInfo);
    });
  });

  describe('tenant behavior', () => {
    it('works with common tenant (multi-tenant apps)', async () => {
      provider = new MicrosoftOAuthProvider('common');
      const scopes = ['openid', 'email'];

      const url = provider.buildAuthorizationUrl(mockClientId, mockRedirectUri, scopes, mockState);

      expect(url).toContain('login.microsoftonline.com/common/oauth2/v2.0/authorize');
    });

    it('works with organizations tenant', async () => {
      provider = new MicrosoftOAuthProvider('organizations');
      const scopes = ['openid', 'email'];

      const url = provider.buildAuthorizationUrl(mockClientId, mockRedirectUri, scopes, mockState);

      expect(url).toContain('login.microsoftonline.com/organizations/oauth2/v2.0/authorize');
    });

    it('works with consumers tenant', async () => {
      provider = new MicrosoftOAuthProvider('consumers');
      const scopes = ['openid', 'email'];

      const url = provider.buildAuthorizationUrl(mockClientId, mockRedirectUri, scopes, mockState);

      expect(url).toContain('login.microsoftonline.com/consumers/oauth2/v2.0/authorize');
    });

    it('works with specific tenant GUID', async () => {
      const tenantGuid = '12345678-1234-1234-1234-123456789012';
      provider = new MicrosoftOAuthProvider(tenantGuid);
      const scopes = ['openid', 'email'];

      const url = provider.buildAuthorizationUrl(mockClientId, mockRedirectUri, scopes, mockState);

      expect(url).toContain(`login.microsoftonline.com/${tenantGuid}/oauth2/v2.0/authorize`);
    });
  });
});
