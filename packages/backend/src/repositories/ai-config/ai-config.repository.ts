import { injectable, inject } from 'inversify';
import { DGraphService } from '../../services/dgraph.service';
import { dgraphResolversTypes, LoggerService } from '@skilder-ai/common';
import pino from 'pino';
import {
  GET_AI_CONFIGS_BY_WORKSPACE,
  FIND_AI_CONFIG_BY_KEY,
  CREATE_AI_CONFIG,
  UPDATE_AI_CONFIG,
  DELETE_AI_CONFIG,
  OBSERVE_AI_CONFIGS,
} from './ai-config.operations';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AIConfigData {
  key: string;
  value: string;
  description?: string;
}

@injectable()
export class AIConfigRepository {
  private logger: pino.Logger;

  constructor(
    @inject(DGraphService) private readonly dgraphService: DGraphService,
    @inject(LoggerService) private readonly loggerService: LoggerService,
  ) {
    this.logger = this.loggerService.getLogger('ai-config.repository');
  }

  async getByWorkspace(workspaceId: string): Promise<dgraphResolversTypes.AiConfig[]> {
    try {
      const res = await this.dgraphService.query<{
        getWorkspace: { aiConfigs: dgraphResolversTypes.AiConfig[] } | null;
      }>(GET_AI_CONFIGS_BY_WORKSPACE, { workspaceId });

      return res.getWorkspace?.aiConfigs || [];
    } catch (error) {
      this.logger.error(`Failed to get AI configs for workspace ${workspaceId}: ${error}`);
      throw new Error('Failed to get AI configs');
    }
  }

  async findByKey(workspaceId: string, key: string): Promise<dgraphResolversTypes.AiConfig | null> {
    try {
      const res = await this.dgraphService.query<{
        getWorkspace: { aiConfigs: dgraphResolversTypes.AiConfig[] } | null;
      }>(FIND_AI_CONFIG_BY_KEY, { workspaceId, key });

      const configs = res.getWorkspace?.aiConfigs || [];
      return configs.length > 0 ? configs[0] : null;
    } catch (error) {
      this.logger.error(`Failed to find AI config by key ${key} for workspace ${workspaceId}: ${error}`);
      throw new Error('Failed to find AI config');
    }
  }

  async create(workspaceId: string, data: AIConfigData): Promise<dgraphResolversTypes.AiConfig> {
    try {
      const now = new Date().toISOString();

      const res = await this.dgraphService.mutation<{
        addAIConfig: { aIConfig: dgraphResolversTypes.AiConfig[] };
      }>(CREATE_AI_CONFIG, {
        workspaceId,
        key: data.key,
        value: data.value,
        description: data.description || null,
        now,
      });

      this.logger.info(`Created AI config for workspace ${workspaceId} with key ${data.key}`);
      return res.addAIConfig.aIConfig[0];
    } catch (error) {
      this.logger.error(`Failed to create AI config for workspace ${workspaceId}: ${error}`);
      throw new Error('Failed to create AI config');
    }
  }

  async update(id: string, value: string, description?: string): Promise<dgraphResolversTypes.AiConfig> {
    try {
      const now = new Date().toISOString();

      const res = await this.dgraphService.mutation<{
        updateAIConfig: { aIConfig: dgraphResolversTypes.AiConfig[] };
      }>(UPDATE_AI_CONFIG, {
        id,
        value,
        description: description || null,
        now,
      });

      this.logger.info(`Updated AI config ${id}`);
      return res.updateAIConfig.aIConfig[0];
    } catch (error) {
      this.logger.error(`Failed to update AI config ${id}: ${error}`);
      throw new Error('Failed to update AI config');
    }
  }

  async upsert(workspaceId: string, data: AIConfigData): Promise<dgraphResolversTypes.AiConfig> {
    const existing = await this.findByKey(workspaceId, data.key);

    if (existing) {
      return this.update(existing.id, data.value, data.description);
    }

    return this.create(workspaceId, data);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.dgraphService.mutation<{
        deleteAIConfig: { aIConfig: { id: string }[] };
      }>(DELETE_AI_CONFIG, { id });

      this.logger.info(`Deleted AI config ${id}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete AI config ${id}: ${error}`);
      throw new Error('Failed to delete AI config');
    }
  }

  observeAIConfigs(workspaceId: string): Observable<dgraphResolversTypes.AiConfig[]> {
    const subscription = OBSERVE_AI_CONFIGS('subscription');
    return this.dgraphService
      .observe<{ aiConfigs: dgraphResolversTypes.AiConfig[] }>(
        subscription,
        { workspaceId },
        'getWorkspace',
        true,
      )
      .pipe(map((workspace) => workspace?.aiConfigs ?? []));
  }
}
