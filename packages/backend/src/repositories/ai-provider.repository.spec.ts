import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIProviderRepository, type AIProviderConfigData } from './ai-provider.repository';
import { DGraphService } from '../services/dgraph.service';
import { LoggerService, EncryptionService, AIProviderService, dgraphResolversTypes } from '@2ly/common';

describe('AIProviderRepository', () => {
  let repository: AIProviderRepository;
  let mockDGraphService: DGraphService;
  let mockLoggerService: LoggerService;
  let mockEncryptionService: EncryptionService;
  let mockAIProviderService: AIProviderService;

  beforeEach(() => {
    // Mock DGraphService
    mockDGraphService = {
      mutation: vi.fn(),
      query: vi.fn(),
      observe: vi.fn(),
    } as unknown as DGraphService;

    // Mock LoggerService
    mockLoggerService = {
      getLogger: vi.fn(() => ({
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      })),
    } as unknown as LoggerService;

    // Mock EncryptionService
    mockEncryptionService = {
      encrypt: vi.fn((val: string) => `encrypted_${val}`),
      decrypt: vi.fn((val: string) => val.replace('encrypted_', '')),
    } as unknown as EncryptionService;

    // Mock AIProviderService
    mockAIProviderService = {
      listProviderModels: vi.fn(),
      chat: vi.fn(),
      stream: vi.fn(),
      getProviderModel: vi.fn(),
      parseModelString: vi.fn(),
    } as unknown as AIProviderService;

    repository = new AIProviderRepository(
      mockDGraphService,
      mockLoggerService,
      mockEncryptionService,
      mockAIProviderService
    );
  });

  describe('Opportunity 5: Repository Upsert Logic', () => {
    describe('upsert() - create new provider', () => {
      it('should create new provider when none exists', async () => {
        const workspaceId = 'workspace-1';
        const data: AIProviderConfigData = {
          provider: dgraphResolversTypes.AiProviderType.Openai,
          encryptedApiKey: 'encrypted_key',
          baseUrl: null,
          availableModels: ['gpt-4o', 'gpt-4-turbo'],
        };

        // Mock findByType returning null (provider doesn't exist)
        vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
          getWorkspace: { aiProviders: [] },
        });

        // Mock create mutation
        const expectedProvider: dgraphResolversTypes.AiProviderConfig = {
          id: 'provider-1',
          provider: dgraphResolversTypes.AiProviderType.Openai,
          encryptedApiKey: 'encrypted_key',
          baseUrl: null,
          availableModels: ['gpt-4o', 'gpt-4-turbo'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          workspace: {
            id: workspaceId,
            name: 'Test Workspace',
            createdAt: '2024-01-01T00:00:00Z',
            system: { id: 'system-1', createdAt: '2024-01-01T00:00:00Z', initialized: true } as dgraphResolversTypes.System,
          },
        };

        vi.mocked(mockDGraphService.mutation).mockResolvedValueOnce({
          addAIProviderConfig: { aIProviderConfig: [expectedProvider] },
        });

        const result = await repository.upsert(workspaceId, data);

        expect(result).toEqual(expectedProvider);
        expect(mockDGraphService.query).toHaveBeenCalledTimes(1);
        expect(mockDGraphService.mutation).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            workspaceId,
            provider: data.provider,
            encryptedApiKey: data.encryptedApiKey,
            baseUrl: data.baseUrl,
            availableModels: data.availableModels,
          })
        );
      });

      it('should create provider with null encrypted key for Ollama', async () => {
        const workspaceId = 'workspace-1';
        const data: AIProviderConfigData = {
          provider: dgraphResolversTypes.AiProviderType.Ollama,
          encryptedApiKey: null,
          baseUrl: 'http://localhost:11434',
          availableModels: ['llama2', 'codellama'],
        };

        vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
          getWorkspace: { aiProviders: [] },
        });

        const expectedProvider: dgraphResolversTypes.AiProviderConfig = {
          id: 'provider-1',
          provider: dgraphResolversTypes.AiProviderType.Ollama,
          encryptedApiKey: null,
          baseUrl: 'http://localhost:11434',
          availableModels: ['llama2', 'codellama'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          workspace: {
            id: workspaceId,
            name: 'Test Workspace',
            createdAt: '2024-01-01T00:00:00Z',
            system: { id: 'system-1', createdAt: '2024-01-01T00:00:00Z', initialized: true } as dgraphResolversTypes.System,
          },
        };

        vi.mocked(mockDGraphService.mutation).mockResolvedValueOnce({
          addAIProviderConfig: { aIProviderConfig: [expectedProvider] },
        });

        const result = await repository.upsert(workspaceId, data);

        expect(result.encryptedApiKey).toBeNull();
        expect(result.baseUrl).toBe('http://localhost:11434');
      });
    });

    describe('upsert() - update existing provider', () => {
      it('should update existing provider when already configured', async () => {
        const workspaceId = 'workspace-1';
        const existingProvider: dgraphResolversTypes.AiProviderConfig = {
          id: 'provider-1',
          provider: dgraphResolversTypes.AiProviderType.Openai,
          encryptedApiKey: 'old_encrypted_key',
          baseUrl: null,
          availableModels: ['gpt-4'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          workspace: {
            id: workspaceId,
            name: 'Test Workspace',
            createdAt: '2024-01-01T00:00:00Z',
            system: { id: 'system-1', createdAt: '2024-01-01T00:00:00Z', initialized: true } as dgraphResolversTypes.System,
          },
        };

        const updateData: AIProviderConfigData = {
          provider: dgraphResolversTypes.AiProviderType.Openai,
          encryptedApiKey: 'new_encrypted_key',
          baseUrl: null,
          availableModels: ['gpt-4o', 'gpt-4-turbo'],
        };

        // Mock findByType returning existing provider
        vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
          getWorkspace: { aiProviders: [existingProvider] },
        });

        // Mock update mutation
        const updatedProvider: dgraphResolversTypes.AiProviderConfig = {
          ...existingProvider,
          encryptedApiKey: 'new_encrypted_key',
          availableModels: ['gpt-4o', 'gpt-4-turbo'],
          updatedAt: '2024-01-02T00:00:00Z',
        };

        vi.mocked(mockDGraphService.mutation).mockResolvedValueOnce({
          updateAIProviderConfig: { aIProviderConfig: [updatedProvider] },
        });

        const result = await repository.upsert(workspaceId, updateData);

        expect(result).toEqual(updatedProvider);
        expect(mockDGraphService.mutation).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            id: existingProvider.id,
            encryptedApiKey: 'new_encrypted_key',
            availableModels: ['gpt-4o', 'gpt-4-turbo'],
          })
        );
      });

      it('should preserve existing values when partial update provided', async () => {
        const workspaceId = 'workspace-1';
        const existingProvider: dgraphResolversTypes.AiProviderConfig = {
          id: 'provider-1',
          provider: dgraphResolversTypes.AiProviderType.Openai,
          encryptedApiKey: 'existing_key',
          baseUrl: 'https://custom.openai.com',
          availableModels: ['gpt-4o'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          workspace: {
            id: workspaceId,
            name: 'Test Workspace',
            createdAt: '2024-01-01T00:00:00Z',
            system: { id: 'system-1', createdAt: '2024-01-01T00:00:00Z', initialized: true } as dgraphResolversTypes.System,
          },
        };

        // Partial update - only updating availableModels
        const updateData: AIProviderConfigData = {
          provider: dgraphResolversTypes.AiProviderType.Openai,
          encryptedApiKey: undefined,
          baseUrl: undefined,
          availableModels: ['gpt-4o', 'gpt-4-turbo'],
        };

        vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
          getWorkspace: { aiProviders: [existingProvider] },
        });

        const updatedProvider: dgraphResolversTypes.AiProviderConfig = {
          ...existingProvider,
          availableModels: ['gpt-4o', 'gpt-4-turbo'],
          updatedAt: '2024-01-02T00:00:00Z',
        };

        vi.mocked(mockDGraphService.mutation).mockResolvedValueOnce({
          updateAIProviderConfig: { aIProviderConfig: [updatedProvider] },
        });

        await repository.upsert(workspaceId, updateData);

        // Should preserve existing encryptedApiKey and baseUrl
        expect(mockDGraphService.mutation).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            id: existingProvider.id,
            encryptedApiKey: 'existing_key', // Preserved
            baseUrl: 'https://custom.openai.com', // Preserved
            availableModels: ['gpt-4o', 'gpt-4-turbo'], // Updated
          })
        );
      });

      it('should preserve existing values when null is provided (nullish coalescing)', async () => {
        const workspaceId = 'workspace-1';
        const existingProvider: dgraphResolversTypes.AiProviderConfig = {
          id: 'provider-1',
          provider: dgraphResolversTypes.AiProviderType.Openai,
          encryptedApiKey: 'existing_key',
          baseUrl: 'https://custom.openai.com',
          availableModels: ['gpt-4o'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          workspace: {
            id: workspaceId,
            name: 'Test Workspace',
            createdAt: '2024-01-01T00:00:00Z',
            system: { id: 'system-1', createdAt: '2024-01-01T00:00:00Z', initialized: true } as dgraphResolversTypes.System,
          },
        };

        // NOTE: The upsert logic uses ?? operator, which treats null as falsy
        // So null values will NOT override existing values - only undefined preserves them
        const updateData: AIProviderConfigData = {
          provider: dgraphResolversTypes.AiProviderType.Openai,
          encryptedApiKey: 'new_key',
          baseUrl: null, // Will preserve existing baseUrl due to ?? operator
          availableModels: null, // Will preserve existing availableModels due to ?? operator
        };

        vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
          getWorkspace: { aiProviders: [existingProvider] },
        });

        const updatedProvider: dgraphResolversTypes.AiProviderConfig = {
          ...existingProvider,
          encryptedApiKey: 'new_key',
          // baseUrl and availableModels preserved from existing
          updatedAt: '2024-01-02T00:00:00Z',
        };

        vi.mocked(mockDGraphService.mutation).mockResolvedValueOnce({
          updateAIProviderConfig: { aIProviderConfig: [updatedProvider] },
        });

        await repository.upsert(workspaceId, updateData);

        // Verify existing values are preserved due to ?? operator
        const mutationCall = vi.mocked(mockDGraphService.mutation).mock.calls[0];
        expect(mutationCall[1]).toMatchObject({
          encryptedApiKey: 'new_key',
          baseUrl: 'https://custom.openai.com', // Preserved
          availableModels: ['gpt-4o'], // Preserved
        });
      });

      it('should update different provider types independently', async () => {
        const workspaceId = 'workspace-1';

        // OpenAI provider exists
        const _existingOpenAI: dgraphResolversTypes.AiProviderConfig = {
          id: 'provider-openai',
          provider: dgraphResolversTypes.AiProviderType.Openai,
          encryptedApiKey: 'openai_key',
          baseUrl: null,
          availableModels: ['gpt-4o'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          workspace: {
            id: workspaceId,
            name: 'Test Workspace',
            createdAt: '2024-01-01T00:00:00Z',
            system: { id: 'system-1', createdAt: '2024-01-01T00:00:00Z', initialized: true } as dgraphResolversTypes.System,
          },
        };

        // Updating Anthropic (new provider)
        const anthropicData: AIProviderConfigData = {
          provider: dgraphResolversTypes.AiProviderType.Anthropic,
          encryptedApiKey: 'anthropic_key',
          baseUrl: null,
          availableModels: ['claude-3-5-sonnet-20241022'],
        };

        // Mock findByType for Anthropic (not found)
        vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
          getWorkspace: { aiProviders: [] },
        });

        const newAnthropicProvider: dgraphResolversTypes.AiProviderConfig = {
          id: 'provider-anthropic',
          provider: dgraphResolversTypes.AiProviderType.Anthropic,
          encryptedApiKey: 'anthropic_key',
          baseUrl: null,
          availableModels: ['claude-3-5-sonnet-20241022'],
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          workspace: {
            id: workspaceId,
            name: 'Test Workspace',
            createdAt: '2024-01-01T00:00:00Z',
            system: { id: 'system-1', createdAt: '2024-01-01T00:00:00Z', initialized: true } as dgraphResolversTypes.System,
          },
        };

        vi.mocked(mockDGraphService.mutation).mockResolvedValueOnce({
          addAIProviderConfig: { aIProviderConfig: [newAnthropicProvider] },
        });

        const result = await repository.upsert(workspaceId, anthropicData);

        // Should create new Anthropic provider, not update OpenAI
        expect(result.provider).toBe(dgraphResolversTypes.AiProviderType.Anthropic);
        expect(mockDGraphService.mutation).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            provider: dgraphResolversTypes.AiProviderType.Anthropic,
          })
        );
      });
    });

    describe('error handling in upsert', () => {
      it('should throw error when create fails', async () => {
        const workspaceId = 'workspace-1';
        const data: AIProviderConfigData = {
          provider: dgraphResolversTypes.AiProviderType.Openai,
          encryptedApiKey: 'encrypted_key',
          baseUrl: null,
          availableModels: ['gpt-4o'],
        };

        vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
          getWorkspace: { aiProviders: [] },
        });

        vi.mocked(mockDGraphService.mutation).mockRejectedValueOnce(
          new Error('Database error')
        );

        await expect(repository.upsert(workspaceId, data)).rejects.toThrow('Failed to create AI provider');
      });

      it('should throw error when update fails', async () => {
        const workspaceId = 'workspace-1';
        const existingProvider: dgraphResolversTypes.AiProviderConfig = {
          id: 'provider-1',
          provider: dgraphResolversTypes.AiProviderType.Openai,
          encryptedApiKey: 'old_key',
          baseUrl: null,
          availableModels: ['gpt-4'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          workspace: {
            id: workspaceId,
            name: 'Test Workspace',
            createdAt: '2024-01-01T00:00:00Z',
            system: { id: 'system-1', createdAt: '2024-01-01T00:00:00Z', initialized: true } as dgraphResolversTypes.System,
          },
        };

        const updateData: AIProviderConfigData = {
          provider: dgraphResolversTypes.AiProviderType.Openai,
          encryptedApiKey: 'new_key',
          baseUrl: null,
          availableModels: ['gpt-4o'],
        };

        vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
          getWorkspace: { aiProviders: [existingProvider] },
        });

        vi.mocked(mockDGraphService.mutation).mockRejectedValueOnce(
          new Error('Database error')
        );

        await expect(repository.upsert(workspaceId, updateData)).rejects.toThrow('Failed to update AI provider');
      });
    });
  });

  describe('Opportunity 5: Default Model Management', () => {
    describe('setDefaultModel() - validation', () => {
      it('should validate model format (provider/model)', async () => {
        const workspaceId = 'workspace-1';
        const invalidFormat = 'gpt-4o'; // Missing provider prefix

        await expect(repository.setDefaultModel(workspaceId, invalidFormat)).rejects.toThrow(
          'Invalid model format: expected "provider/model"'
        );
      });

      it('should throw error when provider is missing', async () => {
        const workspaceId = 'workspace-1';
        const invalidFormat = '/gpt-4o'; // Empty provider

        await expect(repository.setDefaultModel(workspaceId, invalidFormat)).rejects.toThrow(
          'Invalid model format'
        );
      });

      it('should throw error when model name is missing', async () => {
        const workspaceId = 'workspace-1';
        const invalidFormat = 'openai/'; // Empty model

        await expect(repository.setDefaultModel(workspaceId, invalidFormat)).rejects.toThrow(
          'Invalid model format'
        );
      });

      it('should validate provider exists before setting default', async () => {
        const workspaceId = 'workspace-1';
        const providerModel = 'openai/gpt-4o';

        // Mock findByType returning null (provider not configured)
        vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
          getWorkspace: { aiProviders: [] },
        });

        await expect(repository.setDefaultModel(workspaceId, providerModel)).rejects.toThrow(
          'Provider "openai" is not configured for this workspace'
        );
      });

      it('should handle case insensitivity in provider name', async () => {
        const workspaceId = 'workspace-1';
        const providerModel = 'OpenAI/gpt-4o'; // Mixed case

        const existingProvider: dgraphResolversTypes.AiProviderConfig = {
          id: 'provider-1',
          provider: dgraphResolversTypes.AiProviderType.Openai,
          encryptedApiKey: 'encrypted_key',
          baseUrl: null,
          availableModels: ['gpt-4o'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          workspace: {
            id: workspaceId,
            name: 'Test Workspace',
            createdAt: '2024-01-01T00:00:00Z',
            system: { id: 'system-1', createdAt: '2024-01-01T00:00:00Z', initialized: true } as dgraphResolversTypes.System,
          },
        };

        vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
          getWorkspace: { aiProviders: [existingProvider] },
        });

        vi.mocked(mockDGraphService.mutation).mockResolvedValueOnce({
          updateWorkspace: {
            workspace: [{ id: workspaceId, defaultAIModel: 'OpenAI/gpt-4o' }],
          },
        });

        const result = await repository.setDefaultModel(workspaceId, providerModel);

        expect(result).toBe(true);
      });
    });

    describe('setDefaultModel() - success cases', () => {
      it('should set default model when provider is configured', async () => {
        const workspaceId = 'workspace-1';
        const providerModel = 'openai/gpt-4o';

        const existingProvider: dgraphResolversTypes.AiProviderConfig = {
          id: 'provider-1',
          provider: dgraphResolversTypes.AiProviderType.Openai,
          encryptedApiKey: 'encrypted_key',
          baseUrl: null,
          availableModels: ['gpt-4o', 'gpt-4-turbo'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          workspace: {
            id: workspaceId,
            name: 'Test Workspace',
            createdAt: '2024-01-01T00:00:00Z',
            system: { id: 'system-1', createdAt: '2024-01-01T00:00:00Z', initialized: true } as dgraphResolversTypes.System,
          },
        };

        vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
          getWorkspace: { aiProviders: [existingProvider] },
        });

        vi.mocked(mockDGraphService.mutation).mockResolvedValueOnce({
          updateWorkspace: {
            workspace: [{ id: workspaceId, defaultAIModel: providerModel }],
          },
        });

        const result = await repository.setDefaultModel(workspaceId, providerModel);

        expect(result).toBe(true);
        expect(mockDGraphService.mutation).toHaveBeenCalledWith(
          expect.anything(),
          {
            workspaceId,
            providerModel,
          }
        );
      });

      it('should set default model for Anthropic provider', async () => {
        const workspaceId = 'workspace-1';
        const providerModel = 'anthropic/claude-3-5-sonnet-20241022';

        const existingProvider: dgraphResolversTypes.AiProviderConfig = {
          id: 'provider-1',
          provider: dgraphResolversTypes.AiProviderType.Anthropic,
          encryptedApiKey: 'encrypted_key',
          baseUrl: null,
          availableModels: ['claude-3-5-sonnet-20241022'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          workspace: {
            id: workspaceId,
            name: 'Test Workspace',
            createdAt: '2024-01-01T00:00:00Z',
            system: { id: 'system-1', createdAt: '2024-01-01T00:00:00Z', initialized: true } as dgraphResolversTypes.System,
          },
        };

        vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
          getWorkspace: { aiProviders: [existingProvider] },
        });

        vi.mocked(mockDGraphService.mutation).mockResolvedValueOnce({
          updateWorkspace: {
            workspace: [{ id: workspaceId, defaultAIModel: providerModel }],
          },
        });

        const result = await repository.setDefaultModel(workspaceId, providerModel);

        expect(result).toBe(true);
      });

      it('should set default model for Ollama provider', async () => {
        const workspaceId = 'workspace-1';
        const providerModel = 'ollama/llama2';

        const existingProvider: dgraphResolversTypes.AiProviderConfig = {
          id: 'provider-1',
          provider: dgraphResolversTypes.AiProviderType.Ollama,
          encryptedApiKey: null,
          baseUrl: 'http://localhost:11434',
          availableModels: ['llama2', 'codellama'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          workspace: {
            id: workspaceId,
            name: 'Test Workspace',
            createdAt: '2024-01-01T00:00:00Z',
            system: { id: 'system-1', createdAt: '2024-01-01T00:00:00Z', initialized: true } as dgraphResolversTypes.System,
          },
        };

        vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
          getWorkspace: { aiProviders: [existingProvider] },
        });

        vi.mocked(mockDGraphService.mutation).mockResolvedValueOnce({
          updateWorkspace: {
            workspace: [{ id: workspaceId, defaultAIModel: providerModel }],
          },
        });

        const result = await repository.setDefaultModel(workspaceId, providerModel);

        expect(result).toBe(true);
      });

      it('should allow setting default for model with slashes in name', async () => {
        const workspaceId = 'workspace-1';
        const providerModel = 'google/models/gemini-pro';

        const existingProvider: dgraphResolversTypes.AiProviderConfig = {
          id: 'provider-1',
          provider: dgraphResolversTypes.AiProviderType.Google,
          encryptedApiKey: 'encrypted_key',
          baseUrl: null,
          availableModels: ['models/gemini-pro'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          workspace: {
            id: workspaceId,
            name: 'Test Workspace',
            createdAt: '2024-01-01T00:00:00Z',
            system: { id: 'system-1', createdAt: '2024-01-01T00:00:00Z', initialized: true } as dgraphResolversTypes.System,
          },
        };

        vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
          getWorkspace: { aiProviders: [existingProvider] },
        });

        vi.mocked(mockDGraphService.mutation).mockResolvedValueOnce({
          updateWorkspace: {
            workspace: [{ id: workspaceId, defaultAIModel: providerModel }],
          },
        });

        const result = await repository.setDefaultModel(workspaceId, providerModel);

        expect(result).toBe(true);
      });
    });

    describe('setDefaultModel() - error handling', () => {
      it('should throw error when database mutation fails', async () => {
        const workspaceId = 'workspace-1';
        const providerModel = 'openai/gpt-4o';

        const existingProvider: dgraphResolversTypes.AiProviderConfig = {
          id: 'provider-1',
          provider: dgraphResolversTypes.AiProviderType.Openai,
          encryptedApiKey: 'encrypted_key',
          baseUrl: null,
          availableModels: ['gpt-4o'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          workspace: {
            id: workspaceId,
            name: 'Test Workspace',
            createdAt: '2024-01-01T00:00:00Z',
            system: { id: 'system-1', createdAt: '2024-01-01T00:00:00Z', initialized: true } as dgraphResolversTypes.System,
          },
        };

        vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
          getWorkspace: { aiProviders: [existingProvider] },
        });

        vi.mocked(mockDGraphService.mutation).mockRejectedValueOnce(
          new Error('Database error')
        );

        await expect(repository.setDefaultModel(workspaceId, providerModel)).rejects.toThrow(
          'Failed to update workspace default model'
        );
      });

      it('should throw error when workspace does not exist', async () => {
        const workspaceId = 'non-existent-workspace';
        const providerModel = 'openai/gpt-4o';

        vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
          getWorkspace: null,
        });

        await expect(repository.setDefaultModel(workspaceId, providerModel)).rejects.toThrow(
          'Provider "openai" is not configured for this workspace'
        );
      });
    });
  });

  describe('Additional Repository Methods', () => {
    describe('findByType()', () => {
      it('should find provider by type', async () => {
        const workspaceId = 'workspace-1';
        const provider = dgraphResolversTypes.AiProviderType.Openai;

        const mockProvider: dgraphResolversTypes.AiProviderConfig = {
          id: 'provider-1',
          provider: dgraphResolversTypes.AiProviderType.Openai,
          encryptedApiKey: 'encrypted_key',
          baseUrl: null,
          availableModels: ['gpt-4o'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          workspace: {
            id: workspaceId,
            name: 'Test Workspace',
            createdAt: '2024-01-01T00:00:00Z',
            system: { id: 'system-1', createdAt: '2024-01-01T00:00:00Z', initialized: true } as dgraphResolversTypes.System,
          },
        };

        vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
          getWorkspace: { aiProviders: [mockProvider] },
        });

        const result = await repository.findByType(workspaceId, provider);

        expect(result).toEqual(mockProvider);
      });

      it('should return null when provider not found', async () => {
        const workspaceId = 'workspace-1';
        const provider = dgraphResolversTypes.AiProviderType.Openai;

        vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
          getWorkspace: { aiProviders: [] },
        });

        const result = await repository.findByType(workspaceId, provider);

        expect(result).toBeNull();
      });

      it('should throw error when query fails', async () => {
        const workspaceId = 'workspace-1';
        const provider = dgraphResolversTypes.AiProviderType.Openai;

        vi.mocked(mockDGraphService.query).mockRejectedValueOnce(
          new Error('Database error')
        );

        await expect(repository.findByType(workspaceId, provider)).rejects.toThrow(
          'Failed to find AI provider'
        );
      });
    });

    describe('listAllModels()', () => {
      it('should list all models from all configured providers', async () => {
        const workspaceId = 'workspace-1';

        const mockProviders: dgraphResolversTypes.AiProviderConfig[] = [
          {
            id: 'provider-1',
            provider: dgraphResolversTypes.AiProviderType.Openai,
            encryptedApiKey: 'key1',
            baseUrl: null,
            availableModels: ['gpt-4o', 'gpt-4-turbo'],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            workspace: {
            id: workspaceId,
            name: 'Test Workspace',
            createdAt: '2024-01-01T00:00:00Z',
            system: { id: 'system-1', createdAt: '2024-01-01T00:00:00Z', initialized: true } as dgraphResolversTypes.System,
          },
          },
          {
            id: 'provider-2',
            provider: dgraphResolversTypes.AiProviderType.Anthropic,
            encryptedApiKey: 'key2',
            baseUrl: null,
            availableModels: ['claude-3-5-sonnet-20241022'],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            workspace: {
            id: workspaceId,
            name: 'Test Workspace',
            createdAt: '2024-01-01T00:00:00Z',
            system: { id: 'system-1', createdAt: '2024-01-01T00:00:00Z', initialized: true } as dgraphResolversTypes.System,
          },
          },
        ];

        vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
          getWorkspace: { aiProviders: mockProviders },
        });

        const result = await repository.listAllModels(workspaceId);

        expect(result).toEqual([
          'openai/gpt-4o',
          'openai/gpt-4-turbo',
          'anthropic/claude-3-5-sonnet-20241022',
        ]);
      });

      it('should skip providers with no models', async () => {
        const workspaceId = 'workspace-1';

        const mockProviders: dgraphResolversTypes.AiProviderConfig[] = [
          {
            id: 'provider-1',
            provider: dgraphResolversTypes.AiProviderType.Openai,
            encryptedApiKey: 'key1',
            baseUrl: null,
            availableModels: ['gpt-4o'],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            workspace: {
            id: workspaceId,
            name: 'Test Workspace',
            createdAt: '2024-01-01T00:00:00Z',
            system: { id: 'system-1', createdAt: '2024-01-01T00:00:00Z', initialized: true } as dgraphResolversTypes.System,
          },
          },
          {
            id: 'provider-2',
            provider: dgraphResolversTypes.AiProviderType.Anthropic,
            encryptedApiKey: 'key2',
            baseUrl: null,
            availableModels: null, // No models
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            workspace: {
            id: workspaceId,
            name: 'Test Workspace',
            createdAt: '2024-01-01T00:00:00Z',
            system: { id: 'system-1', createdAt: '2024-01-01T00:00:00Z', initialized: true } as dgraphResolversTypes.System,
          },
          },
        ];

        vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
          getWorkspace: { aiProviders: mockProviders },
        });

        const result = await repository.listAllModels(workspaceId);

        expect(result).toEqual(['openai/gpt-4o']);
      });
    });

    describe('removeByType()', () => {
      it('should remove provider by type', async () => {
        const workspaceId = 'workspace-1';
        const provider = dgraphResolversTypes.AiProviderType.Openai;

        const existingProvider: dgraphResolversTypes.AiProviderConfig = {
          id: 'provider-1',
          provider: dgraphResolversTypes.AiProviderType.Openai,
          encryptedApiKey: 'encrypted_key',
          baseUrl: null,
          availableModels: ['gpt-4o'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          workspace: {
            id: workspaceId,
            name: 'Test Workspace',
            createdAt: '2024-01-01T00:00:00Z',
            system: { id: 'system-1', createdAt: '2024-01-01T00:00:00Z', initialized: true } as dgraphResolversTypes.System,
          },
        };

        vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
          getWorkspace: { aiProviders: [existingProvider] },
        });

        vi.mocked(mockDGraphService.mutation).mockResolvedValueOnce({
          deleteAIProviderConfig: { aIProviderConfig: [{ id: 'provider-1' }] },
        });

        const result = await repository.removeByType(workspaceId, provider);

        expect(result).toBe(true);
        expect(mockDGraphService.mutation).toHaveBeenCalledWith(
          expect.anything(),
          { id: 'provider-1' }
        );
      });

      it('should return false when provider does not exist', async () => {
        const workspaceId = 'workspace-1';
        const provider = dgraphResolversTypes.AiProviderType.Openai;

        vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
          getWorkspace: { aiProviders: [] },
        });

        const result = await repository.removeByType(workspaceId, provider);

        expect(result).toBe(false);
        expect(mockDGraphService.mutation).not.toHaveBeenCalled();
      });
    });
  });
});
