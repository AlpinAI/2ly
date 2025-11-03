import { injectable, inject } from 'inversify';
import { DGraphService } from '../services/dgraph.service';
import { dgraphResolversTypes, hashPassword } from '@2ly/common';
import {
  CREATE_TOKEN,
  REVOKE_TOKEN,
  FIND_TOKENS_BY_TYPE,
  FIND_TOKENS_BY_TOOLSET,
  FIND_TOKENS_BY_RUNTIME,
  DELETE_TOKEN,
} from './token.operations';

export interface CreateTokenData {
  key: string;
  type: 'MASTER_KEY' | 'TOOLSET_KEY' | 'RUNTIME_KEY';
  workspaceId: string;
  toolsetId?: string;
  runtimeId?: string;
  expiresAt?: Date;
  description?: string;
  permissions?: string;
}

@injectable()
export class TokenRepository {
  constructor(@inject(DGraphService) private readonly dgraphService: DGraphService) {}

  /**
   * Create a new token with hashed key.
   */
  async create(tokenData: CreateTokenData): Promise<dgraphResolversTypes.Token> {
    try {
      const now = new Date().toISOString();
      const hashedKey = await hashPassword(tokenData.key);

      const res = await this.dgraphService.mutation<{
        addToken: { token: dgraphResolversTypes.Token[] };
      }>(CREATE_TOKEN, {
        key: hashedKey,
        type: tokenData.type,
        workspaceId: tokenData.workspaceId,
        toolsetId: tokenData.toolsetId,
        runtimeId: tokenData.runtimeId,
        now,
        expiresAt: tokenData.expiresAt?.toISOString(),
        description: tokenData.description,
        permissions: tokenData.permissions,
      });

      return res.addToken.token[0];
    } catch (error) {
      console.error('Failed to create token:', error);
      throw new Error('Failed to create token');
    }
  }

  /**
   * Find token by plain key (verifies against hashed keys).
   * Note: This method is intentionally not implemented efficiently because
   * keys are hashed. In practice, use findByType with additional context
   * to narrow down the search space, then verify the key.
   *
   * For Phase 2, this method is not needed for the core authentication flow.
   */
  async findByKey(_plainKey: string, _workspaceId?: string): Promise<dgraphResolversTypes.Token | null> {
    try {
      // Note: We cannot search directly by key since it's hashed
      // This is intentionally inefficient - in production, you should:
      // 1. Pass workspaceId and type to narrow down the search
      // 2. Use an indexed key fingerprint field
      // 3. Implement caching layer

      throw new Error(
        'findByKey is not efficiently implemented in Phase 2. ' +
        'Use findByType with workspace context instead.'
      );
    } catch (error) {
      console.error('Failed to find token by key:', error);
      throw new Error('Failed to find token by key');
    }
  }

  /**
   * Find tokens by type and workspace.
   */
  async findByType(
    type: 'MASTER_KEY' | 'TOOLSET_KEY' | 'RUNTIME_KEY',
    workspaceId: string
  ): Promise<dgraphResolversTypes.Token[]> {
    try {
      const res = await this.dgraphService.query<{
        queryToken: dgraphResolversTypes.Token[];
      }>(FIND_TOKENS_BY_TYPE, { type, workspaceId });

      return res.queryToken || [];
    } catch (error) {
      console.error('Failed to find tokens by type:', error);
      throw new Error('Failed to find tokens by type');
    }
  }

  /**
   * Find tokens by toolset ID.
   */
  async findByToolset(toolsetId: string): Promise<dgraphResolversTypes.Token[]> {
    try {
      const res = await this.dgraphService.query<{
        queryToken: dgraphResolversTypes.Token[];
      }>(FIND_TOKENS_BY_TOOLSET, { toolsetId });

      return res.queryToken || [];
    } catch (error) {
      console.error('Failed to find tokens by toolset:', error);
      throw new Error('Failed to find tokens by toolset');
    }
  }

  /**
   * Find tokens by runtime ID.
   */
  async findByRuntime(runtimeId: string): Promise<dgraphResolversTypes.Token[]> {
    try {
      const res = await this.dgraphService.query<{
        queryToken: dgraphResolversTypes.Token[];
      }>(FIND_TOKENS_BY_RUNTIME, { runtimeId });

      return res.queryToken || [];
    } catch (error) {
      console.error('Failed to find tokens by runtime:', error);
      throw new Error('Failed to find tokens by runtime');
    }
  }

  /**
   * Revoke a token by setting revokedAt timestamp.
   */
  async revoke(tokenId: string): Promise<dgraphResolversTypes.Token> {
    try {
      const now = new Date().toISOString();
      const res = await this.dgraphService.mutation<{
        updateToken: { token: dgraphResolversTypes.Token[] };
      }>(REVOKE_TOKEN, { id: tokenId, now });

      return res.updateToken.token[0];
    } catch (error) {
      console.error('Failed to revoke token:', error);
      throw new Error('Failed to revoke token');
    }
  }

  /**
   * Delete a token permanently.
   */
  async delete(tokenId: string): Promise<dgraphResolversTypes.Token> {
    try {
      const res = await this.dgraphService.mutation<{
        deleteToken: { token: dgraphResolversTypes.Token[] };
      }>(DELETE_TOKEN, { id: tokenId });

      return res.deleteToken.token[0];
    } catch (error) {
      console.error('Failed to delete token:', error);
      throw new Error('Failed to delete token');
    }
  }

  /**
   * Check if a token is expired.
   */
  isTokenExpired(token: dgraphResolversTypes.Token): boolean {
    if (!token.expiresAt) {
      return false;
    }
    return new Date(token.expiresAt) < new Date();
  }

  /**
   * Check if a token is revoked.
   */
  isTokenRevoked(token: dgraphResolversTypes.Token): boolean {
    return !!token.revokedAt;
  }

  /**
   * Check if a token is valid (not expired and not revoked).
   */
  isTokenValid(token: dgraphResolversTypes.Token): boolean {
    return !this.isTokenExpired(token) && !this.isTokenRevoked(token);
  }
}
