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
    if (!identity.RID) {
      throw new Error('RID not set');
    }
    if (!this.natsService.isConnected()) {
      throw new Error('NATS not connected');
    }
    this.logger.info('Starting');
    this.natsService.heartbeat(identity.RID, {});
    this.heartbeatIntervalRef = setInterval(async () => {
      const RID = this.authService.getIdentity()?.RID;
      if (!RID) {
        // ignore
        return;
      }
      this.natsService.heartbeat(RID, {});
    }, this.heartbeatInterval);
  }

  protected async shutdown() {
    this.logger.info('Stopping');
    if (this.heartbeatIntervalRef) {
      clearInterval(this.heartbeatIntervalRef);
    }
    const RID = this.authService.getIdentity()?.RID;
    if (RID) {
      this.natsService.kill(RID);
    }
  }
}
