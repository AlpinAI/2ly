import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SkillService, SkillIdentity } from './skill.service';
import {
  LoggerService,
  NatsService,
  NatsCacheService,
  SkillListToolsPublish,
  RuntimeCallToolResponse,
  dgraphResolversTypes,
  SmartSkillTool,
  type CacheWatchEvent,
  type RawMessage,
} from '@skilder-ai/common';
import pino from 'pino';

// Type for the cache watch subscription mock
type MockCacheWatchSubscription = {
  [Symbol.asyncIterator]: () => AsyncGenerator<
    CacheWatchEvent<RawMessage<SkillListToolsPublish['data']>>,
    void,
    unknown
  >;
  unsubscribe: () => void;
  drain: () => Promise<void>;
};

// Test helpers
const SUBSCRIPTION_WAIT_MS = 50;

/**
 * Wait for async subscription to process after initialization
 */
const waitForSubscription = (): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, SUBSCRIPTION_WAIT_MS));
};

describe('SkillService - init_skill tool', () => {
  let skillService: SkillService;
  let mockLoggerService: LoggerService;
  let mockNatsService: NatsService;
  let mockCacheService: NatsCacheService;
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
      request: vi.fn(),
    } as unknown as NatsService;

    // Mock CacheService
    mockCacheService = {
      watch: vi.fn(),
    } as unknown as NatsCacheService;

    // Identity for testing
    identity = {
      workspaceId: 'workspace-1',
      skillId: 'skill-1',
      skillName: 'Test Skill',
    };

    skillService = new SkillService(mockLoggerService, mockNatsService, mockCacheService, identity);
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
      const toolsMessage = new SkillListToolsPublish({
        workspaceId: 'workspace-1',
        skillId: 'skill-1',
        mcpTools: mockTools,
        description: 'Test skill description',
      });

      vi.mocked(mockCacheService.watch).mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          yield {
            key: 'workspace-1.skill-1.list-tools',
            operation: 'PUT',
            value: toolsMessage.prepareData(),
            revision: 1,
            timestamp: Date.now(),
          } as CacheWatchEvent<RawMessage<SkillListToolsPublish['data']>>;
        },
        unsubscribe: vi.fn(),
        drain: vi.fn().mockResolvedValue(undefined),
      } as MockCacheWatchSubscription);

      // Initialize the service
      await skillService['initialize']();

      // Wait for async subscription to process
      await waitForSubscription();

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
            description: 'Original user message',
          },
        },
        required: ['original_prompt'],
      });

      // Verify regular tool is second
      expect(tools[1].name).toBe('test_tool');
    });

    it('should include init_skill even when no regular tools exist', async () => {
      // Mock the subscription with empty tools
      const toolsMessage = new SkillListToolsPublish({
        workspaceId: 'workspace-1',
        skillId: 'skill-1',
        mcpTools: [],
        description: 'Test skill description',
      });

      vi.mocked(mockCacheService.watch).mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          yield {
            key: 'workspace-1.skill-1.list-tools',
            operation: 'PUT',
            value: toolsMessage.prepareData(),
            revision: 1,
            timestamp: Date.now(),
          } as CacheWatchEvent<RawMessage<SkillListToolsPublish['data']>>;
        },
        unsubscribe: vi.fn(),
        drain: vi.fn().mockResolvedValue(undefined),
      } as MockCacheWatchSubscription);

      // Initialize the service
      await skillService['initialize']();

      // Wait for async subscription to process
      await waitForSubscription();

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
      const toolsMessage = new SkillListToolsPublish({
        workspaceId: 'workspace-1',
        skillId: 'skill-1',
        mcpTools: [],
        description: skillDescription,
      });

      vi.mocked(mockCacheService.watch).mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          yield {
            key: 'workspace-1.skill-1.list-tools',
            operation: 'PUT',
            value: toolsMessage.prepareData(),
            revision: 1,
            timestamp: Date.now(),
          } as CacheWatchEvent<RawMessage<SkillListToolsPublish['data']>>;
        },
        unsubscribe: vi.fn(),
        drain: vi.fn().mockResolvedValue(undefined),
      } as MockCacheWatchSubscription);

      // Initialize the service
      await skillService['initialize']();

      // Wait for async subscription to process
      await waitForSubscription();

      // Call init_skill
      const result = await skillService.callTool('init_skill', {
        original_prompt: 'Hello, what can you do?',
      });

      // Verify response format
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: skillDescription,
          },
        ],
      });
    });

    it('should return empty string when skill has no description', async () => {
      // Mock the subscription without description
      const toolsMessage = new SkillListToolsPublish({
        workspaceId: 'workspace-1',
        skillId: 'skill-1',
        mcpTools: [],
      });

      vi.mocked(mockCacheService.watch).mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          yield {
            key: 'workspace-1.skill-1.list-tools',
            operation: 'PUT',
            value: toolsMessage.prepareData(),
            revision: 1,
            timestamp: Date.now(),
          } as CacheWatchEvent<RawMessage<SkillListToolsPublish['data']>>;
        },
        unsubscribe: vi.fn(),
        drain: vi.fn().mockResolvedValue(undefined),
      } as MockCacheWatchSubscription);

      // Initialize the service
      await skillService['initialize']();

      // Wait for async subscription to process
      await waitForSubscription();

      // Call init_skill
      const result = await skillService.callTool('init_skill', {
        original_prompt: 'Hello',
      });

      // Verify empty string in response
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: '',
          },
        ],
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
      const toolsMessage = new SkillListToolsPublish({
        workspaceId: 'workspace-1',
        skillId: 'skill-1',
        mcpTools: mockTools,
        description: 'Test skill',
      });

      vi.mocked(mockCacheService.watch).mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          yield {
            key: 'workspace-1.skill-1.list-tools',
            operation: 'PUT',
            value: toolsMessage.prepareData(),
            revision: 1,
            timestamp: Date.now(),
          } as CacheWatchEvent<RawMessage<SkillListToolsPublish['data']>>;
        },
        unsubscribe: vi.fn(),
        drain: vi.fn().mockResolvedValue(undefined),
      } as MockCacheWatchSubscription);

      // Mock NATS request for regular tool call
      const mockToolResponse = new RuntimeCallToolResponse({
        result: {
          content: [{ type: 'text', text: 'Tool executed successfully' }],
        },
        executedByIdOrAgent: 'tool-server-1',
      });
      vi.mocked(mockNatsService.request).mockResolvedValue(mockToolResponse);

      // Initialize the service
      await skillService['initialize']();

      // Wait for async subscription to process
      await waitForSubscription();

      // Call regular tool (should delegate to NATS, not short-circuit)
      await skillService.callTool('regular_tool', { arg: 'value' });

      // Verify NATS request was called (delegated properly)
      expect(mockNatsService.request).toHaveBeenCalled();
    });
  });
});

