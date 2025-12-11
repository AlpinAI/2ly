/**
 * Test Environment using Testcontainers
 *
 * Provides a complete integration testing environment with:
 * - Dgraph (Zero + Alpha) for database
 * - NATS with JetStream for messaging
 * - Backend API server
 * - Runtime, including MCP server and skill
 *
 * Can be used for both frontend (Playwright) and backend integration tests
 */

import { GenericContainer, StartedTestContainer, Network, StartedNetwork, Wait } from 'testcontainers';
import { generateKeyPairSync } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execSync } from 'child_process';
import {
  TEST_ENCRYPTION_KEY,
  TEST_SYSTEM_KEY,
  TEST_RUNTIME_ROUTE,
  TEST_RUNTIME_STOP_ROUTE,
} from './test.containers.constants';
import { findProjectRoot, waitForHealth } from './test.containers.helpers';
import { startControllerServer, registerRoute, callRoute } from './test.containers.web-server';
import { testLog, testError } from './test.containers.logger';

export interface TestEnvironmentConfig {
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
  logging?: boolean;
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
  runtime?: {
    container: GenericContainer;
    startedContainer?: StartedTestContainer;
  };
}

export class TestEnvironment {
  private network?: StartedNetwork;
  private services?: TestEnvironmentServices;
  private tempKeyDir?: string;
  private config: Required<TestEnvironmentConfig>;

  constructor(config: TestEnvironmentConfig = {}) {
    this.config = {
      projectRoot: config.projectRoot ?? findProjectRoot(),
      backendEnv: config.backendEnv ?? {},
      logging: config.logging ?? false,
    };

    process.env.TEST_LOGGING_ENABLED = this.config.logging ? 'true' : 'false';
  }

  /**
   * Generate JWT keys for test environment
   * Creates a temporary directory with RSA key pair
   */
  private generateJWTKeys(): string {
    testLog('Generating JWT keys...');

    // Create unique temp directory
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skilder-test-keys-'));
    testLog(`Created temp key directory: ${tempDir}`);

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

    testLog('JWT keys generated and written to temp directory');

    // Store temp directory for cleanup
    this.tempKeyDir = tempDir;

    return tempDir;
  }

