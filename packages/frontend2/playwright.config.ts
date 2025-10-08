import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

/**
 * Playwright Configuration for @2ly/frontend2
 *
 * This configuration:
 * - Uses testcontainers to spin up a complete test environment (Dgraph, NATS, Backend)
 * - Tests against Chromium, Firefox, and WebKit
 * - Runs tests in parallel with isolated contexts
 * - Provides trace, screenshot, and video capture on failure
 */

// Get current directory in ES module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use environment variable for base URL, fallback to localhost:8888
const BASE_URL = process.env.BASE_URL || 'http://localhost:8888';

// Backend API URL (set by global setup)
const API_URL = process.env.API_URL || 'http://localhost:3000';

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

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],

  // Shared settings for all projects
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: BASE_URL,

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Take screenshot on failure
    screenshot: 'only-on-failure',

    // Record video on first retry
    video: 'retain-on-failure',

    // Maximum time each action can take
    actionTimeout: 10 * 1000, // 10 seconds
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Chromium-specific settings
        launchOptions: {
          args: ['--disable-dev-shm-usage'], // Helps with Docker environments
        },
      },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
    },

    // Test against mobile viewports (optional, commented out by default)
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
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
