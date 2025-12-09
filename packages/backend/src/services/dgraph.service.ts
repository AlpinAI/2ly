import { inject, injectable } from 'inversify';
import { LoggerService, Service } from '@skilder-ai/common';
import pino from 'pino';
import path from 'path';
import { readFileSync } from 'fs';
import {
  Client,
  subscriptionExchange,
  fetchExchange,
  DocumentInput,
  AnyVariables,
  OperationContext,
  OperationResult,
} from 'urql';
import { Observable } from 'rxjs';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { v4 as uuidv4 } from 'uuid';
import { latestValueFrom } from 'rxjs-for-await';

export const DGRAPH_URL = 'dgraphUrl';

@injectable()
export class DGraphService extends Service {
  name = 'dgraph';
  private logger: pino.Logger;
  private subscriptionClient?: SubscriptionClient;
  private urqlClient?: Client;

  constructor(
    @inject(LoggerService) private loggerService: LoggerService,
    @inject(DGRAPH_URL) private readonly dgraphUrl: string,
  ) {
    super();
    this.logger = this.loggerService.getLogger(this.name);

  }

  isConnected(): boolean {
    return this.state === 'STARTED';
  }

  protected async initialize() {
    this.logger.info('Starting');
    try {
      this.logger.info(`Connecting to DGraph at: ${this.dgraphUrl}`);
      this.logger.debug(`Initializing urqlClient with URL: http://${this.dgraphUrl}/graphql`);
      this.subscriptionClient = new SubscriptionClient(`ws://${this.dgraphUrl}/graphql`, {
        reconnect: true,
        //connectionParams: {headers: {'X-Auth-Token': '1234567890'}},
      });
      this.urqlClient = new Client({
        url: `http://${this.dgraphUrl}/graphql`,
        exchanges: [
          subscriptionExchange({
            forwardSubscription: (operation) => this.subscriptionClient!.request(operation),
          }),
          fetchExchange,
        ],
      });
      this.logger.debug('urqlClient initialized successfully');
    } catch (error) {
      this.logger.error(`Error connecting to DGraph: ${error}`);
      throw error;
    }
  }

  async initSchema(dropAll: boolean = false) {
    this.logger.info('Initializing schema');
    if (dropAll) {
      await this.dropAll();
    }
    await this.initGraphQLSchema();
  }

  protected async shutdown() {
    this.logger.info('Stopping');
    this.subscriptionClient?.close();
    this.subscriptionClient = undefined;
    this.urqlClient = undefined;
    this.logger.info('Stopped');
  }

  private async initGraphQLSchema() {
    const schemaPath = path.join(__dirname, 'dgraph.schema.graphql');
    const schema = readFileSync(schemaPath, 'utf-8').replace('scalar DateTime', '');
    const url = `http://${this.dgraphUrl}`;
    try {
      const response = await fetch(`${url}/admin/schema`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/graphql',
        },
        body: schema,
      });

      const result = await response.json();

