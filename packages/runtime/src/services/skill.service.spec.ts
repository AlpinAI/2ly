import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SkillService, SkillIdentity } from './skill.service';
import { LoggerService, NatsService, SkillListToolsPublish, RuntimeCallToolResponse, dgraphResolversTypes } from '@2ly/common';
import pino from 'pino';
import { BehaviorSubject } from 'rxjs';

// Type for the subscription mock
type MockSubscription = {
  [Symbol.asyncIterator]: () => AsyncGenerator<SkillListToolsPublish, void, unknown>;
  unsubscribe: () => void;
  drain: () => Promise<void>;
  isClosed?: () => boolean;
};

describe('SkillService - init_skill tool', () => {
  let skillService: SkillService;
  let mockLoggerService: LoggerService;
  let mockNatsService: NatsService;
  let mockLogger: pino.Logger;
  let identity: SkillIdentity;

  beforeEach(() => {
    // Create silent logger to avoid test output noise
    mockLogger = pino({ level: 'silent' });

    // Mock LoggerService
    mockLoggerService = {
      getLogger: vi.fn(() => mockLogger),
    } as unknown as LoggerService;

    // Mock NatsService
    mockNatsService = {
      observeEphemeral: vi.fn(),
      request: vi.fn(),
    } as unknown as NatsService;

    // Identity for testing
    identity = {
      workspaceId: 'workspace-1',
      skillId: 'skill-1',
      skillName: 'Test Skill',
    };

    skillService = new SkillService(mockLoggerService, mockNatsService, identity);
  });

  describe('getToolsForMCP', () => {
    it('should include init_skill as first tool when tools are available', async () => {
      // Create mock tools
      const mockTools: dgraphResolversTypes.McpTool[] = [
        {
          id: 'tool-1',
          name: 'test_tool',
          description: 'A test tool',
          inputSchema: '{"type":"object"}',
          annotations: '{}',
          status: 'active' as dgraphResolversTypes.ActiveStatus,
          createdAt: '2024-01-01',
          lastSeenAt: '2024-01-01',
        } as dgraphResolversTypes.McpTool,
      ];

      // Mock the subscription to immediately provide tools
      const toolsSubject = new BehaviorSubject<SkillListToolsPublish | null>(
        new SkillListToolsPublish({
          workspaceId: 'workspace-1',
          skillId: 'skill-1',
          mcpTools: mockTools,
          description: 'Test skill description',
        })
      );

      vi.mocked(mockNatsService.observeEphemeral).mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          const message = toolsSubject.getValue();
          if (message) yield message;
        },
        unsubscribe: vi.fn(),
        drain: vi.fn().mockResolvedValue(undefined),
      } as MockSubscription);

      // Initialize the service
      await skillService['initialize']();

      // Wait a bit for async subscription to process
      await new Promise(resolve => setTimeout(resolve, 50));

      // Get tools
      const tools = await skillService.getToolsForMCP();

      // Verify init_skill is first
      expect(tools.length).toBe(2);
      expect(tools[0].name).toBe('init_skill');
      expect(tools[0].description).toBe('call this tool at the beginning of every conversation');
      expect(tools[0].inputSchema).toEqual({
        type: 'object',
        properties: {
          original_prompt: {
            type: 'string',
            description: 'Original user message'
          }
        },
        required: ['original_prompt']
      });

      // Verify regular tool is second
      expect(tools[1].name).toBe('test_tool');
    });

    it('should include init_skill even when no regular tools exist', async () => {
      // Mock the subscription with empty tools
      const toolsSubject = new BehaviorSubject<SkillListToolsPublish | null>(
        new SkillListToolsPublish({
          workspaceId: 'workspace-1',
          skillId: 'skill-1',
          mcpTools: [],
          description: 'Test skill description',
        })
      );

      vi.mocked(mockNatsService.observeEphemeral).mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          const message = toolsSubject.getValue();
          if (message) yield message;
        },
        unsubscribe: vi.fn(),
        drain: vi.fn().mockResolvedValue(undefined),
      } as MockSubscription);

      // Initialize the service
      await skillService['initialize']();

      // Wait a bit for async subscription to process
      await new Promise(resolve => setTimeout(resolve, 50));

      // Get tools
      const tools = await skillService.getToolsForMCP();

      // Verify only init_skill is present
      expect(tools.length).toBe(1);
      expect(tools[0].name).toBe('init_skill');
    });
  });

  describe('callTool - init_skill', () => {
    it('should return skill description when calling init_skill', async () => {
      const skillDescription = 'This is a test skill for testing purposes';

      // Mock the subscription with tools and description
      const toolsSubject = new BehaviorSubject<SkillListToolsPublish | null>(
        new SkillListToolsPublish({
          workspaceId: 'workspace-1',
          skillId: 'skill-1',
          mcpTools: [],
          description: skillDescription,
        })
      );

      vi.mocked(mockNatsService.observeEphemeral).mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          const message = toolsSubject.getValue();
          if (message) yield message;
        },
        unsubscribe: vi.fn(),
        drain: vi.fn().mockResolvedValue(undefined),
      } as MockSubscription);

      // Initialize the service
      await skillService['initialize']();

      // Wait a bit for async subscription to process
      await new Promise(resolve => setTimeout(resolve, 50));

      // Call init_skill
      const result = await skillService.callTool('init_skill', {
        original_prompt: 'Hello, what can you do?'
      });

      // Verify response format
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            skill_instructions: skillDescription
          })
        }]
      });
    });

    it('should return empty string when skill has no description', async () => {
      // Mock the subscription without description
      const toolsSubject = new BehaviorSubject<SkillListToolsPublish | null>(
        new SkillListToolsPublish({
          workspaceId: 'workspace-1',
          skillId: 'skill-1',
          mcpTools: [],
        })
      );

      vi.mocked(mockNatsService.observeEphemeral).mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          const message = toolsSubject.getValue();
          if (message) yield message;
        },
        unsubscribe: vi.fn(),
        drain: vi.fn().mockResolvedValue(undefined),
      } as MockSubscription);

      // Initialize the service
      await skillService['initialize']();

      // Wait a bit for async subscription to process
      await new Promise(resolve => setTimeout(resolve, 50));

      // Call init_skill
      const result = await skillService.callTool('init_skill', {
        original_prompt: 'Hello'
      });

      // Verify empty string in response
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            skill_instructions: ''
          })
        }]
      });
    });

    it('should still delegate regular tool calls normally', async () => {
      const mockTools: dgraphResolversTypes.McpTool[] = [
        {
          id: 'tool-1',
          name: 'regular_tool',
          description: 'A regular tool',
          inputSchema: '{"type":"object"}',
          annotations: '{}',
          status: 'active' as dgraphResolversTypes.ActiveStatus,
          createdAt: '2024-01-01',
          lastSeenAt: '2024-01-01',
        } as dgraphResolversTypes.McpTool,
      ];

      // Mock the subscription
      const toolsSubject = new BehaviorSubject<SkillListToolsPublish | null>(
        new SkillListToolsPublish({
          workspaceId: 'workspace-1',
          skillId: 'skill-1',
          mcpTools: mockTools,
          description: 'Test skill',
        })
      );

      vi.mocked(mockNatsService.observeEphemeral).mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          const message = toolsSubject.getValue();
          if (message) yield message;
        },
        unsubscribe: vi.fn(),
        drain: vi.fn().mockResolvedValue(undefined),
      } as MockSubscription);

      // Mock NATS request for regular tool call
      const mockToolResponse = new RuntimeCallToolResponse({
        result: {
          content: [{ type: 'text', text: 'Tool executed successfully' }]
        },
        executedByIdOrAgent: 'tool-server-1'
      });
      vi.mocked(mockNatsService.request).mockResolvedValue(mockToolResponse);

      // Initialize the service
      await skillService['initialize']();

      // Wait a bit for async subscription to process
      await new Promise(resolve => setTimeout(resolve, 50));

      // Call regular tool (should delegate to NATS, not short-circuit)
      await skillService.callTool('regular_tool', { arg: 'value' });

      // Verify NATS request was called (delegated properly)
      expect(mockNatsService.request).toHaveBeenCalled();
    });
  });
});
