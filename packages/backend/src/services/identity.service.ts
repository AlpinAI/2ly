import { injectable, inject } from 'inversify';
import { IdentityRepository } from '../repositories/identity.repository';
import { LoggerService, NatsService, Service, HandshakeRequest, HandshakeResponse, ErrorResponse, dgraphResolversTypes } from '@2ly/common';
import pino from 'pino';
import { WorkspaceRepository } from '../repositories/workspace.repository';
import { RuntimeRepository } from '../repositories/runtime.repository';
import { ToolSetRepository } from '../repositories/toolset.repository';
import { v4 as uuidv4 } from 'uuid';

type HandshakeRuntimeCallback = (identity: {instance: dgraphResolversTypes.Runtime; pid: string; hostIP: string; hostname: string;}) => void;
type HandshakeToolsetCallback = (identity: {instance: dgraphResolversTypes.ToolSet; pid: string; hostIP: string; hostname: string;}) => void;

/**
 * TokenService handles validation of Master Keys, Toolset Keys, and Runtime Keys.
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
    this.logger.debug(`Handling handshake message: ${key.slice(0, 5)}...${key.slice(-3)}, ${msg.data.nature} ${msg.data.name}]`);
    
    try {
      // 1. Find the identity key
      const { nature, relatedId } = await this.identityRepository.findKey(key);
      let workspaceId: string | null = null;
      let finalNature: 'runtime' | 'toolset' | null = null;
      let finalRelatedId: string | null = null;
      let finalRelatedName: string | null = null;
      let runtime: dgraphResolversTypes.Runtime | null = null;
      let toolset: dgraphResolversTypes.ToolSet | null = null;

      if (nature === 'workspace') {
        this.logger.debug(`Handshake with workspace identity: ${relatedId}`);
        const workspace = await this.workspaceRepository.findById(relatedId);
        if (!workspace) {
          throw new Error(`Workspace ${relatedId} not found`);
        }
        workspaceId = workspace.id;
        // upsert the runtime or toolset
        if (msg.data.nature === 'runtime' && msg.data.name) {
          runtime = await this.runtimeRepository.findByName(workspace.id, msg.data.name) ?? null;
          if (!runtime) {
            this.logger.debug(`Creating runtime ${msg.data.name} for workspace ${workspace.id}`);
            runtime = await this.runtimeRepository.create(msg.data.name, '', 'INACTIVE', workspace.id, 'EDGE');
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
        workspaceId = runtime.workspace.id;
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

      if (!workspaceId || !finalNature || !finalRelatedId || !finalRelatedName) {
        throw new Error('Could not retrieve identity');
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
      this.logger.error(`Handshake failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      msg.respond(new ErrorResponse({ error: `Handshake failed: ${error instanceof Error ? error.message : 'Unknown error'}` }));
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
