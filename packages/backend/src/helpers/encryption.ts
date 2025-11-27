/**
 * Encryption Utility for API Key Storage
 *
 * WHY: Securely encrypt and decrypt API keys before storing in database.
 * Uses AES-256-GCM encryption with a secret key from environment variables.
 *
 * SECURITY:
 * - Uses crypto.randomBytes for secure IV generation
 * - AES-256-GCM provides both confidentiality and authenticity
 * - Auth tag prevents tampering with encrypted data
 * - Encryption key must be 32 bytes (256 bits)
 */

import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits for GCM

/**
 * Get encryption key from environment or generate a warning
 * In production, ENCRYPTION_KEY must be set as a 32-byte hex string
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is required. Generate one with: node -e "console.log(crypto.randomBytes(32).toString(\'hex\'))"',
    );
  }

  const keyBuffer = Buffer.from(key, 'hex');

  if (keyBuffer.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
  }

  return keyBuffer;
}

/**
 * Encrypt a plaintext string (e.g., API key)
 * Returns base64-encoded string in format: iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Store as: iv:authTag:ciphertext (all hex encoded)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt an encrypted string back to plaintext
 * Expects format: iv:authTag:ciphertext (hex encoded)
 */
export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey();
  const parts = encryptedData.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
