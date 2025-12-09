import { injectable, inject } from 'inversify';
import { IdentityRepository } from '../repositories/identity.repository';
import { KeyRateLimiterService } from './key-rate-limiter.service';
import { LoggerService, NatsService, Service, HandshakeRequest, HandshakeResponse, ErrorResponse, dgraphResolversTypes } from '@skilder-ai/common';
import pino from 'pino';
import { WorkspaceRepository } from '../repositories/workspace.repository';
import { RuntimeRepository } from '../repositories/runtime.repository';
import { SkillRepository } from '../repositories/skill.repository';
import { v4 as uuidv4 } from 'uuid';
import { HandshakeRuntimeCallback, HandshakeSkillCallback } from '../types';
import { SystemRepository } from '../repositories/system.repository';

/**
 * TokenService handles validation of System Keys, Workspace Keys, and Skill Keys.
 * It also generates NATS JWTs for authenticated runtimes.
 */
@injectable()
export class IdentityService extends Service {
  name = 'identity';
  private logger: pino.Logger;

  /**
   * Nats subscriptions
   */
  private subscriptions: { unsubscribe: () => void; drain: () => Promise<void>; isClosed: () => boolean }[] = [];

  private onRuntimeHandshakeCallbacks: Map<string, HandshakeRuntimeCallback> = new Map();
  private onSkillHandshakeCallbacks: Map<string, HandshakeSkillCallback> = new Map();

  constructor(
    @inject(LoggerService) private loggerService: LoggerService,
    @inject(NatsService) private readonly natsService: NatsService,
    @inject(IdentityRepository) private readonly identityRepository: IdentityRepository,
    @inject(KeyRateLimiterService) private readonly keyRateLimiter: KeyRateLimiterService,
    @inject(SystemRepository) private readonly systemRepository: SystemRepository,
    @inject(WorkspaceRepository) private readonly workspaceRepository: WorkspaceRepository,
    @inject(RuntimeRepository) private readonly runtimeRepository: RuntimeRepository,
    @inject(SkillRepository) private readonly skillRepository: SkillRepository,
  ) {
    super();
    this.logger = this.loggerService.getLogger(this.name);
  }

  protected async initialize() {
    this.logger.info('Starting');
    await this.startService(this.natsService);
    this.handleHandshakes();
  }

  protected async shutdown() {
    this.logger.info('Stopping');
    for (const subscription of this.subscriptions) {
      try {
        if (!subscription.isClosed()) {
          await subscription.drain();
        }
      } catch (error) {
        this.logger.error(`Failed to drain subscription with error ${error}`);
      }
    }
    this.subscriptions = [];
    // Clear callback maps as defensive cleanup
    this.onRuntimeHandshakeCallbacks.clear();
    this.onSkillHandshakeCallbacks.clear();
    await this.stopService(this.natsService);
    this.logger.info('Stopped');
  }

  private async handleHandshakes() {
    this.logger.debug(`Subscribing to handshake messages`);
    const subscription = this.natsService.subscribe(HandshakeRequest.subscribe());
    this.subscriptions.push(subscription);
    for await (const msg of subscription) {
      if (msg instanceof HandshakeRequest) {
        await this.handleHandshake(msg);
      } else {
        this.logger.error(`Unknown message type on handshake subscription: ${msg.type}`);
      }
    }
  }

