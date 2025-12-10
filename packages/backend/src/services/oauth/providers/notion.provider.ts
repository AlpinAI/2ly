import { OAuthProvider, OAuthTokenResponse, OAuthUserInfo } from './oauth-provider.interface';

const NOTION_AUTH_URL = 'https://api.notion.com/v1/oauth/authorize';
const NOTION_TOKEN_URL = 'https://api.notion.com/v1/oauth/token';
const NOTION_USERS_URL = 'https://api.notion.com/v1/users/me';

export class NotionOAuthProvider implements OAuthProvider {
  readonly providerType = 'NOTION';

  // Notion doesn't use traditional scopes - access is determined by workspace integration settings
  readonly defaultScopes: string[] = [];

  buildAuthorizationUrl(
    clientId: string,
    redirectUri: string,
    _scopes: string[],
    state: string,
    additionalParams?: Record<string, string>
  ): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      owner: 'user', // Request user-level access
      state,
      ...additionalParams,
    });

    return `${NOTION_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForTokens(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
  ): Promise<OAuthTokenResponse> {
    // Notion uses Basic Auth for token exchange
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(NOTION_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credentials}`,
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Notion token exchange failed: ${error}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      // Notion doesn't provide refresh tokens - access tokens are long-lived
      refreshToken: undefined,
      expiresIn: undefined, // Notion tokens don't expire
      tokenType: data.token_type || 'Bearer',
      scope: undefined,
    };
  }

  async refreshAccessToken(
    _refreshToken: string,
    _clientId: string,
    _clientSecret: string
  ): Promise<OAuthTokenResponse> {
    // Notion doesn't support token refresh - tokens are long-lived
    throw new Error('Notion does not support token refresh. User must re-authorize.');
  }

  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    const response = await fetch(NOTION_USERS_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Notion-Version': '2022-06-28',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Notion user request failed: ${error}`);
    }

    const data = await response.json();

    // Notion returns a "bot" object with owner info
    const user = data.bot?.owner?.user || data;

    return {
      id: user.id,
      email: user.person?.email || undefined,
      name: user.name,
      avatarUrl: user.avatar_url,
    };
  }
}
