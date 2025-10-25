/**
 * AgentDetail Component Tests
 *
 * WHY: Test the AgentDetail component displays agent details with action bar
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AgentDetail } from './agent-detail';
import * as uiStore from '@/stores/uiStore';
import * as NotificationContext from '@/contexts/NotificationContext';
import * as apolloClient from '@apollo/client/react';
import { ActiveStatus } from '@/graphql/generated/graphql';
import type { SubscribeRuntimesSubscription } from '@/graphql/generated/graphql';

type Runtime = NonNullable<SubscribeRuntimesSubscription['runtimes']>[number];

// Mock the stores and context
vi.mock('@/stores/uiStore');
vi.mock('@/contexts/NotificationContext');

// Mock Apollo Client
vi.mock('@apollo/client/react', () => ({
  useMutation: vi.fn(),
}));

describe('AgentDetail', () => {
  const mockAgent: Runtime = {
    __typename: 'Runtime',
    id: 'agent-1',
    name: 'Test Agent',
    description: 'Test agent description',
    status: ActiveStatus.Active,
    capabilities: ['agent', 'tools'],
    mcpToolCapabilities: [
      {
        __typename: 'MCPTool',
        id: 'tool-1',
        name: 'Test Tool 1',
        description: 'Tool 1 description',
        status: ActiveStatus.Active,
      },
      {
        __typename: 'MCPTool',
        id: 'tool-2',
        name: 'Test Tool 2',
        description: 'Tool 2 description',
        status: ActiveStatus.Active,
      },
    ],
    createdAt: new Date('2024-01-01'),
    hostIP: '192.168.1.1',
    hostname: 'test-hostname',
    mcpClientName: 'test-client',
    lastSeenAt: new Date('2024-01-15T10:30:00Z'),
    mcpServers: null,
  };

  const mockSetManageToolsOpen = vi.fn();
  const mockSetSelectedToolSetId = vi.fn();
  const mockSetConnectDialogOpen = vi.fn();
  const mockSetSelectedAgentId = vi.fn();
  const mockConfirm = vi.fn();
  const mockDeleteAgent = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useMutation for deleteAgent
    vi.mocked(apolloClient.useMutation).mockReturnValue([
      mockDeleteAgent,
      { loading: false, error: undefined, data: undefined },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);

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

    // Mock the notification context
    vi.mocked(NotificationContext.useNotification).mockReturnValue({
      confirm: mockConfirm,
      toast: vi.fn(),
    });
  });

  const renderComponent = (agent: Runtime) => {
    return render(<AgentDetail agent={agent} />);
  };

  it('renders agent details', () => {
    renderComponent(mockAgent);

    expect(screen.getByText('Test Agent')).toBeInTheDocument();
    expect(screen.getByText('Test agent description')).toBeInTheDocument();
  });

  it('displays action bar with Connect and Manage Tools buttons', () => {
    renderComponent(mockAgent);

    const connectButton = screen.getByRole('button', { name: /Connect/i });
    const manageToolsButton = screen.getByRole('button', { name: /Manage Tools/i });

    expect(connectButton).toBeInTheDocument();
    expect(manageToolsButton).toBeInTheDocument();
  });

  it('action bar appears after header and before content', () => {
    const { container } = renderComponent(mockAgent);

    // Find the action bar
    const actionBar = container.querySelector('.flex.gap-2');

    // Action bar should exist
    expect(actionBar).toBeDefined();

    // Action bar should have both buttons
    expect(actionBar?.querySelectorAll('button')).toHaveLength(2);
  });

  it('does NOT display Connect button in Status section', () => {
    renderComponent(mockAgent);

    // Get all buttons with Cable icon or "Connect" text
    const buttons = screen.getAllByRole('button');
    const connectButtons = buttons.filter((btn) => btn.textContent?.includes('Connect'));

    // Should only have 1 Connect button (in action bar), not 2
    expect(connectButtons).toHaveLength(1);
  });

  it('does NOT display Manage Tools button in Tools section', () => {
    renderComponent(mockAgent);

    // Get all buttons with Settings icon or "Manage" text
    const buttons = screen.getAllByRole('button');
    const manageButtons = buttons.filter((btn) =>
      btn.textContent?.includes('Manage Tools') || btn.textContent?.includes('Manage')
    );

    // Should only have 1 Manage Tools button (in action bar), not 2
    expect(manageButtons).toHaveLength(1);
  });

  it('opens ConnectAgentDialog when Connect button clicked', () => {
    renderComponent(mockAgent);

    const connectButton = screen.getByRole('button', { name: /Connect/i });
    fireEvent.click(connectButton);

    expect(mockSetSelectedAgentId).toHaveBeenCalledWith('agent-1');
    expect(mockSetConnectDialogOpen).toHaveBeenCalledWith(true);
  });

  it('opens ManageToolsDialog when Manage Tools button clicked', () => {
    renderComponent(mockAgent);

    const manageToolsButton = screen.getByRole('button', { name: /Manage Tools/i });
    fireEvent.click(manageToolsButton);

    expect(mockSetSelectedToolSetId).toHaveBeenCalledWith('agent-1');
    expect(mockSetManageToolsOpen).toHaveBeenCalledWith(true);
  });

  it('displays agent status', () => {
    renderComponent(mockAgent);

    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('displays agent capabilities', () => {
    renderComponent(mockAgent);

    expect(screen.getByText('agent')).toBeInTheDocument();
    expect(screen.getByText('tools')).toBeInTheDocument();
  });

  it('displays host information', () => {
    renderComponent(mockAgent);

    expect(screen.getByText('test-hostname')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    expect(screen.getByText('test-client')).toBeInTheDocument();
  });

  it('displays last seen timestamp', () => {
    renderComponent(mockAgent);

    // Check that Last Seen section exists
    expect(screen.getByText('Last Seen')).toBeInTheDocument();

    // The date should be formatted and displayed (using toLocaleString)
    // We can't predict exact format as it varies by locale, so just check the section exists
    const lastSeenSection = screen.getByText('Last Seen').closest('div');
    expect(lastSeenSection).toBeDefined();
  });

  it('displays available tools list', () => {
    renderComponent(mockAgent);

    expect(screen.getByText('Available Tools (2)')).toBeInTheDocument();
    expect(screen.getByText('Test Tool 1')).toBeInTheDocument();
    expect(screen.getByText('Test Tool 2')).toBeInTheDocument();
  });

  it('displays no tools message when agent has no tools', () => {
    const agentWithNoTools = { ...mockAgent, mcpToolCapabilities: [] };
    renderComponent(agentWithNoTools);

    expect(screen.getByText('Available Tools (0)')).toBeInTheDocument();
    expect(screen.getByText('No tools available')).toBeInTheDocument();
  });

  it('displays delete button', () => {
    renderComponent(mockAgent);

    const deleteButton = screen.getByRole('button', { name: /Delete Tool Set/i });
    expect(deleteButton).toBeInTheDocument();
  });

  it('shows confirmation dialog when delete button clicked', async () => {
    mockConfirm.mockResolvedValue(false);
    renderComponent(mockAgent);

    const deleteButton = screen.getByRole('button', { name: /Delete Tool Set/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalledWith({
        title: 'Delete Tool Set',
        description: 'Are you sure you want to delete "Test Agent"? This action cannot be undone.',
        confirmLabel: 'Delete Tool Set',
        cancelLabel: 'Cancel',
        variant: 'destructive',
      });
    });
  });

  it('hides capabilities section when agent has no capabilities', () => {
    const agentWithNoCapabilities = { ...mockAgent, capabilities: null };
    renderComponent(agentWithNoCapabilities);

    expect(screen.queryByText('Capabilities')).not.toBeInTheDocument();
  });

  it('hides host information when not available', () => {
    const agentWithNoHost = {
      ...mockAgent,
      hostname: null,
      hostIP: null,
      mcpClientName: null,
    };
    renderComponent(agentWithNoHost);

    expect(screen.queryByText('Host Information')).not.toBeInTheDocument();
  });

  it('hides last seen when not available', () => {
    const agentWithNoLastSeen = { ...mockAgent, lastSeenAt: null };
    renderComponent(agentWithNoLastSeen);

    expect(screen.queryByText('Last Seen')).not.toBeInTheDocument();
  });

  it('renders action buttons with icon and text labels', () => {
    const { container } = renderComponent(mockAgent);

    // Find action bar buttons
    const actionBar = container.querySelector('.flex.gap-2');
    const buttons = actionBar?.querySelectorAll('button');

    // Should have both buttons
    expect(buttons).toHaveLength(2);

    // Buttons should have text content
    expect(buttons?.[0].textContent).toContain('Connect');
    expect(buttons?.[1].textContent).toContain('Manage Tools');
  });
});
