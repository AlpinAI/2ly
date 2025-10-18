import { inject, injectable } from 'inversify';
import pino from 'pino';
import {
  LoggerService,
  NatsService,
  SetRootsMessage,
  AckMessage,
  Service,
  SetGlobalRuntimeMessage,
} from '@2ly/common';
import { ToolClientService } from './tool.client.service';
import fs from 'fs';
import { HealthService } from './runtime.health.service';
import { IdentityService } from './identity.service';

export const ROOTS = 'ROOTS';
export const GLOBAL_RUNTIME = 'GLOBAL_RUNTIME';

@injectable()
export class ToolService extends Service {
  name = 'tool';
  private logger: pino.Logger;

  @inject(ROOTS) private roots!: string | undefined;
  @inject(GLOBAL_RUNTIME) private globalRuntime!: boolean;

  constructor(
    @inject(LoggerService) private loggerService: LoggerService,
    @inject(ToolClientService) private toolClientService: ToolClientService,
    @inject(IdentityService) private identityService: IdentityService,
    @inject(HealthService) private healthService: HealthService,
    @inject(NatsService) private natsService: NatsService,
  ) {
    super();
    this.logger = this.loggerService.getLogger(this.name);
  }

  protected async initialize() {
    this.logger.info('Starting');
    await this.startService(this.identityService);
    await this.healthService.waitForStarted();
    await this.startService(this.toolClientService);
    this.setRoots();
    this.setGlobalRuntime();
  }

  protected async shutdown() {
    this.logger.info('Stopping');
    await this.stopService(this.toolClientService);
    await this.stopService(this.identityService);
  }

  private async setRoots() {
    if (this.roots) {
      const identity = this.identityService.getIdentity();
      if (!identity.RID) {
        throw new Error('Cannot set roots without RID');
      }
      const roots = this.roots.split(',');
      // validate each root
      for (const root of roots) {
        if (!root.includes(':')) {
          throw new Error(`Invalid root: ${root} (should be in the format name:path)`);
        }
        const [name, uri] = root.split(':');
        // check if file exist
        if (!fs.existsSync(uri)) {
          throw new Error(`Invalid root: ${name}:${uri} (file does not exist)`);
        }
        // check if file is a directory
        if (!fs.statSync(uri).isDirectory()) {
          throw new Error(`Invalid root: ${name}:${uri} (file is not a directory)`);
        }
      }

      const validatedRoots = this.roots
        ? this.roots.split(',').map((root) => {
            const [name, uri] = root.split(':');
            return { name, uri: `file://${uri}` };
          })
        : undefined;

      const message = SetRootsMessage.create({ RID: identity.RID, roots: validatedRoots! }) as SetRootsMessage;
      const response = await this.natsService.request(message);
      if (response instanceof AckMessage) {
        this.logger.info('MCP roots set successfully');
      } else {
        throw new Error('Failed to set MCP roots');
      }
    }
  }

  private async setGlobalRuntime() {
    if (this.globalRuntime) {
      const identity = this.identityService.getIdentity();
      if (!identity.RID) {
        throw new Error('Cannot set global runtime without RID');
      }
      this.logger.info('Setting global runtime');
      const message = SetGlobalRuntimeMessage.create({ RID: identity.RID }) as SetGlobalRuntimeMessage;
      const response = await this.natsService.request(message);
      if (response instanceof AckMessage) {
        this.logger.info('Global runtime set successfully');
      } else {
        throw new Error('Failed to set global runtime');
      }
    }
  }

}
