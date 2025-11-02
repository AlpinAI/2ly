/**
 * Tests for useWorkspaceVisualization Hook
 *
 * WHY: Ensure graph transformation logic correctly converts GraphQL data
 * into nodes and edges for D3 visualization.
 *
 * WHAT WE TEST:
 * - Node creation for each entity type
 * - Edge creation for relationships
 * - Search filtering
 * - Type filtering
 * - Tool call visibility toggle
 * - Stats calculation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWorkspaceVisualization } from './useWorkspaceVisualization';
import * as apolloClient from '@apollo/client/react';
import * as workspaceStore from '@/stores/workspaceStore';

// Mock dependencies
vi.mock('@apollo/client/react');
vi.mock('@/stores/workspaceStore');

describe('useWorkspaceVisualization', () => {
  const mockWorkspaceId = 'workspace-1';

  beforeEach(() => {
    vi.mocked(workspaceStore.useWorkspaceId).mockReturnValue(mockWorkspaceId);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty graph data when no data is available', () => {
    vi.mocked(apolloClient.useQuery).mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
    } as never);

    const { result } = renderHook(() => useWorkspaceVisualization());

    expect(result.current.nodes).toEqual([]);
    expect(result.current.edges).toEqual([]);
    expect(result.current.stats.totalNodes).toBe(0);
    expect(result.current.stats.totalEdges).toBe(0);
  });

  it('should transform servers into nodes', () => {
    const mockData = {
      mcpServers: [
        {
          id: 'server-1',
          name: 'Test Server',
          description: 'A test server',
          transport: 'STREAM',
          runOn: 'GLOBAL',
          runtime: null,
          tools: [],
        },
      ],
      mcpTools: [],
      workspace: [],
      toolCalls: { toolCalls: [] },
    };

    vi.mocked(apolloClient.useQuery).mockReturnValue({
      data: mockData,
      loading: false,
      error: undefined,
    } as never);

    const { result } = renderHook(() => useWorkspaceVisualization());

    expect(result.current.nodes).toHaveLength(1);
    expect(result.current.nodes[0]).toMatchObject({
      id: 'server-1',
      label: 'Test Server',
      type: 'server',
      metadata: {
        description: 'A test server',
        transport: 'STREAM',
        runOn: 'GLOBAL',
      },
    });
  });

  it('should create edges between servers and tools', () => {
    const mockData = {
      mcpServers: [
        {
          id: 'server-1',
          name: 'Test Server',
          description: 'A test server',
          transport: 'STREAM',
          runOn: 'GLOBAL',
          runtime: null,
          tools: [{ id: 'tool-1', name: 'Test Tool' }],
        },
      ],
      mcpTools: [
        {
          id: 'tool-1',
          name: 'Test Tool',
          description: 'A test tool',
          status: 'ACTIVE',
          mcpServer: { id: 'server-1', name: 'Test Server' },
          runtimes: [],
          toolSets: [],
        },
      ],
      workspace: [],
      toolCalls: { toolCalls: [] },
    };

    vi.mocked(apolloClient.useQuery).mockReturnValue({
      data: mockData,
      loading: false,
      error: undefined,
    } as never);

    const { result } = renderHook(() => useWorkspaceVisualization());

    expect(result.current.edges).toHaveLength(1);
    expect(result.current.edges[0]).toMatchObject({
      source: 'server-1',
      target: 'tool-1',
      label: 'provides',
      type: 'server-tool',
    });
  });

  it('should create edges between tools and runtimes', () => {
    const mockData = {
      mcpServers: [],
      mcpTools: [
        {
          id: 'tool-1',
          name: 'Test Tool',
          description: 'A test tool',
          status: 'ACTIVE',
          mcpServer: { id: 'server-1', name: 'Test Server' },
          runtimes: [{ id: 'runtime-1', name: 'Test Runtime' }],
          toolSets: [],
        },
      ],
      workspace: [
        {
          id: mockWorkspaceId,
          name: 'Test Workspace',
          runtimes: [
            {
              id: 'runtime-1',
              name: 'Test Runtime',
              description: 'A test runtime',
              status: 'ACTIVE',
              mcpServers: [],
              mcpToolCapabilities: [],
            },
          ],
          toolSets: [],
        },
      ],
      toolCalls: { toolCalls: [] },
    };

    vi.mocked(apolloClient.useQuery).mockReturnValue({
      data: mockData,
      loading: false,
      error: undefined,
    } as never);

    const { result } = renderHook(() => useWorkspaceVisualization());

    const toolRuntimeEdge = result.current.edges.find(
      (e) => e.type === 'tool-runtime',
    );
    expect(toolRuntimeEdge).toMatchObject({
      source: 'tool-1',
      target: 'runtime-1',
      label: 'available on',
      type: 'tool-runtime',
    });
  });

  it('should filter nodes by search term', async () => {
    const mockData = {
      mcpServers: [
        { id: 'server-1', name: 'Alpha Server', description: '', transport: 'STREAM', runOn: 'GLOBAL', runtime: null, tools: [] },
        { id: 'server-2', name: 'Beta Server', description: '', transport: 'STREAM', runOn: 'GLOBAL', runtime: null, tools: [] },
      ],
      mcpTools: [],
      workspace: [],
      toolCalls: { toolCalls: [] },
    };

    vi.mocked(apolloClient.useQuery).mockReturnValue({
      data: mockData,
      loading: false,
      error: undefined,
    } as never);

    const { result } = renderHook(() => useWorkspaceVisualization());

    // Initially should have both servers
    expect(result.current.nodes).toHaveLength(2);

    // Filter by "alpha"
    result.current.filters.setSearch('alpha');

    // Wait for the filter to be applied
    await waitFor(() => {
      expect(result.current.nodes).toHaveLength(1);
    });

    expect(result.current.nodes[0].label).toBe('Alpha Server');
  });

  it('should filter nodes by type', async () => {
    const mockData = {
      mcpServers: [
        { id: 'server-1', name: 'Server 1', description: '', transport: 'STREAM', runOn: 'GLOBAL', runtime: null, tools: [] },
      ],
      mcpTools: [
        { id: 'tool-1', name: 'Tool 1', description: '', status: 'ACTIVE', mcpServer: { id: 'server-1', name: 'Server 1' }, runtimes: [], toolSets: [] },
      ],
      workspace: [
        {
          id: mockWorkspaceId,
          name: 'Test Workspace',
          runtimes: [
            { id: 'runtime-1', name: 'Runtime 1', description: '', status: 'ACTIVE', mcpServers: [], mcpToolCapabilities: [] },
          ],
          toolSets: [],
        },
      ],
      toolCalls: { toolCalls: [] },
    };

    vi.mocked(apolloClient.useQuery).mockReturnValue({
      data: mockData,
      loading: false,
      error: undefined,
    } as never);

    const { result } = renderHook(() => useWorkspaceVisualization());

    // Initially should have 3 nodes (server, tool, runtime)
    expect(result.current.nodes).toHaveLength(3);

    // Filter to only show servers
    result.current.filters.setTypes(['server']);

    // Wait for the filter to be applied
    await waitFor(() => {
      expect(result.current.nodes).toHaveLength(1);
    });

    expect(result.current.nodes[0].type).toBe('server');
  });

  it('should toggle tool call visibility', async () => {
    const mockData = {
      mcpServers: [],
      mcpTools: [
        { id: 'tool-1', name: 'Tool 1', description: '', status: 'ACTIVE', mcpServer: { id: 'server-1', name: 'Server 1' }, runtimes: [], toolSets: [] },
      ],
      workspace: [],
      toolCalls: {
        toolCalls: [
          {
            id: 'call-1',
            status: 'COMPLETED',
            calledAt: '2024-01-01T00:00:00Z',
            mcpTool: { id: 'tool-1', name: 'Tool 1' },
            calledBy: { id: 'runtime-1', name: 'Runtime 1' },
            executedBy: null,
          },
        ],
      },
    };

    vi.mocked(apolloClient.useQuery).mockReturnValue({
      data: mockData,
      loading: false,
      error: undefined,
    } as never);

    const { result } = renderHook(() => useWorkspaceVisualization());

    // Initially should not show tool calls
    expect(result.current.nodes.some((n) => n.type === 'toolcall')).toBe(false);

    // Enable tool calls
    result.current.filters.setShowToolCalls(true);

    // Wait for the filter to be applied
    await waitFor(() => {
      expect(result.current.nodes.some((n) => n.type === 'toolcall')).toBe(true);
    });
  });

  it('should calculate correct stats', () => {
    const mockData = {
      mcpServers: [
        { id: 'server-1', name: 'Server 1', description: '', transport: 'STREAM', runOn: 'GLOBAL', runtime: null, tools: [] },
        { id: 'server-2', name: 'Server 2', description: '', transport: 'STREAM', runOn: 'GLOBAL', runtime: null, tools: [] },
      ],
      mcpTools: [
        { id: 'tool-1', name: 'Tool 1', description: '', status: 'ACTIVE', mcpServer: { id: 'server-1', name: 'Server 1' }, runtimes: [], toolSets: [] },
      ],
      workspace: [
        {
          id: mockWorkspaceId,
          name: 'Test Workspace',
          runtimes: [
            { id: 'runtime-1', name: 'Runtime 1', description: '', status: 'ACTIVE', mcpServers: [], mcpToolCapabilities: [] },
          ],
          toolSets: [
            { id: 'toolset-1', name: 'Toolset 1', description: '', status: 'ACTIVE', mcpToolCapabilities: [] },
          ],
        },
      ],
      toolCalls: { toolCalls: [] },
    };

    vi.mocked(apolloClient.useQuery).mockReturnValue({
      data: mockData,
      loading: false,
      error: undefined,
    } as never);

    const { result } = renderHook(() => useWorkspaceVisualization());

    expect(result.current.stats).toMatchObject({
      totalNodes: 5, // 2 servers + 1 tool + 1 runtime + 1 toolset
      servers: 2,
      tools: 1,
      runtimes: 1,
      toolsets: 1,
      toolcalls: 0,
    });
  });

  it('should handle loading state', () => {
    vi.mocked(apolloClient.useQuery).mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
    } as never);

    const { result } = renderHook(() => useWorkspaceVisualization());

    expect(result.current.loading).toBe(true);
    expect(result.current.nodes).toEqual([]);
  });

  it('should handle error state', () => {
    const mockError = new Error('GraphQL error');

    vi.mocked(apolloClient.useQuery).mockReturnValue({
      data: undefined,
      loading: false,
      error: mockError,
    } as never);

    const { result } = renderHook(() => useWorkspaceVisualization());

    expect(result.current.error).toBe(mockError);
    expect(result.current.nodes).toEqual([]);
  });

  it('should reset filters', async () => {
    const mockData = {
      mcpServers: [
        { id: 'server-1', name: 'Server 1', description: '', transport: 'STREAM', runOn: 'GLOBAL', runtime: null, tools: [] },
      ],
      mcpTools: [],
      workspace: [],
      toolCalls: { toolCalls: [] },
    };

    vi.mocked(apolloClient.useQuery).mockReturnValue({
      data: mockData,
      loading: false,
      error: undefined,
    } as never);

    const { result } = renderHook(() => useWorkspaceVisualization());

    // Set some filters
    result.current.filters.setSearch('test');
    result.current.filters.setTypes(['server']);
    result.current.filters.setShowToolCalls(true);

    // Verify filters are set
    await waitFor(() => {
      expect(result.current.filters.search).toBe('test');
      expect(result.current.filters.types).toEqual(['server']);
      expect(result.current.filters.showToolCalls).toBe(true);
    });

    // Reset filters
    result.current.filters.reset();

    // Verify filters are cleared
    await waitFor(() => {
      expect(result.current.filters.search).toBe('');
      expect(result.current.filters.types).toEqual([]);
      expect(result.current.filters.showToolCalls).toBe(false);
    });
  });
});
