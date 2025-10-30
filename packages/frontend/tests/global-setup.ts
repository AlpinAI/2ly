/**
 * Playwright Global Setup
 *
 * This runs once before all tests and:
 * 1. Starts the test environment (Dgraph, NATS, Backend) using testcontainers
 * 2. Starts the Vite dev server for the frontend
 * 3. Exposes service URLs via environment variables
 * 4. Saves state for global teardown
 * 5. Supports using published images via E2E_USE_IMAGE flag
 */

import { chromium, FullConfig } from '@playwright/test';
import { TestEnvironment, TEST_ENCRYPTION_KEY } from '@2ly/common/test/testcontainers';
import { exec } from 'child_process';
// import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// const execAsync = promisify(exec);

// Get current directory in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// State file to share info between setup and teardown
const STATE_FILE = path.join(__dirname, '.test-environment-state.json');

interface TestEnvironmentState {
  natsUrl: string;
  dgraphUrl: string;
  backendUrl: string;
  frontendUrl: string;
  frontendPort: number;
  frontendPid?: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function globalSetup(_config: FullConfig) {
  console.log('🚀 Starting test environment...');

  // Check for published image usage
  const usePublishedImages = process.env.E2E_USE_IMAGE === 'true';

  // Configure image build strategy for TestEnvironment
  let imageBuildStrategy: {
    backendImage?: string;
    runtimeImage?: string;
  } | undefined;

  if (usePublishedImages) {
    console.log(`📋 Using 2ly-backend-test:latest and 2ly-runtime-test:latest images`);
    imageBuildStrategy = {
      backendImage: `2ly-backend-test:latest`,
      runtimeImage: `2ly-runtime-test:latest`,
    };
  } else {
    console.log('📋 Building images locally');
  }

  console.log('📦 Starting containers (Dgraph, NATS, Backend)...');

  // Initialize test environment with minimal logging
  const testEnv = new TestEnvironment({
    exposeToHost: true,
    startBackend: true, // Enabled for backend integration tests
    startRuntime: true, // Enable the runtime container 
    runtimeEnv: {
      RUNTIME_NAME: 'E2E Test Runtime',
      GLOBAL_RUNTIME: 'true',
    },
    logging: {
      enabled: false, // Disable verbose TestEnvironment logs
      verbose: false,
    },
    imageBuildStrategy,
  });

  try {
    await testEnv.start();

    const services = testEnv.getServices();

    console.log('✅ Containers started');

    // Start Vite dev server for frontend
    console.log('🎨 Starting Vite dev server...');

    // Use a dedicated port for tests to avoid conflicts with local dev server
    const testFrontendPort = 9999;

    // Prepare environment variables for Vite
    const backendUrl = services.backend ? testEnv.getBackendUrl() : '';
    const viteEnv: Record<string, string> = {
      PORT: testFrontendPort.toString(),
    };

    if (services.backend) {
      // Frontend expects VITE_GRAPHQL_HOST and VITE_GRAPHQL_HOST_SSL
      const host = backendUrl.replace(/^https?:\/\//, '');
      viteEnv.VITE_GRAPHQL_HOST = host;
      viteEnv.VITE_GRAPHQL_HOST_SSL = 'false'; // Test environment uses HTTP
    }

    const viteProcess = exec('npm run dev', {
      cwd: path.join(__dirname, '..'),
      env: {
        ...process.env,
        ...viteEnv,
      },
    });

    // Wait for Vite to be ready
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Vite dev server failed to start in time'));
      }, 60000); // 60 seconds timeout

      viteProcess.stdout?.on('data', (data: Buffer) => {
        const output = data.toString();
        // Only log errors or warnings from Vite
        if (output.includes('error') || output.includes('ERROR') || output.includes('warn') || output.includes('WARN')) {
          console.log('  [Vite]', output.trim());
        }

        // Vite is ready when we see the local URL with the test port
        if (output.includes('Local:') || output.includes(`localhost:${testFrontendPort}`)) {
          clearTimeout(timeout);
          resolve();
        }
      });

      viteProcess.stderr?.on('data', (data: Buffer) => {
        console.error('  [Vite Error]', data.toString().trim());
      });

      viteProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    console.log('✅ Vite started');

    const frontendUrl = `http://localhost:${testFrontendPort}`;

    // Wait for frontend to be actually responsive (silently)
    const browser = await chromium.launch();
    const page = await browser.newPage();

    let retries = 10;
    while (retries > 0) {
      try {
        await page.goto(frontendUrl, { waitUntil: 'networkidle', timeout: 5000 });
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          await browser.close();
          throw new Error(`Frontend failed to become responsive: ${error}`);
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    await browser.close();

    // Save state for tests and teardown
    const state: TestEnvironmentState = {
      natsUrl: services.nats.clientUrl,
      dgraphUrl: testEnv.getDgraphUrl(),
      backendUrl: services.backend ? testEnv.getBackendUrl() : '',
      frontendUrl,
      frontendPort: testFrontendPort,
      frontendPid: viteProcess.pid,
    };

    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

    // Set environment variables for tests
    process.env.NATS_URL = state.natsUrl;
    process.env.DGRAPH_URL = state.dgraphUrl;
    process.env.API_URL = state.backendUrl;
    process.env.BASE_URL = state.frontendUrl;
    process.env.ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;

    console.log('✅ Test environment ready');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Note: We don't call testEnv.stop() here - that happens in global-teardown
    // We also keep a reference by storing it in a global variable
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).__TEST_ENVIRONMENT__ = testEnv;
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
}

export default globalSetup;
