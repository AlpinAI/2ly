/**
 * Testcontainers utilities for test environment setup
 *
 * This file exports only TestEnvironment and testcontainers-based utilities
 * without any test framework dependencies (safe for Playwright and global-setup files).
 *
 * For Vitest unit tests that need mocks, use '@2ly/common/test/vitest' instead.
 */

export { TestEnvironment, TEST_ENCRYPTION_KEY } from './testEnvironment';
export type {
  TestEnvironmentConfig,
  TestEnvironmentServices,
} from './testEnvironment';
export * from '../node-helpers/password';