describe('SkillService - smart skill mode', () => {
  let skillService: SkillService;
  let mockLoggerService: LoggerService;
  let mockNatsService: NatsService;
  let mockCacheService: NatsCacheService;
  let mockLogger: pino.Logger;
  let identity: SkillIdentity;

  beforeEach(() => {
    mockLogger = pino({ level: 'silent' });
    mockLoggerService = {
      getLogger: vi.fn(() => mockLogger),
    } as unknown as LoggerService;

    mockNatsService = {
      request: vi.fn(),
    } as unknown as NatsService;

    mockCacheService = {
      watch: vi.fn(),
    } as unknown as NatsCacheService;

    identity = {
      workspaceId: 'workspace-1',
      skillId: 'skill-1',
      skillName: 'Smart Test Skill',
    };

    skillService = new SkillService(mockLoggerService, mockNatsService, mockCacheService, identity);
  });

  describe('getToolsForMCP with smartSkillTool', () => {
    it('should return smart skill tool when smartSkillTool is provided', async () => {
      const smartSkillTool: SmartSkillTool = {
        id: 'skill-1',
        name: 'Smart Skill',
        description: 'A smart skill that processes messages',
      };

      // Mock the subscription with smartSkillTool (SMART mode)
      const toolsMessage = new SkillListToolsPublish({
        workspaceId: 'workspace-1',
        skillId: 'skill-1',
        mcpTools: [],
        smartSkillTool,
        description: 'Smart skill description',
      });

      vi.mocked(mockCacheService.watch).mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          yield {
            key: 'workspace-1.skill-1.list-tools',
            operation: 'PUT',
            value: toolsMessage.prepareData(),
            revision: 1,
            timestamp: Date.now(),
          } as CacheWatchEvent<RawMessage<SkillListToolsPublish['data']>>;
        },
        unsubscribe: vi.fn(),
        drain: vi.fn().mockResolvedValue(undefined),
      } as MockCacheWatchSubscription);

      await skillService['initialize']();
      await new Promise((resolve) => setTimeout(resolve, 50));

      const tools = await skillService.getToolsForMCP();

      // Should have init_skill + smart skill tool
      expect(tools.length).toBe(2);
      expect(tools[0].name).toBe('init_skill');
      expect(tools[1].name).toBe('Smart Skill');
      expect(tools[1].description).toBe('A smart skill that processes messages');
      expect(tools[1].inputSchema).toEqual({
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Message to send to the smart skill',
          },
        },
        required: ['message'],
      });
    });

    it('should not include regular mcpTools when smartSkillTool is provided', async () => {
      const smartSkillTool: SmartSkillTool = {
        id: 'skill-1',
        name: 'Smart Skill',
        description: 'A smart skill',
      };

      const mockTools: dgraphResolversTypes.McpTool[] = [
        {
          id: 'tool-1',
          name: 'hidden_tool',
          description: 'This tool should not appear',
          inputSchema: '{"type":"object"}',
          annotations: '{}',
          status: 'active' as dgraphResolversTypes.ActiveStatus,
          createdAt: '2024-01-01',
          lastSeenAt: '2024-01-01',
        } as dgraphResolversTypes.McpTool,
      ];

      // Mock with both smartSkillTool and mcpTools
      const toolsMessage = new SkillListToolsPublish({
        workspaceId: 'workspace-1',
        skillId: 'skill-1',
        mcpTools: mockTools,
        smartSkillTool,
        description: 'Smart skill',
      });

      vi.mocked(mockCacheService.watch).mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          yield {
            key: 'workspace-1.skill-1.list-tools',
            operation: 'PUT',
            value: toolsMessage.prepareData(),
            revision: 1,
            timestamp: Date.now(),
          } as CacheWatchEvent<RawMessage<SkillListToolsPublish['data']>>;
        },
        unsubscribe: vi.fn(),
        drain: vi.fn().mockResolvedValue(undefined),
      } as MockCacheWatchSubscription);

      await skillService['initialize']();
      await new Promise((resolve) => setTimeout(resolve, 50));

      const tools = await skillService.getToolsForMCP();

      // Should only have init_skill + smart skill tool, not the hidden_tool
      expect(tools.length).toBe(2);
      expect(tools.find((t) => t.name === 'hidden_tool')).toBeUndefined();
      expect(tools.find((t) => t.name === 'Smart Skill')).toBeDefined();
    });
  });

  describe('callTool with smart skill', () => {
    it('should send smart-skill type request when calling smart skill tool', async () => {
      const smartSkillTool: SmartSkillTool = {
        id: 'smart-skill-123',
        name: 'My Smart Skill',
        description: 'A smart skill',
      };

      const toolsMessage = new SkillListToolsPublish({
        workspaceId: 'workspace-1',
        skillId: 'skill-1',
        mcpTools: [],
        smartSkillTool,
        description: 'Smart skill',
      });

      vi.mocked(mockCacheService.watch).mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          yield {
            key: 'workspace-1.skill-1.list-tools',
            operation: 'PUT',
            value: toolsMessage.prepareData(),
            revision: 1,
            timestamp: Date.now(),
          } as CacheWatchEvent<RawMessage<SkillListToolsPublish['data']>>;
        },
        unsubscribe: vi.fn(),
        drain: vi.fn().mockResolvedValue(undefined),
      } as MockCacheWatchSubscription);

      const mockResponse = new RuntimeCallToolResponse({
        result: {
          content: [{ type: 'text', text: 'Smart skill response' }],
          isError: false,
        },
        executedByIdOrAgent: 'runtime-1',
      });
      vi.mocked(mockNatsService.request).mockResolvedValue(mockResponse);

      await skillService['initialize']();
      await new Promise((resolve) => setTimeout(resolve, 50));

      await skillService.callTool('My Smart Skill', { message: 'Hello smart skill' });

      // Verify the request was made with smart-skill type
      expect(mockNatsService.request).toHaveBeenCalled();
      const requestArg = vi.mocked(mockNatsService.request).mock.calls[0][0];
      expect(requestArg.data).toMatchObject({
        type: 'smart-skill',
        workspaceId: 'workspace-1',
        from: 'skill-1',
        skillId: 'smart-skill-123',
        arguments: { message: 'Hello smart skill' },
      });
    });
  });
});
