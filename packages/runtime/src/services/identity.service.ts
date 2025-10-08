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

@injectable()
export class IdentityService extends Service {
  name = 'identity';

  @inject(IDENTITY_NAME)
  protected identityName!: string;

  @inject(WORKSPACE_ID)
  protected workspaceId!: string;

  @inject(AGENT_CAPABILITY)
  protected agentCapability: boolean | 'auto' = 'auto';

  @inject(TOOL_CAPABILITY)
  protected toolCapability: boolean = true;

  protected id: string | null = null;
  protected RID: string | null = null;

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
  }

  protected async shutdown() {
    this.logger.info('Stopping');
    await this.stopService(this.natsService);
  }

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

  addCapability(capability: string) {
    if (capability === 'agent') {
      this.agentCapability = true;
    }
    if (capability === 'tool') {
      this.toolCapability = true;
    }
    return this.getIdentity().capabilities;
  }

  getIdentity(): RootIdentity {
    this.startedAt = this.startedAt ?? new Date().toISOString();
    const capabilities = [];
    if (this.agentCapability === true) {
      capabilities.push('agent');
    }
    if (this.toolCapability === true) {
      capabilities.push('tool');
    }
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
      capabilities,
      metadata: {
        platform: os.platform(),
        arch: os.arch(),
        node_version: process.version,
      },
    };
  }
}
