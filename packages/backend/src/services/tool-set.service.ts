import { inject, injectable } from 'inversify';
import {
  LoggerService,
  NatsErrorMessage,
  NatsMessage,
  NatsService,
  Service,
  UpdateMcpToolsMessage,
  dgraphResolversTypes,
  AckMessage,
  RUNTIME_SUBJECT,
  NatsRequest,
  RuntimeConnectMessage,
  RuntimeReconnectMessage,
} from '@2ly/common';
import { DGraphService } from './dgraph.service';
import pino from 'pino';

import { RuntimeInstance } from './runtime.instance';
import {
  WorkspaceRepository,
  SystemRepository,
  ToolSetRepository,
} from '../repositories';
import { gql } from 'urql';

export const DROP_ALL_DATA = 'dropAllData';

@injectable()
export class ToolSetService extends Service {
  name = 'tool-set';
  private logger: pino.Logger;

  constructor(
    @inject(LoggerService) private loggerService: LoggerService,
    @inject(DGraphService) private dgraphService: DGraphService,
    @inject(NatsService) private natsService: NatsService,
    @inject(ToolSetRepository) private toolSetRepository: ToolSetRepository,
    @inject(WorkspaceRepository) private workspaceRepository: WorkspaceRepository,
    @inject(SystemRepository) private systemRepository: SystemRepository,
  ) {
    super();
    this.logger = this.loggerService.getLogger(this.name);
  }

  protected async initialize() {
    this.logger.info('Starting');
    await this.startService(this.dgraphService);
    await this.startService(this.natsService);
  }

  protected async shutdown() {
    this.logger.info('Stopping');
    await this.stopService(this.natsService);
    await this.stopService(this.dgraphService);
  }

  /**
   * Subscribe to all the tool sets of the database and keep the NATS KV up-to-date.
   * TODO: this pattern is not resilient for high volume but is designed to test the tool-set concept quickly.
   */
  private async subscribeToToolSet() {
    
  }
}
