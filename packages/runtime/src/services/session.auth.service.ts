import pino from 'pino';
import {
  LoggerService,
  NatsService,
  HandshakeRequest,
  HandshakeResponse,
  ErrorResponse
} from '@2ly/common';
import { getHostIP } from '../utils';
import os from 'os';
import { ToolsetIdentity } from './toolset.service';

export interface AuthHeaders {
  workspaceKey?: string;
  toolsetKey?: string;
  toolsetName?: string;
}

/**
 * SessionAuthService handles authentication for a single session in remote mode.
 * Unlike the singleton AuthService, this is instantiated per-session.
 */
export class SessionAuthService {
  private logger: pino.Logger;
  private identity: ToolsetIdentity | null = null;

  constructor(
    private loggerService: LoggerService,
    private natsService: NatsService,
  ) {
    this.logger = this.loggerService.getLogger(`session-auth`);
  }

  /**
   * Validate auth headers according to the rules
   */
  public validateAuthHeaders(headers: AuthHeaders): void {
    const { workspaceKey, toolsetKey, toolsetName } = headers;

    // Rule 1: WORKSPACE_KEY and TOOLSET_KEY are mutually exclusive
    if (workspaceKey && toolsetKey) {
      throw new Error('WORKSPACE_KEY and TOOLSET_KEY are mutually exclusive');
    }

    // Rule 2: At least one key must be provided
    if (!workspaceKey && !toolsetKey) {
      throw new Error('Either WORKSPACE_KEY or TOOLSET_KEY is required');
    }

    // Rule 3: WORKSPACE_KEY requires TOOLSET_NAME
    if (workspaceKey && !toolsetName) {
      throw new Error('WORKSPACE_KEY requires TOOLSET_NAME');
    }

    // Rule 4: TOOLSET_KEY must not have TOOLSET_NAME
    if (toolsetKey && toolsetName) {
      throw new Error('TOOLSET_KEY must not be used with TOOLSET_NAME');
    }
  }

  /**
   * Authenticate via handshake and return the session identity
   */
  public async authenticateViaHandshake(headers: AuthHeaders): Promise<ToolsetIdentity> {
    const { workspaceKey, toolsetKey, toolsetName } = headers;
    const key = workspaceKey || toolsetKey!;

    this.logger.debug(`Authenticating via handshake with key type: ${workspaceKey ? 'WORKSPACE_KEY' : 'TOOLSET_KEY'}`);

    // Create handshake request
    const handshakeRequest = HandshakeRequest.create({
      key,
      nature: 'toolset',
      name: toolsetName,
      pid: process.pid.toString(),
      hostIP: getHostIP(),
      hostname: os.hostname(),
    }) as HandshakeRequest;

    // Send handshake request to backend via NATS
    const response = await this.natsService.request(handshakeRequest, { timeout: 5000 });

    if (response instanceof ErrorResponse) {
      this.logger.error(`Handshake failed: ${response.data.error}`);
      throw new Error(`Authentication failed: ${response.data.error}`);
    }

    if (!(response instanceof HandshakeResponse)) {
      this.logger.error(`Invalid handshake response: ${JSON.stringify(response)}`);
      throw new Error('Authentication failed: invalid response from backend');
    }

    if (response.data.nature !== 'toolset') {
      throw new Error(`Authentication failed: expected toolset nature, got ${response.data.nature}`);
    }

    if (response.data.workspaceId === null) {
      throw new Error('Authentication failed: workspace ID cannot be null for toolsets');
    }

    this.logger.info(`Successfully authenticated toolset: ${response.data.name} (${response.data.id})`);

    this.identity = {
      workspaceId: response.data.workspaceId,
      toolsetId: response.data.id,
      toolsetName: response.data.name,
    };

    return this.identity;
  }

  /**
   * Get the authenticated identity
   */
  public getIdentity(): ToolsetIdentity | null {
    return this.identity;
  }
}
