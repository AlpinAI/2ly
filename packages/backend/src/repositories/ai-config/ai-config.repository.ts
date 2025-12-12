import { injectable, inject } from 'inversify';
import { DGraphService } from '../../services/dgraph.service';
import { dgraphResolversTypes, LoggerService } from '@skilder-ai/common';
import pino from 'pino';
import {
  GetAiConfigsByWorkspaceDocument,
  FindAiConfigByKeyDocument,
  GetAiConfigByIdDocument,
  CreateAiConfigDocument,
  UpdateAiConfigDocument,
  DeleteAiConfigDocument,
  ObserveAiConfigsSubscriptionDocument,
} from '../../generated/dgraph';
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
      const res = await this.dgraphService.query(GetAiConfigsByWorkspaceDocument, { workspaceId });

      return (res.getWorkspace?.aiConfigs || []) as dgraphResolversTypes.AiConfig[];
    } catch (error) {
      this.logger.error(`Failed to get AI configs for workspace ${workspaceId}: ${error}`);
      throw new Error('Failed to get AI configs');
    }
  }

  async findById(id: string): Promise<(dgraphResolversTypes.AiConfig & { workspace: { id: string } }) | null> {
    try {
      const res = await this.dgraphService.query(GetAiConfigByIdDocument, { id });

      return (res.getAIConfig || null) as (dgraphResolversTypes.AiConfig & { workspace: { id: string } }) | null;
    } catch (error) {
      this.logger.error(`Failed to find AI config by id ${id}: ${error}`);
      throw new Error('Failed to find AI config');
    }
  }

  async findByKey(workspaceId: string, key: string): Promise<dgraphResolversTypes.AiConfig | null> {
    try {
      const res = await this.dgraphService.query(FindAiConfigByKeyDocument, { workspaceId, key });

      const configs = res.getWorkspace?.aiConfigs || [];
      return configs.length > 0 ? (configs[0] as dgraphResolversTypes.AiConfig) : null;
    } catch (error) {
      this.logger.error(`Failed to find AI config by key ${key} for workspace ${workspaceId}: ${error}`);
      throw new Error('Failed to find AI config');
    }
  }

  async create(workspaceId: string, data: AIConfigData): Promise<dgraphResolversTypes.AiConfig> {
    try {
      const now = new Date().toISOString();

      const res = await this.dgraphService.mutation(CreateAiConfigDocument, {
        workspaceId,
        key: data.key,
        value: data.value,
        description: data.description || null,
        now,
      });

      this.logger.info(`Created AI config for workspace ${workspaceId} with key ${data.key}`);
      return res.addAIConfig!.aIConfig![0]! as dgraphResolversTypes.AiConfig;
    } catch (error) {
      this.logger.error(`Failed to create AI config for workspace ${workspaceId}: ${error}`);
      throw new Error('Failed to create AI config');
    }
  }

  async update(id: string, value: string, description?: string): Promise<dgraphResolversTypes.AiConfig> {
    try {
      const now = new Date().toISOString();

      const res = await this.dgraphService.mutation(UpdateAiConfigDocument, {
        id,
        value,
        description: description || null,
        now,
      });

      this.logger.info(`Updated AI config ${id}`);
      return res.updateAIConfig!.aIConfig![0]! as dgraphResolversTypes.AiConfig;
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
      await this.dgraphService.mutation(DeleteAiConfigDocument, { id });

      this.logger.info(`Deleted AI config ${id}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete AI config ${id}: ${error}`);
      throw new Error('Failed to delete AI config');
    }
  }

  observeAIConfigs(workspaceId: string): Observable<dgraphResolversTypes.AiConfig[]> {
    return this.dgraphService
      .observe<{ aiConfigs: dgraphResolversTypes.AiConfig[] }>(
        ObserveAiConfigsSubscriptionDocument,
        { workspaceId },
        'getWorkspace',
        true,
      )
      .pipe(map((workspace) => workspace?.aiConfigs ?? []));
  }
}
