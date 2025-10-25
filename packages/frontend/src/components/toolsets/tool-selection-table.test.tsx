/**
 * ToolSelectionTable Component Tests
 *
 * WHY: Test the ToolSelectionTable component for tool selection with proper description truncation
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ToolSelectionTable } from './tool-selection-table';
import type { GetMcpToolsQuery } from '@/graphql/generated/graphql';
import { ActiveStatus } from '@/graphql/generated/graphql';

type McpTool = NonNullable<NonNullable<GetMcpToolsQuery['mcpTools']>[number]>;

describe('ToolSelectionTable', () => {
  const mockServers = [
    {
      id: 'server-1',
      name: 'Test Server 1',
      description: 'Test server description',
      tools: [
        {
          __typename: 'MCPTool',
          id: 'tool-1',
          name: 'Tool 1',
          description: 'This is a very long tool description that should be truncated to a single line with ellipsis to make the table more compact and scannable.',
          inputSchema: '{}',
          annotations: '',
          status: ActiveStatus.Active,
          createdAt: new Date('2024-01-01'),
          lastSeenAt: new Date('2024-01-02'),
          mcpServer: {
            __typename: 'MCPServer',
            id: 'server-1',
            name: 'Test Server 1',
            description: '',
            repositoryUrl: '',
          },
          runtimes: null,
        } as McpTool,
        {
          __typename: 'MCPTool',
          id: 'tool-2',
          name: 'Tool 2',
          description: 'Short description',
          inputSchema: '{}',
          annotations: '',
          status: ActiveStatus.Active,
          createdAt: new Date('2024-01-01'),
          lastSeenAt: new Date('2024-01-02'),
          mcpServer: {
            __typename: 'MCPServer',
            id: 'server-1',
            name: 'Test Server 1',
            description: '',
            repositoryUrl: '',
          },
          runtimes: null,
        } as McpTool,
      ],
    },
    {
      id: 'server-2',
      name: 'Test Server 2',
      description: 'Another server',
      tools: [
        {
          __typename: 'MCPTool',
          id: 'tool-3',
          name: 'Tool 3',
          description: 'Another tool description',
          inputSchema: '{}',
          annotations: '',
          status: ActiveStatus.Inactive,
          createdAt: new Date('2024-01-01'),
          lastSeenAt: new Date('2024-01-02'),
          mcpServer: {
            __typename: 'MCPServer',
            id: 'server-2',
            name: 'Test Server 2',
            description: '',
            repositoryUrl: '',
          },
          runtimes: null,
        } as McpTool,
      ],
    },
  ];

  const defaultProps = {
    servers: mockServers,
    selectedToolIds: new Set<string>(),
    onToolToggle: vi.fn(),
    onServerToggle: vi.fn(),
    onSelectAll: vi.fn(),
    onSelectNone: vi.fn(),
    searchTerm: '',
    loading: false,
  };

  it('renders server groups with tools', () => {
    render(<ToolSelectionTable {...defaultProps} />);

    expect(screen.getByText('Test Server 1')).toBeDefined();
    expect(screen.getByText('Test Server 2')).toBeDefined();
    expect(screen.getByText('Tool 1')).toBeDefined();
    expect(screen.getByText('Tool 2')).toBeDefined();
  });

  it('applies line-clamp-1 to tool descriptions for single-line truncation', () => {
    const { container } = render(<ToolSelectionTable {...defaultProps} />);

    const descriptions = container.querySelectorAll('.line-clamp-1');
    expect(descriptions.length).toBeGreaterThan(0);
  });

  it('renders tool descriptions with proper truncation', () => {
    const { container } = render(<ToolSelectionTable {...defaultProps} />);

    const longDescription = container.querySelector('.line-clamp-1');
    expect(longDescription).toBeDefined();
    expect(longDescription?.textContent).toContain('This is a very long tool description');
  });

  it('displays tool status badges', () => {
    render(<ToolSelectionTable {...defaultProps} />);

    const activeStatuses = screen.getAllByText('ACTIVE');
    expect(activeStatuses.length).toBe(2);
    expect(screen.getByText('INACTIVE')).toBeDefined();
  });

  it('shows selection count', () => {
    const selectedToolIds = new Set(['tool-1', 'tool-2']);
    render(<ToolSelectionTable {...defaultProps} selectedToolIds={selectedToolIds} />);

    expect(screen.getByText('2 of 3 tools selected')).toBeDefined();
  });

  it('shows loading state', () => {
    render(<ToolSelectionTable {...defaultProps} loading={true} />);

    const loadingElements = screen.getAllByRole('generic');
    const hasAnimatePulse = loadingElements.some((el) =>
      el.className.includes('animate-pulse')
    );
    expect(hasAnimatePulse).toBe(true);
  });

  it('shows empty state when no servers', () => {
    render(<ToolSelectionTable {...defaultProps} servers={[]} />);

    expect(screen.getByText('No tools available.')).toBeDefined();
  });

  it('shows search empty state', () => {
    render(<ToolSelectionTable {...defaultProps} servers={[]} searchTerm="nonexistent" />);

    expect(screen.getByText('No tools found matching your search.')).toBeDefined();
  });

  it('displays tool count per server', () => {
    render(<ToolSelectionTable {...defaultProps} />);

    expect(screen.getByText('2 tools')).toBeDefined();
    expect(screen.getByText('1 tool')).toBeDefined();
  });

  it('highlights search terms in tool names and descriptions', () => {
    const { container } = render(
      <ToolSelectionTable {...defaultProps} searchTerm="Tool" />
    );

    const marks = container.querySelectorAll('mark');
    expect(marks.length).toBeGreaterThan(0);
  });

  it('shows clear all button when tools are selected', () => {
    const selectedToolIds = new Set(['tool-1']);
    render(<ToolSelectionTable {...defaultProps} selectedToolIds={selectedToolIds} />);

    expect(screen.getByText('Clear all')).toBeDefined();
  });

  it('displays all tools when server is expanded', () => {
    render(<ToolSelectionTable {...defaultProps} />);

    // All tools should be visible by default (not collapsed)
    expect(screen.getByText('Tool 1')).toBeDefined();
    expect(screen.getByText('Tool 2')).toBeDefined();
    expect(screen.getByText('Tool 3')).toBeDefined();
  });
});
