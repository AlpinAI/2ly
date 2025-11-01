import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConnectAgentDialog } from './connect-agent-dialog';
import * as uiStore from '@/stores/uiStore';
import * as runtimeStore from '@/stores/runtimeStore';
import { ActiveStatus, type Runtime } from '@/graphql/generated/graphql';

// Mock the stores
vi.mock('@/stores/uiStore');
vi.mock('@/stores/runtimeStore');

describe('ConnectAgentDialog', () => {
  const mockAgent: Runtime = {
    __typename: 'Runtime',
    id: 'agent-1',
    name: 'Test Agent',
    description: 'Test agent description',
    status: ActiveStatus.Active,
    capabilities: ['agent'],
    mcpToolCapabilities: [],
    createdAt: new Date(),
    hostIP: null,
    hostname: null,
    mcpClientName: null,
    lastSeenAt: null,
    mcpServers: null,
    roots: null,
    workspace: {
      __typename: 'Workspace',
      id: 'workspace-1',
      name: 'Test Workspace',
      createdAt: new Date(),
      globalRuntime: null,
      registryServers: [],
      mcpServers: [],
      mcpTools: [],
      onboardingSteps: [],
      runtimes: [],
      toolSets: [],
      aiConfig: null,
    },
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(uiStore.useConnectAgentDialog).mockReturnValue({
      open: true,
      setOpen: vi.fn(),
      selectedAgentId: 'agent-1',
      setSelectedAgentId: vi.fn(),
    });

    vi.mocked(runtimeStore.useRuntimeData).mockReturnValue({
      runtimes: [mockAgent],
      loading: false,
      error: null,
      stats: { total: 1, active: 1, inactive: 0 },
    });
  });

  it('renders dialog when open', () => {
    render(<ConnectAgentDialog />);
    expect(screen.getByText('Connect Agent to 2LY')).toBeInTheDocument();
    expect(screen.getByText(/Agent:/)).toBeInTheDocument();
    expect(screen.getByText('Test Agent')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    vi.mocked(uiStore.useConnectAgentDialog).mockReturnValue({
      open: false,
      setOpen: vi.fn(),
      selectedAgentId: 'agent-1',
      setSelectedAgentId: vi.fn(),
    });

    const { container } = render(<ConnectAgentDialog />);
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('does not render when no agent is selected', () => {
    vi.mocked(uiStore.useConnectAgentDialog).mockReturnValue({
      open: true,
      setOpen: vi.fn(),
      selectedAgentId: null,
      setSelectedAgentId: vi.fn(),
    });

    const { container } = render(<ConnectAgentDialog />);
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('displays waiting status initially', () => {
    // Mock agent as not yet connected (INACTIVE status)
    vi.mocked(runtimeStore.useRuntimeData).mockReturnValue({
      runtimes: [{ ...mockAgent, status: ActiveStatus.Inactive }],
      loading: false,
      error: null,
      stats: { total: 1, active: 0, inactive: 1 },
    });

    render(<ConnectAgentDialog />);
    expect(screen.getByText('Waiting...')).toBeInTheDocument();
  });

  it('shows platform selector', () => {
    render(<ConnectAgentDialog />);
    expect(screen.getByText('Select Platform')).toBeInTheDocument();
  });

  it('renders default platform instructions (Langchain)', () => {
    render(<ConnectAgentDialog />);
    expect(screen.getByText('1. Install connector')).toBeInTheDocument();
    expect(screen.getByText(/pip install langchain_2ly/)).toBeInTheDocument();
  });

  it('shows close button', () => {
    render(<ConnectAgentDialog />);
    // Look for the close button by finding the button with X icon
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
