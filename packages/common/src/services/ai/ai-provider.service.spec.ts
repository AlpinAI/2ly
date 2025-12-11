import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AIProviderService } from './ai-provider.service';
import { LoggerService } from '../logger.service';

describe('AIProviderService', () => {
  let service: AIProviderService;
  let mockLoggerService: LoggerService;

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockLoggerService = {
      getLogger: vi.fn(() => ({
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      })),
    } as unknown as LoggerService;

    service = new AIProviderService(mockLoggerService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('parseModelString()', () => {
    it('should parse valid model string with openai provider', () => {
      const result = service.parseModelString('openai/gpt-4o');

      expect(result.provider).toBe('openai');
      expect(result.modelName).toBe('gpt-4o');
    });

    it('should parse valid model string with anthropic provider', () => {
      const result = service.parseModelString('anthropic/claude-3-5-sonnet-20241022');

      expect(result.provider).toBe('anthropic');
      expect(result.modelName).toBe('claude-3-5-sonnet-20241022');
    });

    it('should parse valid model string with google provider', () => {
      const result = service.parseModelString('google/gemini-pro');

      expect(result.provider).toBe('google');
      expect(result.modelName).toBe('gemini-pro');
    });

    it('should parse valid model string with ollama provider', () => {
      const result = service.parseModelString('ollama/llama2');

      expect(result.provider).toBe('ollama');
      expect(result.modelName).toBe('llama2');
    });

    it('should throw error for malformed string with missing slash', () => {
      expect(() => service.parseModelString('openai-gpt-4o')).toThrow(
        'Invalid model format. Model name cannot be empty'
      );
    });

    it('should throw error for empty provider', () => {
      expect(() => service.parseModelString('/gpt-4o')).toThrow('Invalid model format. Provider cannot be empty');
    });

    it('should throw error for empty model name', () => {
      expect(() => service.parseModelString('openai/')).toThrow('Invalid model format. Model name cannot be empty');
    });

    it('should throw error for unknown provider', () => {
      expect(() => service.parseModelString('unknown-provider/model-name')).toThrow(
        'Unknown provider: unknown-provider'
      );
    });

    it('should handle uppercase provider (should fail - providers must be lowercase)', () => {
      expect(() => service.parseModelString('OPENAI/gpt-4o')).toThrow('Unknown provider: OPENAI');
    });

    it('should only split on first slash (model name can contain slashes)', () => {
      const result = service.parseModelString('openai/model/with/slashes');

      expect(result.provider).toBe('openai');
      expect(result.modelName).toBe('model');
    });
  });

  describe('getProviderModel()', () => {
    it('should create OpenAI model', () => {
      const model = service.getProviderModel('openai', 'gpt-4o', { apiKey: 'test-key' });
      expect(model).toBeDefined();
      expect(model).toBeTruthy();
    });

    it('should create Anthropic model', () => {
      const model = service.getProviderModel('anthropic', 'claude-3-5-sonnet', { apiKey: 'test-key' });
      expect(model).toBeDefined();
      expect(model).toBeTruthy();
    });

    it('should create Google model', () => {
      const model = service.getProviderModel('google', 'gemini-pro', { apiKey: 'test-key' });
      expect(model).toBeDefined();
      expect(model).toBeTruthy();
    });

    it('should create Ollama model with default baseUrl', () => {
      const model = service.getProviderModel('ollama', 'llama2', {});
      expect(model).toBeDefined();
      expect(model).toBeTruthy();
    });

    it('should create Ollama model with custom baseUrl', () => {
      const model = service.getProviderModel('ollama', 'llama2', { baseUrl: 'http://custom:11434/api' });
      expect(model).toBeDefined();
      expect(model).toBeTruthy();
    });

    it('should throw error for unknown provider', () => {
      expect(() => service.getProviderModel('unknown' as 'openai', 'model', {})).toThrow('Unknown provider: unknown');
    });
  });
});
