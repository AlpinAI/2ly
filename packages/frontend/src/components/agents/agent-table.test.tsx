/**
 * AgentTable Component Tests
 *
 * WHY: Test the AgentTable component displays agents correctly with Actions column
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentTable } from './agent-table';
import * as uiStore from '@/stores/uiStore';
import type { SubscribeRuntimesSubscription } from '@/graphql/generated/graphql';
import { ActiveStatus } from '@/graphql/generated/graphql';

type Runtime = NonNullable<SubscribeRuntimesSubscription['runtimes']>[number];

// Mock the stores
vi.mock('@/stores/uiStore');

describe('AgentTable', () => {
  const mockAgents: Runtime[] = [
    {
      __typename: 'Runtime',
      id: 'agent-1',
      name: 'Test Agent 1',
      description: 'Test agent 1 description',
      status: ActiveStatus.Active,
      capabilities: ['agent'],
      mcpToolCapabilities: [
        {
          __typename: 'MCPTool',
          id: 'tool-1',
          name: 'Tool 1',
          description: '',
          status: ActiveStatus.Active,
        },
        {
          __typename: 'MCPTool',
          id: 'tool-2',
          name: 'Tool 2',
          description: '',
          status: ActiveStatus.Active,
        },
      ],
      createdAt: new Date(),
      hostIP: null,
      hostname: 'test-host-1',
      mcpClientName: null,
      lastSeenAt: null,
      mcpServers: null,
    },
    {
      __typename: 'Runtime',
      id: 'agent-2',
      name: 'Test Agent 2',
      description: 'Test agent 2 description',
      status: ActiveStatus.Inactive,
      capabilities: ['agent'],
      mcpToolCapabilities: [],
      createdAt: new Date(),
      hostIP: null,
      hostname: 'test-host-2',
      mcpClientName: null,
      lastSeenAt: null,
      mcpServers: null,
    },
  ];

  const mockSetManageToolsOpen = vi.fn();
  const mockSetSelectedToolSetId = vi.fn();
  const mockSetConnectDialogOpen = vi.fn();
  const mockSetSelectedAgentId = vi.fn();

  const defaultProps = {
    agents: mockAgents,
    selectedAgentId: null,
    onSelectAgent: vi.fn(),
    search: '',
    onSearchChange: vi.fn(),
    serverFilter: [],
    onServerFilterChange: vi.fn(),
    statusFilter: [],
    onStatusFilterChange: vi.fn(),
    availableServers: [{ id: 'server-1', name: 'Test Server 1' }],
    loading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock the uiStore hooks
    vi.mocked(uiStore.useManageToolsDialog).mockReturnValue({
      open: false,
      setOpen: mockSetManageToolsOpen,
      selectedToolSetId: null,
      setSelectedToolSetId: mockSetSelectedToolSetId,
    });

    vi.mocked(uiStore.useConnectAgentDialog).mockReturnValue({
      open: false,
      setOpen: mockSetConnectDialogOpen,
      selectedAgentId: null,
      setSelectedAgentId: mockSetSelectedAgentId,
    });
  });

  it('renders agent table with agents', () => {
    render(<AgentTable {...defaultProps} />);

    expect(screen.getByText('Test Agent 1')).toBeInTheDocument();
    expect(screen.getByText('Test Agent 2')).toBeInTheDocument();
  });

  it('displays Actions column header', () => {
    render(<AgentTable {...defaultProps} />);

    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('renders Connect and Manage Tools action buttons for each agent', () => {
    render(<AgentTable {...defaultProps} />);

    // Should have 2 connect buttons (one per agent)
    const connectButtons = screen.getAllByLabelText('Connect agent');
    expect(connectButtons).toHaveLength(2);

    // Should have 2 manage tools buttons (one per agent)
    const manageButtons = screen.getAllByLabelText('Manage tools');
    expect(manageButtons).toHaveLength(2);
  });

  it('opens ConnectAgentDialog when Connect button clicked', () => {
    render(<AgentTable {...defaultProps} />);

    const connectButtons = screen.getAllByLabelText('Connect agent');
    fireEvent.click(connectButtons[0]);

    expect(mockSetSelectedAgentId).toHaveBeenCalledWith('agent-1');
    expect(mockSetConnectDialogOpen).toHaveBeenCalledWith(true);
  });

  it('opens ManageToolsDialog when Manage Tools button clicked', () => {
    render(<AgentTable {...defaultProps} />);

    const manageButtons = screen.getAllByLabelText('Manage tools');
    fireEvent.click(manageButtons[0]);

    expect(mockSetSelectedToolSetId).toHaveBeenCalledWith('agent-1');
    expect(mockSetManageToolsOpen).toHaveBeenCalledWith(true);
  });

  it('does not select row when action buttons are clicked', () => {
    const onSelectAgent = vi.fn();
    render(<AgentTable {...defaultProps} onSelectAgent={onSelectAgent} />);

    const connectButtons = screen.getAllByLabelText('Connect agent');
    fireEvent.click(connectButtons[0]);

    // onSelectAgent should not be called when clicking action buttons
    expect(onSelectAgent).not.toHaveBeenCalled();
  });

  it('selects row when clicking on the row itself', () => {
    const onSelectAgent = vi.fn();
    render(<AgentTable {...defaultProps} onSelectAgent={onSelectAgent} />);

    // Click on the agent name (part of the row)
    const agentName = screen.getByText('Test Agent 1');
    fireEvent.click(agentName);

    expect(onSelectAgent).toHaveBeenCalledWith('agent-1');
  });

  it('displays tool count for each agent', () => {
    render(<AgentTable {...defaultProps} />);

    // Agent 1 has 2 tools
    const cells = screen.getAllByText('2');
    expect(cells.some((cell) => cell.closest('td'))).toBe(true);

    // Agent 2 has 0 tools
    const zeroCells = screen.getAllByText('0');
    expect(zeroCells.some((cell) => cell.closest('td'))).toBe(true);
  });

  it('displays status badges', () => {
    render(<AgentTable {...defaultProps} />);

    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('INACTIVE')).toBeInTheDocument();
  });

  it('highlights selected agent row', () => {
    const { container } = render(<AgentTable {...defaultProps} selectedAgentId="agent-1" />);

    const selectedRow = container.querySelector('.bg-cyan-50');
    expect(selectedRow).toBeDefined();
  });

  it('shows loading state', () => {
    render(<AgentTable {...defaultProps} loading={true} />);

    expect(screen.getByText('Loading agents...')).toBeInTheDocument();
  });

  it('shows empty state when no agents', () => {
    render(<AgentTable {...defaultProps} agents={[]} />);

    expect(screen.getByText('No agents found')).toBeInTheDocument();
  });

  it('shows filtered empty state', () => {
    render(<AgentTable {...defaultProps} agents={[]} search="nonexistent" />);

    expect(screen.getByText('No agents match your filters')).toBeInTheDocument();
  });

  it('displays agent count in footer', () => {
    render(<AgentTable {...defaultProps} />);

    expect(screen.getByText('Showing 2 tool sets')).toBeInTheDocument();
  });

  it('displays hostname when available', () => {
    render(<AgentTable {...defaultProps} />);

    expect(screen.getByText('test-host-1')).toBeInTheDocument();
    expect(screen.getByText('test-host-2')).toBeInTheDocument();
  });

  it('renders action buttons with correct icon sizes', () => {
    const { container } = render(<AgentTable {...defaultProps} />);

    const connectButtons = container.querySelectorAll('button[aria-label="Connect agent"]');
    expect(connectButtons).toHaveLength(2);

    const manageButtons = container.querySelectorAll('button[aria-label="Manage tools"]');
    expect(manageButtons).toHaveLength(2);

    // Verify buttons have compact styling (h-7 w-7 p-0)
    connectButtons.forEach((button) => {
      expect(button.className).toContain('h-7');
      expect(button.className).toContain('w-7');
    });
  });
});