  private async handleHandshake(msg: HandshakeRequest) {
    const key = msg.data.key;
    const keyPrefix = key.substring(0, 8); // First 8 chars for rate limiting
    const ipAddress = msg.data.hostIP || 'unknown';

    this.logger.debug(`Handling handshake message: ${key.slice(0, 5)}...${key.slice(-3)}, ${msg.data.nature} ${msg.data.name}]`);

    try {
      // 1. Check rate limiting before validation
      if (!this.keyRateLimiter.checkKeyAttempt(keyPrefix, ipAddress)) {
        this.logger.warn(`Rate limit exceeded for key validation attempt from IP: ${ipAddress}`);
        throw new Error('AUTHENTICATION_FAILED');
      }

      // 2. Find the identity key
      const { nature, relatedId } = await this.identityRepository.findKey(key);

      // 3. Record successful validation
      this.keyRateLimiter.recordSuccessfulAttempt(keyPrefix);
      let workspaceId: string | null = null;
      let finalNature: 'runtime' | 'skill' | null = null;
      let finalRelatedId: string | null = null;
      let finalRelatedName: string | null = null;
      let runtime: dgraphResolversTypes.Runtime | null = null;
      let skill: dgraphResolversTypes.Skill | null = null;

      if (nature === 'system') {
        this.logger.debug(`Handshake with system identity: ${relatedId}`);
        const system = await this.systemRepository.getSystem();
        if (!system) {
          throw new Error(`System not found`);
        }
        // upsert the runtime or skill
        if (msg.data.nature === 'runtime' && msg.data.name) {
          runtime = await this.runtimeRepository.findByName('system', system.id, msg.data.name) ?? null;
          if (!runtime) {
            this.logger.debug(`Creating runtime ${msg.data.name} for system ${system.id}`);
            runtime = await this.runtimeRepository.create('system', system.id, msg.data.name, '', 'ACTIVE', 'EDGE');
          } else {
            this.logger.debug(`Found runtime identity for ${msg.data.name}: ${runtime.id}`);
          }
          finalNature = 'runtime';
          finalRelatedId = runtime.id;
          finalRelatedName = msg.data.name;
        }
      } else if (nature === 'workspace') {
        this.logger.debug(`Handshake with workspace identity: ${relatedId}`);
        const workspace = await this.workspaceRepository.findById(relatedId);
        if (!workspace) {
          throw new Error(`Workspace ${relatedId} not found`);
        }
        workspaceId = workspace.id;
        // upsert the runtime or skill
        if (msg.data.nature === 'runtime' && msg.data.name) {
          runtime = await this.runtimeRepository.findByName('workspace', workspace.id, msg.data.name) ?? null;
          if (!runtime) {
            this.logger.debug(`Creating runtime ${msg.data.name} for workspace ${workspace.id}`);
            runtime = await this.runtimeRepository.create('workspace', workspace.id, msg.data.name, '', 'ACTIVE', 'EDGE');
          } else {
            this.logger.debug(`Found runtime identity for ${msg.data.name}: ${runtime.id}`);
          }
          finalNature = 'runtime';
          finalRelatedId = runtime.id;
          finalRelatedName = msg.data.name;
        } else if (msg.data.nature === 'skill' && msg.data.name) {
          skill = await this.skillRepository.findByName(workspace.id, msg.data.name) ?? null;
          if (!skill) {
            this.logger.debug(`Creating skill ${msg.data.name} for workspace ${workspace.id}`);
            skill = await this.skillRepository.create(msg.data.name, '', workspace.id);
          } else {
            this.logger.debug(`Found skill identity for ${msg.data.name}: ${skill.id}`);
          }
          finalNature = 'skill';
          finalRelatedId = skill.id;
          finalRelatedName = msg.data.name;
        }
      } else if (nature === 'runtime') {
        this.logger.debug(`Handshake with runtime identity: ${relatedId}`);
        runtime = await this.runtimeRepository.findById(relatedId);
        if (!runtime) {
          throw new Error(`Runtime ${relatedId} not found`);
        }
        workspaceId = runtime.workspace?.id ?? null;
        finalNature = 'runtime';
        finalRelatedId = runtime.id;
        finalRelatedName = runtime.name;
      } else if (nature === 'skill') {
        this.logger.debug(`Handshake with skill identity: ${relatedId}`);
        skill = await this.skillRepository.findById(relatedId);
        if (!skill) {
          throw new Error(`Skill ${relatedId} not found`);
        }
        workspaceId = skill.workspace.id;
        finalNature = 'skill';
        finalRelatedId = skill.id;
        finalRelatedName = skill.name;
      } else {
        throw new Error(`Unknown nature: ${nature}`);
      }

      if (!finalNature || !finalRelatedId || !finalRelatedName) {
        throw new Error('Could not retrieve identity');
      }
      if (finalNature === 'skill' && !workspaceId) {
        throw new Error('Authentication failed: workspace ID cannot be null for skills');
      }
      // set roots if provided
      if (finalNature === 'runtime' && runtime && msg.data.roots) {
        await this.runtimeRepository.setRoots(runtime.id, msg.data.roots);
      }
      if (finalNature === 'runtime' && runtime) {
        for (const callback of this.onRuntimeHandshakeCallbacks.values()) {
          callback({ instance: runtime, pid: msg.data.pid, hostIP: msg.data.hostIP, hostname: msg.data.hostname });
        }
      } else if (finalNature === 'skill' && skill) {
        for (const callback of this.onSkillHandshakeCallbacks.values()) {
          callback({ instance: skill, pid: msg.data.pid, hostIP: msg.data.hostIP, hostname: msg.data.hostname });
        }
      }
      const handshakeResponse = new HandshakeResponse({
        workspaceId,
        nature: finalNature,
        id: finalRelatedId,
        name: finalRelatedName,
      });
      this.logger.debug(`Sending handshake response: ${JSON.stringify(handshakeResponse.data)}`);
      msg.respond(handshakeResponse);
    } catch (error) {
      // Record failed attempt for rate limiting (unless it was a rate limit error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage !== 'AUTHENTICATION_FAILED') {
        this.keyRateLimiter.recordFailedAttempt(keyPrefix, ipAddress);
      }

      // Log detailed error for debugging (preserves original error information)
      this.logger.error(`Handshake failed: ${errorMessage}`);

      // Always return generic error to prevent enumeration attacks
      // This prevents attackers from distinguishing between:
      // - NOT_FOUND (key doesn't exist)
      // - EXPIRED (key exists but expired)
      // - REVOKED (key exists but revoked)
      // - INVALID_KEY_FORMAT (invalid format)
      // - INVALID_KEY_PREFIX (wrong prefix)
      msg.respond(new ErrorResponse({ error: 'AUTHENTICATION_FAILED' }));
    }
  }

  onHandshake(nature: 'runtime', callback: HandshakeRuntimeCallback): string;
  onHandshake(nature: 'skill', callback: HandshakeSkillCallback): string;
  onHandshake(
    nature: 'runtime' | 'skill',
    callback: HandshakeRuntimeCallback | HandshakeSkillCallback
  ): string {
    const callbackId = uuidv4();
    if (nature === 'runtime') {
      this.onRuntimeHandshakeCallbacks.set(callbackId, callback as HandshakeRuntimeCallback);
    } else if (nature === 'skill') {
      this.onSkillHandshakeCallbacks.set(callbackId, callback as HandshakeSkillCallback);
    }
    return callbackId;
  }

  offHandshake(nature: 'runtime', callbackId: string): void;
  offHandshake(nature: 'skill', callbackId: string): void;
  offHandshake(nature: 'runtime' | 'skill', callbackId: string): void {
    if (nature === 'runtime') {
      this.onRuntimeHandshakeCallbacks.delete(callbackId);
    } else if (nature === 'skill') {
      this.onSkillHandshakeCallbacks.delete(callbackId);
    }
  }
}
