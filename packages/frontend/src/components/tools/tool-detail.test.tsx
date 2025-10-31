/**
 * ToolDetail Component Tests
 *
 * WHY: Test the ToolDetail component with scroll behavior and ToolTester integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToolDetail } from './tool-detail';
import * as runtimeStore from '@/stores/runtimeStore';
import * as notificationContext from '@/contexts/NotificationContext';
import { ActiveStatus } from '@/graphql/generated/graphql';
import type { GetMcpToolsQuery } from '@/graphql/generated/graphql';

// Mock stores and contexts
vi.mock('@/stores/runtimeStore');
vi.mock('@/contexts/NotificationContext');

// Mock Apollo Client
vi.mock('@apollo/client/react', () => ({
  useMutation: vi.fn(() => [vi.fn(), { loading: false }]),
}));

// Mock react-router-dom to provide useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ workspaceId: 'test-workspace' }),
  };
});

// Mock ToolTester component
vi.mock('./tool-tester', () => ({
  ToolTester: ({ toolId, toolName }: { toolId: string; toolName: string }) => (
    <div data-testid="tool-tester">
      Tool Tester for {toolName} ({toolId})
    </div>
  ),
}));

// Mock LinkToolDialog component
vi.mock('./link-tool-dialog', () => ({
  LinkToolDialog: () => <div data-testid="link-tool-dialog">Link Tool Dialog</div>,
}));

describe('ToolDetail', () => {
  const mockTool: NonNullable<NonNullable<GetMcpToolsQuery['mcpTools']>[number]> = {
    __typename: 'MCPTool',
    id: 'tool-1',
    name: 'test-tool',
    description: 'A test tool for testing',
    status: ActiveStatus.Active,
    inputSchema: '{"type":"object","properties":{"query":{"type":"string"}}}',
    annotations: '',
    createdAt: new Date('2025-01-01'),
    lastSeenAt: new Date('2025-01-01'),
    mcpServer: {
      __typename: 'MCPServer',
      id: 'server-1',
      name: 'Test Server',
      description: 'Test server description',
      repositoryUrl: 'https://github.com/test/server',
    },
    runtimes: [
      {
        __typename: 'Runtime',
        id: 'runtime-1',
        name: 'Test Agent',
        status: ActiveStatus.Active,
        capabilities: ['agent'],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock runtime store
    vi.mocked(runtimeStore.useRuntimeData).mockReturnValue({
      runtimes: [
        {
          __typename: 'Runtime',
          id: 'runtime-1',
          name: 'Test Agent',
          description: null,
          status: ActiveStatus.Active,
          capabilities: ['agent'],
          createdAt: new Date('2025-01-01'),
          lastSeenAt: null,
          hostIP: null,
          hostname: null,
          mcpClientName: null,
          roots: null,
          workspace: {
            __typename: 'Workspace',
            id: 'workspace-1',
            name: 'Test Workspace',
            createdAt: new Date('2025-01-01'),
            globalRuntime: null,
            mcpServers: null,
            mcpTools: null,
            onboardingSteps: null,
            registryServers: null,
            runtimes: null,
          },
          mcpServers: null,
          mcpToolCapabilities: null,
        },
      ],
      loading: false,
      error: null,
      stats: { total: 1, active: 1, inactive: 0 },
    });

    // Mock notification context
    vi.mocked(notificationContext.useNotification).mockReturnValue({
      toast: vi.fn(),
      confirm: vi.fn(),
    });
  });

  const renderComponent = (tool: NonNullable<NonNullable<GetMcpToolsQuery['mcpTools']>[number]>) => {
    return render(
      <MemoryRouter initialEntries={['/w/test-workspace/tools']}>
        <ToolDetail tool={tool} />
      </MemoryRouter>
    );
  };

  it('renders tool detail with scroll-smooth class', () => {
    const { container } = renderComponent(mockTool);

    const mainContainer = container.querySelector('.scroll-smooth');
    expect(mainContainer).toBeInTheDocument();
  });

  it('renders with overflow-auto for scrolling', () => {
    const { container } = renderComponent(mockTool);

    const mainContainer = container.querySelector('.overflow-auto');
    expect(mainContainer).toBeInTheDocument();
  });

  it('renders with full height flex column layout', () => {
    const { container } = renderComponent(mockTool);

    const mainContainer = container.querySelector('.flex.flex-col.h-full');
    expect(mainContainer).toBeInTheDocument();
  });

  it('renders tool name and description', () => {
    renderComponent(mockTool);

    expect(screen.getByText('test-tool')).toBeInTheDocument();
    expect(screen.getByText('A test tool for testing')).toBeInTheDocument();
  });

  it('renders tool status', () => {
    renderComponent(mockTool);

    expect(screen.getByText('Status')).toBeInTheDocument();
    // There may be multiple ACTIVE badges (tool status + agent status)
    const activeElements = screen.getAllByText('ACTIVE');
    expect(activeElements.length).toBeGreaterThan(0);
  });

  it('renders MCP server information', () => {
    renderComponent(mockTool);

    expect(screen.getByText('MCP Server')).toBeInTheDocument();
    expect(screen.getByText('Test Server')).toBeInTheDocument();
    expect(screen.getByText('Test server description')).toBeInTheDocument();
  });

  it('renders linked agents', () => {
    renderComponent(mockTool);

    expect(screen.getByText(/Available on Tool Sets \(1\)/)).toBeInTheDocument();
    expect(screen.getByText('Test Agent')).toBeInTheDocument();
  });

  it('renders ToolTester component', () => {
    renderComponent(mockTool);

    const toolTester = screen.getByTestId('tool-tester');
    expect(toolTester).toBeInTheDocument();
    expect(toolTester).toHaveTextContent('Tool Tester for test-tool (tool-1)');
  });

  it('shows message when tool has no linked agents', () => {
    const toolWithNoRuntimes = { ...mockTool, runtimes: [] };

    renderComponent(toolWithNoRuntimes);

    expect(screen.getByText('Not available on any agents yet')).toBeInTheDocument();
  });

  it('shows add button when unlinked agents exist', () => {
    const toolWithNoRuntimes = { ...mockTool, runtimes: [] };

    renderComponent(toolWithNoRuntimes);

    // Should show the add button since we have an agent in the store but it's not linked
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('does not show add button when all agents are linked', () => {
    renderComponent(mockTool);

    // All agents from the store are already linked to the tool
    const addButtons = screen.queryByRole('button', { name: /add/i });
    // The add button should not be present
    expect(addButtons).not.toBeInTheDocument();
  });

  it('renders external link for server repository', () => {
    const { container } = renderComponent(mockTool);

    const externalLink = container.querySelector('a[href="https://github.com/test/server"]');
    expect(externalLink).toBeInTheDocument();
    expect(externalLink?.getAttribute('target')).toBe('_blank');
    expect(externalLink?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('renders inactive status with correct styling', () => {
    const inactiveTool = {
      ...mockTool,
      status: ActiveStatus.Inactive,
    };

    renderComponent(inactiveTool);

    const statusElement = screen.getByText('INACTIVE');
    expect(statusElement.className).toContain('bg-gray-100');
  });

  it('renders agent status badges', () => {
    renderComponent(mockTool);

    // Check for status badge in agent list
    const statusBadges = screen.getAllByText('ACTIVE');
    expect(statusBadges.length).toBeGreaterThan(0);
  });

  it('container supports smooth scrolling for ToolTester', () => {
    const { container } = renderComponent(mockTool);

    // Verify the container has the necessary classes for smooth scrolling
    const scrollContainer = container.querySelector('.scroll-smooth.overflow-auto');
    expect(scrollContainer).toBeInTheDocument();

    // Verify it's a flex container with full height
    expect(scrollContainer?.className).toContain('flex');
    expect(scrollContainer?.className).toContain('flex-col');
    expect(scrollContainer?.className).toContain('h-full');
  });

  it('ToolTester is placed after other content for scroll behavior', () => {
    renderComponent(mockTool);

    // ToolTester should be in the last section (after agents section)
    const toolTester = screen.getByTestId('tool-tester');
    expect(toolTester).toBeInTheDocument();

    // Check that it's in a border-top section (visually separated)
    const toolTesterSection = toolTester.closest('.border-t');
    expect(toolTesterSection).toBeInTheDocument();
  });

  it('renders unlink button for linked agents', () => {
    renderComponent(mockTool);

    // Check for unlink button (X icon button)
    const buttons = screen.getAllByRole('button');
    const unlinkButton = buttons.find(
      (button) => button.querySelector('.h-3.w-3')
    );

    expect(unlinkButton).toBeDefined();
  });

  it('header is fixed at top with border', () => {
    const { container } = renderComponent(mockTool);

    const header = container.querySelector('.border-b.border-gray-200');
    expect(header).toBeInTheDocument();
    expect(header?.className).toContain('p-4');
  });

  it('content area is scrollable', () => {
    const { container } = renderComponent(mockTool);

    const contentArea = container.querySelector('.flex-1.p-4');
    expect(contentArea).toBeInTheDocument();
  });
});
