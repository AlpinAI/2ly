/**
 * Testcontainers utilities for test environment setup
 *
 * This file exports only TestEnvironment and testcontainers-based utilities
 * without any test framework dependencies (safe for Playwright and global-setup files).
 *
 * For Vitest unit tests that need mocks, use '@2ly/common/test/vitest' instead.
 */

export { startRuntime, stopRuntime, TestEnvironment,  } from './testEnvironment';
export { TEST_ENCRYPTION_KEY, TEST_MASTER_KEY } from './test.constants';
export type {
  TestEnvironmentConfig,
  TestEnvironmentServices,
} from './testEnvironment';
export * from '../node-helpers/password';
export * from '../messages/handshake.request';
export * from '../messages/handshake.response';
export * from '../services/nats.message';