import pino from 'pino';
import {
  LoggerService,
  NatsService,
  HandshakeRequest,
  HandshakeResponse,
  ErrorResponse
} from '@skilder-ai/common';
import { getHostIP } from '../utils';
import os from 'os';
import { SkillIdentity } from './skill.service';

export interface AuthHeaders {
  workspaceKey?: string;
  skillKey?: string;
  skillName?: string;
}

/**
 * SessionAuthService handles authentication for a single session in remote mode.
 * Unlike the singleton AuthService, this is instantiated per-session.
 */
export class SessionAuthService {
  private logger: pino.Logger;
  private identity: SkillIdentity | null = null;

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
    const { workspaceKey, skillKey, skillName } = headers;

    // Rule 1: WORKSPACE_KEY and SKILL_KEY are mutually exclusive
    if (workspaceKey && skillKey) {
      throw new Error('WORKSPACE_KEY and SKILL_KEY are mutually exclusive');
    }

    // Rule 2: At least one key must be provided
    if (!workspaceKey && !skillKey) {
      throw new Error('Either WORKSPACE_KEY or SKILL_KEY is required');
    }

    // Rule 3: WORKSPACE_KEY requires SKILL_NAME
    if (workspaceKey && !skillName) {
      throw new Error('WORKSPACE_KEY requires SKILL_NAME');
    }

    // Rule 4: SKILL_KEY must not have SKILL_NAME
    if (skillKey && skillName) {
      throw new Error('SKILL_KEY must not be used with SKILL_NAME');
    }
  }

  /**
   * Authenticate via handshake and return the session identity
   */
  public async authenticateViaHandshake(headers: AuthHeaders): Promise<SkillIdentity> {
    const { workspaceKey, skillKey, skillName } = headers;
    const key = workspaceKey || skillKey!;

    this.logger.debug(`Authenticating via handshake with key type: ${workspaceKey ? 'WORKSPACE_KEY' : 'SKILL_KEY'}`);

    // Create handshake request
    const handshakeRequest = HandshakeRequest.create({
      key,
      nature: 'skill',
      name: skillName,
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

    if (response.data.nature !== 'skill') {
      throw new Error(`Authentication failed: expected skill nature, got ${response.data.nature}`);
    }

    if (response.data.workspaceId === null) {
      throw new Error('Authentication failed: workspace ID cannot be null for skills');
    }

    this.logger.info(`Successfully authenticated skill: ${response.data.name} (${response.data.id})`);

    this.identity = {
      workspaceId: response.data.workspaceId,
      skillId: response.data.id,
      skillName: response.data.name,
    };

    return this.identity;
  }

  /**
   * Get the authenticated identity
   */
  public getIdentity(): SkillIdentity | null {
    return this.identity;
  }
}
