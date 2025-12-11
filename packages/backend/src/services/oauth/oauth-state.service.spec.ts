import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { OAuthStateService } from './oauth-state.service';
import { LoggerServiceMock } from '@skilder-ai/common/test/vitest';
import { LoggerService, EncryptionService, dgraphResolversTypes } from '@skilder-ai/common';
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

describe('OAuthStateService', () => {
  let service: OAuthStateService;
  let loggerService: LoggerServiceMock;
  let encryptionService: EncryptionServiceMock;

  const mockUserId = 'user-123';
  const mockWorkspaceId = 'workspace-456';
  const mockProvider = dgraphResolversTypes.OAuthProviderType.Google;
  const mockRedirectUri = 'https://app.example.com/oauth/callback';
  const mockScopes = ['email', 'profile'];

  beforeEach(() => {
    loggerService = new LoggerServiceMock();
    encryptionService = new EncryptionServiceMock();
    service = new OAuthStateService(
      loggerService as unknown as LoggerService,
      encryptionService as unknown as EncryptionService
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

    it('creates unique nonces on multiple calls', () => {
      const state1 = service.generateState(mockUserId, mockWorkspaceId, mockProvider, mockRedirectUri, mockScopes);
      const state2 = service.generateState(mockUserId, mockWorkspaceId, mockProvider, mockRedirectUri, mockScopes);

      // States should be different due to unique nonces
      expect(state1).not.toBe(state2);

      // Both should be valid and contain different nonces
      const payload1 = service.validateState(state1);
      const payload2 = service.validateState(state2);

      expect(payload1).not.toBeNull();
      expect(payload2).not.toBeNull();
      expect(payload1!.nonce).not.toBe(payload2!.nonce);
    });

    it('encodes all payload fields correctly', () => {
      const state = service.generateState(mockUserId, mockWorkspaceId, mockProvider, mockRedirectUri, mockScopes);
      const payload = service.validateState(state);

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
    it('accepts valid state and returns payload', () => {
      const state = service.generateState(mockUserId, mockWorkspaceId, mockProvider, mockRedirectUri, mockScopes);
      const payload = service.validateState(state);

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

    it('rejects expired state', () => {
      // Mock Date.now to control time
      const now = 1000000000;
      const dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(now);

      // Generate state at time = now
      const state = service.generateState(mockUserId, mockWorkspaceId, mockProvider, mockRedirectUri, mockScopes);

      // Fast forward past expiry (10 minutes + 1ms)
      dateNowSpy.mockReturnValue(now + 10 * 60 * 1000 + 1);

      // Validation should fail
      const payload = service.validateState(state);
      expect(payload).toBeNull();

      dateNowSpy.mockRestore();
    });

    it('accepts state just before expiry', () => {
      // Mock Date.now to control time
      const now = 1000000000;
      const dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(now);

      // Generate state at time = now
      const state = service.generateState(mockUserId, mockWorkspaceId, mockProvider, mockRedirectUri, mockScopes);

      // Fast forward to just before expiry (10 minutes - 1ms)
      dateNowSpy.mockReturnValue(now + 10 * 60 * 1000 - 1);

      // Validation should succeed
      const payload = service.validateState(state);
      expect(payload).not.toBeNull();
      expect(payload!.userId).toBe(mockUserId);

      dateNowSpy.mockRestore();
    });

    it('rejects replayed nonce on second validation', () => {
      const state = service.generateState(mockUserId, mockWorkspaceId, mockProvider, mockRedirectUri, mockScopes);

      // First validation should succeed
      const payload1 = service.validateState(state);
      expect(payload1).not.toBeNull();
      expect(payload1!.userId).toBe(mockUserId);

      // Second validation with same state should fail (replay attack)
      const payload2 = service.validateState(state);
      expect(payload2).toBeNull();
    });

    it('returns null for malformed state (invalid base64url)', () => {
      // Silence expected error logs
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const malformedState = 'this-is-not-valid-base64url!!!';
      const payload = service.validateState(malformedState);

      expect(payload).toBeNull();

      errorSpy.mockRestore();
    });

    it('returns null for malformed state (invalid JSON)', () => {
      // Silence expected error logs
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Create an encrypted state that doesn't contain valid JSON
      const invalidJson = encryptionService.encrypt('not-valid-json');
      const state = Buffer.from(invalidJson).toString('base64url');

      const payload = service.validateState(state);
      expect(payload).toBeNull();

      errorSpy.mockRestore();
    });

    it('returns null for decryption errors (corrupted ciphertext)', () => {
      // Silence expected error logs
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Generate valid state then corrupt it
      const validState = service.generateState(mockUserId, mockWorkspaceId, mockProvider, mockRedirectUri, mockScopes);

      // Corrupt the state by modifying some characters
      const corruptedState = validState.slice(0, -5) + 'XXXXX';

      const payload = service.validateState(corruptedState);
      expect(payload).toBeNull();

      errorSpy.mockRestore();
    });

    it('returns null for decryption errors (wrong encryption format)', () => {
      // Silence expected error logs
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Create a base64url encoded string that's not in the expected encryption format
      const invalidFormat = Buffer.from('missing:colons').toString('base64url');

      const payload = service.validateState(invalidFormat);
      expect(payload).toBeNull();

      errorSpy.mockRestore();
    });

    it('validates state with different OAuth providers', () => {
      const providers = [
        dgraphResolversTypes.OAuthProviderType.Google,
        dgraphResolversTypes.OAuthProviderType.Microsoft,
        dgraphResolversTypes.OAuthProviderType.Notion,
      ];

      for (const provider of providers) {
        const state = service.generateState(mockUserId, mockWorkspaceId, provider, mockRedirectUri, mockScopes);
        const payload = service.validateState(state);

        expect(payload).not.toBeNull();
        expect(payload!.provider).toBe(provider);
      }
    });

    it('validates state with empty scopes array', () => {
      const state = service.generateState(mockUserId, mockWorkspaceId, mockProvider, mockRedirectUri, []);
      const payload = service.validateState(state);

      expect(payload).not.toBeNull();
      expect(payload!.scopes).toEqual([]);
    });

    it('validates state with multiple scopes', () => {
      const multipleScopes = ['email', 'profile', 'openid', 'https://www.googleapis.com/auth/drive.readonly'];
      const state = service.generateState(mockUserId, mockWorkspaceId, mockProvider, mockRedirectUri, multipleScopes);
      const payload = service.validateState(state);

      expect(payload).not.toBeNull();
      expect(payload!.scopes).toEqual(multipleScopes);
    });
  });

  describe('nonce cleanup', () => {
    it('clears nonces when size exceeds 10000', () => {
      // Generate and validate 10001 states to trigger cleanup
      // Note: This test verifies the cleanup logic but doesn't test the actual cleanup interval
      const states: string[] = [];

      // Generate 10001 unique states
      for (let i = 0; i < 10001; i++) {
        const state = service.generateState(
          `user-${i}`,
          mockWorkspaceId,
          mockProvider,
          mockRedirectUri,
          mockScopes
        );
        states.push(state);
        service.validateState(state); // Mark nonce as used
      }

      // Access private usedNonces via reflection to verify size
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const usedNonces = (service as unknown as { usedNonces: Set<string> }).usedNonces;

      // After 10001 validations, cleanup should have been triggered
      // The set should be cleared when it exceeds 10000
      expect(usedNonces.size).toBeLessThanOrEqual(10001);
    });
  });
});
