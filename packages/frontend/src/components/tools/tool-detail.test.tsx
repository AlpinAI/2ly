/**
 * ToolDetail Component Tests
 *
 * WHY: Test the ToolDetail component with scroll behavior and ToolTester integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToolDetail } from './tool-detail';
import * as useToolSetsHook from '@/hooks/useToolSets';
import * as notificationContext from '@/contexts/NotificationContext';
import { ActiveStatus } from '@/graphql/generated/graphql';
import type { GetMcpToolsQuery } from '@/graphql/generated/graphql';

// Mock hooks and contexts
vi.mock('@/hooks/useToolSets');
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

// Mock LinkToolSetDialog component
vi.mock('./link-toolset-dialog', () => ({
  LinkToolSetDialog: () => <div data-testid="link-toolset-dialog">Link ToolSet Dialog</div>,
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
      runOn: null,
    },
    toolSets: [
      {
        __typename: 'ToolSet',
        id: 'toolset-1',
        name: 'Test Tool Set',
        description: 'Test tool set description',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useToolSets hook
    vi.mocked(useToolSetsHook.useToolSets).mockReturnValue({
      toolSets: [
        {
          __typename: 'ToolSet',
          id: 'toolset-1',
          name: 'Test Tool Set',
          description: 'Test tool set description',
          createdAt: new Date('2025-01-01'),
          updatedAt: null,
          mcpTools: null,
        },
      ],
      filteredToolSets: [
        {
          __typename: 'ToolSet',
          id: 'toolset-1',
          name: 'Test Tool Set',
          description: 'Test tool set description',
          createdAt: new Date('2025-01-01'),
          updatedAt: null,
          mcpTools: null,
        },
      ],
      loading: false,
      error: undefined,
      stats: { total: 1, filtered: 1 },
      filters: {
        search: '',
        setSearch: vi.fn(),
        reset: vi.fn(),
      },
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
    // Check for ACTIVE status badge
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('renders MCP server information', () => {
    renderComponent(mockTool);

    expect(screen.getByText('MCP Server')).toBeInTheDocument();
    expect(screen.getByText('Test Server')).toBeInTheDocument();
    expect(screen.getByText('Test server description')).toBeInTheDocument();
  });

  it('renders linked toolsets', () => {
    renderComponent(mockTool);

    expect(screen.getByText(/Available in Tool Sets \(1\)/)).toBeInTheDocument();
    expect(screen.getByText('Test Tool Set')).toBeInTheDocument();
  });

  it('renders ToolTester component', () => {
    renderComponent(mockTool);

    const toolTester = screen.getByTestId('tool-tester');
    expect(toolTester).toBeInTheDocument();
    expect(toolTester).toHaveTextContent('Tool Tester for test-tool (tool-1)');
  });

  it('shows message when tool has no linked toolsets', () => {
    const toolWithNoToolSets = { ...mockTool, toolSets: [] };

    renderComponent(toolWithNoToolSets);

    expect(screen.getByText('Not available in any tool sets yet')).toBeInTheDocument();
  });

  it('shows add button when unlinked toolsets exist', () => {
    const toolWithNoToolSets = { ...mockTool, toolSets: [] };

    renderComponent(toolWithNoToolSets);

    // Should show the add button since we have a toolset in the store but it's not linked
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('does not show add button when all toolsets are linked', () => {
    renderComponent(mockTool);

    // All toolsets from the store are already linked to the tool
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

  it('renders toolset description when available', () => {
    renderComponent(mockTool);

    // Check for toolset description
    expect(screen.getByText('Test tool set description')).toBeInTheDocument();
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

    // ToolTester should be in the last section (after toolsets section)
    const toolTester = screen.getByTestId('tool-tester');
    expect(toolTester).toBeInTheDocument();

    // Check that it's in a border-top section (visually separated)
    const toolTesterSection = toolTester.closest('.border-t');
    expect(toolTesterSection).toBeInTheDocument();
  });

  it('renders unlink button for linked toolsets', () => {
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
