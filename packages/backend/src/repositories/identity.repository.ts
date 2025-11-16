import { injectable, inject } from 'inversify';
import { randomBytes } from 'crypto';
import { DGraphService } from '../services/dgraph.service';
import { dgraphResolversTypes } from '@2ly/common';
import {
  CREATE_IDENTITY_KEY,
  REVOKE_IDENTITY_KEY,
  FIND_IDENTITY_KEY,
  DELETE_IDENTITY_KEY,
  FIND_KEYS_BY_RELATED_ID,
  FIND_KEY_BY_ID,
} from './identity.operations';

export interface CreateIdentityKeyData {
  key: string;
  relatedId: string;
  expiresAt?: Date;
  description?: string;
  permissions?: string;
}

const KEY_NATURE_PREFIX = {
  workspace: 'WSK',
  runtime: 'RTK',
  toolset: 'TSK',
};

@injectable()
export class IdentityRepository {
  constructor(@inject(DGraphService) private readonly dgraphService: DGraphService) {}

  /**
   * Create a new identity key
   */
  async createKey(nature: 'workspace' | 'runtime' | 'toolset', relatedId: string, description?: string, permissions?: string, options?: {key?: string}): Promise<dgraphResolversTypes.IdentityKey> {
    try {
      const now = new Date().toISOString();
      const expiresAtDate = new Date(now);
      expiresAtDate.setFullYear(expiresAtDate.getFullYear() + 20);
      const expiresAt = expiresAtDate.toISOString();
      
      const key = options?.key ? options.key : KEY_NATURE_PREFIX[nature] + randomBytes(22).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '').substring(0, 29);

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

      return res.addIdentityKey.identityKey[0];
    } catch (error) {
      console.error('Failed to create identity key:', error);
      throw new Error('Failed to create identity key');
    }
  }

  /**
   * Find an identity key to retrieve relatedId and nature
   * Throws:
   * - NOT_FOUND: If the identity key is not found
   * - EXPIRED: If the identity key is expired
   * - REVOKED: If the identity key is revoked
   */
  async findKey(key: string): Promise<{ relatedId: string; nature: 'workspace' | 'runtime' | 'toolset' }> {
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

    const prefix = identityKey.key.substring(0, 3);
    const nature = prefix === 'WSK' ? 'workspace' : prefix === 'RTK' ? 'runtime' : 'toolset';
    return { relatedId: identityKey.relatedId, nature };
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
      console.error('Failed to revoke identity key:', error);
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
      console.error('Failed to delete identity key:', error);
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
      console.error('Failed to find keys by relatedId:', error);
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
      console.error('Failed to find key by ID:', error);
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
