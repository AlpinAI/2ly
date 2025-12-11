import { OAuthProvider, OAuthTokenResponse, OAuthUserInfo } from './oauth-provider.interface';

const MICROSOFT_GRAPH_URL = 'https://graph.microsoft.com/v1.0/me';

export class MicrosoftOAuthProvider implements OAuthProvider {
  readonly providerType = 'MICROSOFT';

  readonly defaultScopes = [
    'openid',
    'email',
    'profile',
    'User.Read',
    'offline_access',
  ];

  private tenantId: string;

  constructor(tenantId: string = 'common') {
    this.tenantId = tenantId;
  }

  private getAuthUrl(): string {
    return `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/authorize`;
  }

  private getTokenUrl(): string {
    return `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
  }

  buildAuthorizationUrl(
    clientId: string,
    redirectUri: string,
    scopes: string[],
    state: string,
    additionalParams?: Record<string, string>
  ): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      state,
      response_mode: 'query',
      ...additionalParams,
    });

    return `${this.getAuthUrl()}?${params.toString()}`;
  }

  async exchangeCodeForTokens(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
  ): Promise<OAuthTokenResponse> {
    const response = await fetch(this.getTokenUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Microsoft token exchange failed: ${error}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
      scope: data.scope,
    };
  }

  async refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string
  ): Promise<OAuthTokenResponse> {
    const response = await fetch(this.getTokenUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Microsoft token refresh failed: ${error}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
      scope: data.scope,
    };
  }

  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    const response = await fetch(MICROSOFT_GRAPH_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Microsoft Graph request failed: ${error}`);
    }

    const data = await response.json();

    return {
      id: data.id,
      email: data.mail || data.userPrincipalName,
      name: data.displayName,
      avatarUrl: undefined, // Microsoft returns binary photo; not implemented
    };
  }
}
