/**
 * OAuth Provider Interface
 *
 * Defines the contract that all OAuth providers must implement.
 */

export interface OAuthTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number; // seconds until expiry
  tokenType: string;
  scope?: string;
}

export interface OAuthUserInfo {
  id: string; // Provider-specific user ID
  email?: string;
  name?: string;
  avatarUrl?: string;
}

export interface OAuthProvider {
  /**
   * Provider identifier
   */
  readonly providerType: string;

  /**
   * Default scopes for this provider
   */
  readonly defaultScopes: string[];

  /**
   * Build the authorization URL for initiating OAuth flow
   */
  buildAuthorizationUrl(
    clientId: string,
    redirectUri: string,
    scopes: string[],
    state: string,
    additionalParams?: Record<string, string>
  ): string;

  /**
   * Exchange authorization code for tokens
   */
  exchangeCodeForTokens(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
  ): Promise<OAuthTokenResponse>;

  /**
   * Refresh an access token using refresh token
   */
  refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string
  ): Promise<OAuthTokenResponse>;

  /**
   * Get user info from the provider using access token
   */
  getUserInfo(accessToken: string): Promise<OAuthUserInfo>;
}
