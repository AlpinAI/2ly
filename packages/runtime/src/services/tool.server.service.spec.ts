/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToolServerService } from './tool.server.service';
import { dgraphResolversTypes } from '@2ly/common';
import pino from 'pino';

// Helper to create a mock McpTool (database type with all required fields)
function createMockTool(name: string): dgraphResolversTypes.McpTool {
  return {
    id: `tool-${name}`,
    name,
    description: `Description for ${name}`,
    inputSchema: '{}',
    annotations: '',
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    status: dgraphResolversTypes.ActiveStatus.Active,
    mcpServer: {} as any,
    workspace: {} as any,
  };
}

// Mock MCP SDK modules to avoid actual connections during tests
vi.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
  Client: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    listTools: vi.fn().mockResolvedValue({ tools: [] }),
    setNotificationHandler: vi.fn(),
    setRequestHandler: vi.fn(),
    close: vi.fn(),
    sendRootsListChanged: vi.fn(),
  })),
}));

vi.mock('@modelcontextprotocol/sdk/client/stdio.js', () => ({
  StdioClientTransport: vi.fn().mockImplementation(() => ({
    close: vi.fn(),
  })),
  getDefaultEnvironment: vi.fn(() => ({})),
}));

vi.mock('@modelcontextprotocol/sdk/client/sse.js', () => ({
  SSEClientTransport: vi.fn().mockImplementation(() => ({
    close: vi.fn(),
  })),
}));

vi.mock('@modelcontextprotocol/sdk/client/streamableHttp.js', () => ({
  StreamableHTTPClientTransport: vi.fn().mockImplementation(() => ({
    close: vi.fn(),
  })),
}));

