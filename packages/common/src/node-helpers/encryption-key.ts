const DEFAULT_KEY = 'zR6xG6E9#h@dNquSM&DYwM#trbmn%nzR';

/**
 * Get and validate the ENCRYPTION_KEY environment variable.
 * Used by both password hashing (HMAC pepper) and API key encryption (AES key derivation).
 *
 * @throws Error if ENCRYPTION_KEY is not set or is too short
 * @returns The validated encryption key string
 */
export function getValidatedEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is required. Please set a strong, unique encryption key.'
    );
  }

  if (key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters long for adequate security.');
  }

  if (key === DEFAULT_KEY) {
    console.warn(
      'PRODUCTION ISSUE! ENCRYPTION_KEY is still the default value. Please set a strong, unique encryption key with at least 32 characters.'
    );
  }

  return key;
}
