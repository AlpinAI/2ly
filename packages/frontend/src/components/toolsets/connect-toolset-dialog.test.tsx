/**
 * Tests for ConnectToolsetDialogNew
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConnectToolsetDialogNew } from './connect-toolset-dialog-new';
import * as uiStore from '@/stores/uiStore';
import * as runtimeStore from '@/stores/runtimeStore';
import * as useSystemInitHook from '@/hooks/useSystemInit';

// Mock dependencies
vi.mock('@/stores/uiStore', () => ({
  useConnectToolsetDialogNew: vi.fn(),
}));

vi.mock('@/stores/runtimeStore', () => ({
  useRuntimeData: vi.fn(),
}));

vi.mock('@/hooks/useSystemInit', () => ({
  useSystemInit: vi.fn(),
}));

vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn(() => ({ data: null })),
}));

describe('ConnectToolsetDialogNew', () => {
  const mockSetOpen = vi.fn();
  const mockSetSelectedToolsetName = vi.fn();
  const mockSetSelectedToolsetId = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(runtimeStore.useRuntimeData).mockReturnValue({
      runtimes: [{ id: '1', name: 'test-toolset' }] as never,
      loading: false,
      error: null,
      stats: { total: 1, active: 1, inactive: 0 },
    });

    vi.mocked(useSystemInitHook.useSystemInit).mockReturnValue({
      infra: { remoteMCP: 'http://localhost:3001', nats: 'localhost:4222' },
      isInitialized: true,
      isLoading: false,
      error: null,
      isBackendError: false,
    });
  });

  it('does not render when no toolset is selected', () => {
    vi.mocked(uiStore.useConnectToolsetDialogNew).mockReturnValue({
      open: true,
      setOpen: mockSetOpen,
      selectedToolsetName: null,
      setSelectedToolsetName: mockSetSelectedToolsetName,
      selectedToolsetId: null,
      setSelectedToolsetId: mockSetSelectedToolsetId,
    });

    const { container } = render(<ConnectToolsetDialogNew />);
    expect(container.firstChild).toBeNull();
  });

  it('renders when dialog is open with toolset selected', () => {
    vi.mocked(uiStore.useConnectToolsetDialogNew).mockReturnValue({
      open: true,
      setOpen: mockSetOpen,
      selectedToolsetName: 'test-toolset',
      setSelectedToolsetName: mockSetSelectedToolsetName,
      selectedToolsetId: '1',
      setSelectedToolsetId: mockSetSelectedToolsetId,
    });

    render(<ConnectToolsetDialogNew />);
    expect(screen.getByText(/Connect:/)).toBeInTheDocument();
    expect(screen.getByText('test-toolset')).toBeInTheDocument();
  });

  it('shows connection settings tabs', () => {
    vi.mocked(uiStore.useConnectToolsetDialogNew).mockReturnValue({
      open: true,
      setOpen: mockSetOpen,
      selectedToolsetName: 'test-toolset',
      setSelectedToolsetName: mockSetSelectedToolsetName,
      selectedToolsetId: '1',
      setSelectedToolsetId: mockSetSelectedToolsetId,
    });

    render(<ConnectToolsetDialogNew />);
    expect(screen.getByText('STREAM')).toBeInTheDocument();
    expect(screen.getByText('SSE')).toBeInTheDocument();
    expect(screen.getByText('STDIO')).toBeInTheDocument();
  });

  it('tabs are clickable', () => {
    vi.mocked(uiStore.useConnectToolsetDialogNew).mockReturnValue({
      open: true,
      setOpen: mockSetOpen,
      selectedToolsetName: 'test-toolset',
      setSelectedToolsetName: mockSetSelectedToolsetName,
      selectedToolsetId: '1',
      setSelectedToolsetId: mockSetSelectedToolsetId,
    });

    render(<ConnectToolsetDialogNew />);

    const sseTab = screen.getByRole('tab', { name: 'SSE' });
    expect(sseTab).toBeInTheDocument();
    // Click should not throw
    fireEvent.click(sseTab);
  });

  it('shows platform cards', () => {
    vi.mocked(uiStore.useConnectToolsetDialogNew).mockReturnValue({
      open: true,
      setOpen: mockSetOpen,
      selectedToolsetName: 'test-toolset',
      setSelectedToolsetName: mockSetSelectedToolsetName,
      selectedToolsetId: '1',
      setSelectedToolsetId: mockSetSelectedToolsetId,
    });

    render(<ConnectToolsetDialogNew />);
    expect(screen.getByText('Langchain')).toBeInTheDocument();
    expect(screen.getByText('Langflow')).toBeInTheDocument();
    expect(screen.getByText('N8N')).toBeInTheDocument();
    expect(screen.getByText('JSON Configuration')).toBeInTheDocument();
  });

  it('auto-selects tab when platform card is clicked', () => {
    vi.mocked(uiStore.useConnectToolsetDialogNew).mockReturnValue({
      open: true,
      setOpen: mockSetOpen,
      selectedToolsetName: 'test-toolset',
      setSelectedToolsetName: mockSetSelectedToolsetName,
      selectedToolsetId: '1',
      setSelectedToolsetId: mockSetSelectedToolsetId,
    });

    render(<ConnectToolsetDialogNew />);

    // Click Langflow which should select SSE tab
    const langflowCard = screen.getByText('Langflow');
    fireEvent.click(langflowCard);

    const sseTabs = screen.getAllByText('SSE');
    const sseTab = sseTabs.find(el => el.getAttribute('role') === 'tab');
    expect(sseTab).toHaveAttribute('data-state', 'active');
  });

  it('shows instructions when platform is selected', () => {
    vi.mocked(uiStore.useConnectToolsetDialogNew).mockReturnValue({
      open: true,
      setOpen: mockSetOpen,
      selectedToolsetName: 'test-toolset',
      setSelectedToolsetName: mockSetSelectedToolsetName,
      selectedToolsetId: '1',
      setSelectedToolsetId: mockSetSelectedToolsetId,
    });

    render(<ConnectToolsetDialogNew />);

    // Click N8N card
    const n8nCard = screen.getByText('N8N');
    fireEvent.click(n8nCard);

    expect(screen.getByText('Connect N8N to 2LY')).toBeInTheDocument();
  });

  it('shows docs link in footer', () => {
    vi.mocked(uiStore.useConnectToolsetDialogNew).mockReturnValue({
      open: true,
      setOpen: mockSetOpen,
      selectedToolsetName: 'test-toolset',
      setSelectedToolsetName: mockSetSelectedToolsetName,
      selectedToolsetId: '1',
      setSelectedToolsetId: mockSetSelectedToolsetId,
    });

    render(<ConnectToolsetDialogNew />);
    const docsLink = screen.getByText('View full documentation');
    expect(docsLink).toHaveAttribute('href', 'https://docs.2ly.ai/integrations');
  });

  it('calls setOpen(false) when close button is clicked', () => {
    vi.mocked(uiStore.useConnectToolsetDialogNew).mockReturnValue({
      open: true,
      setOpen: mockSetOpen,
      selectedToolsetName: 'test-toolset',
      setSelectedToolsetName: mockSetSelectedToolsetName,
      selectedToolsetId: '1',
      setSelectedToolsetId: mockSetSelectedToolsetId,
    });

    render(<ConnectToolsetDialogNew />);
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    expect(mockSetOpen).toHaveBeenCalledWith(false);
  });
});
