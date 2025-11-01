/**
 * Tests for Create Tool Set Dialog Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateToolSetDialog } from './create-tool-set-dialog';
import * as uiStore from '@/stores/uiStore';
import * as workspaceStore from '@/stores/workspaceStore';
import * as NotificationContext from '@/contexts/NotificationContext';

// Mock stores
vi.mock('@/stores/uiStore');
vi.mock('@/stores/workspaceStore');
vi.mock('@/contexts/NotificationContext');

// Mock hooks
vi.mock('@/hooks/useMCPTools', () => ({
  useMCPTools: vi.fn(() => ({
    filteredTools: [],
    loading: false,
  })),
}));

// Mock Apollo hooks
vi.mock('@apollo/client/react', () => ({
  useLazyQuery: vi.fn(() => [
    vi.fn(),
    { loading: false, error: null },
  ]),
  useMutation: vi.fn(() => [
    vi.fn(),
    { loading: false },
  ]),
  useQuery: vi.fn(() => ({
    data: null,
    loading: false,
    error: null,
  })),
}));

describe('CreateToolSetDialog', () => {
  const mockClose = vi.fn();
  const mockToast = vi.fn();
  const mockSetOpen = vi.fn();
  const mockSetInitialStep = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup store mocks
    vi.mocked(uiStore.useCreateToolSetDialog).mockReturnValue({
      open: true,
      callback: null,
      close: mockClose,
      openDialog: vi.fn(),
    });

    vi.mocked(uiStore.useAddServerWorkflow).mockReturnValue({
      open: false,
      setOpen: mockSetOpen,
      initialStep: null,
      setInitialStep: mockSetInitialStep,
    });

    vi.mocked(workspaceStore.useWorkspaceId).mockReturnValue('workspace-1');

    vi.mocked(NotificationContext.useNotification).mockReturnValue({
      toast: mockToast,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  });

  it('renders goal input step initially', () => {
    render(<CreateToolSetDialog />);

    expect(screen.getByText('Create Tool Set with AI')).toBeInTheDocument();
    expect(screen.getByText('Describe what you want to accomplish, and AI will suggest everything you need')).toBeInTheDocument();
    expect(screen.getByLabelText('What do you want to accomplish?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /get ai suggestions/i })).toBeInTheDocument();
  });

  it('disables submit button when goal is empty', () => {
    render(<CreateToolSetDialog />);

    const submitButton = screen.getByRole('button', { name: /get ai suggestions/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when goal is entered', async () => {
    const user = userEvent.setup();
    render(<CreateToolSetDialog />);

    const textarea = screen.getByLabelText('What do you want to accomplish?');
    await user.type(textarea, 'I want to manage GitHub repositories');

    const submitButton = screen.getByRole('button', { name: /get ai suggestions/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('closes dialog when closed', () => {
    vi.mocked(uiStore.useCreateToolSetDialog).mockReturnValue({
      open: false,
      callback: null,
      close: mockClose,
      openDialog: vi.fn(),
    });

    const { container } = render(<CreateToolSetDialog />);
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('shows error message when AI config is not found', async () => {
    const { useLazyQuery } = await import('@apollo/client/react');

    vi.mocked(useLazyQuery).mockReturnValue([
      vi.fn(),
      {
        loading: false,
        error: {
          message: 'AI configuration not found. Please configure AI settings first.',
          name: 'Error',
          graphQLErrors: [],
          clientErrors: [],
          networkError: null,
          extraInfo: undefined,
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);

    render(<CreateToolSetDialog />);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(/ai configuration not found/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/please configure your ai settings/i)).toBeInTheDocument();
  });

  it('provides placeholder text as guidance', () => {
    render(<CreateToolSetDialog />);

    const textarea = screen.getByLabelText('What do you want to accomplish?');
    expect(textarea).toHaveAttribute(
      'placeholder',
      'E.g., I want to manage my GitHub repositories and send emails to my team'
    );
  });
});
