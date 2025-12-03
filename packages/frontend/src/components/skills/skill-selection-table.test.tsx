/**
 * SkillSelectionTable Component Tests
 *
 * WHY: Test the SkillSelectionTable component for tool selection with proper description truncation
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkillSelectionTable } from './skill-selection-table';
import type { GetMcpToolsQuery } from '@/graphql/generated/graphql';
import { ActiveStatus } from '@/graphql/generated/graphql';

type McpTool = NonNullable<NonNullable<GetMcpToolsQuery['mcpTools']>[number]>;

describe('SkillSelectionTable', () => {
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
          skills: null,
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
          skills: null,
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
          skills: null,
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
    render(<SkillSelectionTable {...defaultProps} />);

    expect(screen.getByText('Test Server 1')).toBeDefined();
    expect(screen.getByText('Test Server 2')).toBeDefined();
    expect(screen.getByText('Tool 1')).toBeDefined();
    expect(screen.getByText('Tool 2')).toBeDefined();
  });

  it('applies line-clamp-1 to tool descriptions for single-line truncation', () => {
    const { container } = render(<SkillSelectionTable {...defaultProps} />);

    const descriptions = container.querySelectorAll('.line-clamp-1');
    expect(descriptions.length).toBeGreaterThan(0);
  });

  it('renders tool descriptions with proper truncation', () => {
    const { container } = render(<SkillSelectionTable {...defaultProps} />);

    const longDescription = container.querySelector('.line-clamp-1');
    expect(longDescription).toBeDefined();
    expect(longDescription?.textContent).toContain('This is a very long tool description');
  });

  it('displays tool status badges', () => {
    render(<SkillSelectionTable {...defaultProps} />);

    const activeStatuses = screen.getAllByText('ACTIVE');
    expect(activeStatuses.length).toBe(2);
    expect(screen.getByText('INACTIVE')).toBeDefined();
  });

  it('shows selection count', () => {
    const selectedToolIds = new Set(['tool-1', 'tool-2']);
    render(<SkillSelectionTable {...defaultProps} selectedToolIds={selectedToolIds} />);

    expect(screen.getByText('2 of 3 tools selected')).toBeDefined();
  });

  it('shows loading state', () => {
    render(<SkillSelectionTable {...defaultProps} loading={true} />);

    const loadingElements = screen.getAllByRole('generic');
    const hasAnimatePulse = loadingElements.some((el) =>
      el.className.includes('animate-pulse')
    );
    expect(hasAnimatePulse).toBe(true);
  });

  it('shows empty state when no servers', () => {
    render(<SkillSelectionTable {...defaultProps} servers={[]} />);

    expect(screen.getByText('No tools available.')).toBeDefined();
  });

  it('shows search empty state', () => {
    render(<SkillSelectionTable {...defaultProps} servers={[]} searchTerm="nonexistent" />);

    expect(screen.getByText('No tools found matching your search.')).toBeDefined();
  });

  it('displays tool count per server', () => {
    render(<SkillSelectionTable {...defaultProps} />);

    expect(screen.getByText('2 tools')).toBeDefined();
    expect(screen.getByText('1 tool')).toBeDefined();
  });

  it('highlights search terms in tool names and descriptions', () => {
    const { container } = render(
      <SkillSelectionTable {...defaultProps} searchTerm="Tool" />
    );

    const marks = container.querySelectorAll('mark');
    expect(marks.length).toBeGreaterThan(0);
  });

  it('shows clear all button when tools are selected', () => {
    const selectedToolIds = new Set(['tool-1']);
    render(<SkillSelectionTable {...defaultProps} selectedToolIds={selectedToolIds} />);

    expect(screen.getByText('Clear all')).toBeDefined();
  });

  it('displays all tools when server is expanded', () => {
    render(<SkillSelectionTable {...defaultProps} />);

    // All tools should be visible by default (not collapsed)
    expect(screen.getByText('Tool 1')).toBeDefined();
    expect(screen.getByText('Tool 2')).toBeDefined();
    expect(screen.getByText('Tool 3')).toBeDefined();
  });

  describe('showSelectedOnly filter', () => {
    it('shows only selected tools when showSelectedOnly is true', () => {
      const selectedToolIds = new Set(['tool-1', 'tool-3']);
      render(
        <SkillSelectionTable
          {...defaultProps}
          selectedToolIds={selectedToolIds}
          showSelectedOnly={true}
        />
      );

      // Should show selected tools
      expect(screen.getByText('Tool 1')).toBeDefined();
      expect(screen.getByText('Tool 3')).toBeDefined();

      // Should not show unselected tool
      expect(screen.queryByText('Tool 2')).toBeNull();
    });

    it('shows all tools when showSelectedOnly is false', () => {
      const selectedToolIds = new Set(['tool-1']);
      render(
        <SkillSelectionTable
          {...defaultProps}
          selectedToolIds={selectedToolIds}
          showSelectedOnly={false}
        />
      );

      // Should show all tools
      expect(screen.getByText('Tool 1')).toBeDefined();
      expect(screen.getByText('Tool 2')).toBeDefined();
      expect(screen.getByText('Tool 3')).toBeDefined();
    });

    it('hides servers with no selected tools when showSelectedOnly is true', () => {
      const selectedToolIds = new Set(['tool-1']); // Only tool from server 1
      render(
        <SkillSelectionTable
          {...defaultProps}
          selectedToolIds={selectedToolIds}
          showSelectedOnly={true}
        />
      );

      // Should show server with selected tool
      expect(screen.getByText('Test Server 1')).toBeDefined();

      // Should not show server with no selected tools
      expect(screen.queryByText('Test Server 2')).toBeNull();
    });

    it('shows "No selected tools" message when filter is active and nothing is selected', () => {
      render(
        <SkillSelectionTable
          {...defaultProps}
          selectedToolIds={new Set()}
          showSelectedOnly={true}
        />
      );

      expect(screen.getByText('No selected tools.')).toBeDefined();
    });

    it('updates filtered list when selection changes with showSelectedOnly active', () => {
      const selectedToolIds = new Set(['tool-1']);
      const { rerender } = render(
        <SkillSelectionTable
          {...defaultProps}
          selectedToolIds={selectedToolIds}
          showSelectedOnly={true}
        />
      );

      expect(screen.getByText('Tool 1')).toBeDefined();
      expect(screen.queryByText('Tool 2')).toBeNull();

      // Update selection
      const updatedSelection = new Set(['tool-1', 'tool-2']);
      rerender(
        <SkillSelectionTable
          {...defaultProps}
          selectedToolIds={updatedSelection}
          showSelectedOnly={true}
        />
      );

      // Now both should be visible
      expect(screen.getByText('Tool 1')).toBeDefined();
      expect(screen.getByText('Tool 2')).toBeDefined();
    });
  });
});
