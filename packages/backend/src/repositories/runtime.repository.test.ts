import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RuntimeRepository } from './runtime.repository';
import { DGraphService } from '../services/dgraph.service';
import { MCPToolRepository } from './mcp-tool.repository';
import { LoggerService, NatsService, RuntimeMCPLifecyclePublish, RuntimeTestMCPServerRequest, apolloResolversTypes } from '@2ly/common';
import { WorkspaceRepository } from './workspace.repository';
import { Subject } from 'rxjs';

describe('RuntimeRepository - MCP Server Testing', () => {
  let runtimeRepository: RuntimeRepository;
  let mockDgraphService: DGraphService;
  let mockMcpToolRepository: MCPToolRepository;
  let mockLoggerService: LoggerService;
  let mockNatsService: NatsService;
  let mockWorkspaceRepository: WorkspaceRepository;
  let natsSubscriptionSubject: Subject<RuntimeMCPLifecyclePublish>;

  beforeEach(() => {
    natsSubscriptionSubject = new Subject();

    mockLoggerService = {
      getLogger: vi.fn(() => ({
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      })),
    } as unknown as LoggerService;

    mockNatsService = {
      subscribe: vi.fn(() => natsSubscriptionSubject),
      publish: vi.fn(),
    } as unknown as NatsService;

    mockDgraphService = {} as DGraphService;
    mockMcpToolRepository = {} as MCPToolRepository;
    mockWorkspaceRepository = {} as WorkspaceRepository;

    runtimeRepository = new RuntimeRepository(
      mockDgraphService,
      mockMcpToolRepository,
      mockLoggerService,
      mockNatsService,
      mockWorkspaceRepository,
    );
  });

  describe('testMCPServer', () => {
    it('should return testSessionId immediately', async () => {
      const result = await runtimeRepository.testMCPServer(
        'test-server',
        'https://github.com/test/server',
        'SSE',
        JSON.stringify({ type: 'sse', url: 'http://localhost:3000' }),
        'test-workspace',
      );

      expect(result.testSessionId).toBeDefined();
      expect(typeof result.testSessionId).toBe('string');
      expect(result.success).toBe(false); // Initially false until test completes
      expect(result.tools).toBeNull();
      expect(result.error).toBeNull();
    });

    it('should publish test request to NATS', async () => {
      await runtimeRepository.testMCPServer(
        'test-server',
        'https://github.com/test/server',
        'SSE',
        JSON.stringify({ type: 'sse', url: 'http://localhost:3000' }),
        'test-workspace',
      );

      expect(mockNatsService.publish).toHaveBeenCalled();
      const mockPublish = mockNatsService.publish as ReturnType<typeof vi.fn>;
      const publishCall = mockPublish.mock.calls[0][0] as RuntimeTestMCPServerRequest;
      expect(publishCall.data.name).toBe('test-server');
      expect(publishCall.data.transport).toBe('SSE');
    });

    it('should subscribe to NATS lifecycle events', async () => {
      await runtimeRepository.testMCPServer(
        'test-server',
        'https://github.com/test/server',
        'SSE',
        JSON.stringify({ type: 'sse', url: 'http://localhost:3000' }),
        'test-workspace',
      );

      expect(mockNatsService.subscribe).toHaveBeenCalled();
    });
  });

  describe('observeMCPServerTestProgress', () => {
    it('should emit lifecycle events from NATS', async () => {
      const result = await runtimeRepository.testMCPServer(
        'test-server',
        'https://github.com/test/server',
        'SSE',
        JSON.stringify({ type: 'sse', url: 'http://localhost:3000' }),
        'test-workspace',
      );

      const testSessionId = result.testSessionId;
      const events: apolloResolversTypes.McpServerLifecycleEvent[] = [];

      // Subscribe to progress
      const subscription = runtimeRepository
        .observeMCPServerTestProgress(testSessionId)
        .subscribe((event) => {
          events.push(event);
        });

      // Simulate NATS events
      const startingEvent = new RuntimeMCPLifecyclePublish({
        serverId: 'test-server-id',
        testSessionId,
        stage: 'STARTING',
        message: 'Starting MCP server',
        timestamp: new Date().toISOString(),
      });

      natsSubscriptionSubject.next(startingEvent);

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].stage).toBe('STARTING');
      expect(events[0].message).toBe('Starting MCP server');

      subscription.unsubscribe();
    });

    it('should emit COMPLETED event with tools', async () => {
      const result = await runtimeRepository.testMCPServer(
        'test-server',
        'https://github.com/test/server',
        'SSE',
        JSON.stringify({ type: 'sse', url: 'http://localhost:3000' }),
        'test-workspace',
      );

      const testSessionId = result.testSessionId;
      const events: apolloResolversTypes.McpServerLifecycleEvent[] = [];

      const subscription = runtimeRepository
        .observeMCPServerTestProgress(testSessionId)
        .subscribe((event) => {
          events.push(event);
        });

      const completedEvent = new RuntimeMCPLifecyclePublish({
        serverId: 'test-server-id',
        testSessionId,
        stage: 'COMPLETED',
        message: 'Successfully tested test-server',
        timestamp: new Date().toISOString(),
        tools: [
          {
            name: 'test-tool',
            description: 'A test tool',
            inputSchema: {
              type: 'object' as const,
              properties: {},
              required: [],
            },
            annotations: {
              title: 'Test Tool',
            },
          },
        ],
      });

      natsSubscriptionSubject.next(completedEvent);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const completed = events.find((e) => e.stage === 'COMPLETED');
      expect(completed).toBeDefined();
      expect(completed?.tools).toBeDefined();
      expect(completed?.tools?.length).toBe(1);
      expect(completed?.tools?.[0].name).toBe('test-tool');

      subscription.unsubscribe();
    });

    it('should emit FAILED event with error', async () => {
      const result = await runtimeRepository.testMCPServer(
        'test-server',
        'https://github.com/test/server',
        'SSE',
        JSON.stringify({ type: 'sse', url: 'http://localhost:3000' }),
        'test-workspace',
      );

      const testSessionId = result.testSessionId;
      const events: apolloResolversTypes.McpServerLifecycleEvent[] = [];

      const subscription = runtimeRepository
        .observeMCPServerTestProgress(testSessionId)
        .subscribe((event) => {
          events.push(event);
        });

      const failedEvent = new RuntimeMCPLifecyclePublish({
        serverId: 'test-server-id',
        testSessionId,
        stage: 'FAILED',
        message: 'Failed to test test-server',
        timestamp: new Date().toISOString(),
        error: {
          code: 'SERVER_START_FAILED',
          message: 'Connection refused',
          details: 'Stack trace...',
        },
      });

      natsSubscriptionSubject.next(failedEvent);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const failed = events.find((e) => e.stage === 'FAILED');
      expect(failed).toBeDefined();
      expect(failed?.error).toBeDefined();
      expect(failed?.error?.code).toBe('SERVER_START_FAILED');
      expect(failed?.error?.message).toBe('Connection refused');

      subscription.unsubscribe();
    });

    it('should complete subscription on COMPLETED event', async () => {
      const result = await runtimeRepository.testMCPServer(
        'test-server',
        'https://github.com/test/server',
        'SSE',
        JSON.stringify({ type: 'sse', url: 'http://localhost:3000' }),
        'test-workspace',
      );

      const testSessionId = result.testSessionId;
      let completed = false;

      runtimeRepository.observeMCPServerTestProgress(testSessionId).subscribe({
        complete: () => {
          completed = true;
        },
      });

      const completedEvent = new RuntimeMCPLifecyclePublish({
        serverId: 'test-server-id',
        testSessionId,
        stage: 'COMPLETED',
        message: 'Successfully tested',
        timestamp: new Date().toISOString(),
        tools: [],
      });

      natsSubscriptionSubject.next(completedEvent);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(completed).toBe(true);
    });
  });
});
