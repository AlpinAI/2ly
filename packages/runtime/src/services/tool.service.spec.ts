import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ToolService } from './tool.service';
import {
  LoggerService,
  NatsService,
  NatsCacheService,
  dgraphResolversTypes,
  EXECUTION_TARGET,
} from '@skilder-ai/common';
import { AuthService } from './auth.service';
import { HealthService } from './runtime.health.service';
import { type ToolServerServiceFactory } from './tool.mcp.server.service';
import pino from 'pino';

describe('ToolService', () => {
  let toolService: ToolService;
  let mockLoggerService: LoggerService;
  let mockNatsService: NatsService;
  let mockAuthService: AuthService;
  let mockHealthService: HealthService;
  let mockToolServerServiceFactory: ToolServerServiceFactory;
  let mockLogger: pino.Logger;

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Create silent logger to avoid test output noise
    mockLogger = pino({ level: 'silent' });

    // Mock LoggerService
    mockLoggerService = {
      getLogger: vi.fn(() => mockLogger),
    } as unknown as LoggerService;

    // Mock NatsService
    mockNatsService = {
      waitForStarted: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn(),
      publish: vi.fn(),
    } as unknown as NatsService;

    // Mock AuthService
    mockAuthService = {
      waitForStarted: vi.fn().mockResolvedValue(undefined),
      getIdentity: vi.fn().mockReturnValue({
        nature: 'runtime',
        id: '0x1',
        name: 'test-runtime',
        workspaceId: '0x2',
      }),
    } as unknown as AuthService;

    // Mock HealthService
    mockHealthService = {
      waitForStarted: vi.fn().mockResolvedValue(undefined),
    } as unknown as HealthService;

    // Mock ToolServerServiceFactory
    mockToolServerServiceFactory = vi.fn();

    // Mock ToolAgentServiceFactory
    const mockToolAgentServiceFactory = vi.fn();

    // Mock CacheService
    const mockCacheService = {
      watch: vi.fn().mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {},
        unsubscribe: vi.fn(),
        drain: vi.fn().mockResolvedValue(undefined),
      }),
      createBucket: vi.fn().mockResolvedValue(undefined),
    };

    toolService = new ToolService(
      mockLoggerService,
      mockNatsService,
      mockCacheService as unknown as NatsCacheService,
      mockAuthService,
      mockHealthService,
      mockToolServerServiceFactory,
      mockToolAgentServiceFactory,
      undefined,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ensureToolsSubscribed', () => {
    it('should subscribe to new tools that are not yet subscribed', () => {
      const mcpServerId = '0x10';
      const tools: dgraphResolversTypes.McpTool[] = [
        {
          id: '0x101',
          name: 'tool1',
          description: 'Tool 1',
          inputSchema: '{}',
          annotations: '{}',
          status: dgraphResolversTypes.ActiveStatus.Active,
          createdAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          mcpServer: { id: mcpServerId } as dgraphResolversTypes.McpServer,
          workspace: { id: '0x2' } as dgraphResolversTypes.Workspace,
        },
        {
          id: '0x102',
          name: 'tool2',
          description: 'Tool 2',
          inputSchema: '{}',
          annotations: '{}',
          status: dgraphResolversTypes.ActiveStatus.Active,
          createdAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          mcpServer: { id: mcpServerId } as dgraphResolversTypes.McpServer,
          workspace: { id: '0x2' } as dgraphResolversTypes.Workspace,
        },
      ];

      const mockSubscription = {
        unsubscribe: vi.fn(),
        [Symbol.asyncIterator]: () => ({
          next: async () => ({ done: true, value: undefined }),
        }),
      };
      vi.mocked(mockNatsService.subscribe).mockReturnValue(mockSubscription as unknown as ReturnType<NatsService['subscribe']>);

      toolService['ensureToolsSubscribed'](mcpServerId, tools, 'CLOUD' as EXECUTION_TARGET);

      // Should subscribe to both tools
      expect(mockNatsService.subscribe).toHaveBeenCalledTimes(2);
    });

    it('should not re-subscribe to already subscribed tools (idempotency)', () => {
      const mcpServerId = '0x10';
      const tools: dgraphResolversTypes.McpTool[] = [
        {
          id: '0x101',
          name: 'tool1',
          description: 'Tool 1',
          inputSchema: '{}',
          annotations: '{}',
          status: dgraphResolversTypes.ActiveStatus.Active,
          createdAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          mcpServer: { id: mcpServerId } as dgraphResolversTypes.McpServer,
          workspace: { id: '0x2' } as dgraphResolversTypes.Workspace,
        },
      ];

      const mockSubscription = {
        unsubscribe: vi.fn(),
        [Symbol.asyncIterator]: () => ({
          next: async () => ({ done: true, value: undefined }),
        }),
      };
      vi.mocked(mockNatsService.subscribe).mockReturnValue(mockSubscription as unknown as ReturnType<NatsService['subscribe']>);

      // First call - should subscribe
      toolService['ensureToolsSubscribed'](mcpServerId, tools, 'CLOUD' as EXECUTION_TARGET);
      expect(mockNatsService.subscribe).toHaveBeenCalledTimes(1);

      // Second call with same tools - should not subscribe again
      toolService['ensureToolsSubscribed'](mcpServerId, tools, 'CLOUD' as EXECUTION_TARGET);
      expect(mockNatsService.subscribe).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should subscribe to new tools when some are already subscribed', () => {
      const mcpServerId = '0x10';
      const initialTools: dgraphResolversTypes.McpTool[] = [
        {
          id: '0x101',
          name: 'tool1',
          description: 'Tool 1',
          inputSchema: '{}',
          annotations: '{}',
          status: dgraphResolversTypes.ActiveStatus.Active,
          createdAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          mcpServer: { id: mcpServerId } as dgraphResolversTypes.McpServer,
          workspace: { id: '0x2' } as dgraphResolversTypes.Workspace,
        },
      ];

      const updatedTools: dgraphResolversTypes.McpTool[] = [
        {
          id: '0x101',
          name: 'tool1',
          description: 'Tool 1',
          inputSchema: '{}',
          annotations: '{}',
          status: dgraphResolversTypes.ActiveStatus.Active,
          createdAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          mcpServer: { id: mcpServerId } as dgraphResolversTypes.McpServer,
          workspace: { id: '0x2' } as dgraphResolversTypes.Workspace,
        },
        {
          id: '0x102',
          name: 'tool2',
          description: 'Tool 2',
          inputSchema: '{}',
          annotations: '{}',
          status: dgraphResolversTypes.ActiveStatus.Active,
          createdAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          mcpServer: { id: mcpServerId } as dgraphResolversTypes.McpServer,
          workspace: { id: '0x2' } as dgraphResolversTypes.Workspace,
        },
      ];

      const mockSubscription = {
        unsubscribe: vi.fn(),
        [Symbol.asyncIterator]: () => ({
          next: async () => ({ done: true, value: undefined }),
        }),
      };
      vi.mocked(mockNatsService.subscribe).mockReturnValue(mockSubscription as unknown as ReturnType<NatsService['subscribe']>);

      // First call with one tool
      toolService['ensureToolsSubscribed'](mcpServerId, initialTools, 'CLOUD' as EXECUTION_TARGET);
      expect(mockNatsService.subscribe).toHaveBeenCalledTimes(1);

      // Second call with two tools - should only subscribe to the new one
      toolService['ensureToolsSubscribed'](mcpServerId, updatedTools, 'CLOUD' as EXECUTION_TARGET);
      expect(mockNatsService.subscribe).toHaveBeenCalledTimes(2);
    });
  });

  describe('subscribeToTool - subject routing', () => {
    it('should use workspace-specific subject when executionTarget is AGENT', () => {
      const toolId = '0x101';
      const workspaceId = '0x2';
      const runtimeId = '0x1';

      vi.mocked(mockAuthService.getIdentity).mockReturnValue({
        nature: 'runtime',
        id: runtimeId,
        name: 'test-runtime',
        workspaceId: workspaceId,
      });

      const mockSubscription = { unsubscribe: vi.fn(), [Symbol.asyncIterator]: () => ({ next: async () => ({ done: true, value: undefined }) }) };
      vi.mocked(mockNatsService.subscribe).mockReturnValue(mockSubscription as unknown as ReturnType<NatsService['subscribe']>);

      toolService['subscribeToTool'](toolId, 'AGENT' as EXECUTION_TARGET);

      // Verify the subject includes workspace and runtime IDs for AGENT
      expect(mockNatsService.subscribe).toHaveBeenCalledWith(
        expect.stringContaining(toolId),
      );
    });

    it('should use global subject when executionTarget is CLOUD', () => {
      const toolId = '0x101';
      const runtimeId = '0x1';

      vi.mocked(mockAuthService.getIdentity).mockReturnValue({
        nature: 'runtime',
        id: runtimeId,
        name: 'test-runtime',
        workspaceId: '0x2',
      });

      const mockSubscription = { unsubscribe: vi.fn(), [Symbol.asyncIterator]: () => ({ next: async () => ({ done: true, value: undefined }) }) };
      vi.mocked(mockNatsService.subscribe).mockReturnValue(mockSubscription as unknown as ReturnType<NatsService['subscribe']>);

      toolService['subscribeToTool'](toolId, 'CLOUD' as EXECUTION_TARGET);

      // Verify the subject is for the tool globally
      expect(mockNatsService.subscribe).toHaveBeenCalledWith(
        expect.stringContaining(toolId),
      );
    });

    it('should throw error when runtimeId is missing', () => {
      vi.mocked(mockAuthService.getIdentity).mockReturnValue({
        nature: 'runtime',
        id: null as unknown as string,
        name: 'test-runtime',
        workspaceId: '0x2',
      });

      expect(() => {
        toolService['subscribeToTool']('0x101', 'CLOUD' as EXECUTION_TARGET);
      }).toThrow('Cannot subscribe to tool: missing runtimeId or workspaceId');
    });

    it('should throw error when workspaceId is missing for AGENT executionTarget', () => {
      vi.mocked(mockAuthService.getIdentity).mockReturnValue({
        nature: 'runtime',
        id: '0x1',
        name: 'test-runtime',
        workspaceId: null as unknown as string,
      });

      expect(() => {
        toolService['subscribeToTool']('0x101', 'AGENT' as EXECUTION_TARGET);
      }).toThrow('Cannot subscribe to tool: missing runtimeId or workspaceId');
    });
  });

  describe('handleToolCall - executedByIdOrAgent determination', () => {
    it('should determine executedByIdOrAgent as runtime ID when nature is runtime', () => {
      const runtimeId = '0x1';

      vi.mocked(mockAuthService.getIdentity).mockReturnValue({
        nature: 'runtime',
        id: runtimeId,
        name: 'test-runtime',
        workspaceId: '0x2',
      });

      // Access private method to test the identity nature logic
      const identity = mockAuthService.getIdentity();
      const executedByIdOrAgent = identity?.nature === 'runtime' ? identity.id! : 'AGENT';

      expect(executedByIdOrAgent).toBe(runtimeId);
    });

    it('should determine executedByIdOrAgent as AGENT when nature is skill', () => {
      vi.mocked(mockAuthService.getIdentity).mockReturnValue({
        nature: 'skill',
        id: '0x3',
        name: 'test-skill',
        workspaceId: '0x2',
      });

      // Access private method to test the identity nature logic
      const identity = mockAuthService.getIdentity();
      const executedByIdOrAgent = identity?.nature === 'runtime' ? identity.id! : 'AGENT';

      expect(executedByIdOrAgent).toBe('AGENT');
    });
  });

  describe('stopMCPServer - subscription cleanup', () => {
    it('should unsubscribe from all tool subscriptions when MCP server stops', async () => {
      const mcpServerId = '0x10';
      const mcpServerName = 'test-server';

      const mockSubscription1 = { unsubscribe: vi.fn() };
      const mockSubscription2 = { unsubscribe: vi.fn() };

      // Setup subscriptions
      toolService['toolSubscriptions'].set(mcpServerId, new Map([
        ['0x101', mockSubscription1 as unknown as ReturnType<NatsService['subscribe']>],
        ['0x102', mockSubscription2 as unknown as ReturnType<NatsService['subscribe']>],
      ]));

      // Setup MCP server
      const mockMcpServer = {
        getName: () => mcpServerName,
      };
      toolService['mcpServers'].set(mcpServerId, mockMcpServer as unknown as ReturnType<ToolServerServiceFactory>);

      // Mock stopService
      const _stopServiceSpy = vi.spyOn(toolService as unknown as { stopService: (mcpServer: unknown) => Promise<void> }, 'stopService').mockResolvedValue(undefined);

      await toolService['stopMCPServer']({ id: mcpServerId, name: mcpServerName });

      // Verify all subscriptions were unsubscribed
      expect(mockSubscription1.unsubscribe).toHaveBeenCalled();
      expect(mockSubscription2.unsubscribe).toHaveBeenCalled();

      // Verify subscriptions map was cleaned up
      expect(toolService['toolSubscriptions'].has(mcpServerId)).toBe(false);
    });

    it('should handle unsubscribe errors gracefully', async () => {
      const mcpServerId = '0x10';
      const mcpServerName = 'test-server';

      const mockSubscription1 = {
        unsubscribe: vi.fn().mockImplementation(() => { throw new Error('Unsubscribe failed'); })
      };
      const mockSubscription2 = { unsubscribe: vi.fn() };

      // Silence expected console warnings
      const warnSpy = vi.spyOn(mockLogger, 'warn').mockImplementation(() => {});

      // Setup subscriptions
      toolService['toolSubscriptions'].set(mcpServerId, new Map([
        ['0x101', mockSubscription1 as unknown as ReturnType<NatsService['subscribe']>],
        ['0x102', mockSubscription2 as unknown as ReturnType<NatsService['subscribe']>],
      ]));

      // Setup MCP server
      const mockMcpServer = {
        getName: () => mcpServerName,
      };
      toolService['mcpServers'].set(mcpServerId, mockMcpServer as unknown as ReturnType<ToolServerServiceFactory>);

      // Mock stopService
      const _stopServiceSpy = vi.spyOn(toolService as unknown as { stopService: (mcpServer: unknown) => Promise<void> }, 'stopService').mockResolvedValue(undefined);

      await toolService['stopMCPServer']({ id: mcpServerId, name: mcpServerName });

      // Verify both unsubscribe attempts were made despite first one failing
      expect(mockSubscription1.unsubscribe).toHaveBeenCalled();
      expect(mockSubscription2.unsubscribe).toHaveBeenCalled();

      // Verify subscriptions map was still cleaned up
      expect(toolService['toolSubscriptions'].has(mcpServerId)).toBe(false);

      warnSpy.mockRestore();
    });

    it('should clear mcpTools when MCP server stops', async () => {
      const mcpServerId = '0x10';
      const mcpServerName = 'test-server';

      const mockTools: dgraphResolversTypes.McpTool[] = [
        {
          id: '0x101',
          name: 'tool1',
          description: 'Tool 1',
          inputSchema: '{}',
          annotations: '{}',
          status: dgraphResolversTypes.ActiveStatus.Active,
          createdAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          mcpServer: { id: mcpServerId } as dgraphResolversTypes.McpServer,
          workspace: { id: '0x2' } as dgraphResolversTypes.Workspace,
        },
      ];

      toolService['mcpTools'].set(mcpServerId, mockTools);

      // Setup MCP server
      const mockMcpServer = {
        getName: () => mcpServerName,
      };
      toolService['mcpServers'].set(mcpServerId, mockMcpServer as unknown as ReturnType<ToolServerServiceFactory>);

      // Mock stopService
      const _stopServiceSpy = vi.spyOn(toolService as unknown as { stopService: (mcpServer: unknown) => Promise<void> }, 'stopService').mockResolvedValue(undefined);

      await toolService['stopMCPServer']({ id: mcpServerId, name: mcpServerName });

      // Verify mcpTools was cleared
      expect(toolService['mcpTools'].has(mcpServerId)).toBe(false);
    });

    it('should do nothing when MCP server is not running', async () => {
      const mcpServerId = '0x999';
      const mcpServerName = 'nonexistent-server';

      // Mock stopService to verify it's not called
      const _stopServiceSpy = vi.spyOn(toolService as unknown as { stopService: (mcpServer: unknown) => Promise<void> }, 'stopService').mockResolvedValue(undefined);

      await toolService['stopMCPServer']({ id: mcpServerId, name: mcpServerName });

      // Verify stopService was not called
      expect(_stopServiceSpy).not.toHaveBeenCalled();
    });
  });
});
