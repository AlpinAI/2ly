import { injectable, inject } from 'inversify';
import { DGraphService } from '../../services/dgraph.service';
import { dgraphResolversTypes, LoggerService, EncryptionService } from '@skilder-ai/common';
import pino from 'pino';
import {
  GET_OAUTH_PROVIDERS_BY_WORKSPACE,
  FIND_OAUTH_PROVIDER_BY_TYPE,
  CREATE_OAUTH_PROVIDER,
  UPDATE_OAUTH_PROVIDER,
  UPDATE_OAUTH_PROVIDER_ENABLED,
  DELETE_OAUTH_PROVIDER,
  GET_OAUTH_PROVIDER_BY_ID,
} from './oauth-provider.operations';

export type OAuthProviderType = 'google' | 'microsoft' | 'notion' | 'supabase';

export interface OAuthProviderValidationResult {
  valid: boolean;
  error?: string;
}

export interface OAuthProviderConfigData {
  provider: dgraphResolversTypes.OAuthProviderType;
  enabled: boolean;
  clientId: string;
  encryptedClientSecret: string;
  tenantId?: string | null;
}

@injectable()
export class OAuthProviderRepository {
  private logger: pino.Logger;

  constructor(
    @inject(DGraphService) private readonly dgraphService: DGraphService,
    @inject(LoggerService) private readonly loggerService: LoggerService,
    @inject(EncryptionService) private readonly encryption: EncryptionService
  ) {
    this.logger = this.loggerService.getLogger('oauth.provider.repository');
  }

  async getByWorkspace(workspaceId: string): Promise<dgraphResolversTypes.OAuthProviderConfig[]> {
    try {
      const res = await this.dgraphService.query<{
        getWorkspace: { oauthProviders: dgraphResolversTypes.OAuthProviderConfig[] } | null;
      }>(GET_OAUTH_PROVIDERS_BY_WORKSPACE, { workspaceId });

      return res.getWorkspace?.oauthProviders || [];
    } catch (error) {
      this.logger.error(`Failed to get OAuth providers for workspace ${workspaceId}: ${error}`);
      throw new Error('Failed to get OAuth providers');
    }
  }

  async findByType(
    workspaceId: string,
    provider: dgraphResolversTypes.OAuthProviderType
  ): Promise<dgraphResolversTypes.OAuthProviderConfig | null> {
    try {
      const res = await this.dgraphService.query<{
        getWorkspace: { oauthProviders: dgraphResolversTypes.OAuthProviderConfig[] } | null;
      }>(FIND_OAUTH_PROVIDER_BY_TYPE, { workspaceId, provider });

      const providers = res.getWorkspace?.oauthProviders || [];
      return providers.length > 0 ? providers[0] : null;
    } catch (error) {
      this.logger.error(
        `Failed to find OAuth provider for workspace ${workspaceId} and provider ${provider}: ${error}`
      );
      throw new Error('Failed to find OAuth provider');
    }
  }

  async findById(id: string): Promise<{ id: string; provider: string; workspaceId: string } | null> {
    try {
      const res = await this.dgraphService.query<{
        getOAuthProviderConfig: { id: string; provider: string; workspace: { id: string } } | null;
      }>(GET_OAUTH_PROVIDER_BY_ID, { id });

      if (!res.getOAuthProviderConfig) return null;
      return {
        id: res.getOAuthProviderConfig.id,
        provider: res.getOAuthProviderConfig.provider,
        workspaceId: res.getOAuthProviderConfig.workspace.id,
      };
    } catch (error) {
      this.logger.error(`Failed to find OAuth provider by id ${id}: ${error}`);
      throw new Error('Failed to find OAuth provider');
    }
  }

  async create(workspaceId: string, data: OAuthProviderConfigData): Promise<dgraphResolversTypes.OAuthProviderConfig> {
    try {
      const now = new Date().toISOString();

      const res = await this.dgraphService.mutation<{
        addOAuthProviderConfig: { oAuthProviderConfig: dgraphResolversTypes.OAuthProviderConfig[] };
      }>(CREATE_OAUTH_PROVIDER, {
        workspaceId,
        provider: data.provider,
        enabled: data.enabled,
        clientId: data.clientId,
        encryptedClientSecret: data.encryptedClientSecret,
        tenantId: data.tenantId,
        now,
      });

      this.logger.info(`Created OAuth provider for workspace ${workspaceId} and provider ${data.provider}`);
      return res.addOAuthProviderConfig.oAuthProviderConfig[0];
    } catch (error) {
      this.logger.error(
        `Failed to create OAuth provider for workspace ${workspaceId} and provider ${data.provider}: ${error}`
      );
      throw new Error('Failed to create OAuth provider');
    }
  }

