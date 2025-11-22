#!/usr/bin/env node

import { createOperator } from '@nats-io/nkeys';
import { encodeOperator } from '@nats-io/jwt';
import { randomBytes, generateKeyPairSync } from 'crypto';
import { writeFileSync, existsSync, chmodSync } from 'fs';
import { join } from 'path';

const KEYS_DIR = '/data/keys';  // Bind mounted to host .docker-keys/
const INITIALIZED_MARKER = join(KEYS_DIR, '.initialized');
const ENV_FILE = join(KEYS_DIR, '.env.generated');
const PRIVATE_KEY_FILE = join(KEYS_DIR, 'private.pem');
const PUBLIC_KEY_FILE = join(KEYS_DIR, 'public.pem');
const OPERATOR_JWT_FILE = join(KEYS_DIR, 'operator.jwt');

/**
 * Generate a random encryption key for password peppering
 * @returns {string} 64-character random string
 */
function generateEncryptionKey() {
  return randomBytes(32).toString('hex');
}

/**
 * Generate NATS operator seed and operator JWT using @nats-io/nkeys and @nats-io/jwt
 * @returns {Promise<string>} NKey seed starting with SO
 */
async function generateNatsOperatorSeed() {
  const operator = createOperator();
  const seed = operator.getSeed();

  // Filter null bytes and decode seed to string
  const filteredSeed = seed.filter(byte => byte !== 0);
  const seedString = new TextDecoder().decode(filteredSeed);

  // Generate operator JWT with correct argument order:
  // encodeOperator(name: string, okp: Key, operator?: Partial<Operator>)
  const operatorJwt = await encodeOperator(
    '2ly-operator',    // 1st param: operator name
    seedString,        // 2nd param: key (seed string)
    {}                 // 3rd param: operator options (empty for basic JWT)
  );

  writeFileSync(OPERATOR_JWT_FILE, operatorJwt, { encoding: 'utf8' });
  chmodSync(OPERATOR_JWT_FILE, 0o644); // Public file, readable by all

  operator.clear(); // Clear from memory

  return seedString;
}

/**
 * Generate RSA key pair for JWT signing
 * @returns {{ privateKey: string, publicKey: string }}
 */
function generateJwtKeyPair() {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  return { privateKey, publicKey };
}

/**
 * Generate initial workspace master key in WSK format (46 characters)
 * Uses 32 random bytes (256-bit entropy) encoded as base64url
 * Matches the format used by IdentityRepository
 * @returns {string} Workspace key starting with WSK
 */
function generateMasterKey() {
  const prefix = 'WSK';
  const randomData = randomBytes(32)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

  return prefix + randomData;
}

/**
 * Write file with secure permissions
 * @param {string} path
 * @param {string} content
 * @param {number} mode
 */
function writeSecureFile(path, content, mode) {
  writeFileSync(path, content, { encoding: 'utf8', mode: 0o600 });
  chmodSync(path, mode);
}


/**
 * Main execution
 */
async function main() {
  console.log('🔐 2ly Key Initialization');
  console.log('========================\n');

  // Check if already initialized
  if (existsSync(INITIALIZED_MARKER)) {
    console.log('✅ Keys already initialized. Skipping generation.\n');
    console.log('To regenerate keys:');
    console.log('  1. Stop all services: docker-compose down');
    console.log('  2. Remove the marker: docker run --rm -v 2ly_2ly-data:/data alpine rm /data/keys/.initialized');
    console.log('  3. Restart: docker-compose up\n');
    process.exit(0);
  }

  console.log('Generating cryptographic keys...\n');

  // Generate all keys
  const encryptionKey = generateEncryptionKey();
  const natsOperatorSeed = await generateNatsOperatorSeed();
  const { privateKey, publicKey } = generateJwtKeyPair();
  const masterKey = generateMasterKey();

  // Write JWT key files
  writeSecureFile(PRIVATE_KEY_FILE, privateKey, 0o600);
  writeSecureFile(PUBLIC_KEY_FILE, publicKey, 0o644);
  console.log(`✅ JWT RSA key pair generated`);

  // Write environment variables file (shared)
  const envContent = [
    '# Auto-generated cryptographic keys for 2ly',
    '# DO NOT COMMIT THIS FILE TO VERSION CONTROL',
    '# Generated at: ' + new Date().toISOString(),
    '',
    '# Password peppering key (used by backend for password hashing)',
    `ENCRYPTION_KEY=${encryptionKey}`,
    '',
    '# NATS operator seed (system-wide, used for JWT signing)',
    `NATS_OPERATOR_SEED=${natsOperatorSeed}`,
    '',
    '# Initial workspace master key (used by runtime on first boot)',
    `MASTER_KEY=${masterKey}`,
    ''
  ].join('\n');

  writeSecureFile(ENV_FILE, envContent, 0o600);
  console.log(`✅ Environment file written to ${ENV_FILE}`);

  // Write local environment variables file (for local dev only)
  const LOCAL_ENV_FILE = join(KEYS_DIR, '.env.local');
  const localEnvContent = [
    '# Auto-generated local development keys for 2ly',
    '# DO NOT COMMIT THIS FILE TO VERSION CONTROL',
    '# Generated at: ' + new Date().toISOString(),
    '',
    '# JWT key paths for user session tokens (relative to project root)',
    'JWT_PRIVATE_KEY_PATH=.docker-keys/private.pem',
    'JWT_PUBLIC_KEY_PATH=.docker-keys/public.pem',
    ''
  ].join('\n');

  writeSecureFile(LOCAL_ENV_FILE, localEnvContent, 0o600);
  console.log(`✅ Local environment file written to ${LOCAL_ENV_FILE}`);

  // Write initialized marker
  writeSecureFile(INITIALIZED_MARKER, new Date().toISOString(), 0o600);
  console.log(`✅ Initialization marker created`);

  // Display keys to user
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🔑 GENERATED KEYS - SAVE THESE SECURELY');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('ENCRYPTION_KEY (64 chars):');
  console.log(`  ${encryptionKey}\n`);

  console.log('NATS_OPERATOR_SEED (56 chars):');
  console.log(`  ${natsOperatorSeed}\n`);

  console.log('MASTER_KEY (46 chars):');
  console.log(`  ${masterKey}\n`);

  console.log('JWT Keys:');
  console.log(`  Private: /data/keys/private.pem (2048-bit RSA)`);
  console.log(`  Public:  /data/keys/public.pem (2048-bit RSA)\n`);

  console.log('NATS Operator JWT:');
  console.log(`  /data/keys/operator.jwt (for NATS container)\n`);

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('⚠️  IMPORTANT SECURITY NOTES');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('1. KEYS AVAILABLE ON HOST - For local development');
  console.log('   Location: .docker-keys/ directory in project root');
  console.log('   Keys are bind mounted and work for both Docker and local development\n');

  console.log('2. LOCAL DEVELOPMENT - Ready to use!');
  console.log('   Run: npm run dev:backend');
  console.log('   Run: npm run dev:main-runtime');
  console.log('   Keys are automatically accessible\n');

  console.log('3. BACKUP RECOMMENDED:');
  console.log('   Keys are in .docker-keys/ on host (backed by bind mount)');
  console.log('   Simply backup the .docker-keys/ directory\n');

  console.log('4. PRODUCTION DEPLOYMENT:');
  console.log('   - Use Docker secrets or secure key management service');
  console.log('   - Rotate JWT keys periodically');
  console.log('   - Never commit keys to version control');
  console.log('   - See docs/KEY_MANAGEMENT.md for details\n');

  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('✅ Key initialization complete!\n');
}

main();
