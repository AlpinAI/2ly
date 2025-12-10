import { injectable, inject } from 'inversify';
import { LoggerService, EncryptionService, dgraphResolversTypes } from '@skilder-ai/common';
import pino from 'pino';
import { OAuthStateService } from './oauth-state.service';
import {
  OAuthProvider,
  OAuthTokenResponse,
  OAuthUserInfo,
  GoogleOAuthProvider,
  MicrosoftOAuthProvider,
  NotionOAuthProvider,
} from './providers';
import { OAuthProviderRepository } from '../../repositories/oauth-provider.repository';
import { UserOAuthConnectionRepository } from '../../repositories/user-oauth-connection.repository';

export interface InitiateOAuthResult {
  url: string;
  state: string;
}

export interface OAuthCallbackResult {
  success: boolean;
  connection?: dgraphResolversTypes.UserOAuthConnection;
  error?: string;
  workspaceId?: string;
}

@injectable()
export class OAuthService {
  private logger: pino.Logger;

  constructor(
    @inject(LoggerService) private readonly loggerService: LoggerService,
    @inject(EncryptionService) private readonly encryption: EncryptionService,
    @inject(OAuthStateService) private readonly stateService: OAuthStateService,
    @inject(OAuthProviderRepository) private readonly providerConfigRepo: OAuthProviderRepository,
    @inject(UserOAuthConnectionRepository) private readonly connectionRepo: UserOAuthConnectionRepository
  ) {
    this.logger = this.loggerService.getLogger('oauth.service');
  }

  /**
   * Get the OAuth provider implementation for a given provider type.
   */
  private getProvider(
    providerType: dgraphResolversTypes.OAuthProviderType,
    tenantId?: string
  ): OAuthProvider {
    switch (providerType) {
      case 'GOOGLE':
        return new GoogleOAuthProvider();
      case 'MICROSOFT':
        return new MicrosoftOAuthProvider(tenantId || 'common');
      case 'NOTION':
        return new NotionOAuthProvider();
      default:
        throw new Error(`Unsupported OAuth provider: ${providerType}`);
    }
  }

  /**
   * Initiate OAuth flow - generate authorization URL.
   */
  async initiateOAuthConnection(
    userId: string,
    workspaceId: string,
    provider: dgraphResolversTypes.OAuthProviderType,
    redirectUri: string,
    scopes?: string[]
  ): Promise<InitiateOAuthResult> {
    this.logger.info(`Initiating OAuth connection for user ${userId}, provider ${provider}`);

    // Get workspace OAuth config
    const config = await this.providerConfigRepo.findByType(workspaceId, provider);
    if (!config) {
      throw new Error(`OAuth provider ${provider} is not configured for this workspace`);
    }
    if (!config.enabled) {
      throw new Error(`OAuth provider ${provider} is not enabled for this workspace`);
    }

    // Get provider implementation
    const providerImpl = this.getProvider(provider, config.tenantId || undefined);

    // Use provided scopes or default scopes
    const finalScopes = scopes && scopes.length > 0 ? scopes : providerImpl.defaultScopes;

    // Generate state token
    const state = this.stateService.generateState(
      userId,
      workspaceId,
      provider,
      redirectUri,
      finalScopes
    );

    // Build authorization URL
    const url = providerImpl.buildAuthorizationUrl(
      config.clientId,
      redirectUri,
      finalScopes,
      state
    );

    this.logger.info(`Generated OAuth authorization URL for user ${userId}, provider ${provider}`);

    return { url, state };
  }

