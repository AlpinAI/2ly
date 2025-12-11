import { inject, injectable } from 'inversify';
import {
  LoggerService,
  NatsService,
  RuntimeMCPServersPublish,
  Service,
  SkillListToolsPublish,
  SmartSkillTool,
  dgraphResolversTypes,
} from '@skilder-ai/common';
import { DGraphService } from './dgraph.service';
import pino from 'pino';
import { Subscription } from 'rxjs';
import { tap, debounceTime } from 'rxjs/operators';

import {
  SkillRepository,
  WorkspaceRepository,
} from '../repositories';
import { IdentityService } from './identity.service';
import { SkillHandshakeIdentity } from '../types';

export const DROP_ALL_DATA = 'dropAllData';

@injectable()
export class SkillService extends Service {
  name = 'skill';
  private logger: pino.Logger;
  private rxjsSubscriptions: Subscription[] = [];
  private natsSubscriptions: { unsubscribe: () => void; drain: () => Promise<void>; isClosed?: () => boolean }[] = [];
  private skillHandshakeCallbackId?: string;

  constructor(
    @inject(LoggerService) private loggerService: LoggerService,
    @inject(IdentityService) private identityService: IdentityService,
    @inject(DGraphService) private dgraphService: DGraphService,
    @inject(NatsService) private natsService: NatsService,
    @inject(SkillRepository) private skillRepository: SkillRepository,
    @inject(WorkspaceRepository) private workspaceRepository: WorkspaceRepository,
  ) {
    super();
    this.logger = this.loggerService.getLogger(this.name);
  }

  protected async initialize() {
    this.logger.info('Starting');
    await this.startService(this.dgraphService);
    await this.startService(this.natsService);
    await this.subscribeToAllSkills();
    this.skillHandshakeCallbackId = this.identityService.onHandshake('skill', (identity: SkillHandshakeIdentity) => {
      this.handleSkillHandshake(identity);
    });
  }

  protected async shutdown() {
    this.logger.info('Stopping');

    // Unregister handshake callback
    if (this.skillHandshakeCallbackId) {
      this.identityService.offHandshake('skill', this.skillHandshakeCallbackId);
      this.skillHandshakeCallbackId = undefined;
    }

    await this.stopService(this.dgraphService);

    // Clean up RxJS subscriptions
    this.rxjsSubscriptions.forEach((subscription) => subscription.unsubscribe());
    this.rxjsSubscriptions = [];

    // Clean up NATS subscriptions
    const drainPromises = this.natsSubscriptions.map(async (subscription) => {
      try {
        if (!subscription.isClosed?.()) {
          await subscription.drain();
        }
      } catch (error) {
        this.logger.warn(`Failed to drain subscription: ${error}`);
      }
    });
    await Promise.allSettled(drainPromises);
    this.natsSubscriptions = [];

    await this.stopService(this.natsService);
  }

  private async handleSkillHandshake(identity: SkillHandshakeIdentity) {
    this.logger.info(`Skill ${identity.instance.id} connected`);
    try {
      this.publishSkillTools(identity.instance);
      await this.publishAgentMCPServers(identity.instance);
      this.workspaceRepository.completeOnboardingStep(
        identity.instance.workspace.id,
        'connect-skill-to-agent',
        {
          skillName: identity.instance.name,
          skillId: identity.instance.id,
        }
      );
    } catch (error) {
      this.logger.error(`Error handling skill handshake: ${error}`);
    }
  }

  /**
   * Subscribe to all the skills of the database and keep the NATS KV up-to-date.
   * TODO: this pattern is not resilient for high volume but is designed to test the skill concept quickly.
   * In a near future we'll need to implement a pattern which leverage the health check mechanism and keep alive
   * only active skills
   */
  private async subscribeToAllSkills() {
    this.logger.debug('Subscribing to all skills');

    const subscription = this.skillRepository
      .observeAllSkills()
      .pipe(
        debounceTime(100), // Avoid spamming NATS
        tap((skills) => {
          // Publish one message per skill with skill name as the key
          skills.forEach((skill) => {
            this.publishSkillTools(skill);
          });
        }),
      )
      .subscribe();

    // Store subscription for cleanup
    this.rxjsSubscriptions.push(subscription);
  }

  private publishSkillTools(skill: dgraphResolversTypes.Skill) {
    let smartSkillTool: SmartSkillTool | undefined;
    let mcpTools = skill.mcpTools ?? [];

    // In SMART mode, expose the skill itself as a single tool
    if (skill.mode === dgraphResolversTypes.SkillMode.Smart) {
      smartSkillTool = {
        id: skill.id,
        name: skill.name,
        description: skill.description ?? `Smart skill: ${skill.name}`,
      };
      mcpTools = [];  // Don't expose underlying tools in SMART mode
      this.logger.debug(`Publishing smart skill tool for skill ${skill.id} (${skill.name}) in workspace ${skill.workspace.id}`);
    } else {
      this.logger.debug(`Publishing ${mcpTools.length} tools for skill ${skill.id} in workspace ${skill.workspace.id}`);
    }

    const message = SkillListToolsPublish.create({
      workspaceId: skill.workspace.id,
      skillId: skill.id,
      mcpTools,
      smartSkillTool,
      description: skill.description,
    }) as SkillListToolsPublish;
    this.natsService.publishEphemeral(message);
  }

  // TODO: leverage root from handshake ?
  private async publishAgentMCPServers(skill: dgraphResolversTypes.Skill) {
    const mcpServers  = await this.skillRepository.getMCPServersOnAgent(skill.id);
    this.logger.debug(`Publishing ${mcpServers.length ?? 0} MCP Servers for skill ${skill.id} in workspace ${skill.workspace.id}`);
    const mcpServersMessage = RuntimeMCPServersPublish.create({
      workspaceId: skill.workspace.id,
      runtimeId: skill.id,
      roots: [] as { name: string; uri: string }[],
      mcpServers,
    }) as RuntimeMCPServersPublish;
    this.natsService.publishEphemeral(mcpServersMessage);
  }
}
