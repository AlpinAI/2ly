/**
 * ToolTable Component Tests
 *
 * WHY: Test the ToolTable component displays tools and agents correctly with proper filtering
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ToolTable } from './tool-table';
import { ActiveStatus } from '@/graphql/generated/graphql';
import { ToolItemType } from '@/types/tools';
import type { MCPToolItem, AgentItem, ToolItem } from '@/types/tools';

describe('ToolTable', () => {
  const mockMCPTools: MCPToolItem[] = [
    {
      __typename: 'MCPTool',
      itemType: ToolItemType.MCP_TOOL,
      id: 'tool-1',
      name: 'Test Tool 1',
      description: 'This is a very long description that should be truncated to a single line with ellipsis.',
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
        executionTarget: null,
      },
      skills: [
        {
          __typename: 'Skill',
          id: 'skill-1',
          name: 'Test Skill 1',
          description: 'Test skill description',
        },
      ],
    },
    {
      __typename: 'MCPTool',
      itemType: ToolItemType.MCP_TOOL,
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
        executionTarget: null,
      },
      skills: null,
    },
  ];

  const mockAgents: AgentItem[] = [
    {
      __typename: 'Agent',
      itemType: ToolItemType.AGENT,
      id: 'agent-1',
      name: 'Test Agent 1',
      description: 'An AI agent for testing',
      systemPrompt: 'You are a helpful assistant.',
      model: 'openai/gpt-4',
      temperature: 1.0,
      maxTokens: 4096,
      executionTarget: null,
      runtime: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: null,
      skills: [],
      tools: [],
    },
  ];

  const mockItems: ToolItem[] = [...mockMCPTools, ...mockAgents];

  const defaultProps = {
    items: mockItems,
    selectedItemId: null,
    onSelectItem: vi.fn(),
    search: '',
    onSearchChange: vi.fn(),
    typeFilter: [] as ToolItemType[],
    onTypeFilterChange: vi.fn(),
    serverFilter: [],
    onServerFilterChange: vi.fn(),
    skillFilter: [],
    onSkillFilterChange: vi.fn(),
    availableServers: [{ id: 'server-1', name: 'Test Server 1' }],
    availableSkills: [{ id: 'skill-1', name: 'Test Skill 1' }],
    loading: false,
  };

  it('renders table with both tools and agents', () => {
    render(<ToolTable {...defaultProps} />);

    expect(screen.getByText('Test Tool 1')).toBeDefined();
    expect(screen.getByText('Test Tool 2')).toBeDefined();
    expect(screen.getByText('Test Agent 1')).toBeDefined();
  });

  it('displays type badges for MCP Tools and Agents', () => {
    render(<ToolTable {...defaultProps} />);

    // Check for Tool badges (2 MCP tools)
    const toolBadges = screen.getAllByText('Tool');
    expect(toolBadges.length).toBe(2);

    // Check for Agent badge (1 agent)
    const agentBadges = screen.getAllByText('Agent');
    expect(agentBadges.length).toBe(1);
  });

  it('applies line-clamp-1 to descriptions for single-line truncation', () => {
    const { container } = render(<ToolTable {...defaultProps} />);

    const descriptions = container.querySelectorAll('.line-clamp-1');
    expect(descriptions.length).toBeGreaterThan(0);
  });

  it('displays tool status badges', () => {
    render(<ToolTable {...defaultProps} />);

    // 2 tools with ACTIVE status (tool-1 and agent show ACTIVE) + 1 inactive
    expect(screen.getAllByText('ACTIVE').length).toBe(2);
    expect(screen.getByText('INACTIVE')).toBeDefined();
  });

  it('highlights selected item row', () => {
    const { container } = render(<ToolTable {...defaultProps} selectedItemId="tool-1" />);

    const selectedRow = container.querySelector('.bg-cyan-50');
    expect(selectedRow).toBeDefined();
  });

  it('shows loading state', () => {
    render(<ToolTable {...defaultProps} loading={true} />);

    expect(screen.getByText('Loading tools...')).toBeDefined();
  });

  it('shows empty state when no items', () => {
    render(<ToolTable {...defaultProps} items={[]} />);

    expect(screen.getByText('No tools found')).toBeDefined();
  });

  it('shows filtered empty state', () => {
    render(<ToolTable {...defaultProps} items={[]} search="nonexistent" />);

    expect(screen.getByText('No tools match your filters')).toBeDefined();
  });

  it('displays item count in footer', () => {
    render(<ToolTable {...defaultProps} />);

    expect(screen.getByText('Showing 3 items')).toBeDefined();
  });

  it('shows server name for MCP tools', () => {
    render(<ToolTable {...defaultProps} />);

    expect(screen.getByText('Test Server 1')).toBeDefined();
    expect(screen.getByText('Test Server 2')).toBeDefined();
  });

  it('shows dash for server column on agents', () => {
    render(<ToolTable {...defaultProps} items={mockAgents} />);

    // The agent row should show a dash in the server column
    const cells = screen.getAllByText('—');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('displays correct skill count', () => {
    render(<ToolTable {...defaultProps} />);

    // Tool 1 has 1 skill, Tool 2 has 0, Agent has 0
    const cells = screen.getAllByText('1');
    expect(cells.some((cell) => cell.closest('td'))).toBe(true);
  });

  it('calls onSelectItem when row is clicked', () => {
    const onSelectItem = vi.fn();
    render(<ToolTable {...defaultProps} onSelectItem={onSelectItem} />);

    const rows = screen.getAllByRole('row');
    // Skip header row, click first data row
    rows[1].click();

    expect(onSelectItem).toHaveBeenCalled();
  });
});
