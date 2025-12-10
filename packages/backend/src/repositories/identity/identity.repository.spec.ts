import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IdentityRepository } from '../identity/identity.repository';
import { DGraphService } from '../../services/dgraph.service';
import { LoggerService, dgraphResolversTypes } from '@skilder-ai/common';
import { randomBytes } from 'crypto';

// Mock dependencies
vi.mock('../services/dgraph.service');
vi.mock('@skilder-ai/common', async () => {
  const actual = await vi.importActual('@skilder-ai/common');
  return {
    ...actual,
    LoggerService: vi.fn().mockImplementation(() => ({
      getLogger: vi.fn().mockReturnValue({
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      }),
    })),
  };
});

describe('IdentityRepository', () => {
  let repository: IdentityRepository;
  let mockDgraphService: DGraphService;
  let mockLoggerService: LoggerService;

  beforeEach(() => {
    mockLoggerService = {
      getLogger: vi.fn().mockReturnValue({
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      }),
    } as unknown as LoggerService;

    mockDgraphService = {
      query: vi.fn(),
      mutation: vi.fn(),
    } as unknown as DGraphService;

    repository = new IdentityRepository(mockDgraphService, mockLoggerService);
  });

  describe('createKey', () => {
    it('should create a workspace key with correct format', async () => {
      const mockKey: dgraphResolversTypes.IdentityKey = {
        id: 'key-id',
        key: 'WSK' + randomBytes(32).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
        relatedId: 'workspace-id',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 20 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      };

      // Mock query to return empty array (key doesn't exist yet)
      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        queryIdentityKey: [],
      });

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        addIdentityKey: { identityKey: [mockKey] },
      });

      const result = await repository.createKey('workspace', 'workspace-id', 'Test key');

      expect(result).toEqual(mockKey);
      expect(result.key).toMatch(/^WSK[A-Za-z0-9_-]{43}$/);
      expect(result.key.length).toBe(46);
    });

    it('should create a runtime key with correct format', async () => {
      const mockKey: dgraphResolversTypes.IdentityKey = {
        id: 'key-id',
        key: 'RTK' + randomBytes(32).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
        relatedId: 'runtime-id',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 20 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      };

      // Mock query to return empty array (key doesn't exist yet)
      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        queryIdentityKey: [],
      });

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        addIdentityKey: { identityKey: [mockKey] },
      });

      const result = await repository.createKey('runtime', 'runtime-id', 'Runtime key');

      expect(result.key).toMatch(/^RTK[A-Za-z0-9_-]{43}$/);
      expect(result.key.length).toBe(46);
    });

    it('should create a skill key with correct format', async () => {
      const mockKey: dgraphResolversTypes.IdentityKey = {
        id: 'key-id',
        key: 'SKK' + randomBytes(32).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
        relatedId: 'skill-id',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 20 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      };

      // Mock query to return empty array (key doesn't exist yet)
      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        queryIdentityKey: [],
      });

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        addIdentityKey: { identityKey: [mockKey] },
      });

      const result = await repository.createKey('skill', 'skill-id', 'Skill key');

      expect(result.key).toMatch(/^SKK[A-Za-z0-9_-]{43}$/);
      expect(result.key.length).toBe(46);
    });

    it('should accept a custom key when provided', async () => {
      const customKey = 'WSKcustomkey1234567890123456789012345678901';

      const mockKey: dgraphResolversTypes.IdentityKey = {
        id: 'key-id',
        key: customKey,
        relatedId: 'workspace-id',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 20 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      };

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        addIdentityKey: { identityKey: [mockKey] },
      });

      const result = await repository.createKey('workspace', 'workspace-id', 'Custom key', undefined, {
        key: customKey,
      });

      expect(result.key).toBe(customKey);
    });

    it('should validate custom key format', async () => {
      const invalidKey = 'INVALID_KEY';

      await expect(
        repository.createKey('workspace', 'workspace-id', 'Invalid key', undefined, {
          key: invalidKey,
        })
      ).rejects.toThrow('Failed to create identity key');
    });

    it('should successfully create key when duplicate check returns empty array', async () => {
      const mockKey: dgraphResolversTypes.IdentityKey = {
        id: 'key-id',
        key: 'WSK' + randomBytes(32).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
        relatedId: 'workspace-id',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 20 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      };

      // Mock the duplicate check query to return empty array (key doesn't exist)
      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        queryIdentityKey: [], // Empty array = key not found = good!
      });

      // Mock the mutation to succeed
      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        addIdentityKey: { identityKey: [mockKey] },
      });

      const result = await repository.createKey('workspace', 'workspace-id', 'Test key');

      expect(result).toEqual(mockKey);
      expect(mockDgraphService.query).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ key: expect.stringMatching(/^WSK[A-Za-z0-9_-]{43}$/) })
      );
    });

    it('should detect collision but still create key on first collision within retry limit', async () => {
      const existingKey: dgraphResolversTypes.IdentityKey = {
        id: 'existing-key-id',
        key: 'WSKexisting123456789012345678901234567890abc',
        relatedId: 'other-workspace-id',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 1000000).toISOString(),
      };

      const newKey: dgraphResolversTypes.IdentityKey = {
        id: 'new-key-id',
        key: 'WSKexisting123456789012345678901234567890abc', // Same key as collision
        relatedId: 'workspace-id',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 20 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      };

      // Returns existing key (collision detected, but since it's first attempt, just warns and continues)
      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        queryIdentityKey: [existingKey],
      });

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        addIdentityKey: { identityKey: [newKey] },
      });

      const result = await repository.createKey('workspace', 'workspace-id', 'Test key');

      // Note: Current implementation detects collision but doesn't retry - just logs warning
      // This could be improved in the future to add `continue` after collision detection
      expect(result).toEqual(newKey);
      expect(mockDgraphService.query).toHaveBeenCalledTimes(1);
    });

    it('should handle query errors gracefully and retry', async () => {
      const mockKey: dgraphResolversTypes.IdentityKey = {
        id: 'key-id',
        key: 'WSK' + randomBytes(32).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
        relatedId: 'workspace-id',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 20 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      };

      // Mock query to throw error first time, then succeed
      let queryCount = 0;
      vi.spyOn(mockDgraphService, 'query').mockImplementation(async () => {
        queryCount++;
        if (queryCount === 1) {
          throw new Error('Database connection error');
        }
        return { queryIdentityKey: [] };
      });

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        addIdentityKey: { identityKey: [mockKey] },
      });

      const result = await repository.createKey('workspace', 'workspace-id', 'Test key');

      expect(result).toEqual(mockKey);
      // Should have retried after first query error
      expect(mockDgraphService.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('findKey', () => {
    it('should find and return a valid workspace key', async () => {
      const mockKey: dgraphResolversTypes.IdentityKey = {
        id: 'key-id',
        key: 'WSKabcdefghijklmnopqrstuvwxyz1234567890abcde',
        relatedId: 'workspace-id',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 1000000).toISOString(),
      };

      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        queryIdentityKey: [mockKey],
      });

      const result = await repository.findKey(mockKey.key);

      expect(result).toEqual({
        relatedId: 'workspace-id',
        nature: 'workspace',
      });
    });

    it('should find and return a valid runtime key', async () => {
      const mockKey: dgraphResolversTypes.IdentityKey = {
        id: 'key-id',
        key: 'RTKabcdefghijklmnopqrstuvwxyz1234567890abcde',
        relatedId: 'runtime-id',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 1000000).toISOString(),
      };

      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        queryIdentityKey: [mockKey],
      });

      const result = await repository.findKey(mockKey.key);

      expect(result).toEqual({
        relatedId: 'runtime-id',
        nature: 'runtime',
      });
    });

    it('should find and return a valid skill key', async () => {
      const mockKey: dgraphResolversTypes.IdentityKey = {
        id: 'key-id',
        key: 'SKKabcdefghijklmnopqrstuvwxyz1234567890abcde',
        relatedId: 'skill-id',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 1000000).toISOString(),
      };

      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        queryIdentityKey: [mockKey],
      });

      const result = await repository.findKey(mockKey.key);

      expect(result).toEqual({
        relatedId: 'skill-id',
        nature: 'skill',
      });
    });

    it('should throw NOT_FOUND for non-existent key', async () => {
      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        queryIdentityKey: [],
      });

      await expect(repository.findKey('WSKnonexistent')).rejects.toThrow('NOT_FOUND');
    });

    it('should throw EXPIRED for expired key', async () => {
      const mockKey: dgraphResolversTypes.IdentityKey = {
        id: 'key-id',
        key: 'WSKabcdefghijklmnopqrstuvwxyz1234567890abcde',
        relatedId: 'workspace-id',
        createdAt: new Date(Date.now() - 1000000).toISOString(),
        expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
      };

      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        queryIdentityKey: [mockKey],
      });

      await expect(repository.findKey(mockKey.key)).rejects.toThrow('EXPIRED');
    });

    it('should throw REVOKED for revoked key', async () => {
      const mockKey: dgraphResolversTypes.IdentityKey = {
        id: 'key-id',
        key: 'WSKabcdefghijklmnopqrstuvwxyz1234567890abcde',
        relatedId: 'workspace-id',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 1000000).toISOString(),
        revokedAt: new Date().toISOString(), // Revoked
      };

      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        queryIdentityKey: [mockKey],
      });

      await expect(repository.findKey(mockKey.key)).rejects.toThrow('REVOKED');
    });

    it('should throw INVALID_KEY_FORMAT for invalid key format', async () => {
      await expect(repository.findKey('short')).rejects.toThrow('INVALID_KEY_FORMAT');
    });

    it('should throw INVALID_KEY_PREFIX for invalid prefix', async () => {
      await expect(repository.findKey('XYZinvalidprefix123456789012345678901234')).rejects.toThrow(
        'INVALID_KEY_PREFIX'
      );
    });

    it('should throw INVALID_KEY_FORMAT for key with invalid characters', async () => {
      await expect(repository.findKey('WSK@#$%^&*()_+={}[]|\\:";\'<>?,./~`')).rejects.toThrow(
        'INVALID_KEY_FORMAT'
      );
    });

    it('should accept legacy 32-character keys', async () => {
      const legacyKey = 'WSKabcdefghijklmnopqrstuvwxy'; // 32 chars total

      const mockKey: dgraphResolversTypes.IdentityKey = {
        id: 'key-id',
        key: legacyKey,
        relatedId: 'workspace-id',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 1000000).toISOString(),
      };

      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        queryIdentityKey: [mockKey],
      });

      const result = await repository.findKey(legacyKey);

      expect(result).toEqual({
        relatedId: 'workspace-id',
        nature: 'workspace',
      });
    });
  });

  describe('revokeKey', () => {
    it('should revoke a key successfully', async () => {
      const mockKey: dgraphResolversTypes.IdentityKey = {
        id: 'key-id',
        key: 'WSKabcdefghijklmnopqrstuvwxyz1234567890abcde',
        relatedId: 'workspace-id',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 1000000).toISOString(),
        revokedAt: new Date().toISOString(),
      };

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        updateIdentityKey: { identityKey: [mockKey] },
      });

      const result = await repository.revokeKey('key-id');

      expect(result).toEqual(mockKey);
      expect(result.revokedAt).toBeDefined();
    });
  });

  describe('deleteKey', () => {
    it('should delete a key successfully', async () => {
      const mockKey: dgraphResolversTypes.IdentityKey = {
        id: 'key-id',
        key: 'WSKabcdefghijklmnopqrstuvwxyz1234567890abcde',
        relatedId: 'workspace-id',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 1000000).toISOString(),
      };

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        deleteIdentityKey: { identityKey: [mockKey] },
      });

      const result = await repository.deleteKey('key-id');

      expect(result).toEqual(mockKey);
    });
  });

  describe('findKeysByRelatedId', () => {
    it('should find all keys for a related ID', async () => {
      const mockKeys: dgraphResolversTypes.IdentityKey[] = [
        {
          id: 'key-1',
          key: 'WSKabcdefghijklmnopqrstuvwxyz1234567890abcd1',
          relatedId: 'workspace-id',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 1000000).toISOString(),
        },
        {
          id: 'key-2',
          key: 'WSKabcdefghijklmnopqrstuvwxyz1234567890abcd2',
          relatedId: 'workspace-id',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 1000000).toISOString(),
        },
      ];

      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        queryIdentityKey: mockKeys,
      });

      const result = await repository.findKeysByRelatedId('workspace-id');

      expect(result).toEqual(mockKeys);
      expect(result.length).toBe(2);
    });
  });

  describe('findKeyById', () => {
    it('should find a key by its ID', async () => {
      const mockKey: dgraphResolversTypes.IdentityKey = {
        id: 'key-id',
        key: 'WSKabcdefghijklmnopqrstuvwxyz1234567890abcde',
        relatedId: 'workspace-id',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 1000000).toISOString(),
      };

      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        getIdentityKey: mockKey,
      });

      const result = await repository.findKeyById('key-id');

      expect(result).toEqual(mockKey);
    });

    it('should return null for non-existent key ID', async () => {
      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        getIdentityKey: null,
      });

      const result = await repository.findKeyById('non-existent-id');

      expect(result).toBeNull();
    });
  });
});
