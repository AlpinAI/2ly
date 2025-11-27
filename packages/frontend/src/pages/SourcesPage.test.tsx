/**
 * SourcesPage Component Tests
 *
 * WHY: Test the SourcesPage filtering logic for transport and runOn filters.
 * Ensures filters work independently, combine with AND logic, and only apply to MCP Servers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SourcesPage from './SourcesPage';
import { SourceType } from '@/types/sources';
import type { McpServer } from '@/graphql/generated/graphql';
import { McpTransportType, McpServerRunOn } from '@/graphql/generated/graphql';
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
  transportFilter: string[];
  runOnFilter: string[];
}
vi.mock('@/components/sources/source-table', () => ({
  SourceTable: (props: MockSourceTableProps) => {
    mockSourceTableProps(props);
    return (
      <div data-testid="source-table">
        <div data-testid="source-count">{props.sources.length} sources</div>
        <div data-testid="transport-filter">{props.transportFilter.join(',')}</div>
        <div data-testid="runon-filter">{props.runOnFilter.join(',')}</div>
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
        runOn: McpServerRunOn.Agent,
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
    it('filters sources by AGENT runOn', async () => {
      const agentServer = createMockMcpServer({
        name: 'Agent Server',
        description: 'An agent server',
        transport: McpTransportType.Stdio,
        runOn: McpServerRunOn.Agent,
      });

      const edgeServer = createMockMcpServer({
        id: 'server-2',
        name: 'Edge Server',
        description: 'An edge server',
        runOn: McpServerRunOn.Edge,
      });

      mockServers.push(agentServer, edgeServer);

      renderWithProviders(<SourcesPage />);

      await waitFor(() => {
        expect(mockSourceTableProps).toHaveBeenCalled();
      });

      // Initially, all sources are shown
      const lastCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
      expect(lastCall.sources).toHaveLength(2);

      // Simulate setting runOn filter to AGENT
      lastCall.onRunOnFilterChange(['AGENT']);

      // Wait for filter to be applied and re-render to occur
      await waitFor(() => {
        const filteredCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        expect(filteredCall.runOnFilter).toEqual(['AGENT']);
        expect(filteredCall.sources).toHaveLength(1);
        expect(filteredCall.sources[0].runOn).toBe(McpServerRunOn.Agent);
      });
    });

    it('shows all runOn values when filter is empty', async () => {
      const server = createMockMcpServer({
        name: 'Test Server',
        description: 'A test server',
      });

      mockServers.push(server);

      renderWithProviders(<SourcesPage />);

      await waitFor(() => {
        const lastCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        expect(lastCall.sources).toHaveLength(1);
        expect(lastCall.runOnFilter).toEqual([]);
      });
    });
  });

  describe('Combined Filters', () => {
    it('combines transport and runOn filters with AND logic', async () => {
      // Server that matches both filters (STREAM + EDGE)
      const matchingServer = createMockMcpServer({
        name: 'Matching Server',
        description: 'Matches both filters',
      });

      // Server that matches transport but not runOn (STREAM + AGENT)
      const wrongRunOnServer = createMockMcpServer({
        id: 'server-2',
        name: 'Wrong RunOn Server',
        description: 'Matches transport only',
        runOn: McpServerRunOn.Agent,
      });

      // Server that matches runOn but not transport (STDIO + EDGE)
      const wrongTransportServer = createMockMcpServer({
        id: 'server-3',
        name: 'Wrong Transport Server',
        description: 'Matches runOn only',
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

      // Apply both filters: STREAM transport AND EDGE runOn
      lastCall.onTransportFilterChange(['STREAM']);
      lastCall.onRunOnFilterChange(['EDGE']);

      // Wait for filters to be applied - only server matching BOTH should remain
      await waitFor(() => {
        const filteredCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        expect(filteredCall.transportFilter).toEqual(['STREAM']);
        expect(filteredCall.runOnFilter).toEqual(['EDGE']);
        expect(filteredCall.sources).toHaveLength(1);
        expect(filteredCall.sources[0].transport).toBe(McpTransportType.Stream);
        expect(filteredCall.sources[0].runOn).toBe(McpServerRunOn.Edge);
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
        runOn: McpServerRunOn.Agent,
      });

      mockServers.push(server1, server2);

      renderWithProviders(<SourcesPage />);

      await waitFor(() => {
        const lastCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        // Both filters start empty, so all sources are shown
        expect(lastCall.sources).toHaveLength(2);
        expect(lastCall.transportFilter).toEqual([]);
        expect(lastCall.runOnFilter).toEqual([]);
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
        expect(lastCall.runOnFilter).toEqual([]);
      });
    });
  });

  describe('MCP Server Specific Filtering', () => {
    it('handles null runOn values', async () => {
      const serverWithNullRunOn = createMockMcpServer({
        name: 'Server with null runOn',
        description: 'Has null runOn',
        runOn: null,
      });

      mockServers.push(serverWithNullRunOn);

      renderWithProviders(<SourcesPage />);

      await waitFor(() => {
        const lastCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        // Server with null runOn should still be shown when no filter is applied
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
      mockUseMCPServers.mockReturnValue({
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
});