  /**
   * Check if a Docker image exists locally
   * Returns the image creation timestamp if it exists, null otherwise
   */
  private checkImageExists(imageName: string): Date | null {
    try {
      const output = execSync(`docker image inspect ${imageName} --format='{{.Created}}'`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();

      return new Date(output);
    } catch {
      // Image doesn't exist
      return null;
    }
  }

  /**
   * Check if a Docker image needs rebuilding
   * Returns true if image doesn't exist, Dockerfile is newer, or FORCE_REBUILD is set
   */
  private shouldRebuildImage(imageName: string): boolean {
    // Check for force rebuild flag
    if (process.env.FORCE_REBUILD === 'true') {
      testLog(`FORCE_REBUILD=true, rebuilding ${imageName}`);
      return true;
    }

    // Check if image exists
    const imageCreated = this.checkImageExists(imageName);
    if (!imageCreated) {
      testLog(`Image ${imageName} does not exist, will build`);
      return true;
    }

    return false;
  }

  /**
   * Start all test environment services
   */
  async start(): Promise<TestEnvironmentServices> {
    testLog('Starting test environment...');

    // Create network for container communication
    this.network = await new Network().start();
    testLog(`Network created: ${this.network?.getId()}`);

    // Start services in dependency order
    const natsContainer = await this.startNats();
    const dgraphZero = await this.startDgraphZero();
    const dgraphAlpha = await this.startDgraphAlpha();

    this.services = {
      nats: natsContainer,
      dgraphZero,
      dgraphAlpha,
    };

    // Build Docker images in parallel (if needed)
    testLog(`Building backend and runtime Docker images in parallel...`);
    const buildPromises: Promise<void>[] = [this.buildBackendImage(), this.buildRuntimeImage()];
    await Promise.all(buildPromises);
    testLog('Backend and runtime Docker images built successfully');

    // Start containers sequentially
    const backend = await this.startBackendContainer();
    this.services.backend = backend;

    testLog('Test environment started successfully');

    registerRoute(TEST_RUNTIME_ROUTE, async (_request, reply) => {
      try {
        const port = await this.startRuntime();
        reply.send({ status: 'ok', port });
      } catch (error) {
        testError(`Error starting runtime: ${error instanceof Error ? error.message : String(error)}`);
        reply.send({
          status: 'error',
          message: `Error starting runtime: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    });

    registerRoute(TEST_RUNTIME_STOP_ROUTE, async (_request, reply) => {
      try {
        await this.stopRuntime();
        reply.send({ status: 'ok' });
      } catch (error) {
        testError(`Error stopping runtime: ${error instanceof Error ? error.message : String(error)}`);
        reply.send({
          status: 'error',
          message: `Error stopping runtime: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
      reply.send({ status: 'ok' });
    });

    await startControllerServer();

    return this.services;
  }

  /**
   * Start NATS with JetStream
   */
  private async startNats(): Promise<TestEnvironmentServices['nats']> {
    testLog('Starting NATS...');

    // Use GenericContainer instead of NatsContainer to have full control over configuration
    const container = await new GenericContainer('nats:2.10-alpine')
      .withNetwork(this.network!)
      .withNetworkAliases('nats')
      .withCommand(['--jetstream', '--store_dir=/data', '--http_port=8222', '--name=skilder-test-nats'])
      .withExposedPorts(4222, 8222)
      .withWaitStrategy(Wait.forListeningPorts())
      .withStartupTimeout(30000)
      .start();

    const clientUrl = `localhost:${container.getMappedPort(4222)}`;
    const httpUrl = `http://localhost:${container.getMappedPort(8222)}`;

    testLog(`NATS started: ${clientUrl}`);

    process.env.TEST_NATS_CLIENT_URL = clientUrl;

    return { container, clientUrl, httpUrl };
  }

  /**
   * Start Dgraph Zero (cluster coordinator)
   */
  private async startDgraphZero(): Promise<TestEnvironmentServices['dgraphZero']> {
    testLog('Starting Dgraph Zero...');

    const container = await new GenericContainer('dgraph/dgraph:latest')
      .withNetwork(this.network!)
      .withNetworkAliases('dgraph-zero')
      .withCommand(['dgraph', 'zero', '--my=dgraph-zero:5080'])
      .withExposedPorts(5080, 6080)
      // Wait for port to be open instead of health check (dgraph image doesn't have curl)
      .withWaitStrategy(Wait.forListeningPorts())
      .withStartupTimeout(30000) // 30 seconds
      .start();

    const grpcUrl = `localhost:${container.getMappedPort(5080)}`;

    const httpUrl = `http://localhost:${container.getMappedPort(6080)}`;

    testLog('Dgraph Zero started');

    // Wait for Dgraph Zero to be healthy
    const healthUrl = `http://localhost:${container.getMappedPort(6080)}/health`;
    await waitForHealth(healthUrl);

    return { container, grpcUrl, httpUrl };
  }

  /**
   * Start Dgraph Alpha (data node)
   */
  private async startDgraphAlpha(): Promise<TestEnvironmentServices['dgraphAlpha']> {
    testLog('Starting Dgraph Alpha...');

    const container = await new GenericContainer('dgraph/dgraph:latest')
      .withNetwork(this.network!)
      .withNetworkAliases('dgraph-alpha')
      .withCommand([
        'dgraph',
        'alpha',
        '--my=dgraph-alpha:7080',
        '--zero=dgraph-zero:5080',
        '--security',
        'whitelist=0.0.0.0/0', // Allow all IPs in test environment
      ])
      .withExposedPorts(7080, 8080, 9080)
      // Wait for GraphQL port to be open
      .withWaitStrategy(Wait.forListeningPorts())
      .withStartupTimeout(60000) // 60 seconds - Dgraph Alpha takes longer
      .start();

    const grpcUrl = `localhost:${container.getMappedPort(7080)}`;

    const graphqlUrl = `http://localhost:${container.getMappedPort(8080)}`;

    testLog('Dgraph Alpha started');

    // Wait for Dgraph Alpha to be healthy
    // Dgraph Alpha needs time to connect to Zero and initialize
    const healthUrl = `http://localhost:${container.getMappedPort(8080)}/health`;
    await waitForHealth(healthUrl);

    return { container, grpcUrl, graphqlUrl };
  }

  /**
   * Build backend Docker image
   */
  private async buildBackendImage(): Promise<void> {
    const imageName = 'skilder-backend-test:latest';
    const dockerfilePath = 'packages/backend/Dockerfile';

    // Check if rebuild is needed
    if (!this.shouldRebuildImage(imageName)) {
      testLog('Backend image already exists, waiting for 5 seconds...');
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return;
    }

    testLog('Building backend Docker image...');

    let progressInterval: NodeJS.Timeout | undefined = undefined;
    let promiseTimeout: NodeJS.Timeout | undefined = undefined;

    try {
      progressInterval = setInterval(() => {
        testLog('[Backend] Docker build still in progress...');
      }, 10000);

      const buildPromise = GenericContainer.fromDockerfile(this.config.projectRoot, dockerfilePath)
        .withBuildkit()
        .build('skilder-backend-test', { deleteOnExit: false });

      const timeoutPromise = new Promise((_, reject) => {
        promiseTimeout = setTimeout(
          () => reject(new Error('Backend Docker build timed out after 5 minutes')),
          5 * 60 * 1000,
        );
      });

      await Promise.race([buildPromise, timeoutPromise]);
      testLog('Backend Docker image built successfully');
    } catch (error) {
      testError('Failed to build backend Docker image', error);
      throw new Error(`Backend Docker build failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      if (progressInterval) clearInterval(progressInterval);
      if (promiseTimeout) clearTimeout(promiseTimeout);
    }
  }

  /**
   * Build runtime Docker image
   */
  private async buildRuntimeImage(): Promise<void> {
    const imageName = 'skilder-runtime-test:latest';
    const dockerfilePath = 'packages/runtime/Dockerfile';

    // Check if rebuild is needed
    if (!this.shouldRebuildImage(imageName)) {
      return;
    }

    testLog('Building runtime Docker image...');

    let progressInterval: NodeJS.Timeout | undefined = undefined;
    let promiseTimeout: NodeJS.Timeout | undefined = undefined;

    try {
      progressInterval = setInterval(() => {
        testLog('[Runtime] Docker build still in progress...');
      }, 10000);

      const buildPromise = GenericContainer.fromDockerfile(this.config.projectRoot, dockerfilePath)
        .withBuildkit()
        .build('skilder-runtime-test', { deleteOnExit: false });

      const timeoutPromise = new Promise((_, reject) => {
        promiseTimeout = setTimeout(
          () => reject(new Error('Runtime Docker build timed out after 5 minutes')),
          5 * 60 * 1000,
        );
      });

      await Promise.race([buildPromise, timeoutPromise]);
      testLog('Runtime Docker image built successfully');
    } catch (error) {
      testError('Failed to build runtime Docker image', error);
      throw new Error(`Runtime Docker build failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      if (progressInterval) clearInterval(progressInterval);
      if (promiseTimeout) clearTimeout(promiseTimeout);
    }
  }

  /**
   * Start Backend API server container (assumes image is already built)
   */
  private async startBackendContainer(): Promise<NonNullable<TestEnvironmentServices['backend']>> {
    if (!this.services?.nats || !this.services?.dgraphAlpha) {
      throw new Error('Cannot start backend: NATS and Dgraph must be started first');
    }

    testLog('Starting Backend container...');

    // Generate JWT keys for test environment
    const keyDir = this.generateJWTKeys();

    // Use the appropriate image (pre-built or locally built)
    const imageName = 'skilder-backend-test:latest';
    testLog(`Using backend image: ${imageName}`);

    const containerImage = new GenericContainer(imageName);

    // Create and configure the container
    let started;
    try {
      started = await containerImage
        .withNetwork(this.network!)
        .withNetworkAliases('backend')
        .withEnvironment({
          NODE_ENV: 'test',
          AUTOGEN_KEYS: 'false',
          LOG_LEVEL: 'error', // Only log errors in test environment
          DGRAPH_URL: 'dgraph-alpha:8080',
          NATS_SERVERS: 'nats:4222',
          EXPOSED_NATS_SERVERS: this.services.nats.clientUrl,
          EXPOSED_REMOTE_MCP: 'http://localhost:3001',
          CORS_ORIGINS: 'http://localhost:8888,http://localhost:9999',
          ENCRYPTION_KEY: TEST_ENCRYPTION_KEY,
          SYSTEM_KEY: TEST_SYSTEM_KEY,
          JWT_PRIVATE_KEY_PATH: '/keys/private.pem',
          JWT_PUBLIC_KEY_PATH: '/keys/public.pem',
          IDENTITY_LOG_LEVEL: 'debug',
          ...this.config.backendEnv,
        })
        .withBindMounts([
          {
            source: keyDir,
            target: '/keys',
            mode: 'ro',
          },
        ])
        .withExposedPorts(3000)
        // Wait for HTTP port (backend Dockerfile has curl for healthcheck)
        .withWaitStrategy(Wait.forListeningPorts())
        .withStartupTimeout(120000) // 2 minutes for startup
        .withLogConsumer((stream) => {
          // Only log ERROR and WARN lines to reduce noise
          stream.on('data', (line) => {
            testLog(`[Backend] ${line.trim()}`);
          });
          stream.on('err', (line) => testError(`[Backend ERROR] ${line}`));
        })
        .start();

      testLog('Backend container started, waiting for initialization...');
      // Give backend time to initialize connections
      await new Promise((resolve) => setTimeout(resolve, 3000)); // 3 seconds
    } catch (error) {
      testError('Failed to start backend container', error);
      throw error;
    }

    const apiUrl = `http://localhost:${started.getMappedPort(3000)}`;

    const healthUrl = `${apiUrl}/health`;

    await waitForHealth(healthUrl);
    testLog(`Backend started: ${apiUrl}`);
    return { container: started, apiUrl, healthUrl };
  }

  async startRuntime(): Promise<number> {
    if (this.services?.runtime?.startedContainer) {
      // Return the existing port if already started
      const runtimePort = 3001;
      const existingPort = this.services.runtime.startedContainer.getMappedPort(runtimePort);
      return existingPort;
    }
    testLog('Starting runtime...');
    const runtimeName = 'Test Runtime';
    const runtimePort = 3001;

    // Use the appropriate image (pre-built or locally built)
    const imageName = 'skilder-runtime-test:latest';
    if (!this.services?.runtime?.container) {
      const container = new GenericContainer(imageName)
        .withNetwork(this.network!)
        .withEnvironment({
          NODE_ENV: 'test',
          AUTOGEN_KEYS: 'false',
          LOG_LEVEL: 'silent',
          NATS_SERVERS: 'nats:4222',
          RUNTIME_NAME: runtimeName,
          ROOTS: `TEMP:/tmp`,
          SYSTEM_KEY: TEST_SYSTEM_KEY,
          REMOTE_PORT: String(runtimePort), // Enable HTTP server for SSE/STREAM transports
          REMOTE_HOST: '0.0.0.0',
        })
        // No exposed ports needed - runtime communicates via NATS
        .withExposedPorts(runtimePort)
        .withWaitStrategy(Wait.forListeningPorts())
        .withStartupTimeout(60000) // 1 minute for startup
        .withLogConsumer((stream) => {
          // Only log ERROR and WARN lines to reduce noise
          stream.on('data', (line) => {
            testLog(`[Runtime] ${line.trim()}`);
          });
          stream.on('err', (line) => testError(`[Runtime ERROR] ${line}`));
        });
      this.services!.runtime = { container };
    }

    this.services!.runtime!.startedContainer = await this.services!.runtime!.container.start();

    // Store mapped port for tests to access
    const runtimeExposedPort = this.services!.runtime!.startedContainer?.getMappedPort(runtimePort);
    process.env.TEST_RUNTIME_PORT = String(runtimeExposedPort);
    testLog(`Runtime HTTP server listening on port ${runtimeExposedPort}`);

    const healthUrl = `http://localhost:${runtimeExposedPort}/health`;
    await waitForHealth(healthUrl);

    return runtimeExposedPort;
  }

  async stopRuntime(): Promise<void> {
    if (this.services?.runtime?.startedContainer) {
      await this.services.runtime.startedContainer.stop({ timeout: 10000 });
      this.services.runtime.startedContainer = undefined;
      delete process.env.TEST_RUNTIME_PORT;
      testLog('Runtime stopped');
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
    testLog('Stopping test environment...');

    const errors: Error[] = [];

    try {
      try {
        await this.stopRuntime();
      } catch (error) {
        testError('Error stopping runtime', error);
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }

      if (this.services?.backend) {
        try {
          await this.services.backend.container.stop({ timeout: 10000 });
          testLog('Backend stopped');
        } catch (error) {
          testError('Error stopping backend', error);
          errors.push(error instanceof Error ? error : new Error(String(error)));
        }
      }

      // Clean up temp JWT keys
      if (this.tempKeyDir) {
        try {
          testLog('Cleaning up temp JWT keys');
          fs.unlinkSync(path.join(this.tempKeyDir, 'private.pem'));
          fs.unlinkSync(path.join(this.tempKeyDir, 'public.pem'));
          fs.rmdirSync(this.tempKeyDir);
          this.tempKeyDir = undefined;
          testLog('Temp JWT keys cleaned up');
        } catch (error) {
          testError('Error cleaning up temp JWT keys', error);
          errors.push(error instanceof Error ? error : new Error(String(error)));
        }
      }

      if (this.services?.dgraphAlpha) {
        try {
          await this.services.dgraphAlpha.container.stop({ timeout: 5000 });
          testLog('Dgraph Alpha stopped');
        } catch (error) {
          testError('Error stopping Dgraph Alpha', error);
          errors.push(error instanceof Error ? error : new Error(String(error)));
        }
      }

      if (this.services?.dgraphZero) {
        try {
          await this.services.dgraphZero.container.stop({ timeout: 5000 });
          testLog('Dgraph Zero stopped');
        } catch (error) {
          testError('Error stopping Dgraph Zero', error);
          errors.push(error instanceof Error ? error : new Error(String(error)));
        }
      }

      if (this.services?.nats) {
        try {
          await this.services.nats.container.stop({ timeout: 5000 });
          testLog('NATS stopped');
        } catch (error) {
          testError('Error stopping NATS', error);
          errors.push(error instanceof Error ? error : new Error(String(error)));
        }
      }

      if (this.network) {
        try {
          await this.network.stop();
          testLog('Network stopped');
        } catch (error) {
          testError('Error stopping network', error);
          errors.push(error instanceof Error ? error : new Error(String(error)));
        }
      }

      this.services = undefined;
      this.network = undefined;

      testLog('Test environment stopped successfully');

      if (errors.length > 0) {
        testError(`Encountered ${errors.length} errors during cleanup`);
        // Don't throw, just log - we want cleanup to complete
      }
    } catch (error) {
      testError('Error stopping test environment', error);
      throw error;
    }
  }
}

export async function startRuntime(): Promise<number> {
  const response = await callRoute<{ status: string; port: number }>(TEST_RUNTIME_ROUTE);
  return response.port;
}

export async function stopRuntime(): Promise<void> {
  await callRoute(TEST_RUNTIME_STOP_ROUTE);
}