  /**
   * Handle OAuth callback - exchange code for tokens and store connection.
   */
  async handleOAuthCallback(
    code: string,
    state: string
  ): Promise<OAuthCallbackResult> {
    // Validate state
    const statePayload = this.stateService.validateState(state);
    if (!statePayload) {
      this.logger.warn('Invalid or expired OAuth state');
      return { success: false, error: 'Invalid or expired OAuth state' };
    }

    const { userId, workspaceId, provider, redirectUri, scopes } = statePayload;

    this.logger.info(`Processing OAuth callback for user ${userId}, provider ${provider}`);

    try {
      // Get workspace OAuth config
      const config = await this.providerConfigRepo.findByType(workspaceId, provider);
      if (!config) {
        return { success: false, error: 'OAuth provider not configured', workspaceId };
      }

      // Decrypt client secret
      const clientSecret = this.encryption.decrypt(config.encryptedClientSecret);

      // Get provider implementation
      const providerImpl = this.getProvider(provider, config.tenantId || undefined);

      // Exchange code for tokens
      let tokens: OAuthTokenResponse;
      try {
        tokens = await providerImpl.exchangeCodeForTokens(
          code,
          config.clientId,
          clientSecret,
          redirectUri
        );
      } catch (error) {
        this.logger.error(`Token exchange failed for user ${userId}: ${error}`);
        return { success: false, error: 'Failed to exchange authorization code', workspaceId };
      }

      // Get user info from provider
      let userInfo: OAuthUserInfo;
      try {
        userInfo = await providerImpl.getUserInfo(tokens.accessToken);
      } catch (error) {
        this.logger.error(`Failed to get user info for user ${userId}: ${error}`);
        return { success: false, error: 'Failed to get user info from provider', workspaceId };
      }

      // Calculate token expiry
      const tokenExpiresAt = tokens.expiresIn
        ? new Date(Date.now() + tokens.expiresIn * 1000)
        : undefined;

      // Store or update connection
      const connection = await this.connectionRepo.upsert(userId, workspaceId, {
        provider,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt,
        scopes,
        accountEmail: userInfo.email,
        accountName: userInfo.name,
        accountAvatarUrl: userInfo.avatarUrl,
        providerAccountId: userInfo.id,
      });

      this.logger.info(
        `OAuth connection established for user ${userId}, provider ${provider}, account ${userInfo.email}`
      );

      return { success: true, connection, workspaceId };
    } catch (error) {
      this.logger.error(`OAuth callback failed for user ${userId}: ${error}`);
      return { success: false, error: 'OAuth connection failed', workspaceId };
    }
  }

  /**
   * Disconnect OAuth provider - remove user's connection.
   */
  async disconnectProvider(connectionId: string, userId: string): Promise<boolean> {
    // Verify ownership
    const connection = await this.connectionRepo.findById(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }
    if (connection.userId !== userId) {
      throw new Error('Unauthorized to disconnect this connection');
    }

    await this.connectionRepo.delete(connectionId);
    this.logger.info(`Disconnected OAuth connection ${connectionId} for user ${userId}`);

    return true;
  }

  /**
   * Get decrypted tokens for a user's connection.
   * Used by runtime to make API calls on behalf of users.
   */
  async getDecryptedTokens(
    userId: string,
    workspaceId: string,
    provider: dgraphResolversTypes.OAuthProviderType
  ): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date } | null> {
    const tokens = await this.connectionRepo.getDecryptedTokensByProvider(
      userId,
      workspaceId,
      provider
    );

    if (!tokens) {
      return null;
    }

    // Check if token needs refresh
    if (tokens.expiresAt && tokens.expiresAt < new Date(Date.now() + 5 * 60 * 1000)) {
      // Token expires within 5 minutes, try to refresh
      if (tokens.refreshToken) {
        try {
          const refreshedTokens = await this.refreshTokens(userId, workspaceId, provider);
          if (refreshedTokens) {
            return refreshedTokens;
          }
        } catch (error) {
          this.logger.warn(`Failed to refresh tokens for user ${userId}, provider ${provider}: ${error}`);
          // Return existing token, it may still be valid
        }
      }
    }

    return tokens;
  }

  /**
   * Refresh OAuth tokens for a connection.
   */
  private async refreshTokens(
    userId: string,
    workspaceId: string,
    provider: dgraphResolversTypes.OAuthProviderType
  ): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date } | null> {
    const connection = await this.connectionRepo.findByUserWorkspaceAndProvider(
      userId,
      workspaceId,
      provider
    );

    if (!connection) {
      return null;
    }

    const tokens = await this.connectionRepo.getDecryptedTokens(connection.id);
    if (!tokens?.refreshToken) {
      return null;
    }

    // Get workspace OAuth config
    const config = await this.providerConfigRepo.findByType(workspaceId, provider);
    if (!config) {
      return null;
    }

    const clientSecret = this.encryption.decrypt(config.encryptedClientSecret);
    const providerImpl = this.getProvider(provider, config.tenantId || undefined);

    try {
      const newTokens = await providerImpl.refreshAccessToken(
        tokens.refreshToken,
        config.clientId,
        clientSecret
      );

      const tokenExpiresAt = newTokens.expiresIn
        ? new Date(Date.now() + newTokens.expiresIn * 1000)
        : undefined;

      // Update stored tokens
      await this.connectionRepo.update(connection.id, {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        tokenExpiresAt,
      });

      this.logger.info(`Refreshed OAuth tokens for user ${userId}, provider ${provider}`);

      return {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        expiresAt: tokenExpiresAt,
      };
    } catch (error) {
      this.logger.error(`Token refresh failed for user ${userId}, provider ${provider}: ${error}`);
      throw error;
    }
  }
}
