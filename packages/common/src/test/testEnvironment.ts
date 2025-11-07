/**
 * Test Environment using Testcontainers
 *
 * Provides a complete integration testing environment with:
 * - Dgraph (Zero + Alpha) for database
 * - NATS with JetStream for messaging
 * - Backend API server
 *
 * Can be used for both frontend (Playwright) and backend integration tests
 */

import {
  GenericContainer,
  StartedTestContainer,
  Network,
  StartedNetwork,
  Wait,
} from 'testcontainers';
import { generateKeyPairSync } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/**
 * Encryption key used for password hashing in test environments.
 * This must be at least 32 characters long.
 * Used by both the backend container and test runners that call hashPassword.
 */
export const TEST_ENCRYPTION_KEY = 'test-encryption-key-for-playwright-integration-tests-minimum-32-chars';

/**
 * Workspace master key used for runtime authentication in test environments.
 * This follows the workspace key format (WSK prefix) and must be at least 32 characters long.
 * Used by the runtime container to authenticate with the backend.
 */
export const TEST_MASTER_KEY = 'WSKTestMasterKey1234567890123456';

/**
 * Find the project root by looking for package.json with workspaces
 */
function findProjectRoot(startDir: string = process.cwd()): string {
  let currentDir = startDir;

  while (currentDir !== path.parse(currentDir).root) {
    const packageJsonPath = path.join(currentDir, 'package.json');

    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      // Check if this is a workspace root (has workspaces field)
      if (packageJson.workspaces) {
        return currentDir;
      }
    }

    // Move up one directory
    currentDir = path.dirname(currentDir);
  }

  // Fallback to current directory
  return process.cwd();
}

export interface TestEnvironmentConfig {
  /**
   * Whether to expose ports to host (needed for Playwright tests)
   * @default true
   */
  exposeToHost?: boolean;

  /**
   * Whether to start the backend container
   * @default true
   */
  startBackend?: boolean;

  /**
   * Whether to prepare the runtime container
   * @default false
   */
  prepareRuntime?: boolean;

  /**
   * Project root directory (where packages/ folder is located)
   * @default Auto-detected by finding the closest package.json with workspaces
   */
  projectRoot?: string;

  /**
   * Environment variables for the backend
   */
  backendEnv?: Record<string, string>;

  /**
   * Logging configuration
   */
  logging?: {
    enabled: boolean;
    verbose?: boolean;
  };
  
  /**
   * Use existing backend image instead of building locally
   * Format: '2ly-backend-test:latest'
   * @default undefined (build locally)
   */
  backendImage?: string;

  /**
   * Use published runtime image instead of building locally
   * Format: '2ly-runtime-test:latest'
   * @default undefined (build locally)
   */
  runtimeImage?: string;
}

export interface TestEnvironmentServices {
  nats: {
    container: StartedTestContainer;
    clientUrl: string;
    httpUrl: string;
  };
  dgraphZero: {
    container: StartedTestContainer;
    grpcUrl: string;
    httpUrl: string;
  };
  dgraphAlpha: {
    container: StartedTestContainer;
    grpcUrl: string;
    graphqlUrl: string;
  };
  backend?: {
    container: StartedTestContainer;
    apiUrl: string;
    healthUrl: string;
  };
}

export class TestEnvironment {
  private network?: StartedNetwork;
  private services?: TestEnvironmentServices;
  private tempKeyDir?: string;
  private config: Omit<Required<TestEnvironmentConfig>, 'backendImage' | 'runtimeImage'> & { backendImage?: string; runtimeImage?: string };

  constructor(config: TestEnvironmentConfig = {}) {
    this.config = {
      exposeToHost: config.exposeToHost ?? true,
      startBackend: config.startBackend ?? true,
      prepareRuntime: config.prepareRuntime ?? false,
      projectRoot: config.projectRoot ?? findProjectRoot(),
      backendEnv: config.backendEnv ?? {},
      logging: {
        enabled: config.logging?.enabled ?? false,
        verbose: config.logging?.verbose ?? false,
      },
      backendImage: config.backendImage,
      runtimeImage: config.runtimeImage,
    };

    process.env.TEST_LOGGING_ENABLED = this.config.logging.enabled ? 'true' : 'false';
  }

  private log(message: string, data?: unknown): void {
    if (this.config.logging.enabled) {
      const timestamp = new Date().toISOString();
      console.log(`[TestEnvironment ${timestamp}] ${message}`);
      if (data && this.config.logging.verbose) {
        console.log(JSON.stringify(data, null, 2));
      }
    }
  }

