import { injectable, inject } from 'inversify';
import { DGraphService } from '../services/dgraph.service';
import { dgraphResolversTypes, LoggerService } from '@2ly/common';
import pino from 'pino';
import {
  CREATE_LLM_API_KEY,
  UPDATE_LLM_API_KEY,
  DELETE_LLM_API_KEY,
  SET_ACTIVE_LLM_API_KEY,
  FIND_LLM_API_KEYS_BY_WORKSPACE,
  FIND_LLM_API_KEY_BY_ID,
  FIND_ACTIVE_LLM_API_KEY,
} from './llm-api-key.operations';

export interface CreateLLMAPIKeyData {
  provider: dgraphResolversTypes.LlmProvider;
  encryptedKey: string;
  maskedKey: string;
  isActive: boolean;
  workspaceId: string;
}

export interface UpdateLLMAPIKeyData {
  id: string;
  encryptedKey?: string;
  maskedKey?: string;
  lastValidatedAt?: Date;
}

@injectable()
export class LLMAPIKeyRepository {
  private logger: pino.Logger;

  constructor(
    @inject(DGraphService) private readonly dgraphService: DGraphService,
    @inject(LoggerService) private readonly loggerService: LoggerService,
  ) {
    this.logger = this.loggerService.getLogger('llm-api-key-repository');
  }

  /**
   * Create a new LLM API key
   */
  async create(data: CreateLLMAPIKeyData): Promise<dgraphResolversTypes.LlmapiKey> {
    try {
      const now = new Date().toISOString();

      const res = await this.dgraphService.mutation<{
        addLLMAPIKey: { lLMAPIKey: dgraphResolversTypes.LlmapiKey[] };
      }>(CREATE_LLM_API_KEY, {
        provider: data.provider,
        encryptedKey: data.encryptedKey,
        maskedKey: data.maskedKey,
        isActive: data.isActive,
        workspaceId: data.workspaceId,
        now,
      });

      this.logger.info(`Created ${data.provider} API key for workspace: ${data.workspaceId}`);
      return res.addLLMAPIKey.lLMAPIKey[0];
    } catch (error) {
      this.logger.error(`Failed to create LLM API key: ${error}`);
      throw new Error('Failed to create LLM API key');
    }
  }

  /**
   * Update an existing LLM API key
   */
  async update(data: UpdateLLMAPIKeyData): Promise<dgraphResolversTypes.LlmapiKey> {
    try {
      const now = new Date().toISOString();

      const res = await this.dgraphService.mutation<{
        updateLLMAPIKey: { lLMAPIKey: dgraphResolversTypes.LlmapiKey[] };
      }>(UPDATE_LLM_API_KEY, {
        id: data.id,
        encryptedKey: data.encryptedKey,
        maskedKey: data.maskedKey,
        lastValidatedAt: data.lastValidatedAt?.toISOString(),
        now,
      });

      this.logger.info(`Updated LLM API key: ${data.id}`);
      return res.updateLLMAPIKey.lLMAPIKey[0];
    } catch (error) {
      this.logger.error(`Failed to update LLM API key: ${error}`);
      throw new Error('Failed to update LLM API key');
    }
  }

  /**
   * Delete an LLM API key
   */
  async delete(id: string): Promise<dgraphResolversTypes.LlmapiKey> {
    try {
      const res = await this.dgraphService.mutation<{
        deleteLLMAPIKey: { lLMAPIKey: dgraphResolversTypes.LlmapiKey[] };
      }>(DELETE_LLM_API_KEY, { id });

      this.logger.info(`Deleted LLM API key: ${id}`);
      return res.deleteLLMAPIKey.lLMAPIKey[0];
    } catch (error) {
      this.logger.error(`Failed to delete LLM API key: ${error}`);
      throw new Error('Failed to delete LLM API key');
    }
  }

