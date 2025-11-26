import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LLMAPIKeyService } from './llm-api-key.service';
import { LLMAPIKeyRepository } from '../repositories/llm-api-key.repository';
import { LoggerService } from '@2ly/common';
import { dgraphResolversTypes } from '@2ly/common';
import * as encryptionHelper from '../helpers/encryption';

// Mock the encryption helper
vi.mock('../helpers/encryption', () => ({
  encrypt: vi.fn((text: string) => `encrypted_${text}`),
  decrypt: vi.fn((text: string) => text.replace('encrypted_', '')),
  maskApiKey: vi.fn((key: string) => {
    if (key.startsWith('sk-')) return `sk-...${key.slice(-4)}`;
    return `***...${key.slice(-4)}`;
  }),
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('LLMAPIKeyService', () => {
  let service: LLMAPIKeyService;
  let mockRepository: Partial<LLMAPIKeyRepository>;
  let mockLogger: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock logger
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };

    const mockLoggerService = {
      getLogger: vi.fn(() => mockLogger),
    } as unknown as LoggerService;

    // Mock repository
    mockRepository = {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      setActive: vi.fn(),
      findById: vi.fn(),
      findByWorkspace: vi.fn(),
      findActiveKey: vi.fn(),
    };

    service = new LLMAPIKeyService(mockRepository as LLMAPIKeyRepository, mockLoggerService);
  });

  describe('createKey', () => {
    it('should create and validate an OpenAI key successfully', async () => {
      const mockKey = {
        id: 'key-1',
        provider: dgraphResolversTypes.LlmProvider.Openai,
        encryptedKey: 'encrypted_sk-test',
        maskedKey: 'sk-...test',
        isActive: true,
        createdAt: new Date().toISOString(),
        workspace: { id: 'workspace-1' },
      } as dgraphResolversTypes.LlmapiKey;

      (mockRepository.findByWorkspace as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (mockRepository.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockKey);
      (mockRepository.update as ReturnType<typeof vi.fn>).mockResolvedValue(mockKey);

      // Mock successful OpenAI API validation
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const _result = await service.createKey('workspace-1', dgraphResolversTypes.LlmProvider.Openai, 'sk-test1234');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer sk-test1234',
          }),
        }),
      );

      expect(encryptionHelper.encrypt).toHaveBeenCalledWith('sk-test1234');
      expect(encryptionHelper.maskApiKey).toHaveBeenCalledWith('sk-test1234');
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: dgraphResolversTypes.LlmProvider.Openai,
          isActive: true,
          workspaceId: 'workspace-1',
        }),
      );
    });

    it('should create and validate an Anthropic key successfully', async () => {
      const mockKey = {
        id: 'key-2',
        provider: dgraphResolversTypes.LlmProvider.Anthropic,
        encryptedKey: 'encrypted_sk-ant-test',
        maskedKey: 'sk-ant-...test',
        isActive: true,
        createdAt: new Date().toISOString(),
        workspace: { id: 'workspace-1' },
      } as dgraphResolversTypes.LlmapiKey;

      (mockRepository.findByWorkspace as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (mockRepository.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockKey);
      (mockRepository.update as ReturnType<typeof vi.fn>).mockResolvedValue(mockKey);

      // Mock successful Anthropic API validation (returns 400 for minimal request, which is ok)
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      const _result = await service.createKey('workspace-1', dgraphResolversTypes.LlmProvider.Anthropic, 'sk-ant-test1234');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'sk-ant-test1234',
            'anthropic-version': '2023-06-01',
          }),
        }),
      );
    });

    it('should create and validate a Google key successfully', async () => {
      const mockKey = {
        id: 'key-3',
        provider: dgraphResolversTypes.LlmProvider.Google,
        encryptedKey: 'encrypted_AIza123',
        maskedKey: '***...a123',
        isActive: true,
        createdAt: new Date().toISOString(),
        workspace: { id: 'workspace-1' },
      } as dgraphResolversTypes.LlmapiKey;

      (mockRepository.findByWorkspace as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (mockRepository.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockKey);
      (mockRepository.update as ReturnType<typeof vi.fn>).mockResolvedValue(mockKey);

      // Mock successful Google API validation
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const _result = await service.createKey('workspace-1', dgraphResolversTypes.LlmProvider.Google, 'AIza123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://generativelanguage.googleapis.com/v1beta/models'),
        expect.objectContaining({
          method: 'GET',
        }),
      );
    });

    it('should throw error if API key validation fails', async () => {
      (mockRepository.findByWorkspace as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      // Mock failed OpenAI API validation (401)
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(
        service.createKey('workspace-1', dgraphResolversTypes.LlmProvider.Openai, 'sk-invalid'),
      ).rejects.toThrow('API key validation failed');
    });

    it('should set first key as active automatically', async () => {
      const mockKey = {
        id: 'key-1',
        provider: dgraphResolversTypes.LlmProvider.Openai,
        encryptedKey: 'encrypted_sk-test',
        maskedKey: 'sk-...test',
        isActive: true,
        createdAt: new Date().toISOString(),
        workspace: { id: 'workspace-1' },
      } as dgraphResolversTypes.LlmapiKey;

      // No existing keys
      (mockRepository.findByWorkspace as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (mockRepository.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockKey);
      (mockRepository.update as ReturnType<typeof vi.fn>).mockResolvedValue(mockKey);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true });

      await service.createKey('workspace-1', dgraphResolversTypes.LlmProvider.Openai, 'sk-test');

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
        }),
      );
    });

    it('should set second key as inactive by default', async () => {
      const existingKey = {
        id: 'key-1',
        provider: dgraphResolversTypes.LlmProvider.Openai,
        isActive: true,
      };

      const mockKey = {
        id: 'key-2',
        provider: dgraphResolversTypes.LlmProvider.Openai,
        encryptedKey: 'encrypted_sk-test2',
        maskedKey: 'sk-...est2',
        isActive: false,
        createdAt: new Date().toISOString(),
        workspace: { id: 'workspace-1' },
      } as dgraphResolversTypes.LlmapiKey;

      // One existing key for OpenAI
      (mockRepository.findByWorkspace as ReturnType<typeof vi.fn>).mockResolvedValue([existingKey]);
      (mockRepository.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockKey);
      (mockRepository.update as ReturnType<typeof vi.fn>).mockResolvedValue(mockKey);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true });

      await service.createKey('workspace-1', dgraphResolversTypes.LlmProvider.Openai, 'sk-test2');

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false,
        }),
      );
    });
  });

  describe('updateKey', () => {
    it('should update and validate an existing key', async () => {
      const existingKey = {
        id: 'key-1',
        provider: dgraphResolversTypes.LlmProvider.Openai,
        encryptedKey: 'encrypted_old',
        maskedKey: 'sk-...old',
        isActive: true,
        workspace: { id: 'workspace-1' },
      } as dgraphResolversTypes.LlmapiKey;

      const updatedKey = {
        ...existingKey,
        encryptedKey: 'encrypted_sk-new',
        maskedKey: 'sk-...new',
      };

      (mockRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(existingKey);
      (mockRepository.update as ReturnType<typeof vi.fn>).mockResolvedValue(updatedKey);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true });

      const _result = await service.updateKey('key-1', 'sk-new123');

      expect(mockRepository.findById).toHaveBeenCalledWith('key-1');
      expect(global.fetch).toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'key-1',
          lastValidatedAt: expect.any(Date),
        }),
      );
    });

    it('should throw error if key not found', async () => {
(mockRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(service.updateKey('key-1', 'sk-new')).rejects.toThrow('API key not found');
    });

    it('should throw error if validation fails', async () => {
      const existingKey = {
        id: 'key-1',
        provider: dgraphResolversTypes.LlmProvider.Openai,
      } as dgraphResolversTypes.LlmapiKey;

(mockRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(existingKey);
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, status: 401 });

      await expect(service.updateKey('key-1', 'sk-invalid')).rejects.toThrow('API key validation failed');
    });
  });

  describe('setActiveKey', () => {
    it('should set a key as active', async () => {
      const key = {
        id: 'key-1',
        provider: dgraphResolversTypes.LlmProvider.Openai,
        workspace: { id: 'workspace-1' },
      } as dgraphResolversTypes.LlmapiKey;

      const updatedKey = { ...key, isActive: true };

(mockRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(key);
(mockRepository.setActive as ReturnType<typeof vi.fn>).mockResolvedValue(updatedKey);

      const result = await service.setActiveKey('key-1');

      expect(mockRepository.setActive).toHaveBeenCalledWith('key-1', dgraphResolversTypes.LlmProvider.Openai, 'workspace-1');
      expect(result.isActive).toBe(true);
    });

    it('should throw error if key not found', async () => {
(mockRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(service.setActiveKey('key-1')).rejects.toThrow('API key not found');
    });
  });

  describe('API validation specifics', () => {
    beforeEach(() => {
      (mockRepository.findByWorkspace as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (mockRepository.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'key-1' } as dgraphResolversTypes.LlmapiKey);
      (mockRepository.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'key-1' } as dgraphResolversTypes.LlmapiKey);
    });

    it('should reject OpenAI keys with 401 status', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, status: 401 });

      await expect(
        service.createKey('workspace-1', dgraphResolversTypes.LlmProvider.Openai, 'sk-invalid'),
      ).rejects.toThrow('Invalid API key');
    });

    it('should reject Anthropic keys with 401 status', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, status: 401 });

      await expect(
        service.createKey('workspace-1', dgraphResolversTypes.LlmProvider.Anthropic, 'sk-ant-invalid'),
      ).rejects.toThrow('Invalid API key');
    });

    it('should reject Google keys with 400/403 status', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, status: 403 });

      await expect(
        service.createKey('workspace-1', dgraphResolversTypes.LlmProvider.Google, 'AIza-invalid'),
      ).rejects.toThrow('Invalid API key');
    });

    it('should handle network errors during validation', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        service.createKey('workspace-1', dgraphResolversTypes.LlmProvider.Openai, 'sk-test'),
      ).rejects.toThrow('Network error during validation');
    });
  });

  describe('getDecryptedKey', () => {
    it('should return decrypted key', async () => {
      const key = {
        id: 'key-1',
        encryptedKey: 'encrypted_sk-secret',
      } as dgraphResolversTypes.LlmapiKey;

(mockRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(key);

      const result = await service.getDecryptedKey('key-1');

      expect(encryptionHelper.decrypt).toHaveBeenCalledWith('encrypted_sk-secret');
      expect(result).toBe('sk-secret');
    });

    it('should throw error if key not found', async () => {
(mockRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(service.getDecryptedKey('key-1')).rejects.toThrow('API key not found');
    });
  });
});
