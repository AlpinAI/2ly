import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GoogleOAuthProvider } from './google.provider';
import { OAuthTokenResponse, OAuthUserInfo } from './oauth-provider.interface';

describe('GoogleOAuthProvider', () => {
  let provider: GoogleOAuthProvider;
  let fetchMock: ReturnType<typeof vi.fn>;

  const mockClientId = 'test-client-id-123';
  const mockClientSecret = 'test-client-secret-456';
  const mockRedirectUri = 'https://app.example.com/oauth/callback';
  const mockCode = 'auth-code-xyz';
  const mockState = 'state-abc-123';
  const mockAccessToken = 'access-token-abc123';
  const mockRefreshToken = 'refresh-token-def456';

  beforeEach(() => {
    provider = new GoogleOAuthProvider();
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('providerType', () => {
    it('has correct provider type identifier', () => {
      expect(provider.providerType).toBe('GOOGLE');
    });
  });

  describe('defaultScopes', () => {
    it('has correct default scopes', () => {
      expect(provider.defaultScopes).toEqual(['openid', 'email', 'profile']);
    });
  });

  describe('buildAuthorizationUrl()', () => {
    const scopes = ['openid', 'email', 'profile'];

    it('produces correct URL structure with Google domain', () => {
      const url = provider.buildAuthorizationUrl(mockClientId, mockRedirectUri, scopes, mockState);

      expect(url).toMatch(/^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?/);
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

    it('includes access_type=offline for refresh token', () => {
      const url = provider.buildAuthorizationUrl(mockClientId, mockRedirectUri, scopes, mockState);
      const urlObj = new URL(url);

      expect(urlObj.searchParams.get('access_type')).toBe('offline');
    });

    it('includes prompt=consent to ensure refresh token', () => {
      const url = provider.buildAuthorizationUrl(mockClientId, mockRedirectUri, scopes, mockState);
      const urlObj = new URL(url);

      expect(urlObj.searchParams.get('prompt')).toBe('consent');
    });

    it('includes additional params when provided', () => {
      const additionalParams = {
        login_hint: 'user@example.com',
        hd: 'example.com',
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
      expect(urlObj.searchParams.get('hd')).toBe('example.com');
    });

    it('handles custom scopes correctly', () => {
      const customScopes = [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/drive.readonly',
      ];

      const url = provider.buildAuthorizationUrl(mockClientId, mockRedirectUri, customScopes, mockState);
      const urlObj = new URL(url);

      expect(urlObj.searchParams.get('scope')).toBe(customScopes.join(' '));
    });
  });

  describe('exchangeCodeForTokens()', () => {
    it('sends correct POST request to token endpoint', async () => {
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
      expect(fetchMock).toHaveBeenCalledWith('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: expect.any(URLSearchParams),
      });

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
        scope: 'openid email profile',
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
        scope: 'openid email profile',
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
      ).rejects.toThrow(`Google token exchange failed: ${errorMessage}`);
    });

    it('handles response with all token fields', async () => {
      const mockResponse = {
        access_token: 'token-abc',
        refresh_token: 'refresh-xyz',
        expires_in: 7200,
        token_type: 'Bearer',
        scope: 'openid email profile https://www.googleapis.com/auth/drive.readonly',
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
      expect(result.scope).toBe('openid email profile https://www.googleapis.com/auth/drive.readonly');
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
      expect(fetchMock).toHaveBeenCalledWith('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: expect.any(URLSearchParams),
      });

      // Verify body parameters
      const callArgs = fetchMock.mock.calls[0];
      const body = callArgs[1].body as URLSearchParams;

      expect(body.get('refresh_token')).toBe(mockRefreshToken);
      expect(body.get('client_id')).toBe(mockClientId);
      expect(body.get('client_secret')).toBe(mockClientSecret);
      expect(body.get('grant_type')).toBe('refresh_token');
    });

    it('parses refresh response correctly', async () => {
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
      ).rejects.toThrow(`Google token refresh failed: ${errorMessage}`);
    });

    it('handles network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        provider.refreshAccessToken(mockRefreshToken, mockClientId, mockClientSecret)
      ).rejects.toThrow('Network error');
    });
  });

  describe('getUserInfo()', () => {
    it('sends correct GET request with Bearer token', async () => {
      const mockUserData = {
        id: 'google-user-123',
        email: 'user@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg',
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData,
      });

      await provider.getUserInfo(mockAccessToken);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
      });
    });

    it('parses user info correctly', async () => {
      const mockUserData = {
        id: 'google-user-123',
        email: 'user@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg',
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData,
      });

      const result = await provider.getUserInfo(mockAccessToken);

      expect(result).toEqual({
        id: 'google-user-123',
        email: 'user@example.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
      } as OAuthUserInfo);
    });

    it('handles user info without optional fields', async () => {
      const mockUserData = {
        id: 'google-user-456',
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData,
      });

      const result = await provider.getUserInfo(mockAccessToken);

      expect(result).toEqual({
        id: 'google-user-456',
        email: undefined,
        name: undefined,
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
        `Google userinfo request failed: ${errorMessage}`
      );
    });

    it('handles network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Connection timeout'));

      await expect(provider.getUserInfo(mockAccessToken)).rejects.toThrow('Connection timeout');
    });

    it('handles response with all user fields', async () => {
      const mockUserData = {
        id: 'google-user-789',
        email: 'complete@example.com',
        name: 'Complete User',
        picture: 'https://example.com/complete-avatar.jpg',
        verified_email: true,
        given_name: 'Complete',
        family_name: 'User',
        locale: 'en',
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData,
      });

      const result = await provider.getUserInfo(mockAccessToken);

      // Only mapped fields should be in the result
      expect(result).toEqual({
        id: 'google-user-789',
        email: 'complete@example.com',
        name: 'Complete User',
        avatarUrl: 'https://example.com/complete-avatar.jpg',
      } as OAuthUserInfo);
    });
  });
});
