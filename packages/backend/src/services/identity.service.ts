import { injectable, inject } from 'inversify';
import { IdentityRepository } from '../repositories/identity.repository';
import { KeyRateLimiterService } from './key-rate-limiter.service';
import { LoggerService, NatsService, Service, HandshakeRequest, HandshakeResponse, ErrorResponse, dgraphResolversTypes } from '@2ly/common';
import pino from 'pino';
import { WorkspaceRepository } from '../repositories/workspace.repository';
import { RuntimeRepository } from '../repositories/runtime.repository';
import { ToolSetRepository } from '../repositories/toolset.repository';
import { v4 as uuidv4 } from 'uuid';
import { HandshakeRuntimeCallback, HandshakeToolsetCallback } from '../types';
import { SystemRepository } from '../repositories/system.repository';

/**
 * TokenService handles validation of System Keys, Workspace Keys, and Toolset Keys.
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
  private onToolsetHandshakeCallbacks: Map<string, HandshakeToolsetCallback> = new Map();

  constructor(
    @inject(LoggerService) private loggerService: LoggerService,
    @inject(NatsService) private readonly natsService: NatsService,
    @inject(IdentityRepository) private readonly identityRepository: IdentityRepository,
    @inject(KeyRateLimiterService) private readonly keyRateLimiter: KeyRateLimiterService,
    @inject(SystemRepository) private readonly systemRepository: SystemRepository,
    @inject(WorkspaceRepository) private readonly workspaceRepository: WorkspaceRepository,
    @inject(RuntimeRepository) private readonly runtimeRepository: RuntimeRepository,
    @inject(ToolSetRepository) private readonly toolsetRepository: ToolSetRepository,
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
    this.onToolsetHandshakeCallbacks.clear();
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
      let finalNature: 'runtime' | 'toolset' | null = null;
      let finalRelatedId: string | null = null;
      let finalRelatedName: string | null = null;
      let runtime: dgraphResolversTypes.Runtime | null = null;
      let toolset: dgraphResolversTypes.ToolSet | null = null;

      if (nature === 'system') {
        this.logger.debug(`Handshake with system identity: ${relatedId}`);
        const system = await this.systemRepository.getSystem();
        if (!system) {
          throw new Error(`System not found`);
        }
        // upsert the runtime or toolset
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
        // upsert the runtime or toolset
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
        } else if (msg.data.nature === 'toolset' && msg.data.name) {
          toolset = await this.toolsetRepository.findByName(workspace.id, msg.data.name) ?? null;
          if (!toolset) {
            this.logger.debug(`Creating toolset ${msg.data.name} for workspace ${workspace.id}`);
            toolset = await this.toolsetRepository.create(msg.data.name, '', workspace.id);
          } else {
            this.logger.debug(`Found toolset identity for ${msg.data.name}: ${toolset.id}`);
          }
          finalNature = 'toolset';
          finalRelatedId = toolset.id;
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
      } else if (nature === 'toolset') {
        this.logger.debug(`Handshake with toolset identity: ${relatedId}`);
        toolset = await this.toolsetRepository.findById(relatedId);
        if (!toolset) {
          throw new Error(`Toolset ${relatedId} not found`);
        }
        workspaceId = toolset.workspace.id;
        finalNature = 'toolset';
        finalRelatedId = toolset.id;
        finalRelatedName = toolset.name;
      } else {
        throw new Error(`Unknown nature: ${nature}`);
      }

      if (!finalNature || !finalRelatedId || !finalRelatedName) {
        throw new Error('Could not retrieve identity');
      }
      if (finalNature === 'toolset' && !workspaceId) {
        throw new Error('Authentication failed: workspace ID cannot be null for toolsets');
      }
      // set roots if provided
      if (finalNature === 'runtime' && runtime && msg.data.roots) {
        await this.runtimeRepository.setRoots(runtime.id, msg.data.roots);
      }
      if (finalNature === 'runtime' && runtime) {
        for (const callback of this.onRuntimeHandshakeCallbacks.values()) {
          callback({ instance: runtime, pid: msg.data.pid, hostIP: msg.data.hostIP, hostname: msg.data.hostname });
        }
      } else if (finalNature === 'toolset' && toolset) {
        for (const callback of this.onToolsetHandshakeCallbacks.values()) {
          callback({ instance: toolset, pid: msg.data.pid, hostIP: msg.data.hostIP, hostname: msg.data.hostname });
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
  onHandshake(nature: 'toolset', callback: HandshakeToolsetCallback): string;
  onHandshake(
    nature: 'runtime' | 'toolset',
    callback: HandshakeRuntimeCallback | HandshakeToolsetCallback
  ): string {
    const callbackId = uuidv4();
    if (nature === 'runtime') {
      this.onRuntimeHandshakeCallbacks.set(callbackId, callback as HandshakeRuntimeCallback);
    } else if (nature === 'toolset') {
      this.onToolsetHandshakeCallbacks.set(callbackId, callback as HandshakeToolsetCallback);
    }
    return callbackId;
  }

  offHandshake(nature: 'runtime', callbackId: string): void;
  offHandshake(nature: 'toolset', callbackId: string): void;
  offHandshake(nature: 'runtime' | 'toolset', callbackId: string): void {
    if (nature === 'runtime') {
      this.onRuntimeHandshakeCallbacks.delete(callbackId);
    } else if (nature === 'toolset') {
      this.onToolsetHandshakeCallbacks.delete(callbackId);
    }
  }
}
