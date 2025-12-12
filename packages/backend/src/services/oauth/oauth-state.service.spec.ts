import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { OAuthStateService } from './oauth-state.service';
import { LoggerServiceMock } from '@skilder-ai/common/test/vitest';
import { LoggerService, EncryptionService, dgraphResolversTypes, NatsCacheService } from '@skilder-ai/common';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

/**
 * Simple EncryptionService mock that implements actual encryption/decryption
 * for realistic testing of the OAuthStateService.
 */
class EncryptionServiceMock {
  private readonly key: Buffer;

  constructor() {
    // Use a deterministic test key
    this.key = createHash('sha256').update('test-encryption-key-for-oauth-state-tests').digest();
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
  }

  decrypt(ciphertext: string): string {
    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid ciphertext format');
    }

    const [ivB64, authTagB64, encryptedB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const encrypted = Buffer.from(encryptedB64, 'base64');

    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  }
}

/**
 * Mock NatsCacheService for testing nonce storage.
 */
class NatsCacheServiceMock {
  private buckets: Map<string, Map<string, { value: unknown; ttl?: number }>> = new Map();

  async createBucket(): Promise<void> {
    // No-op for mock
  }

  async get<T>(bucket: string, key: string): Promise<{ value: T; revision: number } | null> {
    const bucketMap = this.buckets.get(bucket);
    if (!bucketMap) return null;
    const entry = bucketMap.get(key);
    if (!entry) return null;
    return { value: entry.value as T, revision: 1 };
  }

  async put<T>(bucket: string, key: string, value: T): Promise<number> {
    if (!this.buckets.has(bucket)) {
      this.buckets.set(bucket, new Map());
    }
    this.buckets.get(bucket)!.set(key, { value });
    return 1;
  }

  clear(): void {
    this.buckets.clear();
  }
}

