import { inject, injectable } from 'inversify';
import pino from 'pino';
import { LoggerService, NatsService, Service } from '@2ly/common';
import { AuthService } from './auth.service';

export const HEARTBEAT_INTERVAL = 'heartbeat.interval';

@injectable()
export class HealthService extends Service {
  name = 'health';
  private logger: pino.Logger;
  private heartbeatIntervalRef: NodeJS.Timeout | null = null;

  @inject(HEARTBEAT_INTERVAL)
  private heartbeatInterval!: number;

  constructor(
    @inject(LoggerService) private loggerService: LoggerService,
    @inject(NatsService) private natsService: NatsService,
    @inject(AuthService) private authService: AuthService,
  ) {
    super();
    this.logger = this.loggerService.getLogger(this.name);
  }

  protected async initialize() {
    const identity = this.authService.getIdentity();
    if (!identity) {
      throw new Error('Identity not set');
    }
    if (!this.natsService.isConnected()) {
      throw new Error('NATS not connected');
    }
    this.logger.info('Starting');
    this.natsService.heartbeat(identity.id!, {});
    this.heartbeatIntervalRef = setInterval(async () => {
      if (!this.authService.getIdentity()) {
        // ignore
        return;
      }
      this.natsService.heartbeat(identity.id!, {});
    }, this.heartbeatInterval);
    this.logger.info(`Heartbeat started for ${identity.nature} ${identity.id}`);
  }

  protected async shutdown() {
    this.logger.info('Stopping');
    if (this.heartbeatIntervalRef) {
      clearInterval(this.heartbeatIntervalRef);
    }
    const identity = this.authService.getIdentity();
    this.logger.info(`Heartbeat stopped for ${identity?.nature ?? 'unknown nature'} ${identity?.id ?? 'unknown id'}`);
    if (!identity) {
      return;
    }
    this.natsService.kill(identity.id!);
  }
}
