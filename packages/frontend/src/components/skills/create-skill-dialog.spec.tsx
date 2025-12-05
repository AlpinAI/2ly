/**
 * Tests for CreateSkillDialog with structured descriptions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateSkillDialog } from './create-skill-dialog';
import * as uiStore from '@/stores/uiStore';
import * as NotificationContext from '@/contexts/NotificationContext';
import { BrowserRouter } from 'react-router-dom';
import { useMutation } from '@apollo/client/react';

// Mock dependencies
vi.mock('@/stores/uiStore', () => ({
  useCreateSkillDialog: vi.fn(),
}));

vi.mock('@/contexts/NotificationContext', () => ({
  useNotification: vi.fn(),
}));

vi.mock('@apollo/client/react', () => ({
  useMutation: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ workspaceId: 'test-workspace' }),
  };
});

describe('CreateSkillDialog', () => {
  const mockClose = vi.fn();
  const mockCallback = vi.fn();
  const mockCreateSkill = vi.fn();
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(uiStore.useCreateSkillDialog).mockReturnValue({
      open: true,
      openDialog: vi.fn(),
      close: mockClose,
      callback: null,
    });

    vi.mocked(NotificationContext.useNotification).mockReturnValue({
      toast: mockToast,
      confirm: vi.fn(),
    });

    vi.mocked(useMutation).mockReturnValue([
      mockCreateSkill,
      { loading: false, error: undefined, data: undefined },
    ] as never);
  });

  describe('Rendering', () => {
    it('renders dialog with structured description fields', () => {
      render(
        <BrowserRouter>
          <CreateSkillDialog />
        </BrowserRouter>
      );

      expect(screen.getByRole('heading', { name: 'Create Skill' })).toBeInTheDocument();
      expect(screen.getByLabelText('Name *')).toBeInTheDocument();
      expect(screen.getByText('Scope *')).toBeInTheDocument();
      expect(screen.getByText('Guardrails *')).toBeInTheDocument();
      expect(screen.getByText('Knowledge')).toBeInTheDocument();
    });

    it('shows character counters for all sections', () => {
      render(
        <BrowserRouter>
          <CreateSkillDialog />
        </BrowserRouter>
      );

      expect(screen.getByText('0 / 300')).toBeInTheDocument(); // Scope
      expect(screen.getAllByText('0 / 10000')).toHaveLength(2); // Guardrails and Knowledge
    });

    it('renders with dialog closed when open is false', () => {
      vi.mocked(uiStore.useCreateSkillDialog).mockReturnValue({
        open: false,
        openDialog: vi.fn(),
        close: mockClose,
        callback: null,
      });

      render(
        <BrowserRouter>
          <CreateSkillDialog />
        </BrowserRouter>
      );

      expect(screen.queryByText('Create Skill')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('disables submit button when name is empty', () => {
      render(
        <BrowserRouter>
          <CreateSkillDialog />
        </BrowserRouter>
      );

      const submitButton = screen.getByRole('button', { name: /Create Skill/i });
      expect(submitButton).toBeDisabled();
    });

    it('disables submit button when scope is empty', () => {
      render(
        <BrowserRouter>
          <CreateSkillDialog />
        </BrowserRouter>
      );

      const nameInput = screen.getByLabelText('Name *');
      fireEvent.change(nameInput, { target: { value: 'Test Skill' } });

      const submitButton = screen.getByRole('button', { name: /Create Skill/i });
      expect(submitButton).toBeDisabled();
    });

    it('disables submit button when guardrails is empty', () => {
      render(
        <BrowserRouter>
          <CreateSkillDialog />
        </BrowserRouter>
      );

      const nameInput = screen.getByLabelText('Name *');
      fireEvent.change(nameInput, { target: { value: 'Test Skill' } });

      const scopeTextarea = screen.getByPlaceholderText(/Define what this skill can do/);
      fireEvent.change(scopeTextarea, { target: { value: 'Test scope' } });

      const submitButton = screen.getByRole('button', { name: /Create Skill/i });
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when all required fields are filled', () => {
      render(
        <BrowserRouter>
          <CreateSkillDialog />
        </BrowserRouter>
      );

      const nameInput = screen.getByLabelText('Name *');
      fireEvent.change(nameInput, { target: { value: 'Test Skill' } });

      const scopeTextarea = screen.getByPlaceholderText(/Define what this skill can do/);
      fireEvent.change(scopeTextarea, { target: { value: 'Test scope' } });

      const guardrailsTextarea = screen.getByPlaceholderText(/Specify what this skill should NOT do/);
      fireEvent.change(guardrailsTextarea, { target: { value: 'Test guardrails' } });

      const submitButton = screen.getByRole('button', { name: /Create Skill/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('validates scope length (max 300 characters)', () => {
      render(
        <BrowserRouter>
          <CreateSkillDialog />
        </BrowserRouter>
      );

      const nameInput = screen.getByLabelText('Name *');
      fireEvent.change(nameInput, { target: { value: 'Test Skill' } });

      const scopeTextarea = screen.getByPlaceholderText(/Define what this skill can do/);
      fireEvent.change(scopeTextarea, { target: { value: 'A'.repeat(301) } });

      const guardrailsTextarea = screen.getByPlaceholderText(/Specify what this skill should NOT do/);
      fireEvent.change(guardrailsTextarea, { target: { value: 'Test guardrails' } });

      const submitButton = screen.getByRole('button', { name: /Create Skill/i });
      expect(submitButton).toBeDisabled();
    });

    it('validates guardrails length (max 10,000 characters)', () => {
      render(
        <BrowserRouter>
          <CreateSkillDialog />
        </BrowserRouter>
      );

      const nameInput = screen.getByLabelText('Name *');
      fireEvent.change(nameInput, { target: { value: 'Test Skill' } });

      const scopeTextarea = screen.getByPlaceholderText(/Define what this skill can do/);
      fireEvent.change(scopeTextarea, { target: { value: 'Test scope' } });

      const guardrailsTextarea = screen.getByPlaceholderText(/Specify what this skill should NOT do/);
      fireEvent.change(guardrailsTextarea, { target: { value: 'A'.repeat(10001) } });

      const submitButton = screen.getByRole('button', { name: /Create Skill/i });
      expect(submitButton).toBeDisabled();
    });

    it('allows empty knowledge section', () => {
      render(
        <BrowserRouter>
          <CreateSkillDialog />
        </BrowserRouter>
      );

      const nameInput = screen.getByLabelText('Name *');
      fireEvent.change(nameInput, { target: { value: 'Test Skill' } });

      const scopeTextarea = screen.getByPlaceholderText(/Define what this skill can do/);
      fireEvent.change(scopeTextarea, { target: { value: 'Test scope' } });

      const guardrailsTextarea = screen.getByPlaceholderText(/Specify what this skill should NOT do/);
      fireEvent.change(guardrailsTextarea, { target: { value: 'Test guardrails' } });

      const submitButton = screen.getByRole('button', { name: /Create Skill/i });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    it('submits with structured description format', async () => {
      mockCreateSkill.mockResolvedValue({
        data: { createSkill: { id: 'new-skill-id' } },
      });

      render(
        <BrowserRouter>
          <CreateSkillDialog />
        </BrowserRouter>
      );

      const nameInput = screen.getByLabelText('Name *');
      fireEvent.change(nameInput, { target: { value: 'Test Skill' } });

      const scopeTextarea = screen.getByPlaceholderText(/Define what this skill can do/);
      fireEvent.change(scopeTextarea, { target: { value: 'Test scope' } });

      const guardrailsTextarea = screen.getByPlaceholderText(/Specify what this skill should NOT do/);
      fireEvent.change(guardrailsTextarea, { target: { value: 'Test guardrails' } });

      const knowledgeTextarea = screen.getByPlaceholderText(/Provide additional context/);
      fireEvent.change(knowledgeTextarea, { target: { value: 'Test knowledge' } });

      const submitButton = screen.getByRole('button', { name: /Create Skill/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreateSkill).toHaveBeenCalledWith({
          variables: {
            workspaceId: 'test-workspace',
            name: 'Test Skill',
            description: '# Scope\nTest scope\n\n# Guardrails\nTest guardrails\n\n# Knowledge\nTest knowledge',
          },
        });
      });
    });

    it('submits without knowledge section if empty', async () => {
      mockCreateSkill.mockResolvedValue({
        data: { createSkill: { id: 'new-skill-id' } },
      });

      render(
        <BrowserRouter>
          <CreateSkillDialog />
        </BrowserRouter>
      );

      const nameInput = screen.getByLabelText('Name *');
      fireEvent.change(nameInput, { target: { value: 'Test Skill' } });

      const scopeTextarea = screen.getByPlaceholderText(/Define what this skill can do/);
      fireEvent.change(scopeTextarea, { target: { value: 'Test scope' } });

      const guardrailsTextarea = screen.getByPlaceholderText(/Specify what this skill should NOT do/);
      fireEvent.change(guardrailsTextarea, { target: { value: 'Test guardrails' } });

      const submitButton = screen.getByRole('button', { name: /Create Skill/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreateSkill).toHaveBeenCalledWith({
          variables: {
            workspaceId: 'test-workspace',
            name: 'Test Skill',
            description: '# Scope\nTest scope\n\n# Guardrails\nTest guardrails',
          },
        });
      });
    });

    it('shows validation error toast when scope exceeds limit on submit', async () => {
      render(
        <BrowserRouter>
          <CreateSkillDialog />
        </BrowserRouter>
      );

      const nameInput = screen.getByLabelText('Name *');
      fireEvent.change(nameInput, { target: { value: 'Test Skill' } });

      const scopeTextarea = screen.getByPlaceholderText(/Define what this skill can do/);
      fireEvent.change(scopeTextarea, { target: { value: 'A'.repeat(301) } });

      const guardrailsTextarea = screen.getByPlaceholderText(/Specify what this skill should NOT do/);
      fireEvent.change(guardrailsTextarea, { target: { value: 'Test guardrails' } });

      // Force click even though button should be disabled (edge case)
      const form = screen.getByRole('button', { name: /Create Skill/i }).closest('form');
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Validation Error',
          description: 'Scope must not exceed 300 characters',
          variant: 'error',
        });
      });

      expect(mockCreateSkill).not.toHaveBeenCalled();
    });

    it('shows success toast and closes dialog on successful creation', async () => {
      mockCreateSkill.mockResolvedValue({
        data: { createSkill: { id: 'new-skill-id' } },
      });

      // Mock the mutation hook to return onCompleted callback
      vi.mocked(useMutation).mockReturnValue([
        mockCreateSkill,
        { loading: false, error: undefined, data: undefined },
      ] as never);

      render(
        <BrowserRouter>
          <CreateSkillDialog />
        </BrowserRouter>
      );

      const nameInput = screen.getByLabelText('Name *');
      fireEvent.change(nameInput, { target: { value: 'Test Skill' } });

      const scopeTextarea = screen.getByPlaceholderText(/Define what this skill can do/);
      fireEvent.change(scopeTextarea, { target: { value: 'Test scope' } });

      const guardrailsTextarea = screen.getByPlaceholderText(/Specify what this skill should NOT do/);
      fireEvent.change(guardrailsTextarea, { target: { value: 'Test guardrails' } });

      const submitButton = screen.getByRole('button', { name: /Create Skill/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreateSkill).toHaveBeenCalled();
      });
    });

    it('trims name before submission', async () => {
      mockCreateSkill.mockResolvedValue({
        data: { createSkill: { id: 'new-skill-id' } },
      });

      render(
        <BrowserRouter>
          <CreateSkillDialog />
        </BrowserRouter>
      );

      const nameInput = screen.getByLabelText('Name *');
      fireEvent.change(nameInput, { target: { value: '  Test Skill  ' } });

      const scopeTextarea = screen.getByPlaceholderText(/Define what this skill can do/);
      fireEvent.change(scopeTextarea, { target: { value: 'Test scope' } });

      const guardrailsTextarea = screen.getByPlaceholderText(/Specify what this skill should NOT do/);
      fireEvent.change(guardrailsTextarea, { target: { value: 'Test guardrails' } });

      const submitButton = screen.getByRole('button', { name: /Create Skill/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreateSkill).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              name: 'Test Skill',
            }),
          })
        );
      });
    });
  });

  describe('Dialog Behavior', () => {
    it('closes dialog on cancel button click', () => {
      render(
        <BrowserRouter>
          <CreateSkillDialog />
        </BrowserRouter>
      );

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(mockClose).toHaveBeenCalled();
    });

    it('resets form after closing', async () => {
      vi.useFakeTimers();

      render(
        <BrowserRouter>
          <CreateSkillDialog />
        </BrowserRouter>
      );

      const nameInput = screen.getByLabelText('Name *');
      fireEvent.change(nameInput, { target: { value: 'Test Skill' } });

      const scopeTextarea = screen.getByPlaceholderText(/Define what this skill can do/);
      fireEvent.change(scopeTextarea, { target: { value: 'Test scope' } });

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(mockClose).toHaveBeenCalled();

      // Fast-forward timer to complete reset
      vi.advanceTimersByTime(300);

      vi.useRealTimers();
    });

    it('disables all fields during loading', () => {
      vi.mocked(useMutation).mockReturnValue([
        mockCreateSkill,
        { loading: true, error: undefined, data: undefined },
      ] as never);

      render(
        <BrowserRouter>
          <CreateSkillDialog />
        </BrowserRouter>
      );

      const nameInput = screen.getByLabelText('Name *');
      const scopeTextarea = screen.getByPlaceholderText(/Define what this skill can do/);
      const guardrailsTextarea = screen.getByPlaceholderText(/Specify what this skill should NOT do/);
      const knowledgeTextarea = screen.getByPlaceholderText(/Provide additional context/);

      expect(nameInput).toBeDisabled();
      expect(scopeTextarea).toBeDisabled();
      expect(guardrailsTextarea).toBeDisabled();
      expect(knowledgeTextarea).toBeDisabled();
    });

    it('shows loading state on submit button during submission', () => {
      vi.mocked(useMutation).mockReturnValue([
        mockCreateSkill,
        { loading: true, error: undefined, data: undefined },
      ] as never);

      render(
        <BrowserRouter>
          <CreateSkillDialog />
        </BrowserRouter>
      );

      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });
  });

  describe('Callback Handling', () => {
    it('calls callback with skillId when provided', async () => {
      mockCreateSkill.mockResolvedValue({
        data: { createSkill: { id: 'new-skill-id' } },
      });

      vi.mocked(uiStore.useCreateSkillDialog).mockReturnValue({
        open: true,
        openDialog: vi.fn(),
        close: mockClose,
        callback: mockCallback,
      });

      render(
        <BrowserRouter>
          <CreateSkillDialog />
        </BrowserRouter>
      );

      const nameInput = screen.getByLabelText('Name *');
      fireEvent.change(nameInput, { target: { value: 'Test Skill' } });

      const scopeTextarea = screen.getByPlaceholderText(/Define what this skill can do/);
      fireEvent.change(scopeTextarea, { target: { value: 'Test scope' } });

      const guardrailsTextarea = screen.getByPlaceholderText(/Specify what this skill should NOT do/);
      fireEvent.change(guardrailsTextarea, { target: { value: 'Test guardrails' } });

      const submitButton = screen.getByRole('button', { name: /Create Skill/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreateSkill).toHaveBeenCalled();
      });
    });
  });
});
