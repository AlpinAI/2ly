import bcrypt from 'bcryptjs';
import { scrypt, randomBytes, timingSafeEqual, createHmac, ScryptOptions } from 'crypto';

// const SALT_ROUNDS = 12 as const; // Legacy bcrypt support
const ERR_PASSWORD_HASH_FAILED = 'ERR_PASSWORD_HASH_FAILED';
const ERR_PASSWORD_VERIFY_FAILED = 'ERR_PASSWORD_VERIFY_FAILED';

// Scrypt configuration - these provide excellent security without native dependencies
const SCRYPT_N = parseInt(process.env.SCRYPT_N || '16384', 10); // CPU/memory cost factor (16K)
const SCRYPT_R = parseInt(process.env.SCRYPT_R || '8', 10); // Block size
const SCRYPT_P = parseInt(process.env.SCRYPT_P || '1', 10); // Parallelization factor
const SCRYPT_KEY_LENGTH = 64; // Output key length in bytes

function scryptAsync(password: string, salt: Buffer, keyLength: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, keyLength, options, (error: NodeJS.ErrnoException | null, derivedKey: Buffer) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derivedKey);
    });
  });
}

function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is required for password security. Please set a strong, unique encryption key.'
    );
  }

  // Basic validation for key strength
  if (key.length < 32) {
    throw new Error(
      'ENCRYPTION_KEY must be at least 32 characters long for adequate security.'
    );
  }

  if (key === 'zR6xG6E9#h@dNquSM&DYwM#trbmn%nzR') {
    console.warn('PRODUCTION ISSUE! ENCRYPTION_KEY is still the default value. Please set a strong, unique encryption key with at least 32 characters.');
  }

  return key;
}

function derivePepperedPassword(plainPassword: string): string {
  const encryptionKey = getEncryptionKey();
  return createHmac('sha256', encryptionKey).update(plainPassword, 'utf8').digest('hex');
}

/**
 * Hash password using Node.js built-in scrypt with configurable parameters.
 * Includes pepper (HMAC) for additional security.
 * Format: $scrypt$N$r$p$salt$hash
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  try {
    const peppered = derivePepperedPassword(plainPassword);

    // Generate a random salt
    const salt = randomBytes(32);

    // Hash the peppered password with scrypt
    const hashedBuffer = await scryptAsync(peppered, salt, SCRYPT_KEY_LENGTH, {
      N: SCRYPT_N,
      r: SCRYPT_R,
      p: SCRYPT_P,
    });

    // Create the formatted hash string
    const saltBase64 = salt.toString('base64');
    const hashBase64 = hashedBuffer.toString('base64');
    const hashedPassword = `$scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${saltBase64}$${hashBase64}`;

    return hashedPassword;
  } catch (error) {
    // Re-throw encryption key validation errors directly
    if (error instanceof Error && error.message.includes('ENCRYPTION_KEY')) {
      throw error;
    }
    // Log and wrap other hashing errors
    console.error(`${ERR_PASSWORD_HASH_FAILED}:`, error);
    throw new Error(`${ERR_PASSWORD_HASH_FAILED}: Unable to hash password`);
  }
}

/**
 * Verify password supporting scrypt (new) and bcrypt (legacy) hashes.
 * This provides backward compatibility during the migration period.
 */
export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  try {
    const peppered = derivePepperedPassword(plainPassword);

    // Check if it's a scrypt hash (starts with $scrypt$)
    const normalizedHashedPassword = hashedPassword.trim();
    if (normalizedHashedPassword.startsWith('$scrypt$')) {
      const parts = normalizedHashedPassword.split('$');
      if (parts.length !== 7) {
        console.warn('Invalid scrypt hash format - expected 7 parts, got', parts.length);
        return false;
      }

      const [, , N, r, p, saltBase64, hashBase64] = parts;
      const salt = Buffer.from(saltBase64, 'base64');
      const expectedHash = Buffer.from(hashBase64, 'base64');

      // Hash the peppered password with the stored parameters
      const derivedHash = await scryptAsync(peppered, salt, SCRYPT_KEY_LENGTH, {
        N: parseInt(N, 10),
        r: parseInt(r, 10),
        p: parseInt(p, 10),
      });

      // Use timing-safe comparison
      return timingSafeEqual(expectedHash, derivedHash);
    }
    // Legacy bcrypt hash support
    else if (hashedPassword.startsWith('$2')) {
      const isMatch = await bcrypt.compare(peppered, hashedPassword);
      return isMatch;
    }
    // Unknown hash format
    else {
      console.warn('Unknown hash format detected during password verification');
      return false;
    }
  } catch (error) {
    // Re-throw encryption key validation errors directly
    if (error instanceof Error && error.message.includes('ENCRYPTION_KEY')) {
      throw error;
    }
    // Log and wrap other verification errors
    console.error(`${ERR_PASSWORD_VERIFY_FAILED}:`, error);
    throw new Error(`${ERR_PASSWORD_VERIFY_FAILED}: Unable to verify password`);
  }
}
