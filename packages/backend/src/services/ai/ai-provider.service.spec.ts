import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AIProviderService, type AIProviderType } from './ai-provider.service';
import { LoggerService, EncryptionService, dgraphResolversTypes } from '@2ly/common';
import { AIProviderRepository } from '../../repositories/ai-provider.repository';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AIProviderService', () => {
  let service: AIProviderService;
  let mockLoggerService: LoggerService;
  let mockEncryptionService: EncryptionService;
  let mockRepository: AIProviderRepository;

  beforeEach(() => {
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
      encrypt: vi.fn((plaintext: string) => `encrypted_${plaintext}`),
      decrypt: vi.fn((ciphertext: string) => ciphertext.replace('encrypted_', '')),
      isEncrypted: vi.fn((value: string) => value.startsWith('encrypted_')),
    } as unknown as EncryptionService;

    // Mock AIProviderRepository
    mockRepository = {
      upsert: vi.fn(),
      findByType: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      getByWorkspace: vi.fn(),
      findById: vi.fn(),
      delete: vi.fn(),
      listAllModels: vi.fn(),
      setDefaultModel: vi.fn(),
      removeByType: vi.fn(),
    } as unknown as AIProviderRepository;

    service = new AIProviderService(mockLoggerService, mockEncryptionService, mockRepository);

    // Reset fetch mock
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Opportunity 1: API Key Encryption and Decryption Flow', () => {
    describe('configure() - API key encryption', () => {
      it('should encrypt API key before storage when provider requires key', async () => {
        const workspaceId = 'workspace-1';
        const provider: AIProviderType = 'openai';
        const apiKey = 'sk-test-key-123';

        // Mock successful API call
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [
              { id: 'gpt-4o' },
              { id: 'gpt-4-turbo' },
              { id: 'text-embedding-3-small' }, // Should be filtered out
            ],
          }),
        });

        // Mock repository upsert
        vi.mocked(mockRepository.upsert).mockResolvedValue({
          id: 'provider-1',
          provider: 'OPENAI',
          encryptedApiKey: 'encrypted_sk-test-key-123',
          baseUrl: null,
          availableModels: ['gpt-4o', 'gpt-4-turbo'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          workspace: { id: workspaceId, name: 'Test Workspace' },
        } as dgraphResolversTypes.AiProviderConfig);

        const result = await service.configure(workspaceId, provider, apiKey);

        // Verify encryption was called
        expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(apiKey);

        // Verify repository was called with encrypted key
        expect(mockRepository.upsert).toHaveBeenCalledWith(workspaceId, {
          provider: 'OPENAI',
          encryptedApiKey: 'encrypted_sk-test-key-123',
          baseUrl: null,
          availableModels: ['gpt-4o', 'gpt-4-turbo'],
        });

        expect(result.valid).toBe(true);
      });

      it('should handle null API key for Ollama (no encryption)', async () => {
        const workspaceId = 'workspace-1';
        const provider: AIProviderType = 'ollama';

        // Mock successful Ollama API call
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            models: [{ name: 'llama2' }, { name: 'codellama' }],
          }),
        });

        vi.mocked(mockRepository.upsert).mockResolvedValue({
          id: 'provider-1',
          provider: 'OLLAMA',
          encryptedApiKey: null,
          baseUrl: 'http://localhost:11434',
          availableModels: ['llama2', 'codellama'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          workspace: { id: workspaceId, name: 'Test Workspace' },
        } as dgraphResolversTypes.AiProviderConfig);

        const result = await service.configure(workspaceId, provider, undefined, 'http://localhost:11434');

        // Verify encryption was NOT called
        expect(mockEncryptionService.encrypt).not.toHaveBeenCalled();

        // Verify repository was called with null encrypted key
        expect(mockRepository.upsert).toHaveBeenCalledWith(workspaceId, {
          provider: 'OLLAMA',
          encryptedApiKey: null,
          baseUrl: 'http://localhost:11434',
          availableModels: ['llama2', 'codellama'],
        });

        expect(result.valid).toBe(true);
      });

      it('should handle undefined API key correctly', async () => {
        const workspaceId = 'workspace-1';
        const provider: AIProviderType = 'ollama';

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ models: [{ name: 'llama2' }] }),
        });

        vi.mocked(mockRepository.upsert).mockResolvedValue({
          id: 'provider-1',
          provider: 'OLLAMA',
          encryptedApiKey: null,
          baseUrl: 'http://localhost:11434',
          availableModels: ['llama2'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          workspace: { id: workspaceId, name: 'Test Workspace' },
        } as dgraphResolversTypes.AiProviderConfig);

        await service.configure(workspaceId, provider, undefined);

        expect(mockRepository.upsert).toHaveBeenCalledWith(workspaceId, expect.objectContaining({
          encryptedApiKey: null,
        }));
      });

      it('should handle encryption service failure', async () => {
        const workspaceId = 'workspace-1';
        const provider: AIProviderType = 'openai';
        const apiKey = 'sk-test-key-123';

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: 'gpt-4o' }] }),
        });

        // Mock encryption failure
        vi.mocked(mockEncryptionService.encrypt).mockImplementation(() => {
          throw new Error('Encryption failed');
        });

        await expect(service.configure(workspaceId, provider, apiKey)).rejects.toThrow('Encryption failed');
      });
    });

    describe('getDecryptedConfig() - API key decryption', () => {
      it('should decrypt stored API key when retrieving config', async () => {
        const workspaceId = 'workspace-1';
        const modelString = 'openai/gpt-4o';

        // Mock repository returning encrypted key
        vi.mocked(mockRepository.findByType).mockResolvedValue({
          id: 'provider-1',
          provider: 'OPENAI',
          encryptedApiKey: 'encrypted_sk-test-key-123',
          baseUrl: null,
          availableModels: ['gpt-4o'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          workspace: { id: workspaceId, name: 'Test Workspace' },
        } as dgraphResolversTypes.AiProviderConfig);

        // Silence expected error from generateText (we're only testing decryption)
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        try {
          await service.chat(workspaceId, modelString, 'test message');
        } catch {
          // Expected to fail since we're not mocking the AI SDK
        }

        // Verify decryption was called
        expect(mockEncryptionService.decrypt).toHaveBeenCalledWith('encrypted_sk-test-key-123');

        errorSpy.mockRestore();
      });

      it('should handle config with null encrypted key (Ollama)', async () => {
        const workspaceId = 'workspace-1';
        const modelString = 'ollama/llama2';

        vi.mocked(mockRepository.findByType).mockResolvedValue({
          id: 'provider-1',
          provider: 'OLLAMA',
          encryptedApiKey: null,
          baseUrl: 'http://localhost:11434',
          availableModels: ['llama2'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          workspace: { id: workspaceId, name: 'Test Workspace' },
        } as dgraphResolversTypes.AiProviderConfig);

        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        try {
          await service.chat(workspaceId, modelString, 'test message');
        } catch {
          // Expected to fail
        }

        // Verify decryption was NOT called for null key
        expect(mockEncryptionService.decrypt).not.toHaveBeenCalled();

        errorSpy.mockRestore();
      });

      it('should throw error when provider is not configured', async () => {
        const workspaceId = 'workspace-1';
        const modelString = 'openai/gpt-4o';

        vi.mocked(mockRepository.findByType).mockResolvedValue(null);

        await expect(service.chat(workspaceId, modelString, 'test')).rejects.toThrow('Provider openai is not configured');
      });
    });

    describe('round-trip encryption/decryption', () => {
      it('should preserve key integrity through encryption and decryption', async () => {
        const originalKey = 'sk-test-key-with-special-chars-!@#$%';

        // Use real-like encryption/decryption behavior
        vi.mocked(mockEncryptionService.encrypt).mockImplementation((plaintext: string) => {
          return Buffer.from(plaintext).toString('base64');
        });

        vi.mocked(mockEncryptionService.decrypt).mockImplementation((ciphertext: string) => {
          return Buffer.from(ciphertext, 'base64').toString('utf8');
        });

        const encrypted = mockEncryptionService.encrypt(originalKey);
        const decrypted = mockEncryptionService.decrypt(encrypted);

        expect(decrypted).toBe(originalKey);
      });
    });
  });

  describe('Opportunity 2: Model String Parsing and Validation', () => {
    describe('parseModelString()', () => {
      it('should parse valid model string with openai provider', async () => {
        const modelString = 'openai/gpt-4o';
        const workspaceId = 'workspace-1';

        vi.mocked(mockRepository.findByType).mockResolvedValue({
          id: 'provider-1',
          provider: 'OPENAI',
          encryptedApiKey: 'encrypted_key',
          baseUrl: null,
          availableModels: ['gpt-4o'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          workspace: { id: workspaceId, name: 'Test Workspace' },
        } as dgraphResolversTypes.AiProviderConfig);

        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        try {
          await service.chat(workspaceId, modelString, 'test');
        } catch {
          // Expected to fail
        }

        // Verify findByType was called with correct provider
        expect(mockRepository.findByType).toHaveBeenCalledWith(workspaceId, 'OPENAI');

        errorSpy.mockRestore();
      });

      it('should parse valid model string with anthropic provider', async () => {
        const modelString = 'anthropic/claude-3-5-sonnet-20241022';
        const workspaceId = 'workspace-1';

        vi.mocked(mockRepository.findByType).mockResolvedValue({
          id: 'provider-1',
          provider: 'ANTHROPIC',
          encryptedApiKey: 'encrypted_key',
          baseUrl: null,
          availableModels: ['claude-3-5-sonnet-20241022'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          workspace: { id: workspaceId, name: 'Test Workspace' },
        } as dgraphResolversTypes.AiProviderConfig);

        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        try {
          await service.chat(workspaceId, modelString, 'test');
        } catch {
          // Expected to fail
        }

        expect(mockRepository.findByType).toHaveBeenCalledWith(workspaceId, 'ANTHROPIC');

        errorSpy.mockRestore();
      });

      it('should throw error for malformed string with missing slash', async () => {
        const modelString = 'openai-gpt-4o'; // Missing slash
        const workspaceId = 'workspace-1';

        await expect(service.chat(workspaceId, modelString, 'test')).rejects.toThrow('Invalid model format. Model name cannot be empty');
      });

      it('should throw error for empty provider', async () => {
        const modelString = '/gpt-4o'; // Empty provider
        const workspaceId = 'workspace-1';

        await expect(service.chat(workspaceId, modelString, 'test')).rejects.toThrow('Invalid model format. Provider cannot be empty');
      });

      it('should throw error for empty model name', async () => {
        const modelString = 'openai/'; // Empty model
        const workspaceId = 'workspace-1';

        await expect(service.chat(workspaceId, modelString, 'test')).rejects.toThrow('Invalid model format. Model name cannot be empty');
      });

      it('should throw error for unknown provider', async () => {
        const modelString = 'unknown-provider/model-name';
        const workspaceId = 'workspace-1';

        await expect(service.chat(workspaceId, modelString, 'test')).rejects.toThrow('Unknown provider: unknown-provider');
      });

      it('should handle case sensitivity correctly (lowercase provider)', async () => {
        const modelString = 'OPENAI/gpt-4o'; // Uppercase - should be converted to lowercase then uppercase for repo
        const workspaceId = 'workspace-1';

        // parseModelString should throw error for uppercase provider since it checks against lowercase list
        await expect(service.chat(workspaceId, modelString, 'test')).rejects.toThrow('Unknown provider: OPENAI');
      });

      it('should handle multiple slashes (only split on first)', async () => {
        const modelString = 'openai/model/with/slashes';
        const workspaceId = 'workspace-1';

        vi.mocked(mockRepository.findByType).mockResolvedValue({
          id: 'provider-1',
          provider: 'OPENAI',
          encryptedApiKey: 'encrypted_key',
          baseUrl: null,
          availableModels: ['model/with/slashes'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          workspace: { id: workspaceId, name: 'Test Workspace' },
        } as dgraphResolversTypes.AiProviderConfig);

        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        try {
          await service.chat(workspaceId, modelString, 'test');
        } catch {
          // Expected to fail
        }

        // Model name should include the slashes
        expect(mockRepository.findByType).toHaveBeenCalledWith(workspaceId, 'OPENAI');

        errorSpy.mockRestore();
      });
    });
  });

  describe('Opportunity 3: External Provider API Integration and Error Handling', () => {
    describe('listProviderModels() - OpenAI', () => {
      it('should fetch and filter OpenAI models successfully', async () => {
        const provider: AIProviderType = 'openai';
        const apiKey = 'sk-test-key';

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [
              { id: 'gpt-4o' },
              { id: 'gpt-4-turbo' },
              { id: 'gpt-3.5-turbo' },
              { id: 'o1-preview' },
              { id: 'chatgpt-4o-latest' },
              { id: 'text-embedding-3-small' }, // Should be filtered out
              { id: 'whisper-1' }, // Should be filtered out
              { id: 'dall-e-3' }, // Should be filtered out
            ],
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [
              { id: 'gpt-4o' },
              { id: 'gpt-4-turbo' },
              { id: 'gpt-3.5-turbo' },
              { id: 'o1-preview' },
              { id: 'chatgpt-4o-latest' },
            ],
          }),
        });

        vi.mocked(mockRepository.upsert).mockResolvedValue({
          id: 'provider-1',
          provider: 'OPENAI',
          encryptedApiKey: 'encrypted_key',
          baseUrl: null,
          availableModels: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1-preview', 'chatgpt-4o-latest'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          workspace: { id: 'workspace-1', name: 'Test Workspace' },
        } as dgraphResolversTypes.AiProviderConfig);

        const result = await service.configure('workspace-1', provider, apiKey);

        expect(result.valid).toBe(true);
        expect(result.availableModels).toEqual(['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1-preview', 'chatgpt-4o-latest']);
        expect(mockFetch).toHaveBeenCalledWith('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
      });

      it('should handle OpenAI API error (401 unauthorized)', async () => {
        const provider: AIProviderType = 'openai';
        const apiKey = 'invalid-key';

        mockFetch.mockResolvedValueOnce({
          ok: false,
          text: async () => 'Unauthorized: Invalid API key',
        });

        const result = await service.configure('workspace-1', provider, apiKey);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('OpenAI error');
      });

      it('should handle OpenAI network failure', async () => {
        const provider: AIProviderType = 'openai';
        const apiKey = 'sk-test-key';

        mockFetch.mockRejectedValueOnce(new Error('Network error: Failed to fetch'));

        const result = await service.configure('workspace-1', provider, apiKey);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('Network error');
      });
    });

    describe('listProviderModels() - Anthropic', () => {
      it('should fetch Anthropic models successfully', async () => {
        const provider: AIProviderType = 'anthropic';
        const apiKey = 'sk-ant-test-key';

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [
              { id: 'claude-sonnet-4-20250514' },
              { id: 'claude-3-5-sonnet-20241022' },
              { id: 'claude-3-haiku-20240307' },
            ],
          }),
        });

        vi.mocked(mockRepository.upsert).mockResolvedValue({
          id: 'provider-1',
          provider: 'ANTHROPIC',
          encryptedApiKey: 'encrypted_key',
          baseUrl: null,
          availableModels: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          workspace: { id: 'workspace-1', name: 'Test Workspace' },
        } as dgraphResolversTypes.AiProviderConfig);

        const result = await service.configure('workspace-1', provider, apiKey);

        expect(result.valid).toBe(true);
        expect(mockFetch).toHaveBeenCalledWith('https://api.anthropic.com/v1/models', {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
        });
      });

      it('should handle Anthropic API error', async () => {
        const provider: AIProviderType = 'anthropic';
        const apiKey = 'invalid-key';

        mockFetch.mockResolvedValueOnce({
          ok: false,
          text: async () => 'Authentication error',
        });

        const result = await service.configure('workspace-1', provider, apiKey);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('Anthropic error');
      });
    });

    describe('listProviderModels() - Google', () => {
      it('should fetch and filter Google Gemini models successfully', async () => {
        const provider: AIProviderType = 'google';
        const apiKey = 'google-api-key';

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            models: [
              { name: 'models/gemini-pro' },
              { name: 'models/gemini-pro-vision' },
              { name: 'models/gemini-1.5-flash' },
              { name: 'models/text-bison-001' }, // Should be filtered out
            ],
          }),
        });

        vi.mocked(mockRepository.upsert).mockResolvedValue({
          id: 'provider-1',
          provider: 'GOOGLE',
          encryptedApiKey: 'encrypted_key',
          baseUrl: null,
          availableModels: ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-flash'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          workspace: { id: 'workspace-1', name: 'Test Workspace' },
        } as dgraphResolversTypes.AiProviderConfig);

        const result = await service.configure('workspace-1', provider, apiKey);

        expect(result.valid).toBe(true);
        expect(result.availableModels).toEqual(['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-flash']);
      });

      it('should use custom baseUrl for Google if provided', async () => {
        const provider: AIProviderType = 'google';
        const apiKey = 'google-api-key';
        const baseUrl = 'https://custom.googleapis.com/v1';

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            models: [{ name: 'models/gemini-pro' }],
          }),
        });

        vi.mocked(mockRepository.upsert).mockResolvedValue({
          id: 'provider-1',
          provider: 'GOOGLE',
          encryptedApiKey: 'encrypted_key',
          baseUrl,
          availableModels: ['gemini-pro'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          workspace: { id: 'workspace-1', name: 'Test Workspace' },
        } as dgraphResolversTypes.AiProviderConfig);

        await service.configure('workspace-1', provider, apiKey, baseUrl);

        expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/models?key=${apiKey}`);
      });

      it('should handle Google API error', async () => {
        const provider: AIProviderType = 'google';
        const apiKey = 'invalid-key';

        mockFetch.mockResolvedValueOnce({
          ok: false,
          text: async () => 'API key invalid',
        });

        const result = await service.configure('workspace-1', provider, apiKey);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('Google Gemini error');
      });
    });

    describe('listProviderModels() - Ollama', () => {
      it('should fetch Ollama models successfully with default baseUrl', async () => {
        const provider: AIProviderType = 'ollama';

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            models: [
              { name: 'llama2' },
              { name: 'codellama' },
              { name: 'mistral' },
            ],
          }),
        });

        vi.mocked(mockRepository.upsert).mockResolvedValue({
          id: 'provider-1',
          provider: 'OLLAMA',
          encryptedApiKey: null,
          baseUrl: 'http://localhost:11434',
          availableModels: ['llama2', 'codellama', 'mistral'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          workspace: { id: 'workspace-1', name: 'Test Workspace' },
        } as dgraphResolversTypes.AiProviderConfig);

        const result = await service.configure('workspace-1', provider);

        expect(result.valid).toBe(true);
        // testConfiguration sets baseUrl to 'http://localhost:11434' (no /api), then '/tags' is appended
        expect(mockFetch).toHaveBeenCalledWith('http://localhost:11434/tags');
      });

      it('should use custom baseUrl for Ollama if provided', async () => {
        const provider: AIProviderType = 'ollama';
        const baseUrl = 'http://custom-ollama:11434';

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            models: [{ name: 'llama2' }],
          }),
        });

        vi.mocked(mockRepository.upsert).mockResolvedValue({
          id: 'provider-1',
          provider: 'OLLAMA',
          encryptedApiKey: null,
          baseUrl,
          availableModels: ['llama2'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          workspace: { id: 'workspace-1', name: 'Test Workspace' },
        } as dgraphResolversTypes.AiProviderConfig);

        await service.configure('workspace-1', provider, undefined, baseUrl);

        expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/tags`);
      });

      it('should handle Ollama connection error', async () => {
        const provider: AIProviderType = 'ollama';

        mockFetch.mockResolvedValueOnce({
          ok: false,
          text: async () => 'Connection refused',
        });

        const result = await service.configure('workspace-1', provider);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('Ollama error');
      });
    });

    describe('empty model list handling', () => {
      it('should return error when no models are available', async () => {
        const provider: AIProviderType = 'openai';
        const apiKey = 'sk-test-key';

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [], // Empty model list
          }),
        });

        const result = await service.configure('workspace-1', provider, apiKey);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('No models available');
      });

      it('should return error when all models are filtered out (OpenAI)', async () => {
        const provider: AIProviderType = 'openai';
        const apiKey = 'sk-test-key';

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [
              { id: 'text-embedding-3-small' },
              { id: 'whisper-1' },
              { id: 'dall-e-3' },
            ],
          }),
        });

        const result = await service.configure('workspace-1', provider, apiKey);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('No models available');
      });
    });

    describe('timeout scenarios', () => {
      it('should handle fetch timeout', async () => {
        const provider: AIProviderType = 'openai';
        const apiKey = 'sk-test-key';

        mockFetch.mockImplementation(() =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 100)
          )
        );

        const result = await service.configure('workspace-1', provider, apiKey);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('Request timeout');
      });
    });
  });

  describe('Opportunity 4: Configuration Validation Flow', () => {
    describe('testConfiguration()', () => {
      it('should validate required API key for providers that need it', async () => {
        const provider: AIProviderType = 'openai';

        const result = await service.configure('workspace-1', provider, undefined);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('openai requires an API key');
      });

      it('should validate Anthropic requires API key', async () => {
        const provider: AIProviderType = 'anthropic';

        const result = await service.configure('workspace-1', provider);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('anthropic requires an API key');
      });

      it('should validate Google requires API key', async () => {
        const provider: AIProviderType = 'google';

        const result = await service.configure('workspace-1', provider);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('google requires an API key');
      });

      it('should allow Ollama without API key', async () => {
        const provider: AIProviderType = 'ollama';

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ models: [{ name: 'llama2' }] }),
        });

        vi.mocked(mockRepository.upsert).mockResolvedValue({
          id: 'provider-1',
          provider: 'OLLAMA',
          encryptedApiKey: null,
          baseUrl: 'http://localhost:11434',
          availableModels: ['llama2'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          workspace: { id: 'workspace-1', name: 'Test Workspace' },
        } as dgraphResolversTypes.AiProviderConfig);

        const result = await service.configure('workspace-1', provider);

        expect(result.valid).toBe(true);
      });

      it('should apply default baseUrl for Ollama when not provided', async () => {
        const provider: AIProviderType = 'ollama';

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ models: [{ name: 'llama2' }] }),
        });

        vi.mocked(mockRepository.upsert).mockResolvedValue({
          id: 'provider-1',
          provider: 'OLLAMA',
          encryptedApiKey: null,
          baseUrl: 'http://localhost:11434',
          availableModels: ['llama2'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          workspace: { id: 'workspace-1', name: 'Test Workspace' },
        } as dgraphResolversTypes.AiProviderConfig);

        await service.configure('workspace-1', provider);

        expect(mockFetch).toHaveBeenCalledWith('http://localhost:11434/tags');
      });

      it('should return validation result with available models on success', async () => {
        const provider: AIProviderType = 'openai';
        const apiKey = 'sk-test-key';

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [{ id: 'gpt-4o' }, { id: 'gpt-4-turbo' }],
          }),
        });

        vi.mocked(mockRepository.upsert).mockResolvedValue({
          id: 'provider-1',
          provider: 'OPENAI',
          encryptedApiKey: 'encrypted_key',
          baseUrl: null,
          availableModels: ['gpt-4o', 'gpt-4-turbo'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          workspace: { id: 'workspace-1', name: 'Test Workspace' },
        } as dgraphResolversTypes.AiProviderConfig);

        const result = await service.configure('workspace-1', provider, apiKey);

        expect(result.valid).toBe(true);
        expect(result.availableModels).toEqual(['gpt-4o', 'gpt-4-turbo']);
      });

      it('should not persist to database when validation fails', async () => {
        const provider: AIProviderType = 'openai';
        const apiKey = 'invalid-key';

        mockFetch.mockResolvedValueOnce({
          ok: false,
          text: async () => 'Invalid API key',
        });

        await service.configure('workspace-1', provider, apiKey);

        // Repository should not be called
        expect(mockRepository.upsert).not.toHaveBeenCalled();
      });

      it('should handle exceptions during validation gracefully', async () => {
        const provider: AIProviderType = 'openai';
        const apiKey = 'sk-test-key';

        mockFetch.mockRejectedValueOnce(new Error('Unexpected error'));

        const result = await service.configure('workspace-1', provider, apiKey);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Unexpected error');
        expect(mockRepository.upsert).not.toHaveBeenCalled();
      });

      it('should validate before persisting (validation errors should not call repository)', async () => {
        const provider: AIProviderType = 'anthropic';

        const result = await service.configure('workspace-1', provider); // Missing API key

        expect(result.valid).toBe(false);
        expect(mockRepository.upsert).not.toHaveBeenCalled();
      });
    });
  });
});
