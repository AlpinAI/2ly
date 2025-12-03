import { injectable } from 'inversify';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

/**
 * EncryptionService - Handles encryption/decryption of sensitive data like API keys.
 * Uses AES-256-GCM for authenticated encryption.
 */
@injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor() {
    this.key = this.deriveKey();
  }

  private deriveKey(): Buffer {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error(
        'ENCRYPTION_KEY environment variable is required for API key encryption. Please set a strong, unique encryption key.'
      );
    }

    if (encryptionKey.length < 32) {
      throw new Error('ENCRYPTION_KEY must be at least 32 characters long for adequate security.');
    }

    // Derive a 256-bit key from the encryption key
    return createHash('sha256').update(encryptionKey).digest();
  }

  /**
   * Encrypt plaintext using AES-256-GCM.
   * Returns format: base64(iv):base64(authTag):base64(ciphertext)
   */
  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);

    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);

    const authTag = cipher.getAuthTag();

    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
  }

  /**
   * Decrypt ciphertext using AES-256-GCM.
   * Expects format: base64(iv):base64(authTag):base64(ciphertext)
   */
  decrypt(ciphertext: string): string {
    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid ciphertext format');
    }

    const [ivB64, authTagB64, encryptedB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const encrypted = Buffer.from(encryptedB64, 'base64');

    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    return decrypted.toString('utf8');
  }

  /**
   * Check if a value is encrypted (has the expected format).
   */
  isEncrypted(value: string): boolean {
    const parts = value.split(':');
    if (parts.length !== 3) return false;

    try {
      // Try to decode each part as base64
      parts.forEach((part) => Buffer.from(part, 'base64'));
      return true;
    } catch {
      return false;
    }
  }
}