describe('ToolServerService', () => {
  let logger: pino.Logger;

  beforeEach(() => {
    vi.clearAllMocks();
    logger = pino({ level: 'silent' }); // Silent logger for tests
  });

  describe('getConfigSignature', () => {
    it('should include transport, config, tools length, and roots length in signature', () => {
      const config: dgraphResolversTypes.McpServer = {
        id: 'test-id',
        name: 'test-server',
        description: 'Test server',
        transport: dgraphResolversTypes.McpTransportType.Stdio,
        config: JSON.stringify({ identifier: 'test-package', registryType: 'npm' }),
        repositoryUrl: 'https://example.com',
        workspace: {} as any,
        registryServer: {} as any,
        tools: [createMockTool('tool1'), createMockTool('tool2')],
      };

      const roots = [
        { name: 'root1', uri: 'file:///path1' },
        { name: 'root2', uri: 'file:///path2' },
      ];

      const service = new ToolServerService(logger, config, roots);
      const signature = service.getConfigSignature();

      // Should include transport, config JSON, 2 tools, and 2 roots
      expect(signature).toBe(`STDIO-${config.config}-2-2`);
    });

    it('should handle undefined tools array (use 0 for tools length)', () => {
      const config: dgraphResolversTypes.McpServer = {
        id: 'test-id',
        name: 'test-server',
        description: 'Test server',
        transport: dgraphResolversTypes.McpTransportType.Sse,
        config: JSON.stringify({ url: 'https://example.com/sse', type: 'sse' }),
        repositoryUrl: 'https://example.com',
        workspace: {} as any,
        registryServer: {} as any,
        tools: undefined, // No tools
      };

      const service = new ToolServerService(logger, config, []);
      const signature = service.getConfigSignature();

      // Should use 0 for undefined tools
      expect(signature).toBe(`SSE-${config.config}-0-0`);
    });

    it('should handle empty tools array', () => {
      const config: dgraphResolversTypes.McpServer = {
        id: 'test-id',
        name: 'test-server',
        description: 'Test server',
        transport: dgraphResolversTypes.McpTransportType.Stream,
        config: JSON.stringify({ url: 'https://example.com/stream', type: 'streamableHttp' }),
        repositoryUrl: 'https://example.com',
        workspace: {} as any,
        registryServer: {} as any,
        tools: [], // Empty tools array
      };

      const roots = [{ name: 'root1', uri: 'file:///path1' }];

      const service = new ToolServerService(logger, config, roots);
      const signature = service.getConfigSignature();

      // Should use 0 for empty tools array
      expect(signature).toBe(`STREAM-${config.config}-0-1`);
    });

    it('should change signature when tools length changes', () => {
      const config: dgraphResolversTypes.McpServer = {
        id: 'test-id',
        name: 'test-server',
        description: 'Test server',
        transport: dgraphResolversTypes.McpTransportType.Stdio,
        config: JSON.stringify({ identifier: 'test-package', registryType: 'npm' }),
        repositoryUrl: 'https://example.com',
        workspace: {} as any,
        registryServer: {} as any,
        tools: [createMockTool('tool1')],
      };

      const service = new ToolServerService(logger, config, []);
      const signatureWithOneTool = service.getConfigSignature();

      // Simulate tools array changing
      config.tools = [createMockTool('tool1'), createMockTool('tool2'), createMockTool('tool3')];

      const signatureWithThreeTools = service.getConfigSignature();

      // Signatures should be different
      expect(signatureWithOneTool).toBe(`STDIO-${config.config}-1-0`);
      expect(signatureWithThreeTools).toBe(`STDIO-${config.config}-3-0`);
      expect(signatureWithOneTool).not.toBe(signatureWithThreeTools);
    });

    it('should change signature when roots length changes', () => {
      const config: dgraphResolversTypes.McpServer = {
        id: 'test-id',
        name: 'test-server',
        description: 'Test server',
        transport: dgraphResolversTypes.McpTransportType.Stdio,
        config: JSON.stringify({ identifier: 'test-package', registryType: 'npm' }),
        repositoryUrl: 'https://example.com',
        workspace: {} as any,
        registryServer: {} as any,
        tools: [],
      };

      const rootsOne = [{ name: 'root1', uri: 'file:///path1' }];
      const rootsThree = [
        { name: 'root1', uri: 'file:///path1' },
        { name: 'root2', uri: 'file:///path2' },
        { name: 'root3', uri: 'file:///path3' },
      ];

      const serviceWithOneRoot = new ToolServerService(logger, config, rootsOne);
      const serviceWithThreeRoots = new ToolServerService(logger, config, rootsThree);

      const signatureOne = serviceWithOneRoot.getConfigSignature();
      const signatureThree = serviceWithThreeRoots.getConfigSignature();

      // Signatures should be different
      expect(signatureOne).toBe(`STDIO-${config.config}-0-1`);
      expect(signatureThree).toBe(`STDIO-${config.config}-0-3`);
      expect(signatureOne).not.toBe(signatureThree);
    });

    it('should include all components in correct order: transport-config-toolsLength-rootsLength', () => {
      const config: dgraphResolversTypes.McpServer = {
        id: 'test-id',
        name: 'test-server',
        description: 'Test server',
        transport: dgraphResolversTypes.McpTransportType.Stdio,
        config: JSON.stringify({ identifier: 'test-package', registryType: 'npm' }),
        repositoryUrl: 'https://example.com',
        workspace: {} as any,
        registryServer: {} as any,
        tools: [
          createMockTool('tool1'),
          createMockTool('tool2'),
          createMockTool('tool3'),
          createMockTool('tool4'),
          createMockTool('tool5'),
        ],
      };

      const roots = [
        { name: 'root1', uri: 'file:///path1' },
        { name: 'root2', uri: 'file:///path2' },
        { name: 'root3', uri: 'file:///path3' },
      ];

      const service = new ToolServerService(logger, config, roots);
      const signature = service.getConfigSignature();

      // Verify the exact format
      const parts = signature.split('-');
      expect(parts[0]).toBe('STDIO'); // transport
      expect(parts.slice(1, -2).join('-')).toBe(config.config); // config (may contain dashes in JSON)
      expect(parts[parts.length - 2]).toBe('5'); // tools length
      expect(parts[parts.length - 1]).toBe('3'); // roots length
    });

    it('should handle different transport types in signature', () => {
      const baseConfig = {
        id: 'test-id',
        name: 'test-server',
        description: 'Test server',
        repositoryUrl: 'https://example.com',
        workspace: {} as any,
        registryServer: {} as any,
        tools: [],
      };

      const stdioConfig: dgraphResolversTypes.McpServer = {
        ...baseConfig,
        transport: dgraphResolversTypes.McpTransportType.Stdio,
        config: JSON.stringify({ identifier: 'test-package', registryType: 'npm' }),
      };

      const sseConfig: dgraphResolversTypes.McpServer = {
        ...baseConfig,
        transport: dgraphResolversTypes.McpTransportType.Sse,
        config: JSON.stringify({ url: 'https://example.com/sse', type: 'sse' }),
      };

      const streamConfig: dgraphResolversTypes.McpServer = {
        ...baseConfig,
        transport: dgraphResolversTypes.McpTransportType.Stream,
        config: JSON.stringify({ url: 'https://example.com/stream', type: 'streamableHttp' }),
      };

      const stdioService = new ToolServerService(logger, stdioConfig, []);
      const sseService = new ToolServerService(logger, sseConfig, []);
      const streamService = new ToolServerService(logger, streamConfig, []);

      expect(stdioService.getConfigSignature()).toContain('STDIO-');
      expect(sseService.getConfigSignature()).toContain('SSE-');
      expect(streamService.getConfigSignature()).toContain('STREAM-');
    });
  });

  describe('getName', () => {
    it('should return the configured server name', () => {
      const config: dgraphResolversTypes.McpServer = {
        id: 'test-id',
        name: 'my-test-server',
        description: 'Test server',
        transport: dgraphResolversTypes.McpTransportType.Stdio,
        config: JSON.stringify({ identifier: 'test-package', registryType: 'npm' }),
        repositoryUrl: 'https://example.com',
        workspace: {} as any,
        registryServer: {} as any,
      };

      const service = new ToolServerService(logger, config, []);
      expect(service.getName()).toBe('my-test-server');
    });
  });

  describe('updateRoots', () => {
    it('should update roots and send notification', () => {
      const config: dgraphResolversTypes.McpServer = {
        id: 'test-id',
        name: 'test-server',
        description: 'Test server',
        transport: dgraphResolversTypes.McpTransportType.Stdio,
        config: JSON.stringify({ identifier: 'test-package', registryType: 'npm' }),
        repositoryUrl: 'https://example.com',
        workspace: {} as any,
        registryServer: {} as any,
      };

      const service = new ToolServerService(logger, config, []);
      const initialSignature = service.getConfigSignature();

      const newRoots = [
        { name: 'root1', uri: 'file:///path1' },
        { name: 'root2', uri: 'file:///path2' },
      ];

      service.updateRoots(newRoots);
      const updatedSignature = service.getConfigSignature();

      // Signature should change when roots are updated
      expect(initialSignature).not.toBe(updatedSignature);
      expect(updatedSignature).toContain('-2'); // Should end with -0-2 (0 tools, 2 roots)
    });
  });
});
