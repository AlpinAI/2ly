import { injectable, inject } from 'inversify';
import { randomBytes } from 'crypto';
import { DGraphService } from '../services/dgraph.service';
import { dgraphResolversTypes, LoggerService } from '@skilder-ai/common';
import {
  CREATE_IDENTITY_KEY,
  REVOKE_IDENTITY_KEY,
  FIND_IDENTITY_KEY,
  DELETE_IDENTITY_KEY,
  FIND_KEYS_BY_RELATED_ID,
  FIND_KEY_BY_ID,
} from './identity.operations';
import pino from 'pino';

export interface CreateIdentityKeyData {
  key: string;
  relatedId: string;
  expiresAt?: Date;
  description?: string;
  permissions?: string;
}

export const KEY_NATURE_PREFIX = {
  system: 'SYK',
  workspace: 'WSK',
  runtime: 'RTK',
  skill: 'SKK',
} as const;

type KeyNature = keyof typeof KEY_NATURE_PREFIX;

// Base64url character set for validation
const BASE64URL_REGEX = /^[A-Za-z0-9_-]+$/;

@injectable()
export class IdentityRepository {
  private logger: pino.Logger;

  constructor(@inject(DGraphService) private readonly dgraphService: DGraphService, @inject(LoggerService) private readonly loggerService: LoggerService) {
    this.logger = this.loggerService.getLogger('identity.repository');
  }

  /**
   * Create a new identity key
   *
   * Security Model:
   * - Keys are stored in plaintext (similar to GitHub PATs, AWS Access Keys)
   * - Plaintext storage allows one-time display to users after creation
   * - Database encryption-at-rest and access controls are critical
   * - Revocation is the primary security mechanism for compromised keys
   *
   * Key Format:
   * - Prefix (3 chars): WSK, RTK, or SKK
   * - Random portion (43 chars): Base64url-encoded 32 random bytes (256-bit entropy)
   * - Total length: 46 characters
   * - Example: "WSK_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1"
   */
  async createKey(nature: 'system' | 'workspace' | 'runtime' | 'skill', relatedId: string, description?: string, permissions?: string, options?: {key?: string}): Promise<dgraphResolversTypes.IdentityKey> {
    try {
      const now = new Date().toISOString();
      const expiresAtDate = new Date(now);
      // Make the key expire in 20 years
      // TODO: Make this configurable
      const addedYears = 20;
      expiresAtDate.setFullYear(expiresAtDate.getFullYear() + addedYears);
      const expiresAt = expiresAtDate.toISOString();

      // Generate key with improved entropy and no truncation
      let key: string;
      if (options?.key) {
        // Use provided key (for testing or migration)
        key = options.key;
        this.validateKeyFormat(key);
      } else {
        // Generate new key with duplicate detection
        key = await this.generateUniqueKey(nature);
      }

      const res = await this.dgraphService.mutation<{
        addIdentityKey: { identityKey: dgraphResolversTypes.IdentityKey[] };
      }>(CREATE_IDENTITY_KEY, {
        key,
        relatedId,
        now,
        expiresAt,
        description,
        permissions,
      });

      this.logger.info(`Created ${nature} key for relatedId: ${relatedId}`);
      return res.addIdentityKey.identityKey[0];
    } catch (error) {
      this.logger.error(`Failed to create identity key: ${error}`);
      throw new Error('Failed to create identity key');
    }
  }

  /**
   * Generate a cryptographically secure unique key with duplicate detection.
   * Uses 32 random bytes (256-bit entropy) encoded as base64url.
   *
   * @param nature - The type of key to generate
   * @param maxRetries - Maximum number of collision retry attempts (default: 3)
   * @returns A unique key in format: "{PREFIX}{43-char-random}"
   */
  private async generateUniqueKey(nature: KeyNature, maxRetries = 3): Promise<string> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      // Generate 32 random bytes (256-bit entropy)
      const randomBuffer = randomBytes(32);

