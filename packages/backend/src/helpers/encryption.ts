/**
 * Encryption Helper
 *
 * Provides encryption and decryption utilities for sensitive data like API keys.
 * Uses AES-256-GCM for authenticated encryption with versioned key rotation and algorithm migration support.
 *
 * Security Model:
 * - API keys are encrypted at rest in the database
 * - ENCRYPTION_KEY must be 64 hex characters (32 bytes)
 * - Each encryption generates a unique IV (initialization vector)
 * - Format: v{keyVersion}.{algorithm}:iv:authTag:encryptedData (all hex-encoded)
 *
 * Key Versioning:
 * - Current version: v2.aes256gcm (key version 2 with AES-256-GCM)
 * - Legacy support: v1 (without algorithm suffix for backward compatibility)
 * - Supports multiple encryption keys via ENCRYPTION_KEY_V1, ENCRYPTION_KEY_V2, etc.
 * - ENCRYPTION_KEY (no suffix) is used as the current/default key
 *
 * Algorithm Versioning:
 * - Current algorithm: aes256gcm (AES-256-GCM)
 * - Format allows future algorithm migration (e.g., v3.chacha20)
 * - Algorithm identifier is embedded in encrypted data for automatic detection
 * - Each algorithm has specific IV and auth tag lengths
 *
 * Usage:
 * - encrypt(plaintext): Returns encrypted string in format "v2.aes256gcm:iv:authTag:ciphertext"
 * - decrypt(encrypted): Returns original plaintext (auto-detects version and algorithm)
 * - reEncrypt(encrypted): Re-encrypts data with current key version and algorithm
 * - maskApiKey(apiKey): Returns masked version for display (e.g., "sk-...****xyz")
 *
 * Key Rotation Example:
 * 1. Set ENCRYPTION_KEY_V2=<new_key> and ENCRYPTION_KEY=<new_key>
 * 2. Keep ENCRYPTION_KEY_V1=<old_key> for decrypting legacy data
 * 3. Use reEncrypt() to migrate encrypted data to v2
 * 4. Once all data migrated, remove ENCRYPTION_KEY_V1
 *
 * Algorithm Migration Example:
 * 1. Add new algorithm support (e.g., chacha20poly1305)
 * 2. Update CURRENT_ALGORITHM and CURRENT_VERSION
 * 3. Use reEncrypt() to migrate data to new algorithm
 * 4. Old algorithm code remains for decrypting legacy data
 */

import crypto from 'crypto';

// Algorithm configuration
type AlgorithmConfig = {
  algorithm: string; // Node.js crypto algorithm name
  ivLength: number; // IV length in bytes
  authTagLength: number; // Auth tag length in bytes
};

const ALGORITHMS: Record<string, AlgorithmConfig> = {
  aes256gcm: {
    algorithm: 'aes-256-gcm',
    ivLength: 12, // 96 bits for GCM
    authTagLength: 16, // 128 bits
  },
  // Future algorithms can be added here:
  // chacha20: {
  //   algorithm: 'chacha20-poly1305',
  //   ivLength: 12,
  //   authTagLength: 16,
  // },
};

// Current encryption configuration
const CURRENT_ALGORITHM = 'aes256gcm';
const CURRENT_VERSION = 2; // Current key version

// Legacy constants for backward compatibility
const LEGACY_ALGORITHM = 'aes-256-gcm';
const LEGACY_IV_LENGTH = 12;
const LEGACY_AUTH_TAG_LENGTH = 16;

/**
 * Get encryption key for a specific version from environment variable.
 * Throws if the key is not set or invalid.
 *
 * @param version - Key version number (e.g., 1, 2, 3)
 * @returns Buffer containing the encryption key
 */
function getEncryptionKey(version?: number): Buffer {
  // Determine which env var to use
  let envVarName: string;
  if (version === undefined) {
    // Use current/default key
    envVarName = 'ENCRYPTION_KEY';
  } else {
    // Use versioned key (e.g., ENCRYPTION_KEY_V1, ENCRYPTION_KEY_V2)
    envVarName = `ENCRYPTION_KEY_V${version}`;
  }

  const encryptionKey = process.env[envVarName];

  if (!encryptionKey) {
    // Fallback: If versioned key not found, try ENCRYPTION_KEY
    if (version !== undefined && process.env.ENCRYPTION_KEY) {
      return getEncryptionKey(); // Use default key as fallback
    }
    throw new Error(`${envVarName} environment variable is not set`);
  }

  // Validate key format (should be 64 hex characters = 32 bytes)
  if (!/^[0-9a-fA-F]{64}$/.test(encryptionKey)) {
    throw new Error(`${envVarName} must be 64 hexadecimal characters (32 bytes)`);
  }

  return Buffer.from(encryptionKey, 'hex');
}

/**
 * Parse encrypted data format to extract version, algorithm, and whether it's a legacy format.
 *
 * Formats supported:
 * - v2.aes256gcm:... (versioned with algorithm - current format)
 * - v2:... (versioned without algorithm - legacy v2)
 * - v1:... (versioned v1 - legacy)
 * - iv:tag:cipher (no version prefix - ancient legacy v1)
 *
 * @param encrypted - Encrypted string to parse
 * @returns Object with version number, algorithm identifier, and isLegacyFormat flag
 */