  async update(
    id: string,
    data: Partial<Omit<OAuthProviderConfigData, 'provider' | 'enabled'>>
  ): Promise<dgraphResolversTypes.OAuthProviderConfig> {
    try {
      const now = new Date().toISOString();

      const res = await this.dgraphService.mutation<{
        updateOAuthProviderConfig: { oAuthProviderConfig: dgraphResolversTypes.OAuthProviderConfig[] };
      }>(UPDATE_OAUTH_PROVIDER, {
        id,
        clientId: data.clientId,
        encryptedClientSecret: data.encryptedClientSecret,
        tenantId: data.tenantId,
        now,
      });

      this.logger.info(`Updated OAuth provider ${id}`);
      return res.updateOAuthProviderConfig.oAuthProviderConfig[0];
    } catch (error) {
      this.logger.error(`Failed to update OAuth provider ${id}: ${error}`);
      throw new Error('Failed to update OAuth provider');
    }
  }

  async updateEnabled(id: string, enabled: boolean): Promise<dgraphResolversTypes.OAuthProviderConfig> {
    try {
      const now = new Date().toISOString();

      const res = await this.dgraphService.mutation<{
        updateOAuthProviderConfig: { oAuthProviderConfig: dgraphResolversTypes.OAuthProviderConfig[] };
      }>(UPDATE_OAUTH_PROVIDER_ENABLED, {
        id,
        enabled,
        now,
      });

      this.logger.info(`Updated OAuth provider ${id} enabled to ${enabled}`);
      return res.updateOAuthProviderConfig.oAuthProviderConfig[0];
    } catch (error) {
      this.logger.error(`Failed to update OAuth provider ${id} enabled status: ${error}`);
      throw new Error('Failed to update OAuth provider');
    }
  }

  async upsert(workspaceId: string, data: OAuthProviderConfigData): Promise<dgraphResolversTypes.OAuthProviderConfig> {
    const existing = await this.findByType(workspaceId, data.provider);

    if (existing) {
      const { clientId, encryptedClientSecret, tenantId } = data;
      return this.update(existing.id, {
        clientId: clientId ?? existing.clientId,
        encryptedClientSecret: encryptedClientSecret ?? existing.encryptedClientSecret,
        tenantId: tenantId ?? existing.tenantId,
      });
    }

    return this.create(workspaceId, data);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.dgraphService.mutation<{
        deleteOAuthProviderConfig: { oAuthProviderConfig: { id: string }[] };
      }>(DELETE_OAUTH_PROVIDER, { id });

      this.logger.info(`Deleted OAuth provider ${id}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete OAuth provider ${id}: ${error}`);
      throw new Error('Failed to delete OAuth provider');
    }
  }

  /**
   * Validate OAuth provider configuration (basic format validation).
   */
  validateConfiguration(
    provider: OAuthProviderType,
    clientId: string,
    clientSecret: string,
    tenantId?: string
  ): OAuthProviderValidationResult {
    // Basic format validation
    if (!clientId || clientId.trim().length === 0) {
      return { valid: false, error: 'Client ID is required' };
    }

    if (!clientSecret || clientSecret.trim().length === 0) {
      return { valid: false, error: 'Client Secret is required' };
    }

    // Microsoft-specific validation
    if (provider === 'microsoft') {
      if (!tenantId || tenantId.trim().length === 0) {
        return { valid: false, error: 'Tenant ID is required for Microsoft' };
      }
      // Basic GUID format check for tenant ID
      const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isCommonTenant = ['common', 'organizations', 'consumers'].includes(tenantId.toLowerCase());
      if (!guidRegex.test(tenantId) && !isCommonTenant) {
        return {
          valid: false,
          error: 'Tenant ID must be a valid GUID or one of: common, organizations, consumers',
        };
      }
    }

    return { valid: true };
  }

  /**
   * Configure an OAuth provider for a workspace.
   * Validates credentials before saving.
   */
  async configure(
    workspaceId: string,
    provider: OAuthProviderType,
    clientId: string,
    clientSecret: string,
    tenantId?: string
  ): Promise<OAuthProviderValidationResult> {
    this.logger.info(`Configuring OAuth provider for workspace ${workspaceId} with provider ${provider}`);

    // Validate configuration
    const validation = this.validateConfiguration(provider, clientId, clientSecret, tenantId);
    if (!validation.valid) {
      return validation;
    }

    // Encrypt client secret
    const encryptedSecret = this.encryption.encrypt(clientSecret);

    // Upsert configuration (auto-enable on configure)
    await this.upsert(workspaceId, {
      provider: provider.toUpperCase() as dgraphResolversTypes.OAuthProviderType,
      enabled: true,
      clientId,
      encryptedClientSecret: encryptedSecret,
      tenantId: tenantId || null,
    });

    this.logger.info(`OAuth provider configured for workspace ${workspaceId} with provider ${provider}`);
    return { valid: true };
  }

  /**
   * Get decrypted configuration for a provider.
   */
  async getDecryptedConfig(
    workspaceId: string,
    provider: OAuthProviderType
  ): Promise<{
    clientId: string;
    clientSecret: string;
    tenantId?: string;
  }> {
    const providerUpper = provider.toUpperCase() as dgraphResolversTypes.OAuthProviderType;
    const config = await this.findByType(workspaceId, providerUpper);

    if (!config) {
      throw new Error(`OAuth provider ${provider} is not configured`);
    }

    return {
      clientId: config.clientId,
      clientSecret: this.encryption.decrypt(config.encryptedClientSecret),
      tenantId: config.tenantId || undefined,
    };
  }
}
