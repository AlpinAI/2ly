import { injectable, inject } from 'inversify';
import { DGraphService } from '../../services/dgraph.service';
import { dgraphResolversTypes, LoggerService, EncryptionService } from '@skilder-ai/common';
import pino from 'pino';
import {
  GET_USER_OAUTH_CONNECTIONS_BY_WORKSPACE,
  FIND_USER_OAUTH_CONNECTION_BY_PROVIDER,
  GET_USER_OAUTH_CONNECTION_BY_ID,
  CREATE_USER_OAUTH_CONNECTION,
  UPDATE_USER_OAUTH_CONNECTION,
  UPDATE_USER_OAUTH_CONNECTION_LAST_USED,
  DELETE_USER_OAUTH_CONNECTION,
} from './user-oauth-connection.operations';

export interface UserOAuthConnectionData {
  provider: dgraphResolversTypes.OAuthProviderType;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  scopes?: string[];
  accountEmail?: string;
  accountName?: string;
  accountAvatarUrl?: string;
  providerAccountId?: string;
}

export interface DecryptedTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

@injectable()
export class UserOAuthConnectionRepository {
  private logger: pino.Logger;

  constructor(
    @inject(DGraphService) private readonly dgraphService: DGraphService,
    @inject(LoggerService) private readonly loggerService: LoggerService,
    @inject(EncryptionService) private readonly encryption: EncryptionService
  ) {
    this.logger = this.loggerService.getLogger('user.oauth.connection.repository');
  }

  async findByUserAndWorkspace(
    userId: string,
    workspaceId: string
  ): Promise<dgraphResolversTypes.UserOAuthConnection[]> {
    try {
      const res = await this.dgraphService.query<{
        queryUserOAuthConnection: (dgraphResolversTypes.UserOAuthConnection & {
          workspace: { id: string } | null;
          user: { id: string } | null;
        })[];
      }>(GET_USER_OAUTH_CONNECTIONS_BY_WORKSPACE, {});

      // Filter by workspace and user ID in code
      const connections = res.queryUserOAuthConnection || [];
      return connections.filter(
        (c) => c.workspace?.id === workspaceId && c.user?.id === userId
      );
    } catch (error) {
      this.logger.error(
        `Failed to get OAuth connections for user ${userId} in workspace ${workspaceId}: ${error}`
      );
      throw new Error('Failed to get user OAuth connections');
    }
  }

  async findByUserWorkspaceAndProvider(
    userId: string,
    workspaceId: string,
    provider: dgraphResolversTypes.OAuthProviderType
  ): Promise<dgraphResolversTypes.UserOAuthConnection | null> {
    try {
      const res = await this.dgraphService.query<{
        queryUserOAuthConnection: (dgraphResolversTypes.UserOAuthConnection & {
          workspace: { id: string } | null;
          user: { id: string } | null;
        })[];
      }>(FIND_USER_OAUTH_CONNECTION_BY_PROVIDER, { provider });

      const connections = res.queryUserOAuthConnection || [];
      // Filter by workspace and user ID in code (not relying on @cascade)
      const match = connections.find(
        (c) => c.workspace?.id === workspaceId && c.user?.id === userId
      );
      return match || null;
    } catch (error) {
      this.logger.error(
        `Failed to find OAuth connection for user ${userId}, workspace ${workspaceId}, provider ${provider}: ${error}`
      );
      throw new Error('Failed to find user OAuth connection');
    }
  }

  async findById(id: string): Promise<{
    id: string;
    provider: string;
    workspaceId: string;
    userId: string;
  } | null> {
    try {
      const res = await this.dgraphService.query<{
        getUserOAuthConnection: (dgraphResolversTypes.UserOAuthConnection & {
          workspace: { id: string };
          user: { id: string };
        }) | null;
      }>(GET_USER_OAUTH_CONNECTION_BY_ID, { id });

      if (!res.getUserOAuthConnection) return null;
      return {
        id: res.getUserOAuthConnection.id,
        provider: res.getUserOAuthConnection.provider,
        workspaceId: res.getUserOAuthConnection.workspace.id,
        userId: res.getUserOAuthConnection.user.id,
      };
    } catch (error) {
      this.logger.error(`Failed to find OAuth connection by id ${id}: ${error}`);
      throw new Error('Failed to find user OAuth connection');
    }
  }

  async create(
    userId: string,
    workspaceId: string,
    data: UserOAuthConnectionData
  ): Promise<dgraphResolversTypes.UserOAuthConnection> {
    try {
      const now = new Date().toISOString();

      // Encrypt tokens
      const encryptedAccessToken = this.encryption.encrypt(data.accessToken);
      const encryptedRefreshToken = data.refreshToken
        ? this.encryption.encrypt(data.refreshToken)
        : null;

      const res = await this.dgraphService.mutation<{
        addUserOAuthConnection: { userOAuthConnection: dgraphResolversTypes.UserOAuthConnection[] };
      }>(CREATE_USER_OAUTH_CONNECTION, {
        workspaceId,
        userId,
        provider: data.provider,
        encryptedAccessToken,
        encryptedRefreshToken,
        tokenExpiresAt: data.tokenExpiresAt?.toISOString() || null,
        scopes: data.scopes || null,
        accountEmail: data.accountEmail || null,
        accountName: data.accountName || null,
        accountAvatarUrl: data.accountAvatarUrl || null,
        providerAccountId: data.providerAccountId || null,
        now,
      });

      this.logger.info(
        `Created OAuth connection for user ${userId} in workspace ${workspaceId} with provider ${data.provider}`
      );
      return res.addUserOAuthConnection.userOAuthConnection[0];
    } catch (error) {
      this.logger.error(
        `Failed to create OAuth connection for user ${userId} in workspace ${workspaceId}: ${error}`
      );
      throw new Error('Failed to create user OAuth connection');
    }
  }

