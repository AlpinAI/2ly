import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TokenRepository } from './token.repository';
import { DGraphService } from '../services/dgraph.service';
import { TestEnvironment, TEST_ENCRYPTION_KEY } from '@2ly/common/test/testcontainers';

// Note: This test relies on the global test environment setup in vitest.integration.config.ts
// which starts Dgraph, NATS, and Backend containers and makes them available via environment variables.
describe('TokenRepository Integration Tests', () => {
  let tokenRepository: TokenRepository;
  let dgraphService: DGraphService;

  beforeAll(async () => {
    // Set encryption key for password hashing in tests
    process.env.ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;

    // Use the Dgraph instance from global test environment (started by backend container)
    let dgraphUrl = process.env.DGRAPH_URL;
    if (!dgraphUrl) {
      throw new Error('DGRAPH_URL not set. Ensure global setup has run.');
    }

    // DGraphService expects hostname:port without http:// prefix
    dgraphUrl = dgraphUrl.replace('http://', '').replace(/\/graphql$/, '');

    // Initialize DGraph service with minimal logger mock
    const mockLogger = {
      getLogger: () => ({
        info: () => {},
        error: () => {},
        debug: () => {},
        warn: () => {},
      }),
    };

    dgraphService = new DGraphService(
      mockLogger as unknown as import('@2ly/common').LoggerService,
      dgraphUrl,
    );
    await dgraphService.start('test');

    // Initialize repository
    tokenRepository = new TokenRepository(dgraphService);
  });

  afterAll(async () => {
    if (dgraphService) {
      await dgraphService.stop('test');
    }
  });

  describe('create', () => {
    it('should create a new token with hashed key', async () => {
      const token = await tokenRepository.create({
        key: 'test-master-key',
        type: 'MASTER_KEY',
        workspaceId: 'workspace-1',
        toolsetId: 'toolset-1',
        description: 'Test master key',
      });

      expect(token).toBeTruthy();
      expect(token.id).toBeTruthy();
      expect(token.type).toBe('MASTER_KEY');
      expect(token.workspaceId).toBe('workspace-1');
      expect(token.toolsetId).toBe('toolset-1');
      expect(token.description).toBe('Test master key');
      expect(token.key).not.toBe('test-master-key'); // Should be hashed
      expect(token.createdAt).toBeTruthy();
    });

    it('should create token with expiration date', async () => {
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
      const token = await tokenRepository.create({
        key: 'test-runtime-key',
        type: 'RUNTIME_KEY',
        workspaceId: 'workspace-1',
        runtimeId: 'runtime-1',
        expiresAt,
        description: 'Test runtime key with expiration',
      });

      expect(token).toBeTruthy();
      expect(token.expiresAt).toBeTruthy();
      expect(new Date(token.expiresAt!).getTime()).toBeGreaterThan(Date.now());
    });

    it('should create token without optional fields', async () => {
      const token = await tokenRepository.create({
        key: 'minimal-key',
        type: 'TOOLSET_KEY',
        workspaceId: 'workspace-1',
      });

      expect(token).toBeTruthy();
      expect(token.type).toBe('TOOLSET_KEY');
      expect(token.toolsetId).toBeNull();
      expect(token.runtimeId).toBeNull();
      expect(token.expiresAt).toBeNull();
      expect(token.revokedAt).toBeNull();
    });
  });

  describe('findByType', () => {
    it('should find tokens by type and workspace', async () => {
      // Create multiple tokens
      await tokenRepository.create({
        key: 'master-key-1',
        type: 'MASTER_KEY',
        workspaceId: 'workspace-2',
        toolsetId: 'toolset-1',
      });

      await tokenRepository.create({
        key: 'master-key-2',
        type: 'MASTER_KEY',
        workspaceId: 'workspace-2',
        toolsetId: 'toolset-2',
      });

      await tokenRepository.create({
        key: 'toolset-key-1',
        type: 'TOOLSET_KEY',
        workspaceId: 'workspace-2',
      });

      const masterKeys = await tokenRepository.findByType('MASTER_KEY', 'workspace-2');
      expect(masterKeys.length).toBeGreaterThanOrEqual(2);
      expect(masterKeys.every(t => t.type === 'MASTER_KEY')).toBe(true);
      expect(masterKeys.every(t => t.workspaceId === 'workspace-2')).toBe(true);
    });

    it('should return empty array when no tokens match', async () => {
      const tokens = await tokenRepository.findByType('MASTER_KEY', 'nonexistent-workspace');
      expect(tokens).toEqual([]);
    });
  });

  describe('findByToolset', () => {
    it('should find tokens by toolset ID', async () => {
      await tokenRepository.create({
        key: 'toolset-specific-key',
        type: 'MASTER_KEY',
        workspaceId: 'workspace-3',
        toolsetId: 'toolset-specific',
      });

      const tokens = await tokenRepository.findByToolset('toolset-specific');
      expect(tokens.length).toBeGreaterThanOrEqual(1);
      expect(tokens.every(t => t.toolsetId === 'toolset-specific')).toBe(true);
    });
  });

  describe('findByRuntime', () => {
    it('should find tokens by runtime ID', async () => {
      await tokenRepository.create({
        key: 'runtime-specific-key',
        type: 'RUNTIME_KEY',
        workspaceId: 'workspace-3',
        runtimeId: 'runtime-specific',
      });

      const tokens = await tokenRepository.findByRuntime('runtime-specific');
      expect(tokens.length).toBeGreaterThanOrEqual(1);
      expect(tokens.every(t => t.runtimeId === 'runtime-specific')).toBe(true);
    });
  });

  describe('revoke', () => {
    it('should revoke a token by setting revokedAt', async () => {
      const token = await tokenRepository.create({
        key: 'revokable-key',
        type: 'MASTER_KEY',
        workspaceId: 'workspace-4',
        toolsetId: 'toolset-1',
      });

      expect(token.revokedAt).toBeNull();

      const revokedToken = await tokenRepository.revoke(token.id);
      expect(revokedToken.revokedAt).toBeTruthy();
      expect(new Date(revokedToken.revokedAt!).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should mark revoked token as invalid', async () => {
      const token = await tokenRepository.create({
        key: 'another-revokable-key',
        type: 'MASTER_KEY',
        workspaceId: 'workspace-4',
        toolsetId: 'toolset-1',
      });

      expect(tokenRepository.isTokenValid(token)).toBe(true);

      const revokedToken = await tokenRepository.revoke(token.id);
      expect(tokenRepository.isTokenValid(revokedToken)).toBe(false);
    });
  });

  describe('delete', () => {
    it('should permanently delete a token', async () => {
      const token = await tokenRepository.create({
        key: 'deletable-key',
        type: 'RUNTIME_KEY',
        workspaceId: 'workspace-5',
        runtimeId: 'runtime-1',
      });

      const deletedToken = await tokenRepository.delete(token.id);
      expect(deletedToken.id).toBe(token.id);

      // Verify token is gone
      const tokens = await tokenRepository.findByRuntime('runtime-1');
      const foundToken = tokens.find(t => t.id === token.id);
      expect(foundToken).toBeUndefined();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for token without expiration', async () => {
      const token = await tokenRepository.create({
        key: 'never-expires',
        type: 'MASTER_KEY',
        workspaceId: 'workspace-6',
      });

      expect(tokenRepository.isTokenExpired(token)).toBe(false);
    });

    it('should return false for token that has not expired yet', async () => {
      const expiresAt = new Date(Date.now() + 3600000);
      const token = await tokenRepository.create({
        key: 'future-expiry',
        type: 'RUNTIME_KEY',
        workspaceId: 'workspace-6',
        runtimeId: 'runtime-1',
        expiresAt,
      });

      expect(tokenRepository.isTokenExpired(token)).toBe(false);
    });

    it('should return true for expired token', async () => {
      const expiresAt = new Date(Date.now() - 1000); // Already expired
      const token = await tokenRepository.create({
        key: 'expired-key',
        type: 'RUNTIME_KEY',
        workspaceId: 'workspace-6',
        runtimeId: 'runtime-1',
        expiresAt,
      });

      expect(tokenRepository.isTokenExpired(token)).toBe(true);
    });
  });

  describe('isTokenRevoked', () => {
    it('should return false for non-revoked token', async () => {
      const token = await tokenRepository.create({
        key: 'active-key',
        type: 'MASTER_KEY',
        workspaceId: 'workspace-7',
      });

      expect(tokenRepository.isTokenRevoked(token)).toBe(false);
    });

    it('should return true for revoked token', async () => {
      const token = await tokenRepository.create({
        key: 'to-be-revoked',
        type: 'MASTER_KEY',
        workspaceId: 'workspace-7',
      });

      const revokedToken = await tokenRepository.revoke(token.id);
      expect(tokenRepository.isTokenRevoked(revokedToken)).toBe(true);
    });
  });

  describe('isTokenValid', () => {
    it('should return true for valid, non-expired, non-revoked token', async () => {
      const token = await tokenRepository.create({
        key: 'valid-key',
        type: 'MASTER_KEY',
        workspaceId: 'workspace-8',
        toolsetId: 'toolset-1',
      });

      expect(tokenRepository.isTokenValid(token)).toBe(true);
    });

    it('should return false for expired token', async () => {
      const expiresAt = new Date(Date.now() - 1000);
      const token = await tokenRepository.create({
        key: 'expired-valid-check',
        type: 'RUNTIME_KEY',
        workspaceId: 'workspace-8',
        runtimeId: 'runtime-1',
        expiresAt,
      });

      expect(tokenRepository.isTokenValid(token)).toBe(false);
    });

    it('should return false for revoked token', async () => {
      const token = await tokenRepository.create({
        key: 'revoked-valid-check',
        type: 'MASTER_KEY',
        workspaceId: 'workspace-8',
      });

      const revokedToken = await tokenRepository.revoke(token.id);
      expect(tokenRepository.isTokenValid(revokedToken)).toBe(false);
    });

    it('should return false for token that is both expired and revoked', async () => {
      const expiresAt = new Date(Date.now() - 1000);
      const token = await tokenRepository.create({
        key: 'expired-and-revoked',
        type: 'RUNTIME_KEY',
        workspaceId: 'workspace-8',
        runtimeId: 'runtime-1',
        expiresAt,
      });

      const revokedToken = await tokenRepository.revoke(token.id);
      expect(tokenRepository.isTokenValid(revokedToken)).toBe(false);
    });
  });
});
