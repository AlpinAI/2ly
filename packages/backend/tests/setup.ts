/**
 * Vitest Global Setup for Backend Integration Tests
 *
 * This runs ONCE before all tests across all workers and:
 * 1. Starts the test environment (Dgraph, NATS, Backend) using testcontainers
 * 2. Exposes service URLs via environment variables
 * 3. Returns teardown function that runs after all tests complete
 *
 * This is a Vitest globalSetup module, not a setup file.
 * It ensures only ONE test environment is created for the entire test suite.
 */

import { TestEnvironment } from '@2ly/common/test/test.containers';

let testEnv: TestEnvironment;

/**
 * Global setup function - runs ONCE before all tests
 */
export default async function globalSetup() {
  console.log('🚀 Starting test environment...');
  console.log('📦 Starting containers (Dgraph, NATS, Backend)...');

  // Initialize test environment with minimal logging
  testEnv = new TestEnvironment({
    startBackend: true,
    logging: {
      enabled: false, // Disable verbose TestEnvironment logs
      verbose: false,
    },
  });

  try {
    await testEnv.start();

    const services = testEnv.getServices();

    console.log('✅ Test environment ready');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Set environment variables for tests
    // These will be available to all test files
    process.env.NATS_URL = services.nats.clientUrl;
    process.env.DGRAPH_URL = testEnv.getDgraphUrl();
    process.env.API_URL = testEnv.getBackendUrl();
  } catch (error) {
    console.error('❌ Failed to start test environment:', error);

    // Cleanup on failure
    try {
      await testEnv.stop();
    } catch (cleanupError) {
      console.error('Failed to cleanup after error:', cleanupError);
    }

    throw error;
  }

  /**
   * Return teardown function - runs ONCE after all tests
   */
  return async () => {
    if (testEnv) {
      try {
        await testEnv.stop();
        console.log('✅ Test environment stopped');
      } catch (error) {
        console.error('❌ Failed to stop test environment:', error);
        throw error;
      }
    }
  };
}
