/**
 * SourcesPage Component Tests
 *
 * WHY: Test the SourcesPage filtering logic for transport and executionTarget filters.
 * Ensures filters work independently, combine with AND logic, and only apply to MCP Servers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SourcesPage from './SourcesPage';
import { SourceType } from '@/types/sources';
import type { McpServer } from '@/graphql/generated/graphql';
import { McpTransportType, ExecutionTarget } from '@/graphql/generated/graphql';
import { createMockMcpServer } from '@/test/factories';

// Mock the useMCPServers hook
const mockServers: McpServer[] = [];

interface UseMCPServersReturn {
  servers: McpServer[];
  stats: { total: number; withTools: number; withoutTools: number };
  loading: boolean;
  error: Error | undefined;
}

const mockUseMCPServers = vi.fn((): UseMCPServersReturn => ({
  servers: mockServers,
  stats: { total: 0, withTools: 0, withoutTools: 0 },
  loading: false,
  error: undefined,
}));

vi.mock('@/hooks/useMCPServers', () => ({
  useMCPServers: () => mockUseMCPServers(),
}));

// Mock UI store
vi.mock('@/stores/uiStore', () => ({
  useUIStore: () => ({
    setAddSourceWorkflowOpen: vi.fn(),
    setAddSourceWorkflowInitialStep: vi.fn(),
  }),
}));

// Mock workspace store
vi.mock('@/stores/workspaceStore', () => ({
  useWorkspaceId: () => 'workspace-123',
}));

// Mock useUrlSync hook
const mockSetSelectedId = vi.fn();
vi.mock('@/hooks/useUrlSync', () => ({
  useUrlSync: () => ({
    selectedId: null,
    setSelectedId: mockSetSelectedId,
  }),
}));

// Mock SourceTable component to test filtering logic
const mockSourceTableProps = vi.fn();
interface MockSourceTableProps {
  sources: unknown[];
  search: string;
  onSearchChange: (search: string) => void;
  transportFilter: string[];
  executionTargetFilter: string[];
}
vi.mock('@/components/sources/source-table', () => ({
  SourceTable: (props: MockSourceTableProps) => {
    mockSourceTableProps(props);
    return (
      <div data-testid="source-table">
        <div data-testid="source-count">{props.sources.length} sources</div>
        <div data-testid="search">{props.search}</div>
        <div data-testid="transport-filter">{props.transportFilter.join(',')}</div>
        <div data-testid="runon-filter">{props.executionTargetFilter.join(',')}</div>
      </div>
    );
  },
}));

// Mock SourceDetail component
vi.mock('@/components/sources/source-detail', () => ({
  SourceDetail: () => null,
}));

// Mock MasterDetailLayout to simplify testing
interface MockMasterDetailLayoutProps {
  table: React.ReactNode;
}
vi.mock('@/components/layout/master-detail-layout', () => ({
  MasterDetailLayout: ({ table }: MockMasterDetailLayoutProps) => <div>{table}</div>,
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('SourcesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServers.length = 0;
  });

  describe('Transport Filter', () => {
    it('filters sources by STREAM transport', async () => {
      const streamServer = createMockMcpServer({
        name: 'Stream Server',
        description: 'A stream server',
      });

      const stdioServer = createMockMcpServer({
        id: 'server-2',
        name: 'STDIO Server',
        description: 'A stdio server',
        transport: McpTransportType.Stdio,
      });

      mockServers.push(streamServer, stdioServer);

      renderWithProviders(<SourcesPage />);

      await waitFor(() => {
        expect(mockSourceTableProps).toHaveBeenCalled();
      });

      // Initially, all sources are shown
      const lastCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
      expect(lastCall.sources).toHaveLength(2);

      // Simulate setting transport filter to STREAM
      lastCall.onTransportFilterChange(['STREAM']);

      // Wait for filter to be applied and re-render to occur
      await waitFor(() => {
        const filteredCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        expect(filteredCall.transportFilter).toEqual(['STREAM']);
        expect(filteredCall.sources).toHaveLength(1);
        expect(filteredCall.sources[0].transport).toBe(McpTransportType.Stream);
      });
    });

    it('filters sources by STDIO transport', async () => {
      const stdioServer = createMockMcpServer({
        name: 'STDIO Server',
        description: 'A stdio server',
        transport: McpTransportType.Stdio,
        executionTarget: ExecutionTarget.Agent,
      });

      const sseServer = createMockMcpServer({
        id: 'server-2',
        name: 'SSE Server',
        description: 'An SSE server',
        transport: McpTransportType.Sse,
      });

      mockServers.push(stdioServer, sseServer);

      renderWithProviders(<SourcesPage />);

      await waitFor(() => {
        expect(mockSourceTableProps).toHaveBeenCalled();
      });

      // Initially, all sources are shown
      const lastCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
      expect(lastCall.sources).toHaveLength(2);

      // Simulate setting transport filter to STDIO
      lastCall.onTransportFilterChange(['STDIO']);

      // Wait for filter to be applied and re-render to occur
      await waitFor(() => {
        const filteredCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        expect(filteredCall.transportFilter).toEqual(['STDIO']);
        expect(filteredCall.sources).toHaveLength(1);
        expect(filteredCall.sources[0].transport).toBe(McpTransportType.Stdio);
      });
    });

    it('shows all transports when filter is empty', async () => {
      const streamServer = createMockMcpServer({
        name: 'Stream Server',
        description: 'A stream server',
      });

      mockServers.push(streamServer);

      renderWithProviders(<SourcesPage />);

      await waitFor(() => {
        const lastCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        expect(lastCall.sources).toHaveLength(1);
        expect(lastCall.transportFilter).toEqual([]);
      });
    });
  });

  describe('RunOn Filter', () => {
    it('filters sources by AGENT executionTarget', async () => {
      const agentServer = createMockMcpServer({
        name: 'Agent Server',
        description: 'An agent server',
        transport: McpTransportType.Stdio,
        executionTarget: ExecutionTarget.Agent,
      });

      const edgeServer = createMockMcpServer({
        id: 'server-2',
        name: 'Edge Server',
        description: 'An edge server',
        executionTarget: ExecutionTarget.Edge,
      });

      mockServers.push(agentServer, edgeServer);

      renderWithProviders(<SourcesPage />);

      await waitFor(() => {
        expect(mockSourceTableProps).toHaveBeenCalled();
      });

      // Initially, all sources are shown
      const lastCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
      expect(lastCall.sources).toHaveLength(2);

      // Simulate setting executionTarget filter to AGENT
      lastCall.onRunOnFilterChange(['AGENT']);

      // Wait for filter to be applied and re-render to occur
      await waitFor(() => {
        const filteredCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        expect(filteredCall.executionTargetFilter).toEqual(['AGENT']);
        expect(filteredCall.sources).toHaveLength(1);
        expect(filteredCall.sources[0].executionTarget).toBe(ExecutionTarget.Agent);
      });
    });

    it('shows all executionTarget values when filter is empty', async () => {
      const server = createMockMcpServer({
        name: 'Test Server',
        description: 'A test server',
      });

      mockServers.push(server);

      renderWithProviders(<SourcesPage />);

      await waitFor(() => {
        const lastCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        expect(lastCall.sources).toHaveLength(1);
        expect(lastCall.executionTargetFilter).toEqual([]);
      });
    });
  });

  describe('Combined Filters', () => {
    it('combines transport and executionTarget filters with AND logic', async () => {
      // Server that matches both filters (STREAM + EDGE)
      const matchingServer = createMockMcpServer({
        name: 'Matching Server',
        description: 'Matches both filters',
      });

      // Server that matches transport but not executionTarget (STREAM + AGENT)
      const wrongRunOnServer = createMockMcpServer({
        id: 'server-2',
        name: 'Wrong RunOn Server',
        description: 'Matches transport only',
        executionTarget: ExecutionTarget.Agent,
      });

      // Server that matches executionTarget but not transport (STDIO + EDGE)
      const wrongTransportServer = createMockMcpServer({
        id: 'server-3',
        name: 'Wrong Transport Server',
        description: 'Matches executionTarget only',
        transport: McpTransportType.Stdio,
      });

      mockServers.push(matchingServer, wrongRunOnServer, wrongTransportServer);

      renderWithProviders(<SourcesPage />);

      await waitFor(() => {
        expect(mockSourceTableProps).toHaveBeenCalled();
      });

      // Initially, all sources are shown
      const lastCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
      expect(lastCall.sources).toHaveLength(3);

      // Apply both filters: STREAM transport AND EDGE executionTarget
      lastCall.onTransportFilterChange(['STREAM']);
      lastCall.onRunOnFilterChange(['EDGE']);

      // Wait for filters to be applied - only server matching BOTH should remain
      await waitFor(() => {
        const filteredCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        expect(filteredCall.transportFilter).toEqual(['STREAM']);
        expect(filteredCall.executionTargetFilter).toEqual(['EDGE']);
        expect(filteredCall.sources).toHaveLength(1);
        expect(filteredCall.sources[0].transport).toBe(McpTransportType.Stream);
        expect(filteredCall.sources[0].executionTarget).toBe(ExecutionTarget.Edge);
      });
    });

    it('filters work independently', async () => {
      const server1 = createMockMcpServer({
        name: 'Server 1',
        description: 'Test server 1',
      });

      const server2 = createMockMcpServer({
        id: 'server-2',
        name: 'Server 2',
        description: 'Test server 2',
        transport: McpTransportType.Stdio,
        executionTarget: ExecutionTarget.Agent,
      });

      mockServers.push(server1, server2);

      renderWithProviders(<SourcesPage />);

      await waitFor(() => {
        const lastCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        // Both filters start empty, so all sources are shown
        expect(lastCall.sources).toHaveLength(2);
        expect(lastCall.transportFilter).toEqual([]);
        expect(lastCall.executionTargetFilter).toEqual([]);
      });
    });
  });

  describe('Filter State Management', () => {
    it('passes state setters to SourceTable', async () => {
      renderWithProviders(<SourcesPage />);

      await waitFor(() => {
        const lastCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        expect(typeof lastCall.onTransportFilterChange).toBe('function');
        expect(typeof lastCall.onRunOnFilterChange).toBe('function');
      });
    });

    it('initializes filters as empty arrays', async () => {
      renderWithProviders(<SourcesPage />);

      await waitFor(() => {
        const lastCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        expect(lastCall.transportFilter).toEqual([]);
        expect(lastCall.executionTargetFilter).toEqual([]);
      });
    });
  });

  describe('MCP Server Specific Filtering', () => {
    it('handles null executionTarget values', async () => {
      const serverWithNullRunOn = createMockMcpServer({
        name: 'Server with null executionTarget',
        description: 'Has null executionTarget',
        executionTarget: null,
      });

      mockServers.push(serverWithNullRunOn);

      renderWithProviders(<SourcesPage />);

      await waitFor(() => {
        const lastCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        // Server with null executionTarget should still be shown when no filter is applied
        expect(lastCall.sources).toHaveLength(1);
      });
    });

    it('adds type field to all sources', async () => {
      const server = createMockMcpServer({
        name: 'Test Server',
        description: 'Test',
      });

      mockServers.push(server);

      renderWithProviders(<SourcesPage />);

      await waitFor(() => {
        const lastCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        expect(lastCall.sources[0].type).toBe(SourceType.MCP_SERVER);
      });
    });
  });

  describe('Search Filter', () => {
    it('filters sources by name (case-insensitive)', async () => {
      const server1 = createMockMcpServer({
        name: 'GitHub Server',
        description: 'Connect to GitHub API',
      });

      const server2 = createMockMcpServer({
        id: 'server-2',
        name: 'Slack Server',
        description: 'Connect to Slack API',
      });

      mockServers.push(server1, server2);

      renderWithProviders(<SourcesPage />);

      await waitFor(() => {
        expect(mockSourceTableProps).toHaveBeenCalled();
      });

      // Initially, all sources are shown
      const lastCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
      expect(lastCall.sources).toHaveLength(2);

      // Simulate search for 'github'
      lastCall.onSearchChange('github');

      // Wait for search to be applied
      await waitFor(() => {
        const filteredCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        expect(filteredCall.search).toBe('github');
        expect(filteredCall.sources).toHaveLength(1);
        expect(filteredCall.sources[0].name).toBe('GitHub Server');
      });
    });

    it('filters sources by description (case-insensitive)', async () => {
      const server1 = createMockMcpServer({
        name: 'Server One',
        description: 'This connects to GitHub',
      });

      const server2 = createMockMcpServer({
        id: 'server-2',
        name: 'Server Two',
        description: 'This connects to Slack',
      });

      mockServers.push(server1, server2);

      renderWithProviders(<SourcesPage />);

      await waitFor(() => {
        expect(mockSourceTableProps).toHaveBeenCalled();
      });

      const lastCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
      expect(lastCall.sources).toHaveLength(2);

      // Simulate search for 'slack'
      lastCall.onSearchChange('slack');

      await waitFor(() => {
        const filteredCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        expect(filteredCall.search).toBe('slack');
        expect(filteredCall.sources).toHaveLength(1);
        expect(filteredCall.sources[0].description).toContain('Slack');
      });
    });

    it('search is case-insensitive', async () => {
      const server = createMockMcpServer({
        name: 'GitHub Server',
        description: 'Connect to GitHub API',
      });

      mockServers.push(server);

      renderWithProviders(<SourcesPage />);

      await waitFor(() => {
        expect(mockSourceTableProps).toHaveBeenCalled();
      });

      const lastCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];

      // Test uppercase search
      lastCall.onSearchChange('GITHUB');

      await waitFor(() => {
        const filteredCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        expect(filteredCall.sources).toHaveLength(1);
      });

      // Test mixed case search
      lastCall.onSearchChange('GiThUb');

      await waitFor(() => {
        const filteredCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        expect(filteredCall.sources).toHaveLength(1);
      });
    });

    it('handles sources with no description', async () => {
      const serverWithDesc = createMockMcpServer({
        name: 'Server One',
        description: 'Has description',
      });

      const serverWithoutDesc = createMockMcpServer({
        id: 'server-2',
        name: 'Server Two',
        description: undefined,
      });

      mockServers.push(serverWithDesc, serverWithoutDesc);

      renderWithProviders(<SourcesPage />);

      await waitFor(() => {
        expect(mockSourceTableProps).toHaveBeenCalled();
      });

      const lastCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];

      // Search by name should still work for server without description
      lastCall.onSearchChange('Two');

      await waitFor(() => {
        const filteredCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        expect(filteredCall.sources).toHaveLength(1);
        expect(filteredCall.sources[0].name).toBe('Server Two');
      });
    });

    it('shows empty results when no sources match search', async () => {
      const server = createMockMcpServer({
        name: 'GitHub Server',
        description: 'Connect to GitHub',
      });

      mockServers.push(server);

      renderWithProviders(<SourcesPage />);

      await waitFor(() => {
        expect(mockSourceTableProps).toHaveBeenCalled();
      });

      const lastCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];

      // Search for something that doesn't exist
      lastCall.onSearchChange('nonexistent');

      await waitFor(() => {
        const filteredCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        expect(filteredCall.sources).toHaveLength(0);
      });
    });

    it('trims whitespace from search query', async () => {
      const server = createMockMcpServer({
        name: 'GitHub Server',
        description: 'Connect to GitHub',
      });

      mockServers.push(server);

      renderWithProviders(<SourcesPage />);

      await waitFor(() => {
        expect(mockSourceTableProps).toHaveBeenCalled();
      });

      const lastCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];

      // Search with whitespace only should show all sources
      lastCall.onSearchChange('   ');

      await waitFor(() => {
        const filteredCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        expect(filteredCall.sources).toHaveLength(1);
      });
    });

    it('combines search with transport filter', async () => {
      const githubStream = createMockMcpServer({
        name: 'GitHub Server',
        description: 'Connect to GitHub',
        transport: McpTransportType.Stream,
      });

      const githubStdio = createMockMcpServer({
        id: 'server-2',
        name: 'GitHub STDIO',
        description: 'GitHub via STDIO',
        transport: McpTransportType.Stdio,
      });

      const slackStream = createMockMcpServer({
        id: 'server-3',
        name: 'Slack Server',
        description: 'Connect to Slack',
        transport: McpTransportType.Stream,
      });

      mockServers.push(githubStream, githubStdio, slackStream);

      renderWithProviders(<SourcesPage />);

      await waitFor(() => {
        expect(mockSourceTableProps).toHaveBeenCalled();
      });

      const lastCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
      expect(lastCall.sources).toHaveLength(3);

      // Apply search AND transport filter
      lastCall.onSearchChange('github');
      lastCall.onTransportFilterChange(['STREAM']);

      await waitFor(() => {
        const filteredCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        expect(filteredCall.search).toBe('github');
        expect(filteredCall.transportFilter).toEqual(['STREAM']);
        // Should only show GitHub Server with STREAM transport
        expect(filteredCall.sources).toHaveLength(1);
        expect(filteredCall.sources[0].name).toBe('GitHub Server');
        expect(filteredCall.sources[0].transport).toBe(McpTransportType.Stream);
      });
    });

    it('combines search with executionTarget filter', async () => {
      const githubAgent = createMockMcpServer({
        name: 'GitHub Server',
        description: 'Connect to GitHub',
        executionTarget: ExecutionTarget.Agent,
      });

      const githubEdge = createMockMcpServer({
        id: 'server-2',
        name: 'GitHub Edge',
        description: 'GitHub on Edge',
        executionTarget: ExecutionTarget.Edge,
      });

      const slackAgent = createMockMcpServer({
        id: 'server-3',
        name: 'Slack Server',
        description: 'Connect to Slack',
        executionTarget: ExecutionTarget.Agent,
      });

      mockServers.push(githubAgent, githubEdge, slackAgent);

      renderWithProviders(<SourcesPage />);

      await waitFor(() => {
        expect(mockSourceTableProps).toHaveBeenCalled();
      });

      const lastCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
      expect(lastCall.sources).toHaveLength(3);

      // Apply search AND executionTarget filter
      lastCall.onSearchChange('github');
      lastCall.onRunOnFilterChange(['AGENT']);

      await waitFor(() => {
        const filteredCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        expect(filteredCall.search).toBe('github');
        expect(filteredCall.executionTargetFilter).toEqual(['AGENT']);
        // Should only show GitHub Server with AGENT executionTarget
        expect(filteredCall.sources).toHaveLength(1);
        expect(filteredCall.sources[0].name).toBe('GitHub Server');
        expect(filteredCall.sources[0].executionTarget).toBe(ExecutionTarget.Agent);
      });
    });

    it('combines search with all filters (AND logic)', async () => {
      const matchingServer = createMockMcpServer({
        name: 'GitHub Server',
        description: 'Connect to GitHub',
        transport: McpTransportType.Stream,
        executionTarget: ExecutionTarget.Edge,
      });

      const wrongTransport = createMockMcpServer({
        id: 'server-2',
        name: 'GitHub STDIO',
        description: 'GitHub via STDIO',
        transport: McpTransportType.Stdio,
        executionTarget: ExecutionTarget.Edge,
      });

      const wrongRunOn = createMockMcpServer({
        id: 'server-3',
        name: 'GitHub Agent',
        description: 'GitHub on Agent',
        transport: McpTransportType.Stream,
        executionTarget: ExecutionTarget.Agent,
      });

      const wrongName = createMockMcpServer({
        id: 'server-4',
        name: 'Slack Server',
        description: 'Connect to Slack',
        transport: McpTransportType.Stream,
        executionTarget: ExecutionTarget.Edge,
      });

      mockServers.push(matchingServer, wrongTransport, wrongRunOn, wrongName);

      renderWithProviders(<SourcesPage />);

      await waitFor(() => {
        expect(mockSourceTableProps).toHaveBeenCalled();
      });

      const lastCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
      expect(lastCall.sources).toHaveLength(4);

      // Apply all filters
      lastCall.onSearchChange('github');
      lastCall.onTransportFilterChange(['STREAM']);
      lastCall.onRunOnFilterChange(['EDGE']);

      await waitFor(() => {
        const filteredCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        // Should only show the one server matching all criteria
        expect(filteredCall.sources).toHaveLength(1);
        expect(filteredCall.sources[0].name).toBe('GitHub Server');
      });
    });
  });

  describe('Loading and Error States', () => {
    it('passes loading state to SourceTable', async () => {
      mockUseMCPServers.mockReturnValue({
        servers: [],
        stats: { total: 0, withTools: 0, withoutTools: 0 },
        loading: true,
        error: undefined,
      });

      renderWithProviders(<SourcesPage />);

      await waitFor(() => {
        const lastCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        expect(lastCall.loading).toBe(true);
      });
    });

    it('shows error message when loading fails', () => {
      mockUseMCPServers.mockReturnValueOnce({
        servers: [],
        stats: { total: 0, withTools: 0, withoutTools: 0 },
        loading: false,
        error: new Error('Failed to load sources'),
      });

      renderWithProviders(<SourcesPage />);

      expect(screen.getByText('Error loading sources')).toBeDefined();
      expect(screen.getByText('Failed to load sources')).toBeDefined();
    });
  });

  describe('Filter State Management', () => {
    it('initializes search as empty string', async () => {
      renderWithProviders(<SourcesPage />);

      await waitFor(() => {
        const lastCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        expect(lastCall.search).toBe('');
      });
    });

    it('passes search setter to SourceTable', async () => {
      renderWithProviders(<SourcesPage />);

      await waitFor(() => {
        const lastCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        expect(typeof lastCall.onSearchChange).toBe('function');
      });
    });
  });
});
