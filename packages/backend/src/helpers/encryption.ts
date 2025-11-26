/**
 * Encryption Helper
 *
 * Provides encryption and decryption utilities for sensitive data like API keys.
 * Uses AES-256-GCM for authenticated encryption with the ENCRYPTION_KEY from environment.
 *
 * Security Model:
 * - API keys are encrypted at rest in the database
 * - ENCRYPTION_KEY must be 64 hex characters (32 bytes)
 * - Each encryption generates a unique IV (initialization vector)
 * - Format: iv:authTag:encryptedData (all hex-encoded)
 *
 * Usage:
 * - encrypt(plaintext): Returns encrypted string in format "iv:authTag:ciphertext"
 * - decrypt(encrypted): Returns original plaintext
 * - maskApiKey(apiKey): Returns masked version for display (e.g., "sk-...****xyz")
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Get encryption key from environment variable.
 * Throws if ENCRYPTION_KEY is not set or invalid.
 */
function getEncryptionKey(): Buffer {
  const encryptionKey = process.env.ENCRYPTION_KEY;

  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  // Validate key format (should be 64 hex characters = 32 bytes)
  if (!/^[0-9a-fA-F]{64}$/.test(encryptionKey)) {
    throw new Error('ENCRYPTION_KEY must be 64 hexadecimal characters (32 bytes)');
  }

  return Buffer.from(encryptionKey, 'hex');
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 *
 * @param plaintext - The string to encrypt
 * @returns Encrypted string in format "iv:authTag:ciphertext" (hex-encoded)
 */
export function encrypt(plaintext: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt an encrypted string using AES-256-GCM.
 *
 * @param encrypted - Encrypted string in format "iv:authTag:ciphertext"
 * @returns Decrypted plaintext string
 */
export function decrypt(encrypted: string): string {
  try {
    const key = getEncryptionKey();

    const parts = encrypted.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format. Expected "iv:authTag:ciphertext"');
    }

    const [ivHex, authTagHex, ciphertext] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    if (iv.length !== IV_LENGTH) {
      throw new Error(`Invalid IV length. Expected ${IV_LENGTH} bytes, got ${iv.length}`);
    }

    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error(`Invalid auth tag length. Expected ${AUTH_TAG_LENGTH} bytes, got ${authTag.length}`);
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Mask an API key for display purposes.
 * Shows prefix and last 4 characters, masks middle.
 *
 * Examples:
 * - "sk-1234567890abcdef" -> "sk-...cdef"
 * - "anthropic-key-12345" -> "ant...2345"
 *
 * @param apiKey - The API key to mask
 * @returns Masked API key string
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) {
    return '***';
  }

  // For keys with common prefixes (sk-, anthropic-, etc.)
  const dashIndex = apiKey.indexOf('-');
  if (dashIndex > 0 && dashIndex < 12) {
    const prefix = apiKey.substring(0, dashIndex + 1);
    const last4 = apiKey.slice(-4);
    return `${prefix}...${last4}`;
  }

  // For keys without recognizable prefix
  const prefix = apiKey.substring(0, 3);
  const last4 = apiKey.slice(-4);
  return `${prefix}...${last4}`;
}
