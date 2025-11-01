/**
 * ToolTable Component Tests
 *
 * WHY: Test the ToolTable component displays tools correctly with proper truncation
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ToolTable } from './tool-table';
import type { GetMcpToolsQuery } from '@/graphql/generated/graphql';
import { ActiveStatus } from '@/graphql/generated/graphql';

type McpTool = NonNullable<NonNullable<GetMcpToolsQuery['mcpTools']>[number]>;

describe('ToolTable', () => {
  const mockTools: McpTool[] = [
    {
      __typename: 'MCPTool',
      id: 'tool-1',
      name: 'Test Tool 1',
      description: 'This is a very long description that should be truncated to a single line with ellipsis to make the table more compact and easier to scan.',
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
      runtimes: [{
        __typename: 'Runtime',
        id: 'runtime-1',
        name: 'Test Runtime',
        status: ActiveStatus.Active,
        capabilities: null,
      }],
      toolSets: null,
    },
    {
      __typename: 'MCPTool',
      id: 'tool-2',
      name: 'Test Tool 2',
      description: 'Short description',
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
      runtimes: [],
      toolSets: null,
    },
  ];

  const defaultProps = {
    tools: mockTools,
    selectedToolId: null,
    onSelectTool: vi.fn(),
    search: '',
    onSearchChange: vi.fn(),
    serverFilter: [],
    onServerFilterChange: vi.fn(),
    toolSetFilter: [],
    onToolSetFilterChange: vi.fn(),
    availableServers: [{ id: 'server-1', name: 'Test Server 1' }],
    availableToolSets: [{ id: 'toolset-1', name: 'Test ToolSet 1' }],
    loading: false,
  };

  it('renders tool table with tools', () => {
    render(<ToolTable {...defaultProps} />);

    expect(screen.getByText('Test Tool 1')).toBeDefined();
    expect(screen.getByText('Test Tool 2')).toBeDefined();
  });

  it('applies line-clamp-1 to tool descriptions for single-line truncation', () => {
    const { container } = render(<ToolTable {...defaultProps} />);

    const descriptions = container.querySelectorAll('.line-clamp-1');
    expect(descriptions.length).toBeGreaterThan(0);
  });

  it('renders tool descriptions with proper text overflow handling', () => {
    const { container } = render(<ToolTable {...defaultProps} />);

    const longDescription = container.querySelector('.line-clamp-1.max-w-md');
    expect(longDescription).toBeDefined();
    expect(longDescription?.textContent).toContain('This is a very long description');
  });

  it('displays tool status badges', () => {
    render(<ToolTable {...defaultProps} />);

    expect(screen.getByText('ACTIVE')).toBeDefined();
    expect(screen.getByText('INACTIVE')).toBeDefined();
  });

  it('highlights selected tool row', () => {
    const { container } = render(<ToolTable {...defaultProps} selectedToolId="tool-1" />);

    const selectedRow = container.querySelector('.bg-cyan-50');
    expect(selectedRow).toBeDefined();
  });

  it('shows loading state', () => {
    render(<ToolTable {...defaultProps} loading={true} />);

    expect(screen.getByText('Loading tools...')).toBeDefined();
  });

  it('shows empty state when no tools', () => {
    render(<ToolTable {...defaultProps} tools={[]} />);

    expect(screen.getByText('No tools found')).toBeDefined();
  });

  it('shows filtered empty state', () => {
    render(<ToolTable {...defaultProps} tools={[]} search="nonexistent" />);

    expect(screen.getByText('No tools match your filters')).toBeDefined();
  });

  it('displays tool count in footer', () => {
    render(<ToolTable {...defaultProps} />);

    expect(screen.getByText('Showing 2 tools')).toBeDefined();
  });

  it('displays correct agent count (runtimes)', () => {
    render(<ToolTable {...defaultProps} />);

    const cells = screen.getAllByText('1');
    expect(cells.some((cell) => cell.closest('td'))).toBe(true);
  });
});
