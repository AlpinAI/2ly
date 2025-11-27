import { inject, injectable } from 'inversify';
import pino from 'pino';
import {
  LoggerService,
  Service,
} from '@2ly/common';
import { ToolClientService } from './tool.client.service';
import { HealthService } from './runtime.health.service';

@injectable()
export class ToolService extends Service {
  name = 'tool';
  private logger: pino.Logger;

  constructor(
    @inject(LoggerService) private loggerService: LoggerService,
    @inject(ToolClientService) private toolClientService: ToolClientService,
    @inject(HealthService) private healthService: HealthService,
  ) {
    super();
    this.logger = this.loggerService.getLogger(this.name);
  }

  protected async initialize() {
    this.logger.info('Starting');
    await this.healthService.waitForStarted();
    await this.startService(this.toolClientService);
  }

  protected async shutdown() {
    this.logger.info('Stopping');
    await this.stopService(this.toolClientService);
  }
}
