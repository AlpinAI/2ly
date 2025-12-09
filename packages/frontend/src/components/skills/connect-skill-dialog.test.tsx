/**
 * Tests for ConnectSkillDialog
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConnectSkillDialog } from './connect-skill-dialog';
import * as uiStore from '@/stores/uiStore';
import * as runtimeStore from '@/stores/runtimeStore';
import * as useSystemInitHook from '@/hooks/useSystemInit';

// Mock dependencies
vi.mock('@/stores/uiStore', () => ({
  useConnectSkillDialog: vi.fn(),
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

describe('ConnectSkillDialog', () => {
  const mockSetOpen = vi.fn();
  const mockSetSelectedSkillName = vi.fn();
  const mockSetSelectedSkillId = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(runtimeStore.useRuntimeData).mockReturnValue({
      runtimes: [{ id: '1', name: 'test-skill' }] as never,
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

  it('does not render when no skill is selected', () => {
    vi.mocked(uiStore.useConnectSkillDialog).mockReturnValue({
      open: true,
      setOpen: mockSetOpen,
      selectedSkillName: null,
      setSelectedSkillName: mockSetSelectedSkillName,
      selectedSkillId: null,
      setSelectedSkillId: mockSetSelectedSkillId,
    });

    const { container } = render(<ConnectSkillDialog />);
    expect(container.firstChild).toBeNull();
  });

  it('renders when dialog is open with skill selected', () => {
    vi.mocked(uiStore.useConnectSkillDialog).mockReturnValue({
      open: true,
      setOpen: mockSetOpen,
      selectedSkillName: 'test-skill',
      setSelectedSkillName: mockSetSelectedSkillName,
      selectedSkillId: '1',
      setSelectedSkillId: mockSetSelectedSkillId,
    });

    render(<ConnectSkillDialog />);
    expect(screen.getByText(/Connect:/)).toBeInTheDocument();
    expect(screen.getByText('test-skill')).toBeInTheDocument();
  });

  it('shows platform cards', () => {
    vi.mocked(uiStore.useConnectSkillDialog).mockReturnValue({
      open: true,
      setOpen: mockSetOpen,
      selectedSkillName: 'test-skill',
      setSelectedSkillName: mockSetSelectedSkillName,
      selectedSkillId: '1',
      setSelectedSkillId: mockSetSelectedSkillId,
    });

    render(<ConnectSkillDialog />);
    expect(screen.getByText('N8N')).toBeInTheDocument();
    expect(screen.getByText('Langflow')).toBeInTheDocument();
    expect(screen.getByText('Manual Configuration')).toBeInTheDocument();
    // Langchain is disabled and should not appear
    expect(screen.queryByText('Langchain')).not.toBeInTheDocument();
  });

  it('shows instructions when platform card is clicked', () => {
    vi.mocked(uiStore.useConnectSkillDialog).mockReturnValue({
      open: true,
      setOpen: mockSetOpen,
      selectedSkillName: 'test-skill',
      setSelectedSkillName: mockSetSelectedSkillName,
      selectedSkillId: '1',
      setSelectedSkillId: mockSetSelectedSkillId,
    });

    render(<ConnectSkillDialog />);

    // Click Langflow card
    const langflowCard = screen.getByText('Langflow');
    fireEvent.click(langflowCard);

    // Verify instructions appear
    expect(screen.getByText(/Connect Langflow to Skilder/i)).toBeInTheDocument();
  });

  it('shows instructions when platform is selected', () => {
    vi.mocked(uiStore.useConnectSkillDialog).mockReturnValue({
      open: true,
      setOpen: mockSetOpen,
      selectedSkillName: 'test-skill',
      setSelectedSkillName: mockSetSelectedSkillName,
      selectedSkillId: '1',
      setSelectedSkillId: mockSetSelectedSkillId,
    });

    render(<ConnectSkillDialog />);

    // Click N8N card
    const n8nCard = screen.getByText('N8N');
    fireEvent.click(n8nCard);

    expect(screen.getByText('Connect N8N to Skilder')).toBeInTheDocument();
  });

  it('shows docs link in footer', () => {
    vi.mocked(uiStore.useConnectSkillDialog).mockReturnValue({
      open: true,
      setOpen: mockSetOpen,
      selectedSkillName: 'test-skill',
      setSelectedSkillName: mockSetSelectedSkillName,
      selectedSkillId: '1',
      setSelectedSkillId: mockSetSelectedSkillId,
    });

    render(<ConnectSkillDialog />);
    const docsLink = screen.getByText('View full documentation');
    expect(docsLink).toHaveAttribute('href', 'https://docs.skilder.ai/integrations');
  });

  it('calls setOpen(false) when close button is clicked', () => {
    vi.mocked(uiStore.useConnectSkillDialog).mockReturnValue({
      open: true,
      setOpen: mockSetOpen,
      selectedSkillName: 'test-skill',
      setSelectedSkillName: mockSetSelectedSkillName,
      selectedSkillId: '1',
      setSelectedSkillId: mockSetSelectedSkillId,
    });

    render(<ConnectSkillDialog />);
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    expect(mockSetOpen).toHaveBeenCalledWith(false);
  });
});
