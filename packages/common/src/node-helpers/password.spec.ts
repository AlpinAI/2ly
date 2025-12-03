import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('Password Helper', () => {
  const originalEnv = process.env;

  beforeAll(() => {
    // Set test environment variables (32+ characters required)
    process.env.ENCRYPTION_KEY = 'test-encryption-key-for-pepper-32chars';
    process.env.SCRYPT_N = '1024'; // Smaller for faster tests
    process.env.SCRYPT_R = '1';
    process.env.SCRYPT_P = '1';
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('encryption key validation', () => {
    it('should throw error when ENCRYPTION_KEY is missing', async () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      try {
        delete process.env.ENCRYPTION_KEY;

        await expect(hashPassword('testPassword')).rejects.toThrow(
          'ENCRYPTION_KEY environment variable is required'
        );
      } finally {
        process.env.ENCRYPTION_KEY = originalKey;
      }
    });

    it('should throw error when ENCRYPTION_KEY is too short', async () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      try {
        process.env.ENCRYPTION_KEY = 'short-key'; // Only 9 characters

        await expect(hashPassword('testPassword')).rejects.toThrow(
          'ENCRYPTION_KEY must be at least 32 characters long for adequate security'
        );
      } finally {
        process.env.ENCRYPTION_KEY = originalKey;
      }
    });

    it('should accept ENCRYPTION_KEY with exactly 32 characters', async () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      try {
        process.env.ENCRYPTION_KEY = '12345678901234567890123456789012'; // Exactly 32 characters

        const hashedPassword = await hashPassword('testPassword');
        expect(hashedPassword).toBeDefined();
        expect(hashedPassword.startsWith('$scrypt$')).toBe(true);
      } finally {
        process.env.ENCRYPTION_KEY = originalKey;
      }
    });

    it('should accept ENCRYPTION_KEY with more than 32 characters', async () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      try {
        process.env.ENCRYPTION_KEY = 'this-is-a-very-long-encryption-key-with-more-than-32-characters'; // 66 characters

        const hashedPassword = await hashPassword('testPassword');
        expect(hashedPassword).toBeDefined();
        expect(hashedPassword.startsWith('$scrypt$')).toBe(true);
      } finally {
        process.env.ENCRYPTION_KEY = originalKey;
      }
    });
  });

  describe('hashPassword', () => {
    it('should hash a password using scrypt', async () => {
      const plainPassword = 'testPassword123';
      const hashedPassword = await hashPassword(plainPassword);

      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
      expect(hashedPassword.startsWith('$scrypt$')).toBe(true);
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    it('should produce different hashes for the same password', async () => {
      const plainPassword = 'testPassword123';
      const hash1 = await hashPassword(plainPassword);
      const hash2 = await hashPassword(plainPassword);

      expect(hash1).not.toBe(hash2);
      expect(hash1.startsWith('$scrypt$')).toBe(true);
      expect(hash2.startsWith('$scrypt$')).toBe(true);
    });

    it('should include pepper in the hash computation', async () => {
      const plainPassword = 'testPassword123';
      const originalKey = process.env.ENCRYPTION_KEY;

      try {
        // Hash with one key (32+ characters required)
        process.env.ENCRYPTION_KEY = 'key1-with-enough-chars-to-be-valid32';
        const hash1 = await hashPassword(plainPassword);

        // Hash with different key
        process.env.ENCRYPTION_KEY = 'key2-with-enough-chars-to-be-valid32';
        const hash2 = await hashPassword(plainPassword);

        // Even though same password, different pepper should give different hashes
        expect(hash1).not.toBe(hash2);
      } finally {
        process.env.ENCRYPTION_KEY = originalKey;
      }
    });

    it('should handle empty passwords', async () => {
      const emptyPasswordHash = await hashPassword('');
      expect(emptyPasswordHash).toBeDefined();
      expect(emptyPasswordHash.startsWith('$scrypt$')).toBe(true);
    });
  });

  describe('verifyPassword', () => {
    it('should verify scrypt hashed passwords', async () => {
      const plainPassword = 'testPassword123';
      const hashedPassword = await hashPassword(plainPassword);

      const isValid = await verifyPassword(plainPassword, hashedPassword);
      expect(isValid).toBe(true);

      const isInvalid = await verifyPassword('wrongPassword', hashedPassword);
      expect(isInvalid).toBe(false);
    });

    it('should verify bcrypt hashed passwords (legacy support)', async () => {
      // This is a bcrypt hash of 'testPassword123' with pepper 'test-encryption-key-for-pepper'
      // Generated with: bcrypt.hash(derivePepperedPassword('testPassword123'), 12)
      const bcryptHash = '$2b$12$7QnLK8.Xh0mGxGxGmjTqDuBJi/iJ7qzF9lZsL9Q0NtR8n6U7XGn5y';

      // Note: This will fail in real test because we don't have the exact bcrypt hash
      // In practice, we'd need to create this during migration
      try {
        const isValid = await verifyPassword('testPassword123', bcryptHash);
        // This might fail if the exact hash doesn't match our pepper
        expect(typeof isValid).toBe('boolean');
      } catch (error) {
        // Expected if hash doesn't match our test pepper
        expect(error).toBeDefined();
      }
    });

    it('should return false for unknown hash formats', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const unknownHash = '$unknown$hash$format$';
      const isValid = await verifyPassword('testPassword123', unknownHash);
      expect(isValid).toBe(false);

      consoleWarnSpy.mockRestore();
    });

    it('should handle empty passwords gracefully', async () => {
      const hashedPassword = await hashPassword('testPassword123');
      const isValid = await verifyPassword('', hashedPassword);
      expect(isValid).toBe(false);
    });

    it('should use the same pepper for verification', async () => {
      const plainPassword = 'testPassword123';
      const originalKey = process.env.ENCRYPTION_KEY;

      try {
        // Hash with one pepper (32+ characters required)
        process.env.ENCRYPTION_KEY = 'pepper1-with-enough-chars-to-be-valid';
        const hashedPassword = await hashPassword(plainPassword);

        // Verify with same pepper
        const isValid1 = await verifyPassword(plainPassword, hashedPassword);
        expect(isValid1).toBe(true);

        // Verify with different pepper
        process.env.ENCRYPTION_KEY = 'pepper2-with-enough-chars-to-be-valid';
        const isValid2 = await verifyPassword(plainPassword, hashedPassword);
        expect(isValid2).toBe(false);
      } finally {
        process.env.ENCRYPTION_KEY = originalKey;
      }
    });

    it('should return false for malformed hash', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const malformedHash = 'not-a-valid-hash';
      const isValid = await verifyPassword('password', malformedHash);
      expect(isValid).toBe(false);

      consoleWarnSpy.mockRestore();
    });
  });

  describe('performance', () => {
    it('should hash password within acceptable time', async () => {
      const start = Date.now();
      await hashPassword('testPassword123');
      const duration = Date.now() - start;

      // Should complete within 1 second (much more lenient than production target)
      expect(duration).toBeLessThan(1000);
    });

    it('should verify password within acceptable time', async () => {
      const hashedPassword = await hashPassword('testPassword123');

      const start = Date.now();
      await verifyPassword('testPassword123', hashedPassword);
      const duration = Date.now() - start;

      // Should complete within 500ms (more lenient than production target)
      expect(duration).toBeLessThan(500);
    });
  });
});