      // Convert to base64url (URL-safe base64 without padding)
      // This produces 43 characters from 32 bytes
      const randomPart = randomBuffer
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, ''); // Remove padding

      const key = KEY_NATURE_PREFIX[nature] + randomPart;

      // Check for duplicate (statistically extremely unlikely, but good practice)
      try {
        const findKey = await this.dgraphService.query<{
          queryIdentityKey: dgraphResolversTypes.IdentityKey[];
        }>(FIND_IDENTITY_KEY, { key });

        if (findKey.queryIdentityKey.length > 0) {
          if (attempt === maxRetries) {
            throw new Error('Failed to generate unique key after maximum retries');
          }
          this.logger.warn(`Key collision detected on attempt ${attempt + 1}, retrying...`);
        }

        // Key not found (expected), this is good
        return key;
      } catch (error) {
        this.logger.warn(`Error ${error} on attempt ${attempt + 1}, retrying...`);
      }
    }

    throw new Error('Failed to generate unique key');
  }

  /**
   * Validate key format and structure.
   * Throws descriptive errors for invalid keys.
   *
   * @param key - The key to validate
   * @throws Error if key format is invalid
   */
  private validateKeyFormat(key: string): void {
    // Check minimum length (3-char prefix + at least some random data)
    if (key.length < 10) {
      throw new Error('INVALID_KEY_FORMAT: Key is too short');
    }

    // Extract and validate prefix
    const prefix = key.substring(0, 3);
    const validPrefixes = Object.values(KEY_NATURE_PREFIX);

    if (!validPrefixes.includes(prefix as typeof validPrefixes[number])) {
      throw new Error(`INVALID_KEY_PREFIX: Key must start with one of: ${validPrefixes.join(', ')}`);
    }

    // Validate random portion uses base64url characters
    const randomPart = key.substring(3);
    if (!BASE64URL_REGEX.test(randomPart)) {
      throw new Error('INVALID_KEY_FORMAT: Key contains invalid characters (must be base64url)');
    }

    // For new-format keys, enforce exact length (46 chars = 3 prefix + 43 random)
    // Allow legacy 32-char keys for backward compatibility
    if (key.length !== 46 && key.length !== 32) {
      this.logger.warn(`Non-standard key length detected: ${key.length} chars (expected 46 or 32 for legacy)`);
    }
  }

  /**
   * Find an identity key to retrieve relatedId and nature
   * Throws:
   * - INVALID_KEY_FORMAT: If the key format is invalid
   * - INVALID_KEY_PREFIX: If the key prefix is not recognized
   * - NOT_FOUND: If the identity key is not found
   * - EXPIRED: If the identity key is expired
   * - REVOKED: If the identity key is revoked
   */
  async findKey(key: string): Promise<{ relatedId: string; nature: 'system' | 'workspace' | 'runtime' | 'skill' }> {
    // Validate key format before database lookup
    this.validateKeyFormat(key);

    const res = await this.dgraphService.query<{
      queryIdentityKey: dgraphResolversTypes.IdentityKey[];
    }>(FIND_IDENTITY_KEY, { key });

    if (!res.queryIdentityKey || res.queryIdentityKey.length === 0) {
      throw new Error('NOT_FOUND');
    }

    const identityKey = res.queryIdentityKey[0];
    if (this.isKeyExpired(identityKey)) {
      throw new Error('EXPIRED');
    }

    if (this.isKeyRevoked(identityKey)) {
      throw new Error('REVOKED');
    }

    // Extract nature from validated prefix
    const prefix = identityKey.key.substring(0, 3) as 'SYK' | 'WSK' | 'RTK' | 'SKK';
    const nature = this.getNatureFromPrefix(prefix);

    return { relatedId: identityKey.relatedId, nature };
  }

  /**
   * Get key nature from prefix with strict validation.
   * Throws error for unrecognized prefixes instead of defaulting.
   *
   * @param prefix - The 3-character key prefix (SYK, WSK, RTK, or SKK)
   * @returns The key nature
   * @throws Error if prefix is not recognized
   */
  private getNatureFromPrefix(prefix: string): 'system' | 'workspace' | 'runtime' | 'skill' {
    switch (prefix) {
      case 'SYK':
        return 'system';
      case 'WSK':
        return 'workspace';
      case 'RTK':
        return 'runtime';
      case 'SKK':
        return 'skill';
      default:
        throw new Error(`INVALID_KEY_PREFIX: Unrecognized prefix '${prefix}'`);
    }
  }

  /**
   * Revoke an identity key by setting revokedAt timestamp.
   */
  async revokeKey(key: string): Promise<dgraphResolversTypes.IdentityKey> {
    try {
      const now = new Date().toISOString();
      const res = await this.dgraphService.mutation<{
        updateIdentityKey: { identityKey: dgraphResolversTypes.IdentityKey[] };
      }>(REVOKE_IDENTITY_KEY, { id: key, now });

      return res.updateIdentityKey.identityKey[0];
    } catch (error) {
      this.logger.error(`Failed to revoke identity key: ${error}`);
      throw new Error('Failed to revoke identity key');
    }
  }

  /**
   * Delete an identity key permanently.
   */
  async deleteKey(key: string): Promise<dgraphResolversTypes.IdentityKey> {
    try {
      const res = await this.dgraphService.mutation<{
        deleteIdentityKey: { identityKey: dgraphResolversTypes.IdentityKey[] };
      }>(DELETE_IDENTITY_KEY, { id: key });

      return res.deleteIdentityKey.identityKey[0];
    } catch (error) {
      this.logger.error(`Failed to delete identity key: ${error}`);
      throw new Error('Failed to delete identity key');
    }
  }

  /**
   * Find all identity keys by relatedId.
   */
  async findKeysByRelatedId(relatedId: string): Promise<dgraphResolversTypes.IdentityKey[]> {
    try {
      const res = await this.dgraphService.query<{
        queryIdentityKey: dgraphResolversTypes.IdentityKey[];
      }>(FIND_KEYS_BY_RELATED_ID, { relatedId });

      return res.queryIdentityKey || [];
    } catch (error) {
      this.logger.error(`Failed to find keys by relatedId: ${error}`);
      throw new Error('Failed to find keys by relatedId');
    }
  }

  /**
   * Find an identity key by its ID.
   */
  async findKeyById(keyId: string): Promise<dgraphResolversTypes.IdentityKey | null> {
    try {
      const res = await this.dgraphService.query<{
        getIdentityKey: dgraphResolversTypes.IdentityKey;
      }>(FIND_KEY_BY_ID, { id: keyId });

      return res.getIdentityKey || null;
    } catch (error) {
      this.logger.error(`Failed to find key by ID: ${error}`);
      throw new Error('Failed to find key by ID');
    }
  }

  /**
   * Check if an identity key is expired.
   */
  private isKeyExpired(key: dgraphResolversTypes.IdentityKey): boolean {
    if (!key.expiresAt) {
      return false;
    }
    return new Date(key.expiresAt) < new Date();
  }

  /**
   * Check if an identity key is revoked.
   */
  private isKeyRevoked(key: dgraphResolversTypes.IdentityKey): boolean {
    return !!key.revokedAt;
  }
}
