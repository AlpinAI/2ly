#!/usr/bin/env tsx
import { generateKeyPairSync } from 'crypto';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';

/**
 * Generate RSA key pair for JWT signing in development.
 * This script creates private.pem and public.pem files in the keys/ directory.
 */
function generateJwtKeys(): void {
  console.log('Generating RSA key pair for JWT signing...');

  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  // Ensure keys directory exists
  const keysDir = resolve(process.cwd(), 'keys');
  mkdirSync(keysDir, { recursive: true });

  // Write private key
  const privateKeyPath = resolve(keysDir, 'private.pem');
  writeFileSync(privateKeyPath, privateKey, { mode: 0o600 });
  console.log(`Private key written to: ${privateKeyPath}`);

  // Write public key
  const publicKeyPath = resolve(keysDir, 'public.pem');
  writeFileSync(publicKeyPath, publicKey, { mode: 0o644 });
  console.log(`Public key written to: ${publicKeyPath}`);

  console.log('Key generation completed successfully!');
  console.log('');
  console.log('Add these environment variables to your .env file:');
  console.log('');
  console.log(`JWT_PRIVATE_KEY_PATH=${privateKeyPath}`);
  console.log(`JWT_PUBLIC_KEY_PATH=${publicKeyPath}`);
  console.log('JWT_ISSUER=skilder-platform');
  console.log('JWT_ACCESS_TOKEN_TTL=900');
  console.log('JWT_REFRESH_TOKEN_TTL=604800');
}

if (require.main === module) {
  generateJwtKeys();
}

export { generateJwtKeys };