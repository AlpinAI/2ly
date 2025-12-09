import Fastify, { FastifyInstance } from 'fastify';
import { inject, injectable } from 'inversify';
import pino from 'pino';
import { LoggerService, Service } from '@skilder-ai/common';
import { SecurityMiddleware } from '../middleware/security.middleware';
import { RateLimitMiddleware } from '../middleware/rate-limit.middleware';

@injectable()
export class FastifyService extends Service {
  name = 'fastify';
  private logger: pino.Logger;
  public readonly fastify: FastifyInstance;
  constructor(
    @inject(LoggerService) private loggerService: LoggerService,
    @inject(SecurityMiddleware) private securityMiddleware: SecurityMiddleware,
    @inject(RateLimitMiddleware) private rateLimitMiddleware: RateLimitMiddleware,
  ) {
    super();
    this.logger = this.loggerService.getLogger(this.name);
    this.fastify = Fastify();
  }

  protected async initialize() {
    this.logger.info('Starting Fastify server');

    // Register middleware
    await this.securityMiddleware.register(this.fastify);
    await this.rateLimitMiddleware.register(this.fastify);

    this.fastify.listen({ port: 3000, host: '0.0.0.0' }, () => {
      this.logger.info('Server is running on port 3000 🚀');
    });
  }

  protected async shutdown() {
    this.logger.info('Stopping Fastify server');
    this.fastify.server.close();
    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 1000));
    const closePromise = this.fastify.close();
    await Promise.race([timeoutPromise, closePromise]);
    this.logger.info('Fastify server stopped');
  }
}
