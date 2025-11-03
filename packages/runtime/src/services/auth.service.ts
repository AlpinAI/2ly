import { inject, injectable } from 'inversify';
import { getHostIP } from '../utils';
import os from 'os';
import { LoggerService, NatsService, RootIdentity, Service } from '@2ly/common';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';

/**
 * Credentials for authentication and authorization
 */
export interface RuntimeCredentials {
  accessToken?: string;
  natsJwt?: string;
  toolsetId: string | null;
  runtimeId: string | null;
}

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

  protected workspaceId!: string;

  // Identity properties
  protected toolsetId: string | null = null;
  protected runtimeId: string | null = null;
  

  // Auth token properties (in-memory only, for long-lived process)
  protected masterKey?: string;
  protected toolsetKey?: string;
  protected toolsetName?: string;
  protected runtimeKey?: string;
  protected runtimeName?: string;
  protected accessToken?: string;
  protected natsJwt?: string;

  private logger: pino.Logger;

  constructor(
    @inject(LoggerService) private loggerService: LoggerService,
    @inject(NatsService) private natsService: NatsService,
  ) {
    super();
    this.logger = this.loggerService.getLogger(this.name);
    this.parseEnvironmentVariables();
  }

  /**
   * Parse and validate environment variables for authentication
   * Validates that at least one authentication method is provided
   */
  private parseEnvironmentVariables() {
    const masterKey = process.env.MASTER_KEY;
    const toolsetName = process.env.TOOLSET_NAME;
    const toolsetKey = process.env.TOOLSET_KEY;

    // Store credentials if present
    if (masterKey) {
      this.masterKey = masterKey;
      this.toolsetName = toolsetName; // May be undefined, that's OK
    }

    if (toolsetKey) {
      this.toolsetKey = toolsetKey;
    }

    // Validate that at least one auth method is provided (when not in standalone mode)
    // Note: In standalone MCP stream mode, no auth is required
    const isStandaloneMcpStream = !process.env.TOOL_SET && !process.env.RUNTIME_NAME && process.env.REMOTE_PORT;

    if (!isStandaloneMcpStream && !this.masterKey && !this.toolsetKey) {
      this.logger.warn('No authentication credentials found in environment variables (MASTER_KEY or TOOLSET_KEY)');
    }
  }

  protected async initialize() {
    this.logger.info('Starting');
    await this.startService(this.natsService);
  }

  protected async shutdown() {
    this.logger.info('Stopping');
    await this.stopService(this.natsService);
  }

  // Identity methods (migrated from IdentityService)

  getToolsetId() {
    return this.toolsetId;
  }

  getRuntimeId() {
    return this.runtimeId;
  }

  getIdentity(): RootIdentity {
    this.startedAt = this.startedAt ?? new Date().toISOString();
    return {
      id: this.runtimeId,
      RID: this.runtimeId,
      processId: process.pid.toString() ?? uuidv4(),
      workspaceId: this.workspaceId,
      name: this.runtimeName || this.toolsetName || 'DEFAULT',
      // TODO: get version from package.json
      version: '1.0.0',
      hostIP: getHostIP(),
      hostname: os.hostname(),
      metadata: {
        platform: os.platform(),
        arch: os.arch(),
        node_version: process.version,
      },
    };
  }

  // Auth methods (new functionality)

  /**
   * Set authentication credentials
   * Used after successful authentication/handshake
   */
  setCredentials(credentials: Partial<RuntimeCredentials>) {
    if (credentials.accessToken !== undefined) {
      this.accessToken = credentials.accessToken;
    }
    if (credentials.natsJwt !== undefined) {
      this.natsJwt = credentials.natsJwt;
    }
    if (credentials.toolsetId !== undefined) {
      this.toolsetId = credentials.toolsetId;
    }
    if (credentials.runtimeId !== undefined) {
      this.runtimeId = credentials.runtimeId;
    }
  }

  /**
   * Get current authentication tokens
   */
  getTokens(): RuntimeCredentials {
    return {
      accessToken: this.accessToken,
      natsJwt: this.natsJwt,
      toolsetId: this.toolsetId,
      runtimeId: this.runtimeId,
    };
  }

  /**
   * Check if runtime has valid authentication
   * Returns true if at least one auth method is present
   */
  hasValidAuth(): boolean {
    return !!(this.masterKey || this.toolsetKey || this.accessToken);
  }

  /**
   * Get master key (if available)
   * Only for internal use during authentication
   */
  getMasterKey(): string | undefined {
    return this.masterKey;
  }

  /**
   * Get toolset key (if available)
   * Only for internal use during authentication
   */
  getToolsetKey(): string | undefined {
    return this.toolsetKey;
  }

  /**
   * Get toolset name (if provided with master key)
   */
  getToolsetName(): string | undefined {
    return this.toolsetName;
  }
}
