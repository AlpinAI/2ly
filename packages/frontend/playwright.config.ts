import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

/**
 * Playwright Configuration for @2ly/frontend
 *
 * This configuration:
 * - Uses testcontainers to spin up a complete test environment (Dgraph, NATS, Backend)
 * - Tests against Chromium, Firefox, and WebKit
 * - Runs tests in parallel with isolated contexts
 * - Provides trace, screenshot, and video capture on failure
 *
 *
 * Note: Docker's layer cache automatically optimizes local builds
 */

// Get current directory in ES module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use environment variable for base URL, fallback to localhost:8888
const BASE_URL = process.env.BASE_URL || 'http://localhost:8888';

export default defineConfig({
  testDir: './tests',

  // Test timeout
  timeout: 30 * 1000, // 30 seconds per test

  // Expect timeout
  expect: {
    timeout: 5000, // 5 seconds for assertions
  },

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use - 'line' for minimal output
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['line'],
  ],

  // Shared settings for all projects
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: BASE_URL,

    // Collect trace when retrying the failed test
    trace: 'retain-on-failure',

    // Take screenshot on failure
    screenshot: 'only-on-failure',

    // Record video on failure
    video: 'retain-on-failure',

    // Maximum time each action can take
    actionTimeout: 10 * 1000, // 10 seconds
  },

  // Quiet mode to suppress console logs
  quiet: false, // Keep test names visible but reduce noise

  // Configure projects for different test strategies
  // Projects use dependencies to run sequentially and avoid database conflicts
  projects: [
    // =============================================================================
    // STRATEGY 1: Serial Tests (Sequential Execution)
    // =============================================================================
    // Tests that need specific database states and must run sequentially
    // Run sequentially (workers: 1) to prevent database race conditions
    // Projects run in sequence via dependencies
    {
      name: 'serial-chromium',
      testMatch: '**/tests/e2e/serial/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-dev-shm-usage'],
        },
      },
      workers: 1,
      fullyParallel: false,
    },
    {
      name: 'serial-firefox',
      testMatch: '**/tests/e2e/serial/**/*.spec.ts',
      use: {
        ...devices['Desktop Firefox'],
      },
      workers: 1,
      fullyParallel: false,
      dependencies: ['serial-chromium'], // Wait for serial-chromium to complete
    },
    {
      name: 'serial-webkit',
      testMatch: '**/tests/e2e/serial/**/*.spec.ts',
      use: {
        ...devices['Desktop Safari'],
      },
      workers: 1,
      fullyParallel: false,
      dependencies: ['serial-firefox'], // Wait for serial-firefox to complete
    },

    // =============================================================================
    // STRATEGY 2: Parallel Tests (UI-focused, Order-independent)
    // =============================================================================
    // Tests that can run in parallel with multiple workers
    // UI-focused tests that don't depend on specific database state
    // Tests can run in any order
    // Projects run in sequence via dependencies
    {
      name: 'parallel-chromium',
      testMatch: '**/tests/e2e/parallel/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-dev-shm-usage'],
        },
      },
      dependencies: ['serial-webkit'], // Wait for all serial tests to complete
    },
    {
      name: 'parallel-firefox',
      testMatch: '**/tests/e2e/parallel/**/*.spec.ts',
      use: {
        ...devices['Desktop Firefox'],
      },
      dependencies: ['parallel-chromium'], // Wait for parallel-chromium to complete
    },
    {
      name: 'parallel-webkit',
      testMatch: '**/tests/e2e/parallel/**/*.spec.ts',
      use: {
        ...devices['Desktop Safari'],
      },
      dependencies: ['parallel-firefox'], // Wait for parallel-firefox to complete
    },
  ],

  // Global setup and teardown
  globalSetup: path.resolve(__dirname, './tests/global-setup.ts'),
  globalTeardown: path.resolve(__dirname, './tests/global-teardown.ts'),

  // Run your local dev server before starting the tests
  // Note: In our case, we start the entire environment (including frontend) in global-setup
  // webServer: {
  //   command: 'npm run dev',
  //   url: BASE_URL,
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000, // 2 minutes
  // },
});
