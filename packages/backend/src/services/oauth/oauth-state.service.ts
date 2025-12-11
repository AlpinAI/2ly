import { injectable, inject } from 'inversify';
import { LoggerService, EncryptionService, dgraphResolversTypes } from '@skilder-ai/common';
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
  // TODO: In-memory nonce store won't work with horizontal scaling (multiple backend instances).
  // Move to Redis or database storage for production deployments with multiple replicas.
  // See: https://github.com/your-org/skilder/issues/XXX (if applicable)
  private usedNonces = new Set<string>();

  constructor(
    @inject(LoggerService) private readonly loggerService: LoggerService,
    @inject(EncryptionService) private readonly encryption: EncryptionService
  ) {
    this.logger = this.loggerService.getLogger('oauth.state.service');
    // Clean up old nonces periodically
    setInterval(() => this.cleanupNonces(), STATE_EXPIRY_MS);
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
  validateState(state: string): OAuthStatePayload | null {
    try {
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
      if (this.usedNonces.has(payload.nonce)) {
        this.logger.warn(`OAuth state nonce already used for user ${payload.userId}`);
        return null;
      }

      // Mark nonce as used
      this.usedNonces.add(payload.nonce);

      this.logger.debug(`Validated OAuth state for user ${payload.userId}, provider ${payload.provider}`);
      return payload;
    } catch (error) {
      this.logger.error(`Failed to validate OAuth state: ${error}`);
      return null;
    }
  }

  /**
   * Clean up expired nonces from memory.
   *
   * TODO: Current cleanup is weak - clearing ALL nonces at 10k allows replay attacks
   * on recently-used nonces. Should implement one of:
   * - Track timestamps per nonce (Map<string, number>) and clean only expired ones
   * - Use a TTL-based cache (Redis, LRU cache with TTL)
   * This should be addressed together with the in-memory store scalability issue above.
   */
  private cleanupNonces(): void {
    if (this.usedNonces.size > 10000) {
      this.usedNonces.clear();
      this.logger.debug('Cleared OAuth state nonces cache');
    }
  }
}
