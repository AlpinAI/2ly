/**
 * AI Service Tests
 *
 * WHY: Verify AI service correctly handles API calls to OpenAI and Anthropic.
 * Tests API key validation, tool suggestions, and error handling.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIService, AIProvider } from './ai.service';

// Mock fetch globally
global.fetch = vi.fn();

describe('AIService', () => {
  let aiService: AIService;

  beforeEach(() => {
    aiService = new AIService();
    vi.clearAllMocks();
  });

  describe('validateApiKey', () => {
    it('should validate OpenAI API key successfully', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
      } as Response);

      const isValid = await aiService.validateApiKey(AIProvider.OPENAI, 'sk-test-key');

      expect(isValid).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer sk-test-key',
        },
      });
    });

    it('should reject invalid OpenAI API key', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValueOnce({
        ok: false,
      } as Response);

      const isValid = await aiService.validateApiKey(AIProvider.OPENAI, 'invalid-key');

      expect(isValid).toBe(false);
    });

    it('should validate Anthropic API key successfully', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
      } as Response);

      const isValid = await aiService.validateApiKey(AIProvider.ANTHROPIC, 'sk-ant-test-key');

      expect(isValid).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'sk-ant-test-key',
          }),
        }),
      );
    });

    it('should reject invalid Anthropic API key', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValueOnce({
        ok: false,
      } as Response);

      const isValid = await aiService.validateApiKey(AIProvider.ANTHROPIC, 'invalid-key');

      expect(isValid).toBe(false);
    });

    it('should handle network errors gracefully', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const isValid = await aiService.validateApiKey(AIProvider.OPENAI, 'sk-test-key');

      expect(isValid).toBe(false);
    });
  });

  describe('suggestTools - OpenAI', () => {
    it('should return tool suggestions from OpenAI', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  suggestions: [
                    {
                      toolId: 'tool-1',
                      toolName: 'send_email',
                      reason: 'Sends emails',
                      confidence: 0.95,
                    },
                  ],
                  externalSuggestions: [],
                }),
              },
            },
          ],
        }),
      } as Response);

      const result = await aiService.suggestTools(
        AIProvider.OPENAI,
        'gpt-4',
        'sk-test-key',
        'I want to send email',
        [
          { id: 'tool-1', name: 'send_email', description: 'Sends an email' },
          { id: 'tool-2', name: 'read_file', description: 'Reads a file' },
        ],
      );

      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0].toolId).toBe('tool-1');
      expect(result.suggestions[0].confidence).toBe(0.95);
      expect(result.externalSuggestions).toHaveLength(0);
    });

    it('should return external suggestions when no internal tools match', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  suggestions: [],
                  externalSuggestions: ['gmail', 'outlook'],
                }),
              },
            },
          ],
        }),
      } as Response);

      const result = await aiService.suggestTools(
        AIProvider.OPENAI,
        'gpt-4',
        'sk-test-key',
        'I want to send email',
        [{ id: 'tool-1', name: 'read_file', description: 'Reads a file' }],
      );

      expect(result.suggestions).toHaveLength(0);
      expect(result.externalSuggestions).toHaveLength(2);
      expect(result.externalSuggestions).toContain('gmail');
    });

    it('should throw error on API failure', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      } as Response);

      await expect(
        aiService.suggestTools(AIProvider.OPENAI, 'gpt-4', 'invalid-key', 'test description', []),
      ).rejects.toThrow('OpenAI API error');
    });
  });

  describe('suggestTools - Anthropic', () => {
    it('should return tool suggestions from Anthropic', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [
            {
              text: JSON.stringify({
                suggestions: [
                  {
                    toolId: 'tool-1',
                    toolName: 'search_web',
                    reason: 'Searches the web',
                    confidence: 0.9,
                  },
                ],
                externalSuggestions: [],
              }),
            },
          ],
        }),
      } as Response);

      const result = await aiService.suggestTools(
        AIProvider.ANTHROPIC,
        'claude-3-opus-20240229',
        'sk-ant-test-key',
        'I want to search the web',
        [
          { id: 'tool-1', name: 'search_web', description: 'Searches the internet' },
          { id: 'tool-2', name: 'read_file', description: 'Reads a file' },
        ],
      );

      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0].toolId).toBe('tool-1');
      expect(result.suggestions[0].confidence).toBe(0.9);
    });

    it('should throw error on API failure', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Invalid API key',
      } as Response);

      await expect(
        aiService.suggestTools(AIProvider.ANTHROPIC, 'claude-3-opus-20240229', 'invalid-key', 'test', []),
      ).rejects.toThrow('Anthropic API error');
    });
  });

  describe('error handling', () => {
    it('should handle malformed JSON response', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'Not valid JSON',
              },
            },
          ],
        }),
      } as Response);

      const result = await aiService.suggestTools(AIProvider.OPENAI, 'gpt-4', 'sk-test-key', 'test', []);

      expect(result.suggestions).toHaveLength(0);
      expect(result.externalSuggestions).toHaveLength(0);
    });

    it('should throw error for unsupported provider', async () => {
      await expect(
        aiService.suggestTools('UNSUPPORTED' as AIProvider, 'model', 'key', 'test', []),
      ).rejects.toThrow('Unsupported AI provider');
    });
  });
});
