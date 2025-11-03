import { inject, injectable } from 'inversify';
import { getHostIP } from '../utils';
import os from 'os';
import { LoggerService, NatsService, RootIdentity, Service } from '@2ly/common';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';

export const IDENTITY_NAME = 'identity.name';
export const WORKSPACE_ID = 'workspace.id';
export const AGENT_CAPABILITY = 'agent.capability';
export const TOOL_CAPABILITY = 'tool.capability';

/**
 * Credentials for authentication and authorization
 */
export interface RuntimeCredentials {
  accessToken?: string;
  natsJwt?: string;
  toolsetId?: string;
}

/**
 * AuthService manages both runtime identity and authentication credentials.
 *
 * Responsibilities:
 * - Identity: id, RID, workspaceId, name, capabilities
 * - Auth tokens: masterKey, toolsetKey, accessToken, natsJwt, toolsetId
 * - Process metadata: PID, hostname, host IP, platform info
 *
 * Environment variables (read-only, not stored):
 * - MASTER_KEY + TOOLSET_NAME (workspace-level access)
 * - TOOLSET_KEY (toolset-level access)
 */
@injectable()
export class AuthService extends Service {
  name = 'auth';

  @inject(IDENTITY_NAME)
  protected identityName!: string;

  @inject(WORKSPACE_ID)
  protected workspaceId!: string;

  @inject(AGENT_CAPABILITY)
  protected agentCapability: boolean | 'auto' = 'auto';

  @inject(TOOL_CAPABILITY)
  protected toolCapability: boolean = true;

  // Identity properties
  protected id: string | null = null;
  protected RID: string | null = null;

  // Auth token properties (in-memory only, for long-lived process)
  protected masterKey?: string;
  protected toolsetKey?: string;
  protected toolsetName?: string;
  protected accessToken?: string;
  protected natsJwt?: string;
  protected toolsetId?: string;

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

  getId() {
    return this.id;
  }

  getAgentCapability() {
    return this.agentCapability;
  }

  getToolCapability() {
    return this.toolCapability;
  }

  setId(id: string, RID: string, workspaceId: string) {
    this.id = id;
    this.RID = RID;
    this.workspaceId = workspaceId;
  }

  clearIdentity() {
    this.logger.info('Clearing identity (id, RID, workspaceId)');
    this.id = null;
    this.RID = null;
    // TODO: this value should come from the DI
    this.workspaceId = process.env.WORKSPACE_ID || 'DEFAULT';
  }

  getIdentity(): RootIdentity {
    this.startedAt = this.startedAt ?? new Date().toISOString();
    return {
      id: this.id,
      RID: this.RID,
      processId: process.pid.toString() ?? uuidv4(),
      workspaceId: this.workspaceId,
      name: this.identityName,
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
  setCredentials(credentials: RuntimeCredentials) {
    if (credentials.accessToken !== undefined) {
      this.accessToken = credentials.accessToken;
    }
    if (credentials.natsJwt !== undefined) {
      this.natsJwt = credentials.natsJwt;
    }
    if (credentials.toolsetId !== undefined) {
      this.toolsetId = credentials.toolsetId;
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
