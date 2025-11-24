import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToolClientService } from './tool.client.service';
import { LoggerService, NatsService, RuntimeTestMCPServerRequest, RuntimeMCPLifecyclePublish } from '@2ly/common';
import { AuthService } from './auth.service';
import { HealthService } from './runtime.health.service';
import { ToolServerService } from './tool.server.service';
import { Subject } from 'rxjs';

describe('ToolClientService - MCP Server Testing', () => {
  let mockNatsService: NatsService;
  let mockAuthService: AuthService;
  let mockHealthService: HealthService;
  let mockLoggerService: LoggerService;
  let mockToolServerServiceFactory: () => ToolServerService;
  let publishedEvents: RuntimeMCPLifecyclePublish[] = [];

  beforeEach(() => {
    publishedEvents = [];

    // Mock logger service
    mockLoggerService = {
      getLogger: vi.fn(() => ({
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      })),
    } as unknown as LoggerService;

    // Mock NATS service
    mockNatsService = {
      subscribe: vi.fn(() => ({
        [Symbol.asyncIterator]: async function* () {
          // Empty iterator for test
        },
      })),
      publish: vi.fn((event: RuntimeMCPLifecyclePublish) => {
        if (event instanceof RuntimeMCPLifecyclePublish) {
          publishedEvents.push(event);
        }
      }),
      waitForStarted: vi.fn().mockResolvedValue(undefined),
    } as unknown as NatsService;

    // Mock auth service
    mockAuthService = {
      getIdentity: vi.fn(() => ({
        workspaceId: 'test-workspace',
        id: 'test-runtime',
      })),
      waitForStarted: vi.fn().mockResolvedValue(undefined),
    } as unknown as AuthService;

    // Mock health service
    mockHealthService = {
      waitForStarted: vi.fn().mockResolvedValue(undefined),
    } as unknown as HealthService;

    // Mock tool server service factory
    mockToolServerServiceFactory = vi.fn(() => {
      const mockToolService = {
        start: vi.fn().mockResolvedValue(undefined),
        stop: vi.fn().mockResolvedValue(undefined),
        observeTools: vi.fn(() => {
          const subject = new Subject();
          setTimeout(() => {
            subject.next([
              {
                name: 'test-tool',
                description: 'A test tool',
                inputSchema: {},
                annotations: {},
              },
            ]);
          }, 10);
          return subject.asObservable();
        }),
        getName: vi.fn(() => 'test-server'),
        getConfigSignature: vi.fn(() => 'test-sig'),
        updateRoots: vi.fn(),
        onShutdown: vi.fn(),
      };
      return mockToolService as unknown as ToolServerService;
    });
  });

  it('should publish INSTALLING event for STDIO transport', async () => {
    const testRequest = new RuntimeTestMCPServerRequest({
      testSessionId: 'test-session-123',
      name: 'test-server',
      repositoryUrl: 'https://github.com/test/server',
      transport: 'STDIO',
      config: JSON.stringify({ identifier: 'npx', args: ['test-server'] }),
      workspaceId: 'test-workspace',
    });

    // Simulate handling the test request
    const service = new ToolClientService(
      mockLoggerService,
      mockNatsService,
      mockAuthService,
      mockHealthService,
      mockToolServerServiceFactory as unknown as () => ToolServerService,
      undefined,
    );

    // Access private method through type assertion for testing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (service as any).handleTestMCPServer(testRequest);

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Check that INSTALLING event was published
    const installingEvent = publishedEvents.find((e) => e.data.stage === 'INSTALLING');
    expect(installingEvent).toBeDefined();
    expect(installingEvent?.data.message).toContain('Installing npm packages');
    expect(installingEvent?.data.testSessionId).toBe('test-session-123');
  });

  it('should publish STARTING event', async () => {
    const testRequest = new RuntimeTestMCPServerRequest({
      testSessionId: 'test-session-123',
      name: 'test-server',
      repositoryUrl: 'https://github.com/test/server',
      transport: 'SSE',
      config: JSON.stringify({ type: 'sse', url: 'http://localhost:3000' }),
      workspaceId: 'test-workspace',
    });

    const service = new ToolClientService(
      mockLoggerService,
      mockNatsService,
      mockAuthService,
      mockHealthService,
      mockToolServerServiceFactory as unknown as () => ToolServerService,
      undefined,
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (service as any).handleTestMCPServer(testRequest);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const startingEvent = publishedEvents.find((e) => e.data.stage === 'STARTING');
    expect(startingEvent).toBeDefined();
    expect(startingEvent?.data.message).toContain('Starting MCP server');
  });

  it('should publish LISTING_TOOLS event', async () => {
    const testRequest = new RuntimeTestMCPServerRequest({
      testSessionId: 'test-session-123',
      name: 'test-server',
      repositoryUrl: 'https://github.com/test/server',
      transport: 'SSE',
      config: JSON.stringify({ type: 'sse', url: 'http://localhost:3000' }),
      workspaceId: 'test-workspace',
    });

    const service = new ToolClientService(
      mockLoggerService,
      mockNatsService,
      mockAuthService,
      mockHealthService,
      mockToolServerServiceFactory as unknown as () => ToolServerService,
      undefined,
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (service as any).handleTestMCPServer(testRequest);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const listingEvent = publishedEvents.find((e) => e.data.stage === 'LISTING_TOOLS');
    expect(listingEvent).toBeDefined();
    expect(listingEvent?.data.message).toContain('Listing tools');
  });

  it('should publish COMPLETED event with tools', async () => {
    const testRequest = new RuntimeTestMCPServerRequest({
      testSessionId: 'test-session-123',
      name: 'test-server',
      repositoryUrl: 'https://github.com/test/server',
      transport: 'SSE',
      config: JSON.stringify({ type: 'sse', url: 'http://localhost:3000' }),
      workspaceId: 'test-workspace',
    });

    const service = new ToolClientService(
      mockLoggerService,
      mockNatsService,
      mockAuthService,
      mockHealthService,
      mockToolServerServiceFactory as unknown as () => ToolServerService,
      undefined,
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (service as any).handleTestMCPServer(testRequest);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const completedEvent = publishedEvents.find((e) => e.data.stage === 'COMPLETED');
    expect(completedEvent).toBeDefined();
    expect(completedEvent?.data.message).toContain('Successfully tested');
    expect(completedEvent?.data.tools).toBeDefined();
    expect(completedEvent?.data.tools?.length).toBeGreaterThan(0);
  });

  it('should publish FAILED event on error', async () => {
    // Create a factory that throws an error
    const failingFactory = vi.fn(() => {
      throw new Error('Failed to start server');
    });

    const testRequest = new RuntimeTestMCPServerRequest({
      testSessionId: 'test-session-123',
      name: 'test-server',
      repositoryUrl: 'https://github.com/test/server',
      transport: 'SSE',
      config: JSON.stringify({ type: 'sse', url: 'http://localhost:3000' }),
      workspaceId: 'test-workspace',
    });

    const service = new ToolClientService(
      mockLoggerService,
      mockNatsService,
      mockAuthService,
      mockHealthService,
      failingFactory as unknown as () => ToolServerService,
      undefined,
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (service as any).handleTestMCPServer(testRequest);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const failedEvent = publishedEvents.find((e) => e.data.stage === 'FAILED');
    expect(failedEvent).toBeDefined();
    expect(failedEvent?.data.error).toBeDefined();
    expect(failedEvent?.data.error?.message).toContain('Failed to start server');
  });

  it('should include error code NPM_INSTALL_FAILED for STDIO npm errors', async () => {
    const failingFactory = vi.fn(() => {
      throw new Error('npm install failed: package not found');
    });

    const testRequest = new RuntimeTestMCPServerRequest({
      testSessionId: 'test-session-123',
      name: 'test-server',
      repositoryUrl: 'https://github.com/test/server',
      transport: 'STDIO',
      config: JSON.stringify({ identifier: 'npx', args: ['test-server'] }),
      workspaceId: 'test-workspace',
    });

    const service = new ToolClientService(
      mockLoggerService,
      mockNatsService,
      mockAuthService,
      mockHealthService,
      failingFactory as unknown as () => ToolServerService,
      undefined,
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (service as any).handleTestMCPServer(testRequest);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const failedEvent = publishedEvents.find((e) => e.data.stage === 'FAILED');
    expect(failedEvent).toBeDefined();
    expect(failedEvent?.data.error?.code).toBe('NPM_INSTALL_FAILED');
  });
});
