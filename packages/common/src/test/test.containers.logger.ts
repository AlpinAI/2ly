/**
 * Centralized logging utility for test containers
 *
 * Provides consistent logging behavior across all test infrastructure:
 * - testLog: Respects TEST_LOGGING_ENABLED environment variable
 * - testError: Always logs errors (critical diagnostics)
 * - testWarn: Always logs warnings (important notifications)
 */

/**
 * Log a message if TEST_LOGGING_ENABLED is true
 * @param message The message to log
 * @param data Optional data to log (will be JSON.stringify'd)
 */
export function testLog(message: string, data?: unknown): void {
  if (process.env.TEST_LOGGING_ENABLED === 'true') {
    console.log(`[Test] ${message}`);
    if (data !== undefined) {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

/**
 * Always log an error message (critical diagnostics)
 * @param message The error message to log
 * @param error Optional error object or data
 */
export function testError(message: string, error?: unknown): void {
  console.error(`[Test ERROR] ${message}`);
  if (error !== undefined) {
    if (error instanceof Error) {
      console.error(error.message);
      if (error.stack) {
        console.error(error.stack);
      }
    } else {
      console.error(JSON.stringify(error, null, 2));
    }
  }
}

/**
 * Always log a warning message (important notifications)
 * @param message The warning message to log
 * @param data Optional data to log
 */
export function testWarn(message: string, data?: unknown): void {
  console.warn(`[Test WARN] ${message}`);
  if (data !== undefined) {
    console.warn(JSON.stringify(data, null, 2));
  }
}
