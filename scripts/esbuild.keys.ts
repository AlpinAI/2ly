import * as esbuild from 'esbuild';

/**
 * Bundle the key generation script into a single standalone file.
 * This eliminates the need to copy node_modules to production Docker images.
 *
 * The bundled script includes:
 * - @nats-io/nkeys (for NATS operator key generation)
 * - @nats-io/jwt (for NATS operator JWT generation)
 * - Node.js crypto (built-in, not bundled)
 * - Node.js fs (built-in, not bundled)
 */
esbuild
  .build({
    entryPoints: ['scripts/generate-keys.js'],
    outfile: 'scripts/generate-keys.bundle.cjs', // .cjs extension forces CommonJS
    bundle: true,
    platform: 'node',
    target: 'node18',
    minify: true,
    format: 'cjs',
    // Note: Don't add banner shebang - source file already has one that gets preserved
    external: ['crypto', 'fs', 'path'], // Node.js built-ins
  })
  .then(() => {
    console.log('✅ Key generation script bundled successfully');
    console.log('   Output: scripts/generate-keys.bundle.cjs');
  })
  .catch((err) => {
    console.error('❌ Bundle failed:', err);
    process.exit(1);
  });
