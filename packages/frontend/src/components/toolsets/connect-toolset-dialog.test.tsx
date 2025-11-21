/**
 * Tests for ConnectToolsetDialog
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConnectToolsetDialog } from './connect-toolset-dialog';
import * as uiStore from '@/stores/uiStore';
import * as runtimeStore from '@/stores/runtimeStore';
import * as useSystemInitHook from '@/hooks/useSystemInit';

// Mock dependencies
vi.mock('@/stores/uiStore', () => ({
  useConnectToolsetDialog: vi.fn(),
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

describe('ConnectToolsetDialog', () => {
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
    vi.mocked(uiStore.useConnectToolsetDialog).mockReturnValue({
      open: true,
      setOpen: mockSetOpen,
      selectedToolsetName: null,
      setSelectedToolsetName: mockSetSelectedToolsetName,
      selectedToolsetId: null,
      setSelectedToolsetId: mockSetSelectedToolsetId,
    });

    const { container } = render(<ConnectToolsetDialog />);
    expect(container.firstChild).toBeNull();
  });

  it('renders when dialog is open with toolset selected', () => {
    vi.mocked(uiStore.useConnectToolsetDialog).mockReturnValue({
      open: true,
      setOpen: mockSetOpen,
      selectedToolsetName: 'test-toolset',
      setSelectedToolsetName: mockSetSelectedToolsetName,
      selectedToolsetId: '1',
      setSelectedToolsetId: mockSetSelectedToolsetId,
    });

    render(<ConnectToolsetDialog />);
    expect(screen.getByText(/Connect:/)).toBeInTheDocument();
    expect(screen.getByText('test-toolset')).toBeInTheDocument();
  });

  it('shows platform cards', () => {
    vi.mocked(uiStore.useConnectToolsetDialog).mockReturnValue({
      open: true,
      setOpen: mockSetOpen,
      selectedToolsetName: 'test-toolset',
      setSelectedToolsetName: mockSetSelectedToolsetName,
      selectedToolsetId: '1',
      setSelectedToolsetId: mockSetSelectedToolsetId,
    });

    render(<ConnectToolsetDialog />);
    expect(screen.getByText('N8N')).toBeInTheDocument();
    expect(screen.getByText('Langflow')).toBeInTheDocument();
    expect(screen.getByText('Manual Configuration')).toBeInTheDocument();
    // Langchain is disabled and should not appear
    expect(screen.queryByText('Langchain')).not.toBeInTheDocument();
  });

  it('shows instructions when platform card is clicked', () => {
    vi.mocked(uiStore.useConnectToolsetDialog).mockReturnValue({
      open: true,
      setOpen: mockSetOpen,
      selectedToolsetName: 'test-toolset',
      setSelectedToolsetName: mockSetSelectedToolsetName,
      selectedToolsetId: '1',
      setSelectedToolsetId: mockSetSelectedToolsetId,
    });

    render(<ConnectToolsetDialog />);

    // Click Langflow card
    const langflowCard = screen.getByText('Langflow');
    fireEvent.click(langflowCard);

    // Verify instructions appear
    expect(screen.getByText(/Connect Langflow to 2LY/i)).toBeInTheDocument();
  });

  it('shows instructions when platform is selected', () => {
    vi.mocked(uiStore.useConnectToolsetDialog).mockReturnValue({
      open: true,
      setOpen: mockSetOpen,
      selectedToolsetName: 'test-toolset',
      setSelectedToolsetName: mockSetSelectedToolsetName,
      selectedToolsetId: '1',
      setSelectedToolsetId: mockSetSelectedToolsetId,
    });

    render(<ConnectToolsetDialog />);

    // Click N8N card
    const n8nCard = screen.getByText('N8N');
    fireEvent.click(n8nCard);

    expect(screen.getByText('Connect N8N to 2LY')).toBeInTheDocument();
  });

  it('shows docs link in footer', () => {
    vi.mocked(uiStore.useConnectToolsetDialog).mockReturnValue({
      open: true,
      setOpen: mockSetOpen,
      selectedToolsetName: 'test-toolset',
      setSelectedToolsetName: mockSetSelectedToolsetName,
      selectedToolsetId: '1',
      setSelectedToolsetId: mockSetSelectedToolsetId,
    });

    render(<ConnectToolsetDialog />);
    const docsLink = screen.getByText('View full documentation');
    expect(docsLink).toHaveAttribute('href', 'https://docs.2ly.ai/integrations');
  });

  it('calls setOpen(false) when close button is clicked', () => {
    vi.mocked(uiStore.useConnectToolsetDialog).mockReturnValue({
      open: true,
      setOpen: mockSetOpen,
      selectedToolsetName: 'test-toolset',
      setSelectedToolsetName: mockSetSelectedToolsetName,
      selectedToolsetId: '1',
      setSelectedToolsetId: mockSetSelectedToolsetId,
    });

    render(<ConnectToolsetDialog />);
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    expect(mockSetOpen).toHaveBeenCalledWith(false);
  });
});
