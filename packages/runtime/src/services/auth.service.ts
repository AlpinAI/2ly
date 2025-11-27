import { inject, injectable } from 'inversify';
import { getHostIP } from '../utils';
import os from 'os';
import { LoggerService, NatsService, RootIdentity, Service, HandshakeRequest, HandshakeResponse, ErrorResponse } from '@2ly/common';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';
import fs from 'fs';

export class PermanentAuthenticationError extends Error {};

/**
 * AuthService manages both runtime identity and authentication credentials.
 *
 * Responsibilities:
 * - Authentication:
 *   - login with master key (workspace-level) or toolset/runtime level key
 * - Identity:
 *   - retrieve runtime id and toolset id (depending on the active services)
 * - Auth tokens: masterKey, toolsetKey, accessToken, natsJwt, toolsetId
 * - Provide metadata during handshake: PID, hostname, host IP, platform info
 *
 * Environment variables (read-only, not stored):
 * - MASTER_KEY (workspace-level access)
 *   - require RUNTIME_NAME or TOOL-SET to be set
 * - TOOLSET_KEY (toolset-level access, toolset name will be implied by the key upon auth)
 * - RUNTIME_KEY (runtime-level access, runtime name will be implied by the key upon auth)
*/
@injectable()
export class AuthService extends Service {
  name = 'auth';

  // Identity properties
  protected identity: RootIdentity | null = null;

  private logger: pino.Logger;

  constructor(
    @inject(LoggerService) private loggerService: LoggerService,
    @inject(NatsService) private natsService: NatsService,
  ) {
    super();
    this.logger = this.loggerService.getLogger(this.name);
  }

  protected async initialize() {
    this.logger.info('Starting');
    await this.startService(this.natsService);
    try {
      await this.handshake();
    } catch (error) {
      this.logger.error(`Failed to handshake: ${error}`);
      await this.stopService(this.natsService);
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Detect permanent authentication failures that should not retry
      const isPermanentAuthFailure = errorMessage.includes('AUTHENTICATION_FAILED');
      
      if (isPermanentAuthFailure) {
        throw new PermanentAuthenticationError(errorMessage);
      }
      throw error;
    }
  }

  protected async shutdown() {
    this.logger.info('Stopping');
    await this.stopService(this.natsService);
    this.logger.info('Stopped');
  }

  private prepareHandshakeRequest(): HandshakeRequest {
    // The DI already validates the mutually exclusive keys
    const key = process.env.MASTER_KEY || process.env.TOOLSET_KEY || process.env.RUNTIME_KEY;
    if (!key) {
      throw new Error(
        'No key found in environment variables. Runtime requires MASTER_KEY, TOOLSET_KEY, or RUNTIME_KEY to operate.'
      );
    }
    const nature = process.env.RUNTIME_NAME ? 'runtime' : process.env.TOOLSET_NAME ? 'toolset' : undefined;
    const roots = this.prepareRoots();
    const handshake = new HandshakeRequest({
      key,
      nature,
      name: process.env.RUNTIME_NAME || process.env.TOOLSET_NAME || undefined,
      pid: process.pid.toString() ?? uuidv4(),
      hostIP: getHostIP(),
      hostname: os.hostname(),
      roots,
    });
    return handshake;
  }

  private prepareRoots(): { name: string; uri: string }[] | undefined {
    const envRoots = process.env.ROOTS;
    if (!envRoots) {
      return undefined;
    }
    this.logger.info(`Preparing roots from environment variable: ${envRoots}`);
    // validate each root
    for (const root of envRoots.split(',')) {
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

    return envRoots.split(',').map((root) => {
      const [name, uri] = root.split(':');
      return { name, uri: `file://${uri}` };
    });
  }

  private async handshake() {
    const handshakeRequest = this.prepareHandshakeRequest();
    this.logger.info(`Sending handshake request: ${JSON.stringify(handshakeRequest.data)}`);
    const handshakeResponse = await this.natsService.request(handshakeRequest);
    this.logger.info(`Handshake response received: ${JSON.stringify(handshakeResponse.data)}`);
    if (handshakeResponse instanceof HandshakeResponse) {
      this.identity = {
        nature: handshakeResponse.data.nature,
        id: handshakeResponse.data.id,
        name: handshakeResponse.data.name,
        workspaceId: handshakeResponse.data.workspaceId,
      };
    } else if (handshakeResponse instanceof ErrorResponse) {
      this.logger.error(`Handshake error message: ${handshakeResponse.data.error}`);
      throw new Error(handshakeResponse.data.error);
    } else {
      this.logger.error(`Invalid handshake response received: ${JSON.stringify(handshakeResponse.data)}`);
      throw new Error('Invalid handshake response received');
    }
  }

  getIdentity(): RootIdentity | null {
    return this.identity ?? null;
  }
}
