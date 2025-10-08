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
import * as fs from 'fs';
import * as path from 'path';

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
  private config: Required<TestEnvironmentConfig>;

  constructor(config: TestEnvironmentConfig = {}) {
    this.config = {
      exposeToHost: config.exposeToHost ?? true,
      startBackend: config.startBackend ?? true,
      projectRoot: config.projectRoot ?? findProjectRoot(),
      backendEnv: config.backendEnv ?? {},
      logging: {
        enabled: config.logging?.enabled ?? false,
        verbose: config.logging?.verbose ?? false,
      },
    };
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
   * Start all test environment services
   */
  async start(): Promise<TestEnvironmentServices> {
    this.log('Starting test environment...');

    // Create network for container communication
    this.network = await new Network().start();
    this.log('Network created', { networkId: this.network.getId() });

    // Start services in dependency order
    const natsContainer = await this.startNats();
    const dgraphZero = await this.startDgraphZero();
    const dgraphAlpha = await this.startDgraphAlpha(dgraphZero);

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

    return { container, grpcUrl, httpUrl };
  }

  /**
   * Start Dgraph Alpha (data node)
   */
  private async startDgraphAlpha(
    dgraphZero: TestEnvironmentServices['dgraphZero']
  ): Promise<TestEnvironmentServices['dgraphAlpha']> {
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

    // Wait longer to ensure Dgraph is fully ready for connections
    // Dgraph Alpha needs time to connect to Zero and initialize
    this.log('Waiting for Dgraph Alpha to fully initialize...');
    await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 seconds

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
    this.log('  nats', this.services.nats.clientUrl);
    this.log('  dgraph', this.services.dgraphAlpha.graphqlUrl);

    const encryptionKey = 'test-encryption-key-for-playwright-integration-tests-minimum-32-chars';

    this.log('Building backend Docker image...', { projectRoot: this.config.projectRoot });

    // Build the Docker image first
    const builtImage = await GenericContainer.fromDockerfile(
      this.config.projectRoot,
      'packages/backend/Dockerfile'
    ).build();

    // Then create and configure the container
    let started;
    try {
      started = await builtImage
        .withNetwork(this.network!)
        .withNetworkAliases('backend')
        .withEnvironment({
          NODE_ENV: 'test',
          DGRAPH_URL: 'dgraph-alpha:8080',
          NATS_SERVERS: 'nats:4222',
          EXPOSED_NATS_SERVERS: this.services.nats.clientUrl,
          ENCRYPTION_KEY: encryptionKey,
          ...this.config.backendEnv,
        })
        .withExposedPorts(...(this.config.exposeToHost ? [3000] : []))
        // Wait for HTTP port (backend Dockerfile has curl for healthcheck)
        .withWaitStrategy(Wait.forListeningPorts())
        .withStartupTimeout(120000) // 2 minutes for startup
        .withLogConsumer((stream) => {
          stream.on('data', (line) => this.log(`[Backend] ${line}`));
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

    try {
      if (this.services?.backend) {
        await this.services.backend.container.stop();
        this.log('Backend stopped');
      }

      if (this.services?.dgraphAlpha) {
        await this.services.dgraphAlpha.container.stop();
        this.log('Dgraph Alpha stopped');
      }

      if (this.services?.dgraphZero) {
        await this.services.dgraphZero.container.stop();
        this.log('Dgraph Zero stopped');
      }

      if (this.services?.nats) {
        await this.services.nats.container.stop();
        this.log('NATS stopped');
      }

      if (this.network) {
        await this.network.stop();
        this.log('Network stopped');
      }

      this.services = undefined;
      this.network = undefined;

      this.log('Test environment stopped successfully');
    } catch (error) {
      this.log('Error stopping test environment', error);
      throw error;
    }
  }
}
