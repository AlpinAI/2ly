import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AgentService } from './agent.service';
import { AgentRepository } from '../repositories/agent.repository';
import { AIProviderService } from './ai/ai-provider.service';
import { LoggerService, dgraphResolversTypes } from '@2ly/common';

// Mock dependencies
vi.mock('../repositories/agent.repository');
vi.mock('./ai/ai-provider.service');
vi.mock('@2ly/common', async () => {
  const actual = await vi.importActual('@2ly/common');
  return {
    ...actual,
    LoggerService: vi.fn(),
  };
});

describe('AgentService', () => {
  let service: AgentService;
  let mockAgentRepository: AgentRepository;
  let mockAIProviderService: AIProviderService;
  let mockLoggerService: LoggerService;
  let mockLogger: ReturnType<LoggerService['getLogger']>;

  // Shared mock objects
  const mockSystem: dgraphResolversTypes.System = {
    id: 'system-123',
    initialized: true,
    instanceId: 'instance-123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockWorkspace: dgraphResolversTypes.Workspace = {
    id: 'workspace-123',
    name: 'test-workspace',
    createdAt: new Date().toISOString(),
    system: mockSystem,
  };

  const mockAgent: dgraphResolversTypes.Agent = {
    id: 'agent-456',
    name: 'Test Agent',
    description: 'Test Description',
    systemPrompt: 'You are a helpful AI assistant.',
    model: 'openai/gpt-4',
    temperature: 0.7,
    maxTokens: 2048,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    workspace: mockWorkspace,
  };

  beforeEach(() => {
    // Silence console errors in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    } as unknown as ReturnType<LoggerService['getLogger']>;

    mockLoggerService = {
      getLogger: vi.fn().mockReturnValue(mockLogger),
    } as unknown as LoggerService;

    mockAgentRepository = {
      findById: vi.fn(),
    } as unknown as AgentRepository;

    mockAIProviderService = {
      chat: vi.fn(),
    } as unknown as AIProviderService;

    service = new AgentService(
      mockLoggerService,
      mockAgentRepository,
      mockAIProviderService,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('call', () => {
    it('should successfully call agent with user messages', async () => {
      const userMessages = ['Hello, how are you?', 'What can you help me with?'];
      const expectedResponse = 'I am doing well! I can help you with many tasks.';

      vi.spyOn(mockAgentRepository, 'findById').mockResolvedValue(mockAgent);
      vi.spyOn(mockAIProviderService, 'chat').mockResolvedValue(expectedResponse);

      const result = await service.call('agent-456', userMessages);

      // Verify agent was fetched
      expect(mockAgentRepository.findById).toHaveBeenCalledWith('agent-456');

      // Verify AI provider was called with correct parameters
      expect(mockAIProviderService.chat).toHaveBeenCalledWith(
        'workspace-123',
        'openai/gpt-4',
        expect.stringContaining('You are a helpful AI assistant.')
      );

      // Verify the full message includes both system prompt and user messages
      const callArgs = vi.mocked(mockAIProviderService.chat).mock.calls[0];
      expect(callArgs[2]).toContain('You are a helpful AI assistant.');
      expect(callArgs[2]).toContain('Hello, how are you?');
      expect(callArgs[2]).toContain('What can you help me with?');

      expect(result).toBe(expectedResponse);
    });

    it('should throw error when agent not found', async () => {
      vi.spyOn(mockAgentRepository, 'findById').mockResolvedValue(null);

      await expect(service.call('nonexistent-agent', ['Test message']))
        .rejects
        .toThrow('Agent with ID nonexistent-agent not found');

      // Verify AI provider was not called
      expect(mockAIProviderService.chat).not.toHaveBeenCalled();
    });

    it('should throw error when agent has no workspace', async () => {
      const agentWithoutWorkspace = {
        ...mockAgent,
        workspace: undefined as unknown as dgraphResolversTypes.Workspace,
      };

      vi.spyOn(mockAgentRepository, 'findById').mockResolvedValue(agentWithoutWorkspace);

      await expect(service.call('agent-456', ['Test message']))
        .rejects
        .toThrow('Agent agent-456 has no associated workspace');

      // Verify AI provider was not called
      expect(mockAIProviderService.chat).not.toHaveBeenCalled();
    });

    it('should construct message correctly with multiple user messages', async () => {
      const userMessages = ['First question', 'Second question', 'Third question'];
      const expectedResponse = 'Here are answers to your questions.';

      vi.spyOn(mockAgentRepository, 'findById').mockResolvedValue(mockAgent);
      vi.spyOn(mockAIProviderService, 'chat').mockResolvedValue(expectedResponse);

      await service.call('agent-456', userMessages);

      const callArgs = vi.mocked(mockAIProviderService.chat).mock.calls[0];
      const fullMessage = callArgs[2];

      // Verify all user messages are included with proper separation
      expect(fullMessage).toContain('First question');
      expect(fullMessage).toContain('Second question');
      expect(fullMessage).toContain('Third question');
      expect(fullMessage).toContain('You are a helpful AI assistant.');
    });

    it('should handle AI provider errors and rethrow', async () => {
      const aiError = new Error('AI provider connection failed');

      vi.spyOn(mockAgentRepository, 'findById').mockResolvedValue(mockAgent);
      vi.spyOn(mockAIProviderService, 'chat').mockRejectedValue(aiError);

      await expect(service.call('agent-456', ['Test message']))
        .rejects
        .toThrow('AI provider connection failed');

      // Verify error was logged
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should call agent with single user message', async () => {
      const userMessages = ['Single message'];
      const expectedResponse = 'Response to single message';

      vi.spyOn(mockAgentRepository, 'findById').mockResolvedValue(mockAgent);
      vi.spyOn(mockAIProviderService, 'chat').mockResolvedValue(expectedResponse);

      const result = await service.call('agent-456', userMessages);

      expect(mockAIProviderService.chat).toHaveBeenCalledWith(
        'workspace-123',
        'openai/gpt-4',
        expect.stringContaining('Single message')
      );

      expect(result).toBe(expectedResponse);
    });

    it('should use correct model from agent configuration', async () => {
      const anthropicAgent = {
        ...mockAgent,
        model: 'anthropic/claude-3-5-sonnet',
      };

      vi.spyOn(mockAgentRepository, 'findById').mockResolvedValue(anthropicAgent);
      vi.spyOn(mockAIProviderService, 'chat').mockResolvedValue('Response');

      await service.call('agent-456', ['Test']);

      expect(mockAIProviderService.chat).toHaveBeenCalledWith(
        'workspace-123',
        'anthropic/claude-3-5-sonnet',
        expect.any(String)
      );
    });

    it('should log appropriate info messages during execution', async () => {
      vi.spyOn(mockAgentRepository, 'findById').mockResolvedValue(mockAgent);
      vi.spyOn(mockAIProviderService, 'chat').mockResolvedValue('Response');

      await service.call('agent-456', ['Test message']);

      // Verify logging was called
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Calling agent agent-456')
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Agent agent-456 call completed successfully')
      );
      expect(mockLogger.debug).toHaveBeenCalled();
    });
  });
});
