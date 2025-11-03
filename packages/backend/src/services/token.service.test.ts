import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TokenService } from './token.service';
import { TokenRepository } from '../repositories/token.repository';
import { ToolSetRepository } from '../repositories/toolset.repository';
import { dgraphResolversTypes, TokenType } from '@2ly/common';

// Mock the password verification
vi.mock('@2ly/common', async () => {
  const actual = await vi.importActual('@2ly/common');
  return {
    ...actual,
    verifyPassword: vi.fn(),
  };
});

describe('TokenService', () => {
  let tokenService: TokenService;
  let tokenRepository: TokenRepository;
  let toolSetRepository: ToolSetRepository;

  const mockWorkspace: dgraphResolversTypes.Workspace = {
    id: 'workspace-1',
    name: 'Test Workspace',
    createdAt: new Date().toISOString(),
    system: {
      id: 'system-1',
      createdAt: new Date().toISOString(),
      initialized: false,
      instanceId: 'test-instance',
      updatedAt: new Date().toISOString(),
      defaultWorkspace: null,
      workspaces: null,
      admins: null,
    },
  };

  const mockToolSet: dgraphResolversTypes.ToolSet = {
    id: 'toolset-1',
    name: 'test-toolset',
    description: 'Test ToolSet',
    createdAt: new Date().toISOString(),
    workspace: mockWorkspace,
  };

  const mockToken: dgraphResolversTypes.Token = {
    id: 'token-1',
    key: 'hashed-key',
    type: TokenType.MasterKey,
    workspaceId: 'workspace-1',
    toolsetId: 'toolset-1',
    runtimeId: null,
    createdAt: new Date().toISOString(),
    expiresAt: null,
    revokedAt: null,
    description: 'Test Token',
    permissions: null,
  };

  beforeEach(() => {
    tokenRepository = {
      findByType: vi.fn(),
      isTokenValid: vi.fn(),
      create: vi.fn(),
    } as unknown as TokenRepository;

    toolSetRepository = {
      findByName: vi.fn(),
    } as unknown as ToolSetRepository;

    tokenService = new TokenService(tokenRepository, toolSetRepository);

    // Set up environment variables for NATS JWT generation
    process.env.NATS_OPERATOR_SEED = 'SOABC123456789012345678901234567890123456789012345';
    process.env.NATS_ACCOUNT_SEED = 'SAABC123456789012345678901234567890123456789012345';
  });

  describe('validateMasterKey', () => {
    it('should return toolset when master key is valid', async () => {
      const { verifyPassword } = await import('@2ly/common');

      vi.mocked(toolSetRepository.findByName).mockResolvedValue(mockToolSet);
      vi.mocked(tokenRepository.findByType).mockResolvedValue([mockToken]);
      vi.mocked(tokenRepository.isTokenValid).mockReturnValue(true);
      vi.mocked(verifyPassword).mockResolvedValue(true);

      const result = await tokenService.validateMasterKey('plain-key', 'test-toolset');

      expect(result).toEqual(mockToolSet);
      expect(toolSetRepository.findByName).toHaveBeenCalledWith('test-toolset');
      expect(tokenRepository.findByType).toHaveBeenCalledWith('MASTER_KEY', 'workspace-1');
      expect(verifyPassword).toHaveBeenCalledWith('plain-key', 'hashed-key');
    });

    it('should return null when toolset not found', async () => {
      vi.mocked(toolSetRepository.findByName).mockResolvedValue(null);

      const result = await tokenService.validateMasterKey('plain-key', 'nonexistent-toolset');

      expect(result).toBeNull();
      expect(tokenRepository.findByType).not.toHaveBeenCalled();
    });

    it('should return null when no valid tokens found', async () => {
      vi.mocked(toolSetRepository.findByName).mockResolvedValue(mockToolSet);
      vi.mocked(tokenRepository.findByType).mockResolvedValue([]);

      const result = await tokenService.validateMasterKey('plain-key', 'test-toolset');

      expect(result).toBeNull();
    });

    it('should return null when token is expired', async () => {
      const expiredToken = {
        ...mockToken,
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      };

      vi.mocked(toolSetRepository.findByName).mockResolvedValue(mockToolSet);
      vi.mocked(tokenRepository.findByType).mockResolvedValue([expiredToken]);
      vi.mocked(tokenRepository.isTokenValid).mockReturnValue(false);

      const result = await tokenService.validateMasterKey('plain-key', 'test-toolset');

      expect(result).toBeNull();
    });

    it('should return null when token is revoked', async () => {
      const revokedToken = {
        ...mockToken,
        revokedAt: new Date().toISOString(),
      };

      vi.mocked(toolSetRepository.findByName).mockResolvedValue(mockToolSet);
      vi.mocked(tokenRepository.findByType).mockResolvedValue([revokedToken]);
      vi.mocked(tokenRepository.isTokenValid).mockReturnValue(false);

      const result = await tokenService.validateMasterKey('plain-key', 'test-toolset');

      expect(result).toBeNull();
    });

    it('should return null when token is not associated with toolset', async () => {
      const { verifyPassword } = await import('@2ly/common');

      const wrongToolsetToken = {
        ...mockToken,
        toolsetId: 'different-toolset-id',
      };

      vi.mocked(toolSetRepository.findByName).mockResolvedValue(mockToolSet);
      vi.mocked(tokenRepository.findByType).mockResolvedValue([wrongToolsetToken]);
      vi.mocked(tokenRepository.isTokenValid).mockReturnValue(true);

      const result = await tokenService.validateMasterKey('plain-key', 'test-toolset');

      expect(result).toBeNull();
      expect(verifyPassword).not.toHaveBeenCalled();
    });

    it('should return null when key does not match', async () => {
      const { verifyPassword } = await import('@2ly/common');

      vi.mocked(toolSetRepository.findByName).mockResolvedValue(mockToolSet);
      vi.mocked(tokenRepository.findByType).mockResolvedValue([mockToken]);
      vi.mocked(tokenRepository.isTokenValid).mockReturnValue(true);
      vi.mocked(verifyPassword).mockResolvedValue(false);

      const result = await tokenService.validateMasterKey('wrong-key', 'test-toolset');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(toolSetRepository.findByName).mockRejectedValue(new Error('Database error'));

      const result = await tokenService.validateMasterKey('plain-key', 'test-toolset');

      expect(result).toBeNull();
    });
  });

  describe('validateToolsetKey', () => {
    it('should throw error indicating not implemented in Phase 2', async () => {
      await expect(tokenService.validateToolsetKey('some-key')).rejects.toThrow(
        'validateToolsetKey requires workspace context or full scan - not implemented in Phase 2'
      );
    });
  });

  describe('generateNatsJwt', () => {
    it('should generate a valid NATS JWT with correct structure', async () => {
      const jwt = await tokenService.generateNatsJwt('toolset-1', 'runtime-1', 'workspace-1');

      expect(jwt).toBeTruthy();
      expect(typeof jwt).toBe('string');

      // JWT should have 3 parts separated by dots
      const parts = jwt.split('.');
      expect(parts).toHaveLength(3);

      // Decode and verify header
      const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
      expect(header.typ).toBe('JWT');
      expect(header.alg).toBe('ed25519-nkey');

      // Decode and verify payload
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      expect(payload.toolsetId).toBe('toolset-1');
      expect(payload.workspaceId).toBe('workspace-1');
      expect(payload.nats.type).toBe('user');
      expect(payload.nats.pub.allow).toContain('toolset.toolset-1.*');
      expect(payload.nats.sub.allow).toContain('toolset.toolset-1.*');
    });

    it('should include correct expiration time', async () => {
      const beforeTime = Math.floor(Date.now() / 1000);
      const jwt = await tokenService.generateNatsJwt('toolset-1', 'runtime-1', 'workspace-1');
      const afterTime = Math.floor(Date.now() / 1000);

      const parts = jwt.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

      // Should expire in approximately 1 hour (3600 seconds)
      expect(payload.exp).toBeGreaterThanOrEqual(beforeTime + 3600);
      expect(payload.exp).toBeLessThanOrEqual(afterTime + 3600);
      expect(payload.iat).toBeGreaterThanOrEqual(beforeTime);
      expect(payload.iat).toBeLessThanOrEqual(afterTime);
    });

    it('should throw error when NATS_OPERATOR_SEED is missing', async () => {
      delete process.env.NATS_OPERATOR_SEED;

      await expect(
        tokenService.generateNatsJwt('toolset-1', 'runtime-1', 'workspace-1')
      ).rejects.toThrow('NATS_OPERATOR_SEED and NATS_ACCOUNT_SEED must be set in environment');
    });

    it('should throw error when NATS_ACCOUNT_SEED is missing', async () => {
      delete process.env.NATS_ACCOUNT_SEED;

      await expect(
        tokenService.generateNatsJwt('toolset-1', 'runtime-1', 'workspace-1')
      ).rejects.toThrow('NATS_OPERATOR_SEED and NATS_ACCOUNT_SEED must be set in environment');
    });

    it('should include unique JTI for each JWT', async () => {
      const jwt1 = await tokenService.generateNatsJwt('toolset-1', 'runtime-1', 'workspace-1');
      const jwt2 = await tokenService.generateNatsJwt('toolset-1', 'runtime-1', 'workspace-1');

      const payload1 = JSON.parse(Buffer.from(jwt1.split('.')[1], 'base64url').toString());
      const payload2 = JSON.parse(Buffer.from(jwt2.split('.')[1], 'base64url').toString());

      expect(payload1.jti).toBeTruthy();
      expect(payload2.jti).toBeTruthy();
      expect(payload1.jti).not.toBe(payload2.jti);
    });
  });

  describe('generateAccessToken', () => {
    it('should generate a unique access token', async () => {
      const createdToken = { ...mockToken, id: 'new-token-id' };
      vi.mocked(tokenRepository.create).mockResolvedValue(createdToken);

      const token1 = await tokenService.generateAccessToken('runtime-1', 'toolset-1');
      const token2 = await tokenService.generateAccessToken('runtime-1', 'toolset-1');

      expect(token1).toBeTruthy();
      expect(token2).toBeTruthy();
      expect(token1).not.toBe(token2);
      expect(typeof token1).toBe('string');
      expect(token1.length).toBeGreaterThan(0);
    });

    it('should create token in repository with correct properties', async () => {
      const createdToken = { ...mockToken, id: 'new-token-id' };
      vi.mocked(tokenRepository.create).mockResolvedValue(createdToken);

      await tokenService.generateAccessToken('runtime-1', 'toolset-1');

      expect(tokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'RUNTIME_KEY',
          workspaceId: 'PENDING',
          toolsetId: 'toolset-1',
          runtimeId: 'runtime-1',
          description: 'Runtime access token',
        })
      );

      // Check that expiration is approximately 1 hour from now
      const callArgs = vi.mocked(tokenRepository.create).mock.calls[0][0];
      const expiresAt = callArgs.expiresAt;
      expect(expiresAt).toBeInstanceOf(Date);
      const expirationTime = expiresAt!.getTime();
      const now = Date.now();
      expect(expirationTime).toBeGreaterThan(now);
      expect(expirationTime).toBeLessThan(now + 3700000); // Within 1 hour + 100 seconds buffer
    });

    it('should handle repository errors', async () => {
      vi.mocked(tokenRepository.create).mockRejectedValue(new Error('Database error'));

      await expect(
        tokenService.generateAccessToken('runtime-1', 'toolset-1')
      ).rejects.toThrow('Failed to generate access token');
    });
  });

  describe('isTokenValid', () => {
    it('should return true for valid token', async () => {
      const validToken: dgraphResolversTypes.Token = { ...mockToken, type: TokenType.RuntimeKey, workspaceId: 'PENDING' };
      vi.mocked(tokenRepository.findByType).mockResolvedValue([validToken]);
      vi.mocked(tokenRepository.isTokenValid).mockReturnValue(true);

      const result = await tokenService.isTokenValid('token-1');

      expect(result).toBe(true);
    });

    it('should return false for expired token', async () => {
      const expiredToken: dgraphResolversTypes.Token = {
        ...mockToken,
        type: TokenType.RuntimeKey,
        workspaceId: 'PENDING',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      };
      vi.mocked(tokenRepository.findByType).mockResolvedValue([expiredToken]);
      vi.mocked(tokenRepository.isTokenValid).mockReturnValue(false);

      const result = await tokenService.isTokenValid('token-1');

      expect(result).toBe(false);
    });

    it('should return false for revoked token', async () => {
      const revokedToken: dgraphResolversTypes.Token = {
        ...mockToken,
        type: TokenType.RuntimeKey,
        workspaceId: 'PENDING',
        revokedAt: new Date().toISOString(),
      };
      vi.mocked(tokenRepository.findByType).mockResolvedValue([revokedToken]);
      vi.mocked(tokenRepository.isTokenValid).mockReturnValue(false);

      const result = await tokenService.isTokenValid('token-1');

      expect(result).toBe(false);
    });

    it('should return false for non-existent token', async () => {
      vi.mocked(tokenRepository.findByType).mockResolvedValue([]);

      const result = await tokenService.isTokenValid('nonexistent-token');

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(tokenRepository.findByType).mockRejectedValue(new Error('Database error'));

      const result = await tokenService.isTokenValid('token-1');

      expect(result).toBe(false);
    });
  });
});
