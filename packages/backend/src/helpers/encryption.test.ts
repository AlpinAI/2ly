import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encrypt, decrypt, maskApiKey } from './encryption';

describe('Encryption Helper', () => {
  const originalEnv = process.env.ENCRYPTION_KEY;
  const testKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'; // 64 hex chars

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = testKey;
  });

  afterEach(() => {
    process.env.ENCRYPTION_KEY = originalEnv;
  });

  describe('encrypt', () => {
    it('should encrypt a plaintext string', () => {
      const plaintext = 'sk-1234567890abcdef';
      const encrypted = encrypt(plaintext);

      // Check format: iv:authTag:ciphertext
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(3);
      expect(parts[0]).toHaveLength(24); // 12 bytes IV in hex = 24 chars
      expect(parts[1]).toHaveLength(32); // 16 bytes auth tag in hex = 32 chars
      expect(parts[2].length).toBeGreaterThan(0); // Ciphertext
    });

    it('should produce different outputs for the same input (due to random IV)', () => {
      const plaintext = 'sk-1234567890abcdef';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should throw error if ENCRYPTION_KEY is not set', () => {
      delete process.env.ENCRYPTION_KEY;

      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY environment variable is not set');
    });

    it('should throw error if ENCRYPTION_KEY is invalid format', () => {
      process.env.ENCRYPTION_KEY = 'invalid-key';

      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY must be 64 hexadecimal characters');
    });

    it('should handle empty strings', () => {
      const encrypted = encrypt('');
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(3);
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

      expect(() => decrypt(encrypted)).toThrow('ENCRYPTION_KEY environment variable is not set');
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
      parts[1] = parts[1].replace(/0/g, '1'); // Change auth tag
      const tampered = parts.join(':');

      expect(() => decrypt(tampered)).toThrow('Decryption failed');
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

      expect(masked).toBe('sk-ant-...cdef');
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

    it('should mask at least 50% of the key', () => {
      const key = 'sk-1234567890abcdef';
      const masked = maskApiKey(key);

      // Visible parts: prefix (3 chars) + last 4 + dots (3)
      // Should be significantly shorter than original
      expect(masked.length).toBeLessThan(key.length * 0.5);
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
