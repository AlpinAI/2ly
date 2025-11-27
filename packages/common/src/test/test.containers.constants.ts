/**
 * Encryption key used for password hashing in test environments.
 * This must be at least 32 characters long.
 * Used by both the backend container and test runners that call hashPassword.
 */
export const TEST_ENCRYPTION_KEY = 'test-encryption-key-for-playwright-integration-tests-minimum-32-chars';

/**
 * System key used for system authentication in test environments.
 * This follows the workspace key format (WSK prefix) and must be at least 32 characters long.
 * Used by the runtime container to authenticate with the backend.
 */
export const TEST_SYSTEM_KEY = 'SYKTestSystemKey1234567890123456';
export const TEST_RUNTIME_ROUTE = '/start-runtime';
export const TEST_RUNTIME_STOP_ROUTE = '/stop-runtime';