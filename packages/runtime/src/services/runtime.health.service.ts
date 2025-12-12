import { inject, injectable } from 'inversify';
import pino from 'pino';
import { LoggerService, NatsService, Service, NatsCacheService, CACHE_BUCKETS } from '@skilder-ai/common';
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
    @inject(NatsCacheService) private cacheService: NatsCacheService,
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

    // Start the cache service and create heartbeat bucket
    await this.startService(this.cacheService);

    // Send initial heartbeat
    await this.sendHeartbeat(identity.id!);

    this.heartbeatIntervalRef = setInterval(async () => {
      if (!this.authService.getIdentity()) {
        // ignore
        return;
      }
      await this.sendHeartbeat(identity.id!);
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
    await this.cacheService.delete(CACHE_BUCKETS.HEARTBEAT, identity.id!);
    await this.stopService(this.cacheService);
  }

  private async sendHeartbeat(id: string): Promise<void> {
    await this.cacheService.put(CACHE_BUCKETS.HEARTBEAT, id, {
      i: id,
      t: Date.now().toString(),
    });
  }
}
