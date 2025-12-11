/**
 * Testcontainers utilities for test environment setup
 *
 * This file exports only TestEnvironment and testcontainers-based utilities
 * without any test framework dependencies (safe for Playwright and global-setup files).
 *
 * For Vitest unit tests that need mocks, use '@skilder-ai/common/test/vitest' instead.
 */

export { startRuntime, stopRuntime, TestEnvironment, type TestEnvironmentConfig,
  type TestEnvironmentServices, } from './test.containers.environment';
export { TEST_ENCRYPTION_KEY, TEST_SYSTEM_KEY as TEST_MASTER_KEY } from './test.containers.constants';
export * from '../node-helpers/password';
export * from '../messages/handshake.request';
export * from '../messages/handshake.response';
export * from '../services/nats.message';