  /**
   * Wait for a health endpoint to become available
   * @param url - The health endpoint URL to check
   * @param maxRetries - Maximum number of retry attempts
   * @param intervalMs - Delay between retries in milliseconds
   */
  private async waitForHealth(url: string, maxRetries: number, intervalMs: number): Promise<void> {
    this.log(`Waiting for health check: ${url}`, { maxRetries, intervalMs });

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          this.log(`Health check passed: ${url}`, { attempt, status: response.status });
          return;
        }
        this.log(`Health check failed: ${url}`, { attempt, status: response.status });
      } catch (error) {
        this.log(`Health check error: ${url}`, { attempt, error: error instanceof Error ? error.message : String(error) });
      }

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }

    throw new Error(`Health check failed after ${maxRetries} attempts: ${url}`);
  }

  /**
   * Generate JWT keys for test environment
   * Creates a temporary directory with RSA key pair
   */
  private generateJWTKeys(): string {
    this.log('Generating JWT keys...');

    // Create unique temp directory
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), '2ly-test-keys-'));
    this.log('Created temp key directory', { path: tempDir });

    // Generate RSA key pair with same parameters as production
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    // Write keys to temp directory
    const privateKeyPath = path.join(tempDir, 'private.pem');
    const publicKeyPath = path.join(tempDir, 'public.pem');

    fs.writeFileSync(privateKeyPath, privateKey);
    fs.writeFileSync(publicKeyPath, publicKey);

    this.log('JWT keys generated and written to temp directory');

    // Store temp directory for cleanup
    this.tempKeyDir = tempDir;

    return tempDir;
  }

  /**
   * Start all test environment services
   */
  async start(): Promise<TestEnvironmentServices> {
    this.log('Starting test environment...');

    // Create network for container communication
    this.network = await new Network().start();
    this.log('Network created', { networkId: this.network?.getId() });

    // Start services in dependency order
    const natsContainer = await this.startNats();
    const dgraphZero = await this.startDgraphZero();
    const dgraphAlpha = await this.startDgraphAlpha();

    this.services = {
      nats: natsContainer,
      dgraphZero,
      dgraphAlpha,
    };

    // Optionally start backend
    if (this.config.startBackend) {
      const backend = await this.startBackend();
      this.services.backend = backend;
    }

    // Optionally start runtime
    if (this.config.prepareRuntime) {
      await this.prepareRuntime();
    }

    this.log('Test environment started successfully');
    return this.services;
  }

  /**
   * Start NATS with JetStream
   */
  private async startNats(): Promise<TestEnvironmentServices['nats']> {
    this.log('Starting NATS...');

    // Use GenericContainer instead of NatsContainer to have full control over configuration
    const container = await new GenericContainer('nats:2.10-alpine')
      .withNetwork(this.network!)
      .withNetworkAliases('nats')
      .withCommand([
        '--jetstream',
        '--store_dir=/data',
        '--http_port=8222',
        '--name=2ly-test-nats',
      ])
      .withExposedPorts(
        ...(this.config.exposeToHost ? [4222, 8222] : [])
      )
      .withWaitStrategy(Wait.forListeningPorts())
      .withStartupTimeout(30000)
      .start();

    const mappedPort = container.getMappedPort(4222);
    process.env.TEST_NATS_CLIENT_URL = `localhost:${mappedPort}`;

    const clientUrl = this.config.exposeToHost
      ? `localhost:${container.getMappedPort(4222)}`
      : 'nats:4222';

    const httpUrl = this.config.exposeToHost
      ? `http://localhost:${container.getMappedPort(8222)}`
      : 'http://nats:8222';

    this.log('NATS started', { clientUrl, httpUrl });

    return { container, clientUrl, httpUrl };
  }

  /**
   * Start Dgraph Zero (cluster coordinator)
   */
  private async startDgraphZero(): Promise<TestEnvironmentServices['dgraphZero']> {
    this.log('Starting Dgraph Zero...');

    const container = await new GenericContainer('dgraph/dgraph:latest')
      .withNetwork(this.network!)
      .withNetworkAliases('dgraph-zero')
      .withCommand(['dgraph', 'zero', '--my=dgraph-zero:5080'])
      .withExposedPorts(
        ...(this.config.exposeToHost ? [5080, 6080] : [])
      )
      // Wait for port to be open instead of health check (dgraph image doesn't have curl)
      .withWaitStrategy(Wait.forListeningPorts())
      .withStartupTimeout(30000) // 30 seconds
      .start();

    const grpcUrl = this.config.exposeToHost
      ? `localhost:${container.getMappedPort(5080)}`
      : 'dgraph-zero:5080';

    const httpUrl = this.config.exposeToHost
      ? `http://localhost:${container.getMappedPort(6080)}`
      : 'http://dgraph-zero:6080';

    this.log('Dgraph Zero started', { grpcUrl, httpUrl });

    // Wait for Dgraph Zero to be healthy
    if (this.config.exposeToHost) {
      const healthUrl = `http://localhost:${container.getMappedPort(6080)}/health`;
      await this.waitForHealth(healthUrl, 30, 1000); // 30 retries, 1 second interval
    }

    return { container, grpcUrl, httpUrl };
  }

  /**
   * Start Dgraph Alpha (data node)
   */
  private async startDgraphAlpha(): Promise<TestEnvironmentServices['dgraphAlpha']> {
    this.log('Starting Dgraph Alpha...');

    const container = await new GenericContainer('dgraph/dgraph:latest')
      .withNetwork(this.network!)
      .withNetworkAliases('dgraph-alpha')
      .withCommand([
        'dgraph',
        'alpha',
        '--my=dgraph-alpha:7080',
        '--zero=dgraph-zero:5080',
        '--security', 'whitelist=0.0.0.0/0', // Allow all IPs in test environment
      ])
      .withExposedPorts(
        ...(this.config.exposeToHost ? [7080, 8080, 9080] : [])
      )
      // Wait for GraphQL port to be open
      .withWaitStrategy(Wait.forListeningPorts())
      .withStartupTimeout(60000) // 60 seconds - Dgraph Alpha takes longer
      .start();

    const grpcUrl = this.config.exposeToHost
      ? `localhost:${container.getMappedPort(7080)}`
      : 'dgraph-alpha:7080';

    const graphqlUrl = this.config.exposeToHost
      ? `http://localhost:${container.getMappedPort(8080)}`
      : 'http://dgraph-alpha:8080';

    this.log('Dgraph Alpha started', { grpcUrl, graphqlUrl });

    // Wait for Dgraph Alpha to be healthy
    // Dgraph Alpha needs time to connect to Zero and initialize
    if (this.config.exposeToHost) {
      const healthUrl = `http://localhost:${container.getMappedPort(8080)}/health`;
      await this.waitForHealth(healthUrl, 60, 1000); // 60 retries, 1 second interval
    }

    return { container, grpcUrl, graphqlUrl };
  }

  /**
   * Start Backend API server
   */
  private async startBackend(): Promise<NonNullable<TestEnvironmentServices['backend']>> {
    if (!this.services?.nats || !this.services?.dgraphAlpha) {
      throw new Error('Cannot start backend: NATS and Dgraph must be started first');
    }

    this.log('Starting Backend...');

    // Generate JWT keys for test environment
    const keyDir = this.generateJWTKeys();

    let containerImage: GenericContainer;

    if (this.config.backendImage) {
      // Use existing image
      this.log(`Using published backend image: ${this.config.backendImage}`);
      containerImage = new GenericContainer(this.config.backendImage);
    } else {
      // Build the Docker image
      this.log('Building backend Docker image...', { projectRoot: this.config.projectRoot });

      let builtImage: GenericContainer | undefined = undefined;
      let progressInterval: NodeJS.Timeout | undefined = undefined;
      let promiseTimeout: NodeJS.Timeout | undefined = undefined;
      try {
        // Log progress every 10 seconds during build
        progressInterval = setInterval(() => {
          this.log('Docker build still in progress...');
        }, 10000);

        const buildPromise = GenericContainer.fromDockerfile(
          this.config.projectRoot,
          'packages/backend/Dockerfile'
        ).build('2ly-backend-test', { deleteOnExit: false });

        // Add timeout to prevent hanging indefinitely
        const timeoutPromise = new Promise((_, reject) => {
          promiseTimeout = setTimeout(() => reject(new Error('Docker build timed out after 5 minutes')), 5 * 60 * 1000);
        });

        builtImage = await Promise.race([
          buildPromise, timeoutPromise
        ]) as GenericContainer;
        this.log('Backend Docker image built successfully');
        containerImage = builtImage;
      } catch (error) {
        this.log('Failed to build backend Docker image', error);
        throw new Error(`Docker build failed: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        if (progressInterval) {
          clearInterval(progressInterval);
        }
        if (promiseTimeout) {
          clearTimeout(promiseTimeout);
        }
      }
    }

    // Then create and configure the container
    let started;
    try {
      started = await containerImage
        .withNetwork(this.network!)
        .withNetworkAliases('backend')
        .withEnvironment({
          NODE_ENV: 'test',
          LOG_LEVEL: 'error', // Only log errors in test environment
          DGRAPH_URL: 'dgraph-alpha:8080',
          NATS_SERVERS: 'nats:4222',
          EXPOSED_NATS_SERVERS: this.services.nats.clientUrl,
          CORS_ORIGINS: 'http://localhost:8888,http://localhost:9999',
          ENCRYPTION_KEY: TEST_ENCRYPTION_KEY,
          MASTER_KEY: TEST_MASTER_KEY,
          JWT_PRIVATE_KEY_PATH: '/keys/private.pem',
          JWT_PUBLIC_KEY_PATH: '/keys/public.pem',
          IDENTITY_LOG_LEVEL: 'debug',
          ...this.config.backendEnv,
        })
        .withBindMounts([{
          source: keyDir,
          target: '/keys',
          mode: 'ro',
        }])
        .withExposedPorts(...(this.config.exposeToHost ? [3000] : []))
        // Wait for HTTP port (backend Dockerfile has curl for healthcheck)
        .withWaitStrategy(Wait.forListeningPorts())
        .withStartupTimeout(120000) // 2 minutes for startup
        .withLogConsumer((stream) => {
          // Only log ERROR and WARN lines to reduce noise
          stream.on('data', (line) => {
            this.log(`[Backend] ${line}`);
          });
          stream.on('err', (line) => this.log(`[Backend ERROR] ${line}`));
        })
        .start();

      this.log('Backend container started, waiting for initialization...');
      // Give backend time to initialize connections
      await new Promise((resolve) => setTimeout(resolve, 3000)); // 3 seconds
    } catch (error) {
      this.log('Failed to start backend container', error);
      throw error;
    }

    const apiUrl = this.config.exposeToHost
      ? `http://localhost:${started.getMappedPort(3000)}`
      : 'http://backend:3000';

    const healthUrl = `${apiUrl}/health`;

    this.log('Backend started', { apiUrl, healthUrl });
    return { container: started, apiUrl, healthUrl };
  }

  /**
   * Start Runtime container
   */
  private async prepareRuntime(): Promise<void> {
    if (!this.services?.nats || !this.services?.dgraphAlpha) {
      throw new Error('Cannot start runtime: NATS and Dgraph must be started first');
    }

    this.log('Starting Runtime...');

    if (this.config.runtimeImage) {
      // Use published image
      this.log(`Using published runtime image: ${this.config.runtimeImage}`);
    } else {
      // Build the Docker image
      this.log('Building runtime Docker image...', { projectRoot: this.config.projectRoot });

      let progressInterval: NodeJS.Timeout | undefined = undefined;
      let promiseTimeout: NodeJS.Timeout | undefined = undefined;
      try {
        // Log progress every 10 seconds during build
        progressInterval = setInterval(() => {
          this.log('Docker build still in progress...');
        }, 10000);

        const buildPromise = GenericContainer.fromDockerfile(
          this.config.projectRoot,
          'packages/runtime/Dockerfile'
        ).build('2ly-runtime-test', { deleteOnExit: false });

        // Add timeout to prevent hanging indefinitely
        const timeoutPromise = new Promise((_, reject) => {
          promiseTimeout = setTimeout(() => reject(new Error('Docker build timed out after 5 minutes')), 5 * 60 * 1000);
        });

        await Promise.race([
          buildPromise, timeoutPromise
        ]) as GenericContainer;
        this.log('Runtime Docker image built successfully');
      } catch (error) {
        this.log('Failed to build runtime Docker image', error);
        throw new Error(`Docker build failed: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        if (progressInterval) {
          clearInterval(progressInterval);
        }
        if (promiseTimeout) {
          clearTimeout(promiseTimeout);
        }
      }
    }
  }

  /**
   * Get service URLs (useful for tests)
   */
  getServices(): TestEnvironmentServices {
    if (!this.services) {
      throw new Error('Test environment not started. Call start() first.');
    }
    return this.services;
  }

  /**
   * Get connection string for NATS
   */
  getNatsUrl(): string {
    return this.getServices().nats.clientUrl;
  }

  /**
   * Get GraphQL endpoint for Dgraph
   */
  getDgraphUrl(): string {
    return `${this.getServices().dgraphAlpha.graphqlUrl}/graphql`;
  }

  /**
   * Get backend API URL
   */
  getBackendUrl(): string {
    const backend = this.getServices().backend;
    if (!backend) {
      throw new Error('Backend not started');
    }
    return backend.apiUrl;
  }

  /**
   * Stop all services and cleanup
   */
  async stop(): Promise<void> {
    this.log('Stopping test environment...');

    const errors: Error[] = [];

    try {

      if (this.services?.backend) {
        try {
          await this.services.backend.container.stop({ timeout: 10000 });
          this.log('Backend stopped');
        } catch (error) {
          this.log('Error stopping backend', error);
          errors.push(error instanceof Error ? error : new Error(String(error)));
        }
      }

      // Clean up temp JWT keys
      if (this.tempKeyDir) {
        try {
          this.log('Cleaning up temp JWT keys', { path: this.tempKeyDir });
          fs.unlinkSync(path.join(this.tempKeyDir, 'private.pem'));
          fs.unlinkSync(path.join(this.tempKeyDir, 'public.pem'));
          fs.rmdirSync(this.tempKeyDir);
          this.tempKeyDir = undefined;
          this.log('Temp JWT keys cleaned up');
        } catch (error) {
          this.log('Error cleaning up temp JWT keys', error);
          errors.push(error instanceof Error ? error : new Error(String(error)));
        }
      }

      if (this.services?.dgraphAlpha) {
        try {
          await this.services.dgraphAlpha.container.stop({ timeout: 5000 });
          this.log('Dgraph Alpha stopped');
        } catch (error) {
          this.log('Error stopping Dgraph Alpha', error);
          errors.push(error instanceof Error ? error : new Error(String(error)));
        }
      }

      if (this.services?.dgraphZero) {
        try {
          await this.services.dgraphZero.container.stop({ timeout: 5000 });
          this.log('Dgraph Zero stopped');
        } catch (error) {
          this.log('Error stopping Dgraph Zero', error);
          errors.push(error instanceof Error ? error : new Error(String(error)));
        }
      }

      if (this.services?.nats) {
        try {
          await this.services.nats.container.stop({ timeout: 5000 });
          this.log('NATS stopped');
        } catch (error) {
          this.log('Error stopping NATS', error);
          errors.push(error instanceof Error ? error : new Error(String(error)));
        }
      }

      if (this.network) {
        try {
          await this.network.stop();
          this.log('Network stopped');
        } catch (error) {
          this.log('Error stopping network', error);
          errors.push(error instanceof Error ? error : new Error(String(error)));
        }
      }

      this.services = undefined;
      this.network = undefined;

      this.log('Test environment stopped successfully');

      if (errors.length > 0) {
        this.log(`Encountered ${errors.length} errors during cleanup`);
        // Don't throw, just log - we want cleanup to complete
      }
    } catch (error) {
      this.log('Error stopping test environment', error);
      throw error;
    }
  }
}


let startedContainer: StartedTestContainer | undefined = undefined;
export const startRuntime = async (): Promise<void> => {
  if (startedContainer) {
    return;
  }
  if (process.env.TEST_LOGGING_ENABLED === 'true') {
    console.log('Starting runtime...');
  }
  const natsUrl = process.env.TEST_NATS_CLIENT_URL ?? 'nats:4222';
  const runtimeName = 'Test Runtime';
  const container = new GenericContainer('2ly-runtime-test:latest')
    .withNetworkMode('host')
    .withEnvironment({
      NODE_ENV: 'test',
      LOG_LEVEL: 'error', // Only log errors in test environment
      NATS_SERVERS: natsUrl,
      RUNTIME_NAME: runtimeName,
      ROOTS: `TEMP:/tmp`,
      MASTER_KEY: TEST_MASTER_KEY,
    })
    // No exposed ports needed - runtime communicates via NATS
    .withWaitStrategy(Wait.forListeningPorts())
    .withStartupTimeout(60000) // 1 minute for startup
    .withLogConsumer((stream) => {
      // Only log ERROR and WARN lines to reduce noise
      stream.on('data', (line) => {
        if (process.env.TEST_LOGGING_ENABLED === 'true') {
          console.log(`[Runtime] ${line}`);
        }
      });
      stream.on('err', (line) => console.log(`[Runtime ERROR] ${line}`));
    });
  startedContainer = await container.start();
  // Wait a bit for the runtime to fully start and register with NATS
  await new Promise((resolve) => setTimeout(resolve, 1000));
};

export const stopRuntime = async (): Promise<void> => {
  if (startedContainer) {
    await startedContainer.stop({ timeout: 10000 });
    startedContainer = undefined;
    if (process.env.TEST_LOGGING_ENABLED === 'true') {
      console.log('Runtime stopped');
    }
  }
};