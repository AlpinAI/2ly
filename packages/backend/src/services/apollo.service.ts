import { ApolloServer, BaseContext } from '@apollo/server';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { fastifyApolloDrainPlugin, fastifyApolloHandler } from '@nitra/as-integrations-fastify';
import { injectable, inject } from 'inversify';
import { resolvers } from '../database/resolvers';
import { FastifyService } from './fastify.service';
import { GraphQLSchema } from 'graphql';
import { useServer } from 'graphql-ws/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import pino from 'pino';
import { WebSocketServer } from 'ws';
import { DGraphService } from './dgraph.service';
import { LoggerService } from '@2ly/common';
import { Service } from '@2ly/common';
import path from 'path';
import { readFileSync } from 'fs';
import { GraphQLAuthMiddleware } from '../middleware/graphql-auth.middleware';

export interface GraphQLContext extends BaseContext {
  user?: {
    userId: string;
    email: string;
    workspaceId?: string;
    role?: string;
  };
  req?: {
    ip?: string;
    headers?: { [key: string]: string | string[] | undefined };
  };
}

@injectable()
export class ApolloService extends Service {
  name = 'apollo';
  public readonly apollo: ApolloServer<GraphQLContext>;
  // TODO: correctly tear down the websocket server
  private wsCleanup?: { dispose: () => void | Promise<void> };
  private schema: GraphQLSchema;
  private wsServer: WebSocketServer;

  private logger: pino.Logger;

  constructor(
    @inject(FastifyService) private readonly fastifyService: FastifyService,
    @inject(DGraphService) private readonly dgraphService: DGraphService,
    @inject(LoggerService) private readonly loggerService: LoggerService,
    @inject(GraphQLAuthMiddleware) private readonly authMiddleware: GraphQLAuthMiddleware,
  ) {
    super();
    this.logger = this.loggerService.getLogger('apollo');
    const schemaPath = path.join(__dirname, 'apollo.schema.graphql');
    const schema = readFileSync(schemaPath, 'utf-8');
    // ensure nats is started and connection is established
    const res = resolvers();
    this.apollo = new ApolloServer<GraphQLContext>({
      typeDefs: schema,
      resolvers: res,
      plugins: [
        // Ensure proper shutdown of the server
        fastifyApolloDrainPlugin(this.fastify),
        // Apollo Studio Explorer
        ApolloServerPluginLandingPageLocalDefault({ embed: true }),
      ],
      introspection: true,
    });
    this.schema = makeExecutableSchema({
      typeDefs: schema,
      resolvers: res,
    });
    this.wsServer = new WebSocketServer({
      server: this.fastifyService.fastify.server,
      path: '/graphql-ws',
    });

    this.wsCleanup = useServer({ schema: this.schema }, this.wsServer);
  }

  isRunning(): boolean {
    return this.state === 'STARTED';
  }

  protected async initialize() {
    this.logger.info('Starting');
    await this.startService(this.dgraphService);
    await this.apollo.start();

    // Register WebSocket handler at /graphql-ws to avoid conflict with HTTP /graphql
    // this.fastify.get('/graphql-ws', { websocket: true }, makeHandler({ schema: this.schema }));

    // Mount Apollo Server at /graphql, allow POST for GraphQL requests, GET for Apollo Studio Explorer
    this.fastify.route({
      url: '/graphql',
      method: ['POST', 'GET', 'OPTIONS'],
      handler: fastifyApolloHandler(this.apollo, {
        context: async (request): Promise<GraphQLContext> => {
          // Use the GraphQLAuthMiddleware to create authenticated context
          const authContext = await this.authMiddleware.createContext(request);

          return {
            ...authContext,
            req: {
              ip: request.ip,
              headers: request.headers,
            },
          };
        },
      }),
      // TODO: Restrict CORS for production
      // TODO: Add rate limiting
      // TODO: Add logging
      // TODO: Add error handling
      // TODO: Add JWT authorization
      config: {
        cors: {
          origin: '*',
        },
      },
    });
    await this.startService(this.fastifyService);
  }

  protected async shutdown() {
    this.logger.info('Stopping');
    // closing services that need to be closed for the fastify connection to properly close
    this.wsCleanup?.dispose();
    this.stopService(this.dgraphService);
    this.logger.info('wsCleanup done');
    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 1000));
    const stopPromise = this.apollo.stop();
    const apolloStopPromise = Promise.race([timeoutPromise, stopPromise]);
    await Promise.all([
      this.stopService(this.fastifyService),
      apolloStopPromise,
    ]);
    this.logger.info('Stopped');
  }

  /**
   * Alias for the fastify instance
   */
  private get fastify() {
    return this.fastifyService.fastify;
  }
}