function parseEncryptedFormat(encrypted: string): {
  version: number;
  algorithm: string;
  isLegacyFormat: boolean;
} {
  // Try to match v{version}.{algorithm}:
  const versionAlgoMatch = encrypted.match(/^v(\d+)\.([a-z0-9]+):/);
  if (versionAlgoMatch) {
    return {
      version: parseInt(versionAlgoMatch[1], 10),
      algorithm: versionAlgoMatch[2],
      isLegacyFormat: false,
    };
  }

  // Try to match v{version}: (legacy format without algorithm)
  const versionMatch = encrypted.match(/^v(\d+):/);
  if (versionMatch) {
    return {
      version: parseInt(versionMatch[1], 10),
      algorithm: 'aes256gcm', // Default to current algorithm
      isLegacyFormat: true,
    };
  }

  // Ancient legacy format (no version prefix) is v1 with default algorithm
  return {
    version: 1,
    algorithm: 'aes256gcm',
    isLegacyFormat: true,
  };
}

/**
 * Detect the version of encrypted data.
 * Returns the version number if prefixed (e.g., "v2:..."), or 1 for legacy format.
 *
 * @param encrypted - Encrypted string to inspect
 * @returns Version number
 */
function detectVersion(encrypted: string): number {
  return parseEncryptedFormat(encrypted).version;
}

/**
 * Encrypt a plaintext string with versioned algorithm support.
 *
 * @param plaintext - The string to encrypt
 * @param version - Optional key version number (defaults to CURRENT_VERSION)
 * @param algorithmId - Optional algorithm identifier (defaults to CURRENT_ALGORITHM)
 * @returns Encrypted string in format "v{version}.{algorithm}:iv:authTag:ciphertext" (hex-encoded)
 */
export function encrypt(
  plaintext: string,
  version: number = CURRENT_VERSION,
  algorithmId: string = CURRENT_ALGORITHM
): string {
  try {
    const key = getEncryptionKey(version);
    const algoConfig = ALGORITHMS[algorithmId];

    if (!algoConfig) {
      throw new Error(`Unsupported algorithm: ${algorithmId}`);
    }

    const iv = crypto.randomBytes(algoConfig.ivLength);
    const cipher = crypto.createCipheriv(algoConfig.algorithm, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: v{version}.{algorithm}:iv:authTag:encryptedData
    return `v${version}.${algorithmId}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt an encrypted string with automatic version and algorithm detection.
 * Supports all legacy formats for backward compatibility.
 *
 * @param encrypted - Encrypted string in various formats (see parseEncryptedFormat)
 * @returns Decrypted plaintext string
 */
export function decrypt(encrypted: string): string {
  try {
    const { version, algorithm: algorithmId } = parseEncryptedFormat(encrypted);
    const key = getEncryptionKey(version);

    // Get algorithm configuration
    const algoConfig = ALGORITHMS[algorithmId];
    if (!algoConfig) {
      throw new Error(`Unsupported algorithm: ${algorithmId}`);
    }

    // Remove version prefix if present (v2.aes256gcm:, v2:, v1:, etc.)
    let dataPart = encrypted;
    const prefixMatch = encrypted.match(/^v\d+(\.[a-z0-9]+)?:/);
    if (prefixMatch) {
      dataPart = encrypted.substring(prefixMatch[0].length);
    }

    const parts = dataPart.split(':');
    if (parts.length !== 3) {
      throw new Error(
        'Invalid encrypted data format. Expected "v{version}.{algorithm}:iv:authTag:ciphertext" or legacy formats'
      );
    }

    const [ivHex, authTagHex, ciphertext] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    // Validate lengths based on algorithm config
    if (iv.length !== algoConfig.ivLength) {
      throw new Error(`Invalid IV length. Expected ${algoConfig.ivLength} bytes, got ${iv.length}`);
    }

    if (authTag.length !== algoConfig.authTagLength) {
      throw new Error(`Invalid auth tag length. Expected ${algoConfig.authTagLength} bytes, got ${authTag.length}`);
    }

    const decipher = crypto.createDecipheriv(algoConfig.algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Re-encrypt data with the current encryption key version.
 * Useful for migrating encrypted data after key rotation.
 *
 * @param encrypted - Encrypted string in any supported format
 * @returns Newly encrypted string with current version
 */
export function reEncrypt(encrypted: string): string {
  try {
    // Decrypt with old key (auto-detects version)
    const plaintext = decrypt(encrypted);
    // Re-encrypt with current version
    return encrypt(plaintext);
  } catch (error) {
    throw new Error(`Re-encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get the version of encrypted data without decrypting.
 *
 * @param encrypted - Encrypted string to inspect
 * @returns Version number
 */
export function getEncryptedDataVersion(encrypted: string): number {
  return detectVersion(encrypted);
}

/**
 * Get the algorithm of encrypted data without decrypting.
 *
 * @param encrypted - Encrypted string to inspect
 * @returns Algorithm identifier
 */
export function getEncryptedDataAlgorithm(encrypted: string): string {
  return parseEncryptedFormat(encrypted).algorithm;
}

/**
 * Check if encrypted data needs migration to current version and algorithm.
 * Legacy formats (without explicit algorithm) are always flagged for migration.
 *
 * @param encrypted - Encrypted string to check
 * @returns True if data should be re-encrypted with current version/algorithm
 */
export function needsMigration(encrypted: string): boolean {
  const { version, algorithm, isLegacyFormat } = parseEncryptedFormat(encrypted);
  return isLegacyFormat || version !== CURRENT_VERSION || algorithm !== CURRENT_ALGORITHM;
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