describe('OAuthStateService', () => {
  let service: OAuthStateService;
  let loggerService: LoggerServiceMock;
  let encryptionService: EncryptionServiceMock;
  let cacheService: NatsCacheServiceMock;

  const mockUserId = 'user-123';
  const mockWorkspaceId = 'workspace-456';
  const mockProvider = dgraphResolversTypes.OAuthProviderType.Google;
  const mockRedirectUri = 'https://app.example.com/oauth/callback';
  const mockScopes = ['email', 'profile'];

  beforeEach(async () => {
    loggerService = new LoggerServiceMock();
    encryptionService = new EncryptionServiceMock();
    cacheService = new NatsCacheServiceMock();
    service = new OAuthStateService(
      loggerService as unknown as LoggerService,
      encryptionService as unknown as EncryptionService,
      cacheService as unknown as NatsCacheService,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cacheService.clear();
  });

  describe('generateState()', () => {
    it('returns valid base64url string', () => {
      const state = service.generateState(mockUserId, mockWorkspaceId, mockProvider, mockRedirectUri, mockScopes);

      // Should be a non-empty string
      expect(state).toBeTruthy();
      expect(typeof state).toBe('string');

      // Base64url should not contain +, /, or = characters
      expect(state).not.toMatch(/[+/=]/);

      // Should be decodable as base64url
      expect(() => Buffer.from(state, 'base64url')).not.toThrow();
    });

    it('creates unique nonces on multiple calls', async () => {
      const state1 = service.generateState(mockUserId, mockWorkspaceId, mockProvider, mockRedirectUri, mockScopes);
      const state2 = service.generateState(mockUserId, mockWorkspaceId, mockProvider, mockRedirectUri, mockScopes);

      // States should be different due to unique nonces
      expect(state1).not.toBe(state2);

      // Both should be valid and contain different nonces
      const payload1 = await service.validateState(state1);
      const payload2 = await service.validateState(state2);

      expect(payload1).not.toBeNull();
      expect(payload2).not.toBeNull();
      expect(payload1!.nonce).not.toBe(payload2!.nonce);
    });

    it('encodes all payload fields correctly', async () => {
      const state = service.generateState(mockUserId, mockWorkspaceId, mockProvider, mockRedirectUri, mockScopes);
      const payload = await service.validateState(state);

      expect(payload).not.toBeNull();
      expect(payload!.userId).toBe(mockUserId);
      expect(payload!.workspaceId).toBe(mockWorkspaceId);
      expect(payload!.provider).toBe(mockProvider);
      expect(payload!.redirectUri).toBe(mockRedirectUri);
      expect(payload!.scopes).toEqual(mockScopes);
      expect(payload!.nonce).toBeTruthy();
      expect(payload!.createdAt).toBeGreaterThan(0);
    });
  });

  describe('validateState()', () => {
    it('accepts valid state and returns payload', async () => {
      const state = service.generateState(mockUserId, mockWorkspaceId, mockProvider, mockRedirectUri, mockScopes);
      const payload = await service.validateState(state);

      expect(payload).not.toBeNull();
      expect(payload).toMatchObject({
        userId: mockUserId,
        workspaceId: mockWorkspaceId,
        provider: mockProvider,
        redirectUri: mockRedirectUri,
        scopes: mockScopes,
      });
      expect(payload!.nonce).toBeTruthy();
      expect(payload!.createdAt).toBeGreaterThan(0);
    });

    it('rejects expired state', async () => {
      // Mock Date.now to control time
      const now = 1000000000;
      const dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(now);

      // Generate state at time = now
      const state = service.generateState(mockUserId, mockWorkspaceId, mockProvider, mockRedirectUri, mockScopes);

      // Fast forward past expiry (10 minutes + 1ms)
      dateNowSpy.mockReturnValue(now + 10 * 60 * 1000 + 1);

      // Validation should fail
      const payload = await service.validateState(state);
      expect(payload).toBeNull();

      dateNowSpy.mockRestore();
    });

    it('accepts state just before expiry', async () => {
      // Mock Date.now to control time
      const now = 1000000000;
      const dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(now);

      // Generate state at time = now
      const state = service.generateState(mockUserId, mockWorkspaceId, mockProvider, mockRedirectUri, mockScopes);

      // Fast forward to just before expiry (10 minutes - 1ms)
      dateNowSpy.mockReturnValue(now + 10 * 60 * 1000 - 1);

      // Validation should succeed
      const payload = await service.validateState(state);
      expect(payload).not.toBeNull();
      expect(payload!.userId).toBe(mockUserId);

      dateNowSpy.mockRestore();
    });

    it('rejects replayed nonce on second validation', async () => {
      const state = service.generateState(mockUserId, mockWorkspaceId, mockProvider, mockRedirectUri, mockScopes);

      // First validation should succeed
      const payload1 = await service.validateState(state);
      expect(payload1).not.toBeNull();
      expect(payload1!.userId).toBe(mockUserId);

      // Second validation with same state should fail (replay attack)
      const payload2 = await service.validateState(state);
      expect(payload2).toBeNull();
    });

    it('returns null for malformed state (invalid base64url)', async () => {
      // Silence expected error logs
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const malformedState = 'this-is-not-valid-base64url!!!';
      const payload = await service.validateState(malformedState);

      expect(payload).toBeNull();

      errorSpy.mockRestore();
    });

    it('returns null for malformed state (invalid JSON)', async () => {
      // Silence expected error logs
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Create an encrypted state that doesn't contain valid JSON
      const invalidJson = encryptionService.encrypt('not-valid-json');
      const state = Buffer.from(invalidJson).toString('base64url');

      const payload = await service.validateState(state);
      expect(payload).toBeNull();

      errorSpy.mockRestore();
    });

    it('returns null for decryption errors (corrupted ciphertext)', async () => {
      // Silence expected error logs
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Generate valid state then corrupt it
      const validState = service.generateState(mockUserId, mockWorkspaceId, mockProvider, mockRedirectUri, mockScopes);

      // Corrupt the state by modifying some characters
      const corruptedState = validState.slice(0, -5) + 'XXXXX';

      const payload = await service.validateState(corruptedState);
      expect(payload).toBeNull();

      errorSpy.mockRestore();
    });

    it('returns null for decryption errors (wrong encryption format)', async () => {
      // Silence expected error logs
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Create a base64url encoded string that's not in the expected encryption format
      const invalidFormat = Buffer.from('missing:colons').toString('base64url');

      const payload = await service.validateState(invalidFormat);
      expect(payload).toBeNull();

      errorSpy.mockRestore();
    });

    it('validates state with different OAuth providers', async () => {
      const providers = [
        dgraphResolversTypes.OAuthProviderType.Google,
        dgraphResolversTypes.OAuthProviderType.Microsoft,
        dgraphResolversTypes.OAuthProviderType.Notion,
      ];

      for (const provider of providers) {
        const state = service.generateState(mockUserId, mockWorkspaceId, provider, mockRedirectUri, mockScopes);
        const payload = await service.validateState(state);

        expect(payload).not.toBeNull();
        expect(payload!.provider).toBe(provider);
      }
    });

    it('validates state with empty scopes array', async () => {
      const state = service.generateState(mockUserId, mockWorkspaceId, mockProvider, mockRedirectUri, []);
      const payload = await service.validateState(state);

      expect(payload).not.toBeNull();
      expect(payload!.scopes).toEqual([]);
    });

    it('validates state with multiple scopes', async () => {
      const multipleScopes = ['email', 'profile', 'openid', 'https://www.googleapis.com/auth/drive.readonly'];
      const state = service.generateState(mockUserId, mockWorkspaceId, mockProvider, mockRedirectUri, multipleScopes);
      const payload = await service.validateState(state);

      expect(payload).not.toBeNull();
      expect(payload!.scopes).toEqual(multipleScopes);
    });
  });

  describe('nonce storage', () => {
    it('stores nonces in distributed cache for horizontal scaling', async () => {
      const state = service.generateState(mockUserId, mockWorkspaceId, mockProvider, mockRedirectUri, mockScopes);

      // First validation stores nonce in cache and succeeds
      const payload1 = await service.validateState(state);
      expect(payload1).not.toBeNull();

      // Second validation finds nonce in cache and fails (replay prevention)
      const payload2 = await service.validateState(state);
      expect(payload2).toBeNull();

      // This verifies the service correctly uses the cache for nonce tracking
      // TTL-based cleanup is handled automatically by the cache service
    });

    it('handles multiple concurrent state validations', async () => {
      const states = Array.from({ length: 10 }, (_, i) =>
        service.generateState(`user-${i}`, mockWorkspaceId, mockProvider, mockRedirectUri, mockScopes)
      );

      // Validate all states concurrently
      const results = await Promise.all(states.map((s) => service.validateState(s)));

      // All should succeed on first validation
      expect(results.every((r) => r !== null)).toBe(true);

      // Attempt to replay all states concurrently
      const replayResults = await Promise.all(states.map((s) => service.validateState(s)));

      // All replays should fail
      expect(replayResults.every((r) => r === null)).toBe(true);
    });
  });
});
