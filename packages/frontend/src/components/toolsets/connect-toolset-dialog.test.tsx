import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConnectToolsetDialog } from './connect-toolset-dialog';
import * as uiStore from '@/stores/uiStore';
import * as runtimeStore from '@/stores/runtimeStore';
import { ActiveStatus, RuntimeType, type Runtime } from '@/graphql/generated/graphql';

// Mock the stores
vi.mock('@/stores/uiStore');
vi.mock('@/stores/runtimeStore');

// skipping these tests since the connect dialog is being revamped
describe.skip('ConnectToolsetDialog', () => {
  const mockToolset: Runtime = {
    __typename: 'Runtime',
    id: 'Test Toolset',
    name: 'Test Toolset',
    description: 'Test toolset description',
    status: ActiveStatus.Active,
    type: RuntimeType.Edge,
    createdAt: new Date(),
    hostIP: null,
    hostname: null,
    mcpClientName: null,
    lastSeenAt: null,
    mcpServers: null,
    roots: null,
    toolResponses: [],
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
    },
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(uiStore.useConnectToolsetDialog).mockReturnValue({
      open: true,
      setOpen: vi.fn(),
      selectedToolsetName: 'Test Toolset',
      setSelectedToolsetName: vi.fn(),
      selectedToolsetId: 'test-id',
      setSelectedToolsetId: vi.fn(),
    });

    vi.mocked(runtimeStore.useRuntimeData).mockReturnValue({
      runtimes: [mockToolset],
      loading: false,
      error: null,
      stats: { total: 1, active: 1, inactive: 0 },
    });
  });

  it('renders dialog when open', () => {
    render(<ConnectToolsetDialog />);
    expect(screen.getByText('Connect Toolset to 2LY')).toBeInTheDocument();
    expect(screen.getByText(/Toolset:/)).toBeInTheDocument();
    expect(screen.getByText('Test Toolset')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    vi.mocked(uiStore.useConnectToolsetDialog).mockReturnValue({
      open: false,
      setOpen: vi.fn(),
      selectedToolsetName: 'Test Toolset',
      setSelectedToolsetName: vi.fn(),
      selectedToolsetId: 'test-id',
      setSelectedToolsetId: vi.fn(),
    });

    const { container } = render(<ConnectToolsetDialog />);
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('does not render when no toolset is selected', () => {
    vi.mocked(uiStore.useConnectToolsetDialog).mockReturnValue({
      open: true,
      setOpen: vi.fn(),
      selectedToolsetName: null,
      setSelectedToolsetName: vi.fn(),
      selectedToolsetId: null,
      setSelectedToolsetId: vi.fn(),
    });

    const { container } = render(<ConnectToolsetDialog />);
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('displays waiting status initially', () => {
    // Mock agent as not yet connected (INACTIVE status)
    vi.mocked(runtimeStore.useRuntimeData).mockReturnValue({
      runtimes: [{ ...mockToolset, status: ActiveStatus.Inactive }],
      loading: false,
      error: null,
      stats: { total: 1, active: 0, inactive: 1 },
    });

    render(<ConnectToolsetDialog />);
    expect(screen.getByText('Waiting...')).toBeInTheDocument();
  });

  it('shows platform selector', () => {
    render(<ConnectToolsetDialog />);
    expect(screen.getByText('Select Platform')).toBeInTheDocument();
  });

  it('renders default platform instructions (Langchain)', () => {
    render(<ConnectToolsetDialog />);
    expect(screen.getByText('1. Install connector')).toBeInTheDocument();
    expect(screen.getByText(/pip install langchain_2ly/)).toBeInTheDocument();
  });

  it('shows close button', () => {
    render(<ConnectToolsetDialog />);
    // Look for the close button by finding the button with X icon
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
