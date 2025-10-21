/**
 * Playwright Global Teardown
 *
 * This runs once after all tests and:
 * 1. Stops the Vite dev server
 * 2. Stops all testcontainers (Dgraph, NATS, Backend)
 * 3. Cleans up state files
 */

import { FullConfig } from '@playwright/test';
import { TestEnvironment } from '@2ly/common/test/testcontainers';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATE_FILE = path.join(__dirname, '.test-environment-state.json');

interface TestEnvironmentState {
  natsUrl: string;
  dgraphUrl: string;
  backendUrl: string;
  frontendUrl: string;
  frontendPid?: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function globalTeardown(_config: FullConfig) {
  console.log('🧹 Cleaning up test environment...');

  try {
    // Read state file
    let state: TestEnvironmentState | undefined;
    if (fs.existsSync(STATE_FILE)) {
      state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    }

    // Kill Vite dev server
    if (state?.frontendPid) {
      console.log('🛑 Stopping Vite dev server...');
      try {
        process.kill(state.frontendPid, 'SIGTERM');
        // Give it a moment to shut down gracefully
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Force kill if still running
        try {
          process.kill(state.frontendPid, 'SIGKILL');
        } catch {
          // Already dead, that's fine
        }

        console.log('✅ Vite dev server stopped');
      } catch (error) {
        console.warn('⚠️  Could not stop Vite dev server:', error);
      }
    }

    // Stop test environment containers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const testEnv: TestEnvironment | undefined = (global as any).__TEST_ENVIRONMENT__;

    if (testEnv) {
      console.log('🛑 Stopping containers (Dgraph, NATS, Backend)...');
      await testEnv.stop();
      console.log('✅ Containers stopped');
    } else {
      console.warn('⚠️  No test environment reference found in global state');
    }

    // Clean up state file
    if (fs.existsSync(STATE_FILE)) {
      fs.unlinkSync(STATE_FILE);
    }

    console.log('✨ Test environment cleaned up successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    // Don't throw - we want teardown to complete even if there are errors
  }
}

export default globalTeardown;
