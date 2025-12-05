import { inject, injectable } from 'inversify';
import pino from 'pino';
import { LoggerService, Service } from '@2ly/common';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';

/**
 * FastifyManagerService manages the shared Fastify instance and MCP Server.
 * This singleton service owns the HTTP server and port binding, allowing multiple
 * transport services (SSE, Streamable HTTP) to register routes on the same instance.
 */
@injectable()
export class FastifyManagerService extends Service {
  name = 'fastify.manager';
  private logger: pino.Logger;
  private fastifyInstance: FastifyInstance | undefined;
  private server: Server | undefined;
  private port: number | undefined;
  private isListening = false;

  constructor(@inject(LoggerService) private loggerService: LoggerService) {
    super();
    this.logger = this.loggerService.getLogger(this.name);
  }

  protected async initialize() {
    const remotePort = process.env.REMOTE_PORT;
    if (!remotePort) {
      this.logger.warn('REMOTE_PORT is not set, Fastify manager will not start');
      return;
    }

    this.logger.info('Starting Fastify manager service');

    // Create MCP Server instance (shared by all transports)
    this.server = new Server(
      {
        name: 'Remote 2LY Server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {
            listChanged: true,
          },
        },
      },
    );

    // Create Fastify instance (but don't listen yet - routes will be registered first)
    await this.setupFastifyInstance();

    // Store port for later use
    this.port = parseInt(remotePort);
  }

  /**
   * Start listening on the configured port.
   * This should be called AFTER all routes have been registered by transport services.
   */
  async startListening(): Promise<void> {
    if (!this.fastifyInstance) {
      throw new Error('Fastify instance not initialized');
    }

    if (!this.port) {
      throw new Error('Port not configured');
    }

    if (this.isListening) {
      this.logger.warn('Fastify is already listening');
      return;
    }

    try {
      await this.fastifyInstance.listen({ port: this.port, host: '0.0.0.0' });
      this.isListening = true;
      this.logger.info(`Fastify server listening on port ${this.port}`);
    } catch (error) {
      this.logger.error(`Failed to start Fastify server: ${error}`);
      throw error;
    }
  }

  protected async shutdown() {
    this.logger.info('Stopping Fastify manager service');

    // Close MCP Server
    if (this.server) {
      await this.server.close();
      this.server = undefined;
    }

    // Close Fastify instance
    if (this.fastifyInstance) {
      await this.fastifyInstance.close();
      this.fastifyInstance = undefined;
    }
  }

  /**
   * Returns the shared Fastify instance for route registration
   */
  getInstance(): FastifyInstance {
    if (!this.fastifyInstance) {
      throw new Error('Fastify instance not initialized. Ensure FastifyManagerService is started first.');
    }
    return this.fastifyInstance;
  }

  /**
   * Returns the shared MCP Server instance
   */
  getServer(): Server {
    if (!this.server) {
      throw new Error('MCP Server not initialized. Ensure FastifyManagerService is started first.');
    }
    return this.server;
  }

  private async setupFastifyInstance() {
    this.logger.info('Setting up Fastify instance');

    this.fastifyInstance = fastify({
      logger: false,
      // Allow empty JSON bodies for DELETE requests (MCP Inspector sends Content-Type: application/json with empty body)
      bodyLimit: 1048576,
    });

    // Override JSON parser to allow empty bodies
    this.fastifyInstance.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
      try {
        const json = body === '' ? {} : JSON.parse(body as string);
        done(null, json);
      } catch (err: unknown) {
        done(err instanceof Error ? err : new Error(String(err)), undefined);
      }
    });

    // Register CORS plugin
    await this.fastifyInstance.register(cors, {
      origin: true, // Reflects the request origin back, allowing any origin with credentials
      credentials: true, // Allow credentials (cookies, authorization headers, etc.)
      methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'], // Explicitly allow methods including GET for SSE
      exposedHeaders: ['mcp-session-id'],
      allowedHeaders: [
        'Content-Type',
        'mcp-session-id',
        'mcp-protocol-version',
        'workspace_key',
        'skill_key',
        'skill_name',
        'x-custom-auth-headers',
      ],
    });

    this.fastifyInstance.get('/health', (req, res) => {
      res.send({ status: 'ok' });
    });

    this.logger.info('Fastify instance configured (not listening yet)');
  }
}
