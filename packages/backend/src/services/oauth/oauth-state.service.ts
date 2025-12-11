import { injectable, inject } from 'inversify';
import {
  LoggerService,
  EncryptionService,
  dgraphResolversTypes,
  NatsCacheService,
  CACHE_BUCKETS,
  OAUTH_NONCE_CACHE_TTL,
} from '@skilder-ai/common';
import pino from 'pino';
import crypto from 'crypto';

export interface OAuthStatePayload {
  userId: string;
  workspaceId: string;
  provider: dgraphResolversTypes.OAuthProviderType;
  redirectUri: string;
  scopes: string[];
  nonce: string;
  createdAt: number;
}

const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

@injectable()
export class OAuthStateService {
  private logger: pino.Logger;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  constructor(
    @inject(LoggerService) private readonly loggerService: LoggerService,
    @inject(EncryptionService) private readonly encryption: EncryptionService,
    @inject(NatsCacheService) private readonly cacheService: NatsCacheService,
    @inject(OAUTH_NONCE_CACHE_TTL) private readonly nonceTTL: number
  ) {
    this.logger = this.loggerService.getLogger('oauth.state.service');
  }

  /**
   * Ensure the service is initialized before use.
   * Uses lazy initialization pattern for resilience.
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    if (!this.initPromise) {
      this.initPromise = (async () => {
        await this.cacheService.createBucket({
          name: CACHE_BUCKETS.OAUTH_NONCE,
          ttlMs: this.nonceTTL,
        });
        this.initialized = true;
        this.logger.info('OAuth nonce cache bucket initialized');
      })();
    }
    await this.initPromise;
  }

  /**
   * Generate a state token for OAuth flow.
   * The state contains encrypted payload with user/workspace info and CSRF nonce.
   */
  generateState(
    userId: string,
    workspaceId: string,
    provider: dgraphResolversTypes.OAuthProviderType,
    redirectUri: string,
    scopes: string[]
  ): string {
    const nonce = crypto.randomBytes(16).toString('hex');

    const payload: OAuthStatePayload = {
      userId,
      workspaceId,
      provider,
      redirectUri,
      scopes,
      nonce,
      createdAt: Date.now(),
    };

    // Encrypt the payload
    const stateJson = JSON.stringify(payload);
    const encryptedState = this.encryption.encrypt(stateJson);

    // Base64url encode for URL safety
    const state = Buffer.from(encryptedState).toString('base64url');

    this.logger.debug(`Generated OAuth state for user ${userId}, provider ${provider}`);
    return state;
  }

  /**
   * Validate and decode a state token.
   * Returns null if invalid, expired, or already used.
   */
  async validateState(state: string): Promise<OAuthStatePayload | null> {
    try {
      await this.ensureInitialized();

      // Decode from base64url
      const encryptedState = Buffer.from(state, 'base64url').toString();

      // Decrypt the payload
      const stateJson = this.encryption.decrypt(encryptedState);
      const payload: OAuthStatePayload = JSON.parse(stateJson);

      // Check expiry
      const age = Date.now() - payload.createdAt;
      if (age > STATE_EXPIRY_MS) {
        this.logger.warn(`OAuth state expired for user ${payload.userId}`);
        return null;
      }

      // Check nonce hasn't been used (prevents replay attacks)
      // Using distributed cache for horizontal scaling support
      const nonceEntry = await this.cacheService.get<boolean>(
        CACHE_BUCKETS.OAUTH_NONCE,
        payload.nonce
      );
      if (nonceEntry) {
        this.logger.warn(`OAuth state nonce already used for user ${payload.userId}`);
        return null;
      }

      // Mark nonce as used - TTL handles automatic cleanup
      await this.cacheService.put(
        CACHE_BUCKETS.OAUTH_NONCE,
        payload.nonce,
        true
      );

      this.logger.debug(`Validated OAuth state for user ${payload.userId}, provider ${payload.provider}`);
      return payload;
    } catch (error) {
      this.logger.error(`Failed to validate OAuth state: ${error}`);
      return null;
    }
  }
}