  /**
   * Set a key as active (and deactivate other keys for the same provider)
   *
   * This operation is atomic - both deactivation and activation happen in a single
   * transaction. DGraph guarantees that either both operations succeed or both fail,
   * preventing race conditions where multiple keys could be active simultaneously.
   *
   * @param id - The ID of the key to activate
   * @param provider - The LLM provider (must match the key's provider)
   * @param workspaceId - The workspace ID (must match the key's workspace)
   * @returns The activated key
   * @throws Error if the key doesn't exist, doesn't match the provider/workspace, or if the operation fails
   */
  async setActive(
    id: string,
    provider: dgraphResolversTypes.LlmProvider,
    workspaceId: string,
  ): Promise<dgraphResolversTypes.LlmapiKey> {
    try {
      const now = new Date().toISOString();

      const res = await this.dgraphService.mutation<{
        deactivateOthers: { numUids: number; lLMAPIKey: dgraphResolversTypes.LlmapiKey[] };
        activateTarget: { numUids: number; lLMAPIKey: dgraphResolversTypes.LlmapiKey[] };
      }>(SET_ACTIVE_LLM_API_KEY, {
        id,
        provider,
        workspaceId,
        now,
      });

      // Validate that the target key was actually updated
      if (!res.activateTarget.lLMAPIKey || res.activateTarget.lLMAPIKey.length === 0) {
        this.logger.error(
          `Failed to activate LLM API key ${id}: Key not found or doesn't match provider ${provider} and workspace ${workspaceId}`,
        );
        throw new Error('Key not found or does not match the specified provider and workspace');
      }

      // Verify exactly one key was activated
      if (res.activateTarget.numUids !== 1) {
        this.logger.error(
          `Unexpected number of keys activated: ${res.activateTarget.numUids} (expected 1)`,
        );
        throw new Error('Unexpected number of keys activated');
      }

      const activatedKey = res.activateTarget.lLMAPIKey[0];

      this.logger.info(
        `Set LLM API key ${id} as active for ${provider} (deactivated ${res.deactivateOthers.numUids} other keys)`,
      );

      return activatedKey;
    } catch (error) {
      this.logger.error(`Failed to set active LLM API key: ${error}`);
      if (error instanceof Error && error.message.includes('Key not found')) {
        throw error; // Rethrow with specific message
      }
      throw new Error('Failed to set active LLM API key');
    }
  }

  /**
   * Find all LLM API keys for a workspace
   */
  async findByWorkspace(workspaceId: string): Promise<dgraphResolversTypes.LlmapiKey[]> {
    try {
      const res = await this.dgraphService.query<{
        queryLLMAPIKey: dgraphResolversTypes.LlmapiKey[];
      }>(FIND_LLM_API_KEYS_BY_WORKSPACE, { workspaceId });

      return res.queryLLMAPIKey || [];
    } catch (error) {
      this.logger.error(`Failed to find LLM API keys by workspace: ${error}`);
      throw new Error('Failed to find LLM API keys by workspace');
    }
  }

  /**
   * Find an LLM API key by ID
   */
  async findById(id: string): Promise<dgraphResolversTypes.LlmapiKey | null> {
    try {
      const res = await this.dgraphService.query<{
        getLLMAPIKey: dgraphResolversTypes.LlmapiKey;
      }>(FIND_LLM_API_KEY_BY_ID, { id });

      return res.getLLMAPIKey || null;
    } catch (error) {
      this.logger.error(`Failed to find LLM API key by ID: ${error}`);
      throw new Error('Failed to find LLM API key by ID');
    }
  }

  /**
   * Find the active LLM API key for a provider in a workspace
   */
  async findActiveKey(
    workspaceId: string,
    provider: dgraphResolversTypes.LlmProvider,
  ): Promise<dgraphResolversTypes.LlmapiKey | null> {
    try {
      const res = await this.dgraphService.query<{
        queryLLMAPIKey: dgraphResolversTypes.LlmapiKey[];
      }>(FIND_ACTIVE_LLM_API_KEY, { workspaceId, provider });

      const keys = res.queryLLMAPIKey || [];
      return keys.length > 0 ? keys[0] : null;
    } catch (error) {
      this.logger.error(`Failed to find active LLM API key: ${error}`);
      throw new Error('Failed to find active LLM API key');
    }
  }
}
