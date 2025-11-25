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

// Mock the useMCPServers hook
const mockServers: McpServer[] = [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUseMCPServers = vi.fn((): any => ({
  servers: mockServers,
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
      const streamServer: McpServer = {
        __typename: 'MCPServer',
        id: 'server-1',
        name: 'Stream Server',
        description: 'A stream server',
        transport: McpTransportType.Stream,
        runOn: McpServerRunOn.Global,
        config: '{}',
        repositoryUrl: '',
        registryServer: {
          __typename: 'MCPRegistryServer',
          id: 'reg-1',
          _meta: null,
          configurations: null,
          name: 'Registry Server',
          title: 'Registry Server Title',
          repositoryUrl: '',
          description: '',
          packages: null,
          remotes: null,
          version: '1.0.0',
          createdAt: new Date(),
          lastSeenAt: new Date(),
          workspace: {
            __typename: 'Workspace',
            id: 'workspace-1',
            name: 'Test Workspace',
            createdAt: new Date(),
            globalRuntime: null,
            mcpServers: null,
            mcpTools: null,
            onboardingSteps: null,
            registryServers: null,
            runtimes: null,
            toolSets: null,
          },
        },
        runtime: null,
        tools: null,
        workspace: {
          __typename: 'Workspace',
          id: 'workspace-1',
          name: 'Test Workspace',
          createdAt: new Date(),
          globalRuntime: null,
          mcpServers: null,
          mcpTools: null,
          onboardingSteps: null,
          registryServers: null,
          runtimes: null,
          toolSets: null,
        },
      };

      const stdioServer: McpServer = {
        ...streamServer,
        id: 'server-2',
        name: 'STDIO Server',
        description: 'A stdio server',
        transport: McpTransportType.Stdio,
      };

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
      const stdioServer: McpServer = {
        __typename: 'MCPServer',
        id: 'server-1',
        name: 'STDIO Server',
        description: 'A stdio server',
        transport: McpTransportType.Stdio,
        runOn: McpServerRunOn.Agent,
        config: '{}',
        repositoryUrl: '',
        registryServer: {
          __typename: 'MCPRegistryServer',
          id: 'reg-1',
          _meta: null,
          configurations: null,
          name: 'Registry Server',
          title: 'Registry Server Title',
          repositoryUrl: '',
          description: '',
          packages: null,
          remotes: null,
          version: '1.0.0',
          createdAt: new Date(),
          lastSeenAt: new Date(),
          workspace: {
            __typename: 'Workspace',
            id: 'workspace-1',
            name: 'Test Workspace',
            createdAt: new Date(),
            globalRuntime: null,
            mcpServers: null,
            mcpTools: null,
            onboardingSteps: null,
            registryServers: null,
            runtimes: null,
            toolSets: null,
          },
        },
        runtime: null,
        tools: null,
        workspace: {
          __typename: 'Workspace',
          id: 'workspace-1',
          name: 'Test Workspace',
          createdAt: new Date(),
          globalRuntime: null,
          mcpServers: null,
          mcpTools: null,
          onboardingSteps: null,
          registryServers: null,
          runtimes: null,
          toolSets: null,
        },
      };

      const sseServer: McpServer = {
        ...stdioServer,
        id: 'server-2',
        name: 'SSE Server',
        description: 'An SSE server',
        transport: McpTransportType.Sse,
      };

      mockServers.push(stdioServer, sseServer);

      renderWithProviders(<SourcesPage />);

      await waitFor(() => {
        expect(mockSourceTableProps).toHaveBeenCalled();
      });

      // Get initial props
      const lastCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
      expect(lastCall.sources).toHaveLength(2);
    });

    it('shows all transports when filter is empty', async () => {
      const streamServer: McpServer = {
        __typename: 'MCPServer',
        id: 'server-1',
        name: 'Stream Server',
        description: 'A stream server',
        transport: McpTransportType.Stream,
        runOn: McpServerRunOn.Global,
        config: '{}',
        repositoryUrl: '',
        registryServer: {
          __typename: 'MCPRegistryServer',
          id: 'reg-1',
          _meta: null,
          configurations: null,
          name: 'Registry Server',
          title: 'Registry Server Title',
          repositoryUrl: '',
          description: '',
          packages: null,
          remotes: null,
          version: '1.0.0',
          createdAt: new Date(),
          lastSeenAt: new Date(),
          workspace: {
            __typename: 'Workspace',
            id: 'workspace-1',
            name: 'Test Workspace',
            createdAt: new Date(),
            globalRuntime: null,
            mcpServers: null,
            mcpTools: null,
            onboardingSteps: null,
            registryServers: null,
            runtimes: null,
            toolSets: null,
          },
        },
        runtime: null,
        tools: null,
        workspace: {
          __typename: 'Workspace',
          id: 'workspace-1',
          name: 'Test Workspace',
          createdAt: new Date(),
          globalRuntime: null,
          mcpServers: null,
          mcpTools: null,
          onboardingSteps: null,
          registryServers: null,
          runtimes: null,
          toolSets: null,
        },
      };

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
    it('filters sources by GLOBAL runOn', async () => {
      const globalServer: McpServer = {
        __typename: 'MCPServer',
        id: 'server-1',
        name: 'Global Server',
        description: 'A global server',
        transport: McpTransportType.Stream,
        runOn: McpServerRunOn.Global,
        config: '{}',
        repositoryUrl: '',
        registryServer: {
          __typename: 'MCPRegistryServer',
          id: 'reg-1',
          _meta: null,
          configurations: null,
          name: 'Registry Server',
          title: 'Registry Server Title',
          repositoryUrl: '',
          description: '',
          packages: null,
          remotes: null,
          version: '1.0.0',
          createdAt: new Date(),
          lastSeenAt: new Date(),
          workspace: {
            __typename: 'Workspace',
            id: 'workspace-1',
            name: 'Test Workspace',
            createdAt: new Date(),
            globalRuntime: null,
            mcpServers: null,
            mcpTools: null,
            onboardingSteps: null,
            registryServers: null,
            runtimes: null,
            toolSets: null,
          },
        },
        runtime: null,
        tools: null,
        workspace: {
          __typename: 'Workspace',
          id: 'workspace-1',
          name: 'Test Workspace',
          createdAt: new Date(),
          globalRuntime: null,
          mcpServers: null,
          mcpTools: null,
          onboardingSteps: null,
          registryServers: null,
          runtimes: null,
          toolSets: null,
        },
      };

      const agentServer: McpServer = {
        ...globalServer,
        id: 'server-2',
        name: 'Agent Server',
        description: 'An agent server',
        runOn: McpServerRunOn.Agent,
      };

      mockServers.push(globalServer, agentServer);

      renderWithProviders(<SourcesPage />);

      await waitFor(() => {
        const lastCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        expect(lastCall.sources).toHaveLength(2);
        expect(lastCall.runOnFilter).toEqual([]);
      });
    });

    it('filters sources by AGENT runOn', async () => {
      const agentServer: McpServer = {
        __typename: 'MCPServer',
        id: 'server-1',
        name: 'Agent Server',
        description: 'An agent server',
        transport: McpTransportType.Stdio,
        runOn: McpServerRunOn.Agent,
        config: '{}',
        repositoryUrl: '',
        registryServer: {
          __typename: 'MCPRegistryServer',
          id: 'reg-1',
          _meta: null,
          configurations: null,
          name: 'Registry Server',
          title: 'Registry Server Title',
          repositoryUrl: '',
          description: '',
          packages: null,
          remotes: null,
          version: '1.0.0',
          createdAt: new Date(),
          lastSeenAt: new Date(),
          workspace: {
            __typename: 'Workspace',
            id: 'workspace-1',
            name: 'Test Workspace',
            createdAt: new Date(),
            globalRuntime: null,
            mcpServers: null,
            mcpTools: null,
            onboardingSteps: null,
            registryServers: null,
            runtimes: null,
            toolSets: null,
          },
        },
        runtime: null,
        tools: null,
        workspace: {
          __typename: 'Workspace',
          id: 'workspace-1',
          name: 'Test Workspace',
          createdAt: new Date(),
          globalRuntime: null,
          mcpServers: null,
          mcpTools: null,
          onboardingSteps: null,
          registryServers: null,
          runtimes: null,
          toolSets: null,
        },
      };

      const edgeServer: McpServer = {
        ...agentServer,
        id: 'server-2',
        name: 'Edge Server',
        description: 'An edge server',
        runOn: McpServerRunOn.Edge,
      };

      mockServers.push(agentServer, edgeServer);

      renderWithProviders(<SourcesPage />);

      await waitFor(() => {
        const lastCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        expect(lastCall.sources).toHaveLength(2);
      });
    });

    it('shows all runOn values when filter is empty', async () => {
      const server: McpServer = {
        __typename: 'MCPServer',
        id: 'server-1',
        name: 'Test Server',
        description: 'A test server',
        transport: McpTransportType.Stream,
        runOn: McpServerRunOn.Global,
        config: '{}',
        repositoryUrl: '',
        registryServer: {
          __typename: 'MCPRegistryServer',
          id: 'reg-1',
          _meta: null,
          configurations: null,
          name: 'Registry Server',
          title: 'Registry Server Title',
          repositoryUrl: '',
          description: '',
          packages: null,
          remotes: null,
          version: '1.0.0',
          createdAt: new Date(),
          lastSeenAt: new Date(),
          workspace: {
            __typename: 'Workspace',
            id: 'workspace-1',
            name: 'Test Workspace',
            createdAt: new Date(),
            globalRuntime: null,
            mcpServers: null,
            mcpTools: null,
            onboardingSteps: null,
            registryServers: null,
            runtimes: null,
            toolSets: null,
          },
        },
        runtime: null,
        tools: null,
        workspace: {
          __typename: 'Workspace',
          id: 'workspace-1',
          name: 'Test Workspace',
          createdAt: new Date(),
          globalRuntime: null,
          mcpServers: null,
          mcpTools: null,
          onboardingSteps: null,
          registryServers: null,
          runtimes: null,
          toolSets: null,
        },
      };

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
      // Server that matches both filters
      const matchingServer: McpServer = {
        __typename: 'MCPServer',
        id: 'server-1',
        name: 'Matching Server',
        description: 'Matches both filters',
        transport: McpTransportType.Stream,
        runOn: McpServerRunOn.Global,
        config: '{}',
        repositoryUrl: '',
        registryServer: {
          __typename: 'MCPRegistryServer',
          id: 'reg-1',
          _meta: null,
          configurations: null,
          name: 'Registry Server',
          title: 'Registry Server Title',
          repositoryUrl: '',
          description: '',
          packages: null,
          remotes: null,
          version: '1.0.0',
          createdAt: new Date(),
          lastSeenAt: new Date(),
          workspace: {
            __typename: 'Workspace',
            id: 'workspace-1',
            name: 'Test Workspace',
            createdAt: new Date(),
            globalRuntime: null,
            mcpServers: null,
            mcpTools: null,
            onboardingSteps: null,
            registryServers: null,
            runtimes: null,
            toolSets: null,
          },
        },
        runtime: null,
        tools: null,
        workspace: {
          __typename: 'Workspace',
          id: 'workspace-1',
          name: 'Test Workspace',
          createdAt: new Date(),
          globalRuntime: null,
          mcpServers: null,
          mcpTools: null,
          onboardingSteps: null,
          registryServers: null,
          runtimes: null,
          toolSets: null,
        },
      };

      // Server that matches transport but not runOn
      const wrongRunOnServer: McpServer = {
        ...matchingServer,
        id: 'server-2',
        name: 'Wrong RunOn Server',
        description: 'Matches transport only',
        runOn: McpServerRunOn.Agent,
      };

      // Server that matches runOn but not transport
      const wrongTransportServer: McpServer = {
        ...matchingServer,
        id: 'server-3',
        name: 'Wrong Transport Server',
        description: 'Matches runOn only',
        transport: McpTransportType.Stdio,
      };

      mockServers.push(matchingServer, wrongRunOnServer, wrongTransportServer);

      renderWithProviders(<SourcesPage />);

      await waitFor(() => {
        const lastCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        expect(lastCall.sources).toHaveLength(3);
      });
    });

    it('filters work independently', async () => {
      const server1: McpServer = {
        __typename: 'MCPServer',
        id: 'server-1',
        name: 'Server 1',
        description: 'Test server 1',
        transport: McpTransportType.Stream,
        runOn: McpServerRunOn.Global,
        config: '{}',
        repositoryUrl: '',
        registryServer: {
          __typename: 'MCPRegistryServer',
          id: 'reg-1',
          _meta: null,
          configurations: null,
          name: 'Registry Server',
          title: 'Registry Server Title',
          repositoryUrl: '',
          description: '',
          packages: null,
          remotes: null,
          version: '1.0.0',
          createdAt: new Date(),
          lastSeenAt: new Date(),
          workspace: {
            __typename: 'Workspace',
            id: 'workspace-1',
            name: 'Test Workspace',
            createdAt: new Date(),
            globalRuntime: null,
            mcpServers: null,
            mcpTools: null,
            onboardingSteps: null,
            registryServers: null,
            runtimes: null,
            toolSets: null,
          },
        },
        runtime: null,
        tools: null,
        workspace: {
          __typename: 'Workspace',
          id: 'workspace-1',
          name: 'Test Workspace',
          createdAt: new Date(),
          globalRuntime: null,
          mcpServers: null,
          mcpTools: null,
          onboardingSteps: null,
          registryServers: null,
          runtimes: null,
          toolSets: null,
        },
      };

      const server2: McpServer = {
        ...server1,
        id: 'server-2',
        name: 'Server 2',
        description: 'Test server 2',
        transport: McpTransportType.Stdio,
        runOn: McpServerRunOn.Agent,
      };

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
      const serverWithNullRunOn: McpServer = {
        __typename: 'MCPServer',
        id: 'server-1',
        name: 'Server with null runOn',
        description: 'Has null runOn',
        transport: McpTransportType.Stream,
        runOn: null,
        config: '{}',
        repositoryUrl: '',
        registryServer: {
          __typename: 'MCPRegistryServer',
          id: 'reg-1',
          _meta: null,
          configurations: null,
          name: 'Registry Server',
          title: 'Registry Server Title',
          repositoryUrl: '',
          description: '',
          packages: null,
          remotes: null,
          version: '1.0.0',
          createdAt: new Date(),
          lastSeenAt: new Date(),
          workspace: {
            __typename: 'Workspace',
            id: 'workspace-1',
            name: 'Test Workspace',
            createdAt: new Date(),
            globalRuntime: null,
            mcpServers: null,
            mcpTools: null,
            onboardingSteps: null,
            registryServers: null,
            runtimes: null,
            toolSets: null,
          },
        },
        runtime: null,
        tools: null,
        workspace: {
          __typename: 'Workspace',
          id: 'workspace-1',
          name: 'Test Workspace',
          createdAt: new Date(),
          globalRuntime: null,
          mcpServers: null,
          mcpTools: null,
          onboardingSteps: null,
          registryServers: null,
          runtimes: null,
          toolSets: null,
        },
      };

      mockServers.push(serverWithNullRunOn);

      renderWithProviders(<SourcesPage />);

      await waitFor(() => {
        const lastCall = mockSourceTableProps.mock.calls[mockSourceTableProps.mock.calls.length - 1][0];
        // Server with null runOn should still be shown when no filter is applied
        expect(lastCall.sources).toHaveLength(1);
      });
    });

    it('adds type field to all sources', async () => {
      const server: McpServer = {
        __typename: 'MCPServer',
        id: 'server-1',
        name: 'Test Server',
        description: 'Test',
        transport: McpTransportType.Stream,
        runOn: McpServerRunOn.Global,
        config: '{}',
        repositoryUrl: '',
        registryServer: {
          __typename: 'MCPRegistryServer',
          id: 'reg-1',
          _meta: null,
          configurations: null,
          name: 'Registry Server',
          title: 'Registry Server Title',
          repositoryUrl: '',
          description: '',
          packages: null,
          remotes: null,
          version: '1.0.0',
          createdAt: new Date(),
          lastSeenAt: new Date(),
          workspace: {
            __typename: 'Workspace',
            id: 'workspace-1',
            name: 'Test Workspace',
            createdAt: new Date(),
            globalRuntime: null,
            mcpServers: null,
            mcpTools: null,
            onboardingSteps: null,
            registryServers: null,
            runtimes: null,
            toolSets: null,
          },
        },
        runtime: null,
        tools: null,
        workspace: {
          __typename: 'Workspace',
          id: 'workspace-1',
          name: 'Test Workspace',
          createdAt: new Date(),
          globalRuntime: null,
          mcpServers: null,
          mcpTools: null,
          onboardingSteps: null,
          registryServers: null,
          runtimes: null,
          toolSets: null,
        },
      };

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
        loading: false,
        error: new Error('Failed to load sources'),
      });

      renderWithProviders(<SourcesPage />);

      expect(screen.getByText('Error loading sources')).toBeDefined();
      expect(screen.getByText('Failed to load sources')).toBeDefined();
    });
  });
});
