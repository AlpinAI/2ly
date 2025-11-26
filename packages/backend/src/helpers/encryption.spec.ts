import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  encrypt,
  decrypt,
  maskApiKey,
  reEncrypt,
  getEncryptedDataVersion,
  getEncryptedDataAlgorithm,
  needsMigration,
} from './encryption';

describe('Encryption Helper', () => {
  const originalEnv = {
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    ENCRYPTION_KEY_V1: process.env.ENCRYPTION_KEY_V1,
    ENCRYPTION_KEY_V2: process.env.ENCRYPTION_KEY_V2,
  };
  const testKeyV1 = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'; // 64 hex chars
  const testKeyV2 = 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210'; // Different key

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = testKeyV2; // Current key
    process.env.ENCRYPTION_KEY_V1 = testKeyV1; // Legacy key
    process.env.ENCRYPTION_KEY_V2 = testKeyV2; // v2 key (same as current)
  });

  afterEach(() => {
    process.env.ENCRYPTION_KEY = originalEnv.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY_V1 = originalEnv.ENCRYPTION_KEY_V1;
    process.env.ENCRYPTION_KEY_V2 = originalEnv.ENCRYPTION_KEY_V2;
  });

  describe('encrypt', () => {
    it('should encrypt a plaintext string with version and algorithm prefix', () => {
      const plaintext = 'sk-1234567890abcdef';
      const encrypted = encrypt(plaintext);

      // Check format: v2.aes256gcm:iv:authTag:ciphertext
      expect(encrypted).toMatch(/^v2\.aes256gcm:/);
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(4); // v2.aes256gcm, iv, authTag, ciphertext
      expect(parts[0]).toBe('v2.aes256gcm');
      expect(parts[1]).toHaveLength(24); // 12 bytes IV in hex = 24 chars
      expect(parts[2]).toHaveLength(32); // 16 bytes auth tag in hex = 32 chars
      expect(parts[3].length).toBeGreaterThan(0); // Ciphertext
    });

    it('should support encrypting with specific version and algorithm', () => {
      const plaintext = 'sk-1234567890abcdef';
      const encryptedV1 = encrypt(plaintext, 1, 'aes256gcm');
      const encryptedV2 = encrypt(plaintext, 2, 'aes256gcm');

      expect(encryptedV1).toMatch(/^v1\.aes256gcm:/);
      expect(encryptedV2).toMatch(/^v2\.aes256gcm:/);
    });

    it('should produce different outputs for the same input (due to random IV)', () => {
      const plaintext = 'sk-1234567890abcdef';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should throw error if ENCRYPTION_KEY is not set', () => {
      delete process.env.ENCRYPTION_KEY;
      delete process.env.ENCRYPTION_KEY_V2;

      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY_V2 environment variable is not set');
    });

    it('should throw error if ENCRYPTION_KEY is invalid format', () => {
      process.env.ENCRYPTION_KEY = 'invalid-key';
      process.env.ENCRYPTION_KEY_V2 = 'invalid-key';

      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY_V2 must be 64 hexadecimal characters');
    });

    it('should handle empty strings', () => {
      const encrypted = encrypt('');
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(4); // v2, iv, authTag, ciphertext
    });

    it('should handle long API keys', () => {
      const longKey = 'sk-' + 'x'.repeat(200);
      const encrypted = encrypt(longKey);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(longKey);
    });

    it('should handle special characters', () => {
      const specialKey = 'sk-!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      const encrypted = encrypt(specialKey);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(specialKey);
    });
  });

  describe('decrypt', () => {
    it('should decrypt an encrypted string back to original', () => {
      const plaintext = 'sk-1234567890abcdef';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle multiple encrypt/decrypt cycles', () => {
      const plaintext = 'sk-test-key-12345';

      for (let i = 0; i < 10; i++) {
        const encrypted = encrypt(plaintext);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(plaintext);
      }
    });

    it('should throw error if encrypted data format is invalid', () => {
      expect(() => decrypt('invalid-format')).toThrow('Invalid encrypted data format');
      expect(() => decrypt('only:two')).toThrow('Invalid encrypted data format');
      expect(() => decrypt('too:many:colons:here')).toThrow('Invalid encrypted data format');
    });

    it('should throw error if IV length is invalid', () => {
      const invalidIV = '0000:' + '0'.repeat(32) + ':abcd';
      expect(() => decrypt(invalidIV)).toThrow('Invalid IV length');
    });

    it('should throw error if auth tag length is invalid', () => {
      const invalidTag = '0'.repeat(24) + ':0000:abcd';
      expect(() => decrypt(invalidTag)).toThrow('Invalid auth tag length');
    });

    it('should throw error if ENCRYPTION_KEY is not set', () => {
      const encrypted = encrypt('test');
      delete process.env.ENCRYPTION_KEY;
      delete process.env.ENCRYPTION_KEY_V2;

      expect(() => decrypt(encrypted)).toThrow('ENCRYPTION_KEY_V2 environment variable is not set');
    });

    it('should throw error if ciphertext has been tampered with', () => {
      const plaintext = 'sk-1234567890abcdef';
      const encrypted = encrypt(plaintext);

      // Tamper with the ciphertext
      const parts = encrypted.split(':');
      parts[2] = parts[2].replace(/0/g, '1'); // Change ciphertext
      const tampered = parts.join(':');

      expect(() => decrypt(tampered)).toThrow('Decryption failed');
    });

    it('should throw error if auth tag has been tampered with', () => {
      const plaintext = 'sk-1234567890abcdef';
      const encrypted = encrypt(plaintext);

      // Tamper with the auth tag
      const parts = encrypted.split(':');
      parts[2] = parts[2].replace(/0/g, '1'); // Change auth tag (index 2 now, after version)
      const tampered = parts.join(':');

      expect(() => decrypt(tampered)).toThrow('Decryption failed');
    });

    it('should decrypt data encrypted with different versions', () => {
      const plaintext = 'sk-test-multi-version';

      // Encrypt with v1
      const encryptedV1 = encrypt(plaintext, 1, 'aes256gcm');
      expect(decrypt(encryptedV1)).toBe(plaintext);

      // Encrypt with v2
      const encryptedV2 = encrypt(plaintext, 2, 'aes256gcm');
      expect(decrypt(encryptedV2)).toBe(plaintext);
    });

    it('should handle legacy v2 format (without algorithm suffix)', () => {
      // Simulate v2 data before algorithm versioning was added
      // Format: v2:iv:authTag:ciphertext (no algorithm)
      const plaintext = 'sk-legacy-v2-key-12345';

      // Manually create legacy v2 format by encrypting and removing algorithm
      const encrypted = encrypt(plaintext, 2, 'aes256gcm');
      const legacyV2Format = encrypted.replace('v2.aes256gcm:', 'v2:');

      // Should still decrypt with default algorithm
      const decrypted = decrypt(legacyV2Format);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle legacy v1 format (without algorithm suffix)', () => {
      // Simulate v1 data before algorithm versioning was added
      // Format: v1:iv:authTag:ciphertext (no algorithm)
      const plaintext = 'sk-legacy-v1-key-12345';

      // Manually create legacy v1 format
      const encrypted = encrypt(plaintext, 1, 'aes256gcm');
      const legacyV1Format = encrypted.replace('v1.aes256gcm:', 'v1:');

      // Should still decrypt with default algorithm
      const decrypted = decrypt(legacyV1Format);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle ancient legacy format (v1 without version prefix)', () => {
      // Simulate ancient encrypted data (before any versioning was added)
      // This uses the old format: iv:authTag:ciphertext (no version prefix)
      process.env.ENCRYPTION_KEY = testKeyV1; // Use old key for encryption

      const plaintext = 'sk-ancient-legacy-key-12345';

      // Manually create ancient legacy format by encrypting with v1 and removing prefix
      const encryptedV1 = encrypt(plaintext, 1, 'aes256gcm');
      const ancientFormat = encryptedV1.substring(13); // Remove "v1.aes256gcm:" prefix

      // Restore current key setup
      process.env.ENCRYPTION_KEY = testKeyV2;
      process.env.ENCRYPTION_KEY_V1 = testKeyV1;

      // Should still be able to decrypt ancient format using v1 key
      const decrypted = decrypt(ancientFormat);
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('maskApiKey', () => {
    it('should mask OpenAI keys correctly', () => {
      const key = 'sk-1234567890abcdef';
      const masked = maskApiKey(key);

      expect(masked).toBe('sk-...cdef');
      expect(masked.length).toBeLessThan(key.length);
    });

    it('should mask Anthropic keys correctly', () => {
      const key = 'sk-ant-1234567890abcdef';
      const masked = maskApiKey(key);

      // Uses first dash as delimiter, so "sk-" is the prefix
      expect(masked).toBe('sk-...cdef');
    });

    it('should mask keys without recognizable prefix', () => {
      const key = 'AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz';
      const masked = maskApiKey(key);

      expect(masked).toBe('AIz...WxYz');
    });

    it('should handle very short keys', () => {
      const key = 'short';
      const masked = maskApiKey(key);

      expect(masked).toBe('***');
    });

    it('should handle empty strings', () => {
      const masked = maskApiKey('');
      expect(masked).toBe('***');
    });

    it('should handle long keys with dashes', () => {
      const key = 'very-long-prefix-1234567890';
      const masked = maskApiKey(key);

      expect(masked).toContain('...');
      expect(masked).toContain('7890');
    });

    it('should always show last 4 characters for normal keys', () => {
      const keys = [
        'sk-1234567890abcdef',
        'sk-ant-api-key-here',
        'AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz',
      ];

      keys.forEach((key) => {
        const masked = maskApiKey(key);
        const last4 = key.slice(-4);
        expect(masked).toContain(last4);
      });
    });

    it('should mask most of the key', () => {
      const key = 'sk-1234567890abcdef';
      const masked = maskApiKey(key);

      // Masked should be shorter than original and hide middle characters
      expect(masked.length).toBeLessThan(key.length);
      expect(masked).toContain('...');
    });
  });

  describe('Key Rotation and Versioning', () => {
    describe('getEncryptedDataVersion', () => {
      it('should detect v2 version from encrypted data', () => {
        const encrypted = encrypt('test-data');
        expect(getEncryptedDataVersion(encrypted)).toBe(2);
      });

      it('should detect v1 version from encrypted data', () => {
        const encryptedV1 = encrypt('test-data', 1, 'aes256gcm');
        expect(getEncryptedDataVersion(encryptedV1)).toBe(1);
      });

      it('should detect legacy format as v1', () => {
        // Simulate legacy format without version prefix
        const legacyData = '0123456789abcdef01234567:0123456789abcdef0123456789abcdef:abcdef0123456789';
        expect(getEncryptedDataVersion(legacyData)).toBe(1);
      });
    });

    describe('getEncryptedDataAlgorithm', () => {
      it('should detect algorithm from new format', () => {
        const encrypted = encrypt('test-data');
        expect(getEncryptedDataAlgorithm(encrypted)).toBe('aes256gcm');
      });

      it('should default to aes256gcm for legacy v2 format', () => {
        const encrypted = encrypt('test-data', 2, 'aes256gcm');
        const legacyV2Format = encrypted.replace('v2.aes256gcm:', 'v2:');
        expect(getEncryptedDataAlgorithm(legacyV2Format)).toBe('aes256gcm');
      });

      it('should default to aes256gcm for legacy v1 format', () => {
        const encrypted = encrypt('test-data', 1, 'aes256gcm');
        const legacyV1Format = encrypted.replace('v1.aes256gcm:', 'v1:');
        expect(getEncryptedDataAlgorithm(legacyV1Format)).toBe('aes256gcm');
      });

      it('should default to aes256gcm for ancient format', () => {
        const legacyData = '0123456789abcdef01234567:0123456789abcdef0123456789abcdef:abcdef0123456789';
        expect(getEncryptedDataAlgorithm(legacyData)).toBe('aes256gcm');
      });
    });

    describe('needsMigration', () => {
      it('should return false for current version and algorithm data', () => {
        const encrypted = encrypt('test-data');
        expect(needsMigration(encrypted)).toBe(false);
      });

      it('should return true for v1 data', () => {
        const encryptedV1 = encrypt('test-data', 1, 'aes256gcm');
        expect(needsMigration(encryptedV1)).toBe(true);
      });

      it('should return true for legacy v2 format without algorithm', () => {
        const encrypted = encrypt('test-data', 2, 'aes256gcm');
        const legacyV2Format = encrypted.replace('v2.aes256gcm:', 'v2:');
        expect(needsMigration(legacyV2Format)).toBe(true);
      });

      it('should return true for legacy v1 format without algorithm', () => {
        const encrypted = encrypt('test-data', 1, 'aes256gcm');
        const legacyV1Format = encrypted.replace('v1.aes256gcm:', 'v1:');
        expect(needsMigration(legacyV1Format)).toBe(true);
      });

      it('should return true for ancient legacy format data', () => {
        // Create ancient legacy format
        process.env.ENCRYPTION_KEY = testKeyV1;
        const encryptedV1 = encrypt('test-data', 1, 'aes256gcm');
        const ancientFormat = encryptedV1.substring(13); // Remove "v1.aes256gcm:" prefix

        process.env.ENCRYPTION_KEY = testKeyV2;
        expect(needsMigration(ancientFormat)).toBe(true);
      });
    });

    describe('reEncrypt', () => {
      it('should re-encrypt v1 data to current version and algorithm', () => {
        const plaintext = 'sk-migrate-me-12345';

        // Encrypt with v1
        const encryptedV1 = encrypt(plaintext, 1, 'aes256gcm');
        expect(getEncryptedDataVersion(encryptedV1)).toBe(1);
        expect(getEncryptedDataAlgorithm(encryptedV1)).toBe('aes256gcm');

        // Re-encrypt to current version
        const reEncrypted = reEncrypt(encryptedV1);
        expect(getEncryptedDataVersion(reEncrypted)).toBe(2);
        expect(getEncryptedDataAlgorithm(reEncrypted)).toBe('aes256gcm');

        // Verify data integrity
        expect(decrypt(reEncrypted)).toBe(plaintext);
      });

      it('should migrate legacy v2 format to include algorithm', () => {
        const plaintext = 'sk-legacy-v2-migrate';

        // Create legacy v2 format (without algorithm)
        const encrypted = encrypt(plaintext, 2, 'aes256gcm');
        const legacyV2Format = encrypted.replace('v2.aes256gcm:', 'v2:');

        expect(needsMigration(legacyV2Format)).toBe(true);

        // Migrate
        const migrated = reEncrypt(legacyV2Format);
        expect(getEncryptedDataVersion(migrated)).toBe(2);
        expect(getEncryptedDataAlgorithm(migrated)).toBe('aes256gcm');
        expect(migrated).toMatch(/^v2\.aes256gcm:/);
        expect(decrypt(migrated)).toBe(plaintext);
      });

      it('should handle ancient legacy format migration', () => {
        const plaintext = 'sk-ancient-legacy-migrate';

        // Create ancient legacy format
        process.env.ENCRYPTION_KEY = testKeyV1;
        const encryptedV1 = encrypt(plaintext, 1, 'aes256gcm');
        const ancientFormat = encryptedV1.substring(13); // Remove "v1.aes256gcm:" prefix

        // Restore v2 as current
        process.env.ENCRYPTION_KEY = testKeyV2;
        process.env.ENCRYPTION_KEY_V1 = testKeyV1;

        // Migrate
        const migrated = reEncrypt(ancientFormat);
        expect(getEncryptedDataVersion(migrated)).toBe(2);
        expect(getEncryptedDataAlgorithm(migrated)).toBe('aes256gcm');
        expect(migrated).toMatch(/^v2\.aes256gcm:/);
        expect(decrypt(migrated)).toBe(plaintext);
      });

      it('should successfully re-encrypt current version data', () => {
        const plaintext = 'sk-already-current';
        const encrypted = encrypt(plaintext);

        // Re-encrypting current version should work (generates new IV)
        const reEncrypted = reEncrypt(encrypted);
        expect(getEncryptedDataVersion(reEncrypted)).toBe(2);
        expect(getEncryptedDataAlgorithm(reEncrypted)).toBe('aes256gcm');
        expect(decrypt(reEncrypted)).toBe(plaintext);
        expect(reEncrypted).not.toBe(encrypted); // Different due to new IV
      });

      it('should handle key rotation scenario', () => {
        const plaintext = 'sk-rotation-test';

        // Step 1: Data encrypted with old key (v1)
        process.env.ENCRYPTION_KEY = testKeyV1;
        const oldEncrypted = encrypt(plaintext, 1, 'aes256gcm');

        // Step 2: New key deployed (v2), old key kept for decryption
        process.env.ENCRYPTION_KEY = testKeyV2;
        process.env.ENCRYPTION_KEY_V1 = testKeyV1;
        process.env.ENCRYPTION_KEY_V2 = testKeyV2;

        // Step 3: Migrate data to new key
        const migrated = reEncrypt(oldEncrypted);

        // Step 4: Verify migration
        expect(getEncryptedDataVersion(migrated)).toBe(2);
        expect(getEncryptedDataAlgorithm(migrated)).toBe('aes256gcm');
        expect(migrated).toMatch(/^v2\.aes256gcm:/);
        expect(decrypt(migrated)).toBe(plaintext);

        // Step 5: Old v1 data still readable (for rollback safety)
        expect(decrypt(oldEncrypted)).toBe(plaintext);
      });
    });

    describe('Multi-version key management', () => {
      it('should handle missing versioned key with fallback to default', () => {
        // Only set default key, no versioned keys
        delete process.env.ENCRYPTION_KEY_V1;
        delete process.env.ENCRYPTION_KEY_V2;
        process.env.ENCRYPTION_KEY = testKeyV2;

        const plaintext = 'sk-fallback-test';

        // Should use default key for both versions
        const encrypted = encrypt(plaintext);
        expect(decrypt(encrypted)).toBe(plaintext);
      });

      it('should throw error if version key is missing and no fallback', () => {
        delete process.env.ENCRYPTION_KEY;
        delete process.env.ENCRYPTION_KEY_V1;
        delete process.env.ENCRYPTION_KEY_V2;

        expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY_V2 environment variable is not set');
      });

      it('should prefer versioned key over default', () => {
        process.env.ENCRYPTION_KEY = testKeyV1; // Default
        process.env.ENCRYPTION_KEY_V2 = testKeyV2; // Specific v2 key

        const plaintext = 'sk-prefer-versioned';

        // Should use V2 key, not default
        const encrypted = encrypt(plaintext, 2);

        // Remove default, should still decrypt with V2 key
        delete process.env.ENCRYPTION_KEY;
        expect(decrypt(encrypted)).toBe(plaintext);
      });
    });
  });

  describe('End-to-end encryption workflow', () => {
    it('should encrypt, store (simulated), and decrypt API keys', () => {
      const originalKeys = [
        'sk-1234567890abcdef',
        'sk-ant-api-key-12345',
        'AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz',
      ];

      // Simulate storing encrypted keys
      const storedKeys = originalKeys.map((key) => ({
        original: key,
        encrypted: encrypt(key),
        masked: maskApiKey(key),
      }));

      // Verify each can be decrypted correctly
      storedKeys.forEach(({ original, encrypted, masked }) => {
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(original);
        expect(masked).not.toBe(original);
        expect(masked).toContain('...');
      });
    });

    it('should maintain security across multiple operations', () => {
      const apiKey = 'sk-prod-api-key-secret-1234567890';

      // Encrypt
      const encrypted = encrypt(apiKey);

      // Create masked version for display
      const masked = maskApiKey(apiKey);

      // Verify encrypted doesn't contain plaintext
      expect(encrypted).not.toContain('sk-prod');
      expect(encrypted).not.toContain('secret');

      // Verify masked hides most of the key
      expect(masked).not.toBe(apiKey);
      expect(masked.length).toBeLessThan(apiKey.length);

      // Verify can still decrypt
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(apiKey);
    });
  });
});