  async update(
    id: string,
    data: Partial<UserOAuthConnectionData>
  ): Promise<dgraphResolversTypes.UserOAuthConnection> {
    try {
      const now = new Date().toISOString();

      // Encrypt tokens if provided
      const encryptedAccessToken = data.accessToken
        ? this.encryption.encrypt(data.accessToken)
        : undefined;
      const encryptedRefreshToken = data.refreshToken
        ? this.encryption.encrypt(data.refreshToken)
        : undefined;

      const res = await this.dgraphService.mutation<{
        updateUserOAuthConnection: { userOAuthConnection: dgraphResolversTypes.UserOAuthConnection[] };
      }>(UPDATE_USER_OAUTH_CONNECTION, {
        id,
        encryptedAccessToken,
        encryptedRefreshToken,
        tokenExpiresAt: data.tokenExpiresAt?.toISOString() || undefined,
        scopes: data.scopes,
        accountEmail: data.accountEmail,
        accountName: data.accountName,
        accountAvatarUrl: data.accountAvatarUrl,
        now,
      });

      this.logger.info(`Updated OAuth connection ${id}`);
      return res.updateUserOAuthConnection.userOAuthConnection[0];
    } catch (error) {
      this.logger.error(`Failed to update OAuth connection ${id}: ${error}`);
      throw new Error('Failed to update user OAuth connection');
    }
  }

  async updateLastUsed(id: string): Promise<void> {
    try {
      const now = new Date().toISOString();
      await this.dgraphService.mutation<{
        updateUserOAuthConnection: { userOAuthConnection: { id: string }[] };
      }>(UPDATE_USER_OAUTH_CONNECTION_LAST_USED, { id, now });
    } catch (error) {
      this.logger.error(`Failed to update lastUsedAt for OAuth connection ${id}: ${error}`);
      // Don't throw - this is a non-critical update
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.dgraphService.mutation<{
        deleteUserOAuthConnection: { userOAuthConnection: { id: string }[] };
      }>(DELETE_USER_OAUTH_CONNECTION, { id });

      this.logger.info(`Deleted OAuth connection ${id}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete OAuth connection ${id}: ${error}`);
      throw new Error('Failed to delete user OAuth connection');
    }
  }

  async upsert(
    userId: string,
    workspaceId: string,
    data: UserOAuthConnectionData
  ): Promise<dgraphResolversTypes.UserOAuthConnection> {
    const existing = await this.findByUserWorkspaceAndProvider(userId, workspaceId, data.provider);

    if (existing) {
      return this.update(existing.id, data);
    }

    return this.create(userId, workspaceId, data);
  }

  /**
   * Get decrypted tokens for a connection.
   * Used internally by runtime to make API calls on behalf of users.
   */
  async getDecryptedTokens(id: string): Promise<DecryptedTokens | null> {
    try {
      const res = await this.dgraphService.query<{
        getUserOAuthConnection: {
          id: string;
          encryptedAccessToken: string;
          encryptedRefreshToken?: string;
          tokenExpiresAt?: string;
        } | null;
      }>(GET_USER_OAUTH_CONNECTION_BY_ID, { id });

      if (!res.getUserOAuthConnection) {
        return null;
      }

      const { encryptedAccessToken, encryptedRefreshToken, tokenExpiresAt } =
        res.getUserOAuthConnection;

      return {
        accessToken: this.encryption.decrypt(encryptedAccessToken),
        refreshToken: encryptedRefreshToken
          ? this.encryption.decrypt(encryptedRefreshToken)
          : undefined,
        expiresAt: tokenExpiresAt ? new Date(tokenExpiresAt) : undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to get decrypted tokens for connection ${id}: ${error}`);
      throw new Error('Failed to get decrypted tokens');
    }
  }

  /**
   * Get decrypted tokens by user, workspace, and provider.
   * Used by runtime when a tool needs to access an external API.
   */
  async getDecryptedTokensByProvider(
    userId: string,
    workspaceId: string,
    provider: dgraphResolversTypes.OAuthProviderType
  ): Promise<DecryptedTokens | null> {
    const connection = await this.findByUserWorkspaceAndProvider(userId, workspaceId, provider);

    if (!connection) {
      return null;
    }

    // Update last used timestamp
    await this.updateLastUsed(connection.id);

    return this.getDecryptedTokens(connection.id);
  }

  /**
   * Check if user has a connection for a specific provider.
   */
  async hasConnection(
    userId: string,
    workspaceId: string,
    provider: dgraphResolversTypes.OAuthProviderType
  ): Promise<boolean> {
    const connection = await this.findByUserWorkspaceAndProvider(userId, workspaceId, provider);
    return connection !== null;
  }
}