      if (response.ok && !result.error && !result.errors) {
        this.logger.info(`✅ Schema pushed successfully`);
      } else {
        this.logger.error(`❌ Failed to push schema: ${JSON.stringify(result, null, 2)}`);
      }
    } catch (error) {
      this.logger.error(`❌ Init schema network or parsing error: ${JSON.stringify(error, null, 2)}`);
    }
  }

  async dropAll() {
    this.logger.info('Dropping all data');
    const url = `http://${this.dgraphUrl}`;
    try {
      const response = await fetch(`${url}/alter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ drop_all: true }),
      });

      const result = await response.json();

      if (response.ok && !result.error && !result.errors) {
        this.logger.info(`✅ Drop all successful`);
      } else {
        this.logger.error(`❌ Failed to drop all: ${JSON.stringify(result, null, 2)}`);
      }
    } catch (error) {
      this.logger.error(`❌ Drop all network or parsing error: ${JSON.stringify(error, null, 2)}`);
    }
  }

  async query<T, Variables extends AnyVariables = AnyVariables>(
    query: DocumentInput<T, Variables>,
    variables: Variables,
    context?: Partial<OperationContext>,
  ): Promise<T> {
    if (!this.urqlClient) {
      throw new Error('urqlClient not initialized');
    }
    const result = await this.urqlClient.query(query, variables, context);
    if (result.error) {
      this.logger.error(`DGraph query error: ${result.error}`);
      if (process.env.NODE_ENV === 'development') {
        const queryString = typeof query === 'string' ? query : query.loc?.source.body;
        this.logger.error(`Query: ${queryString}`);
        this.logger.error(`Variables: ${JSON.stringify(variables, null, 2)}`);
      }
      throw result.error;
    }
    return result.data as T;
  }

  async mutation<T, Variables extends AnyVariables = AnyVariables>(
    mutation: DocumentInput<T, Variables>,
    variables: Variables,
    context?: Partial<OperationContext>,
  ): Promise<T> {
    if (!this.urqlClient) {
      throw new Error('urqlClient not initialized');
    }
    const result = await this.urqlClient.mutation(mutation, variables, context);
    if (result.error) {
      this.logger.error(`DGraph mutation error: ${result.error}`);
      if (process.env.NODE_ENV === 'development') {
        const mutationString = typeof mutation === 'string' ? mutation : mutation.loc?.source.body;
        this.logger.error(`Mutation: ${mutationString}`);
        this.logger.error(`Variables: ${JSON.stringify(variables, null, 2)}`);
      }
      throw result.error;
    }
    return result.data as T;
  }

  observe<T, Variables extends AnyVariables = AnyVariables>(
    query: DocumentInput<T, Variables>,
    variables: Variables,
    key: string,
    initialFetch: boolean = false,
  ): Observable<T> {
    if (!this.urqlClient) {
      throw new Error('urqlClient not initialized');
    }
    const subId = uuidv4();
    this.logger.debug(
      `Observing with subId: ${subId}: ${JSON.stringify(typeof query === 'object' && query.loc?.source.body ? query.loc.source.body : query, null, 2)}`,
    );
    const observable = new Observable((observer) => {
      let receivedChange = false;

      const handleResult = (result: OperationResult<T, Variables>) => {
        if (result.error) {
          observer.error(result.error);
          return;
        }
        if (!result.data || typeof result.data !== 'object') {
          observer.error(new Error('Invalid subscription data'));
          return;
        }

        const data = result.data as Record<string, unknown>;
        if (!(key in data)) {
          observer.error(new Error(`Key ${key} not found in subscription data`));
          return;
        }
        observer.next(data[key] as T);
      };

      if (initialFetch && typeof query === 'object' && query.loc?.source.body) {
        const strQuery = query.loc.source.body;
        const fetchQuery = strQuery.replace('subscription', 'query');
        this.logger.debug(`Initial fetch for subId: ${subId}: ${fetchQuery}`);
        this.urqlClient!.query(fetchQuery, variables).then((result: OperationResult<T, Variables>) => {
          this.logger.debug(`Initial fetch result for subId: ${subId}: ${JSON.stringify(result.data, null, 2)}`);
          if (receivedChange) {
            this.logger.debug(
              `Initial fetch result ignored since we have already received a change for subId: ${subId}`,
            );
            return;
          }

          handleResult(result);
        });
      }

      const subscription = this.urqlClient!.subscription(query, variables);
      const { unsubscribe } = subscription.subscribe((result) => {
        this.logger.debug(`Subscription result for subId: ${subId}: ${JSON.stringify(result.data, null, 2)}`);
        handleResult(result);
        receivedChange = true;
      });
      return () => {
        this.logger.debug(`Unsubscribing subId: ${subId}`);
        unsubscribe();
      };
    });

    return observable as Observable<T>;
  }

  observeIterator<T, Variables extends AnyVariables = AnyVariables>(
    query: DocumentInput<T, Variables>,
    variables: Variables,
    key: string,
  ): AsyncGenerator<T> {
    return latestValueFrom(this.observe(query, variables, key));
  }
}
