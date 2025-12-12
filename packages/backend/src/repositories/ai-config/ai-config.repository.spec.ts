import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIConfigRepository } from './ai-config.repository';
import { DGraphService } from '../../services/dgraph.service';
import { LoggerService } from '@skilder-ai/common';

describe('AIConfigRepository', () => {
  let repository: AIConfigRepository;
  let mockDgraph: DGraphService;
  let mockLogger: LoggerService;

  beforeEach(() => {
    const mockQueryFn = vi.fn();
    const mockMutationFn = vi.fn();

    mockLogger = {
      getLogger: vi.fn().mockReturnValue({
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      }),
    } as unknown as LoggerService;

    mockDgraph = {
      query: mockQueryFn,
      mutation: mockMutationFn,
    } as unknown as DGraphService;

    repository = new AIConfigRepository(mockDgraph, mockLogger);
  });

  describe('getByWorkspace', () => {
    it('should return AI configs for a workspace', async () => {
      const workspaceId = 'workspace-1';
      const expectedConfigs = [
        {
          id: '1',
          key: 'skill-generation-prompt',
          value: 'Test prompt',
          description: 'Test description',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(mockDgraph.query).mockResolvedValue({
        getWorkspace: {
          aiConfigs: expectedConfigs,
        },
      });

      const result = await repository.getByWorkspace(workspaceId);

      expect(result).toEqual(expectedConfigs);
      expect(vi.mocked(mockDgraph.query)).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ workspaceId })
      );
    });

    it('should return empty array when workspace has no configs', async () => {
      vi.mocked(mockDgraph.query).mockResolvedValue({ getWorkspace: null });

      const result = await repository.getByWorkspace('workspace-1');

      expect(result).toEqual([]);
    });

    it('should throw error when query fails', async () => {
      vi.mocked(mockDgraph.query).mockRejectedValue(new Error('Database error'));

      await expect(repository.getByWorkspace('workspace-1')).rejects.toThrow('Failed to get AI configs');
    });
  });

  describe('findByKey', () => {
    it('should return AI config by key', async () => {
      const workspaceId = 'workspace-1';
      const key = 'skill-generation-prompt';
      const expectedConfig = {
        id: '1',
        key,
        value: 'Test prompt',
        description: 'Test description',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      vi.mocked(mockDgraph.query).mockResolvedValue({
        getWorkspace: {
          aiConfigs: [expectedConfig],
        },
      });

      const result = await repository.findByKey(workspaceId, key);

      expect(result).toEqual(expectedConfig);
    });

    it('should return null when key not found', async () => {
      vi.mocked(mockDgraph.query).mockResolvedValue({
        getWorkspace: {
          aiConfigs: [],
        },
      });

      const result = await repository.findByKey('workspace-1', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new AI config', async () => {
      const workspaceId = 'workspace-1';
      const data = {
        key: 'test-prompt',
        value: 'Test value',
        description: 'Test description',
      };

      const expectedConfig = {
        id: 'new-id',
        ...data,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      };

      vi.mocked(mockDgraph.mutation).mockResolvedValue({
        addAIConfig: { aIConfig: [expectedConfig] },
      });

      const result = await repository.create(workspaceId, data);

      expect(result).toEqual(expectedConfig);
      expect(vi.mocked(mockDgraph.mutation)).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          workspaceId,
          key: data.key,
          value: data.value,
          description: data.description,
        })
      );
    });

    it('should handle creation errors', async () => {
      vi.mocked(mockDgraph.mutation).mockRejectedValue(new Error('Creation failed'));

      await expect(
        repository.create('workspace-1', { key: 'test', value: 'value' })
      ).rejects.toThrow('Failed to create AI config');
    });
  });

  describe('update', () => {
    it('should update an existing AI config', async () => {
      const id = 'config-1';
      const value = 'Updated value';
      const description = 'Updated description';

      const expectedConfig = {
        id,
        key: 'test-key',
        value,
        description,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: expect.any(String),
      };

      vi.mocked(mockDgraph.mutation).mockResolvedValue({
        updateAIConfig: { aIConfig: [expectedConfig] },
      });

      const result = await repository.update(id, value, description);

      expect(result).toEqual(expectedConfig);
    });
  });

  describe('upsert', () => {
    it('should create config if it does not exist', async () => {
      const workspaceId = 'workspace-1';
      const data = {
        key: 'new-prompt',
        value: 'New value',
      };

      vi.mocked(mockDgraph.query).mockResolvedValue({ getWorkspace: { aiConfigs: [] } });
      vi.mocked(mockDgraph.mutation).mockResolvedValue({
        addAIConfig: { aIConfig: [{ id: 'new-id', ...data }] },
      });

      await repository.upsert(workspaceId, data);

      expect(vi.mocked(mockDgraph.mutation)).toHaveBeenCalled();
    });

    it('should update config if it exists', async () => {
      const workspaceId = 'workspace-1';
      const existingConfig = {
        id: 'existing-id',
        key: 'existing-prompt',
        value: 'Old value',
        description: 'Old description',
      };

      vi.mocked(mockDgraph.query).mockResolvedValue({
        getWorkspace: { aiConfigs: [existingConfig] },
      });
      vi.mocked(mockDgraph.mutation).mockResolvedValue({
        updateAIConfig: { aIConfig: [{ ...existingConfig, value: 'New value' }] },
      });

      await repository.upsert(workspaceId, {
        key: existingConfig.key,
        value: 'New value',
      });

      expect(vi.mocked(mockDgraph.mutation)).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          id: existingConfig.id,
          value: 'New value',
        })
      );
    });
  });

  describe('delete', () => {
    it('should delete an AI config', async () => {
      const id = 'config-1';

      vi.mocked(mockDgraph.mutation).mockResolvedValue({
        deleteAIConfig: { aIConfig: [{ id }] },
      });

      const result = await repository.delete(id);

      expect(result).toBe(true);
      expect(vi.mocked(mockDgraph.mutation)).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ id })
      );
    });

    it('should handle deletion errors', async () => {
      vi.mocked(mockDgraph.mutation).mockRejectedValue(new Error('Deletion failed'));

      await expect(repository.delete('config-1')).rejects.toThrow('Failed to delete AI config');
    });
  });
});
