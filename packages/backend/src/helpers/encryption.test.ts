/**
 * Encryption Utility Tests
 *
 * WHY: Verify encryption/decryption works correctly and securely.
 * Tests encryption, decryption, error handling, and security properties.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { encrypt, decrypt } from './encryption';

describe('Encryption Utility', () => {
  beforeAll(() => {
    // Set encryption key for testing
    process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  });

  describe('encrypt', () => {
    it('should encrypt plaintext successfully', () => {
      const plaintext = 'sk-test-1234567890';
      const encrypted = encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.split(':').length).toBe(3); // iv:authTag:ciphertext
    });

    it('should produce different encrypted values for same plaintext', () => {
      const plaintext = 'sk-test-1234567890';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      // Due to random IV, each encryption should be different
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should handle empty string', () => {
      const plaintext = '';
      const encrypted = encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted.split(':').length).toBe(3);
    });

    it('should handle special characters', () => {
      const plaintext = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted.split(':').length).toBe(3);
    });

    it('should handle unicode characters', () => {
      const plaintext = 'Hello 世界 🌍';
      const encrypted = encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted.split(':').length).toBe(3);
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted plaintext correctly', () => {
      const plaintext = 'sk-test-1234567890';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should decrypt empty string correctly', () => {
      const plaintext = '';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should decrypt special characters correctly', () => {
      const plaintext = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should decrypt unicode characters correctly', () => {
      const plaintext = 'Hello 世界 🌍';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw error for invalid encrypted data format', () => {
      expect(() => decrypt('invalid')).toThrow('Invalid encrypted data format');
      expect(() => decrypt('part1:part2')).toThrow('Invalid encrypted data format');
      expect(() => decrypt('part1:part2:part3:part4')).toThrow('Invalid encrypted data format');
    });

    it('should throw error for tampered ciphertext', () => {
      const plaintext = 'sk-test-1234567890';
      const encrypted = encrypt(plaintext);
      const parts = encrypted.split(':');
      parts[2] = parts[2].substring(0, parts[2].length - 1) + '0'; // Modify ciphertext
      const tampered = parts.join(':');

      expect(() => decrypt(tampered)).toThrow();
    });

    it('should throw error for tampered auth tag', () => {
      const plaintext = 'sk-test-1234567890';
      const encrypted = encrypt(plaintext);
      const parts = encrypted.split(':');
      parts[1] = '00000000000000000000000000000000'; // Invalid auth tag
      const tampered = parts.join(':');

      expect(() => decrypt(tampered)).toThrow();
    });
  });

  describe('security', () => {
    it('should throw error if ENCRYPTION_KEY is not set', () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      delete process.env.ENCRYPTION_KEY;

      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY environment variable is required');

      process.env.ENCRYPTION_KEY = originalKey;
    });

    it('should throw error if ENCRYPTION_KEY is wrong length', () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      process.env.ENCRYPTION_KEY = 'tooshort';

      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY must be 32 bytes');

      process.env.ENCRYPTION_KEY = originalKey;
    });

    it('should not expose plaintext in encrypted data', () => {
      const plaintext = 'very-secret-api-key-12345';
      const encrypted = encrypt(plaintext);

      expect(encrypted).not.toContain(plaintext);
      expect(encrypted.toLowerCase()).not.toContain(plaintext.toLowerCase());
    });
  });

  describe('round-trip', () => {
    it('should handle long API keys', () => {
      const plaintext = 'sk-proj-1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle multiple encrypt/decrypt cycles', () => {
      let plaintext = 'sk-test-original';

      for (let i = 0; i < 10; i++) {
        const encrypted = encrypt(plaintext);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(plaintext);
        plaintext = decrypted;
      }
    });
  });
});
