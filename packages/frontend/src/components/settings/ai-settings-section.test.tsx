/**
 * AI Settings Section Component Tests
 *
 * WHY: Verify AI settings UI works correctly for configuration management.
 * Tests provider selection, model selection, API key input, and save/delete operations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AISettingsSection } from './ai-settings-section';
import { AiProvider } from '@/graphql/generated/graphql';

// Mock Apollo Client hooks
const mockRefetch = vi.fn();
const mockSetAIConfig = vi.fn();
const mockDeleteAIConfig = vi.fn();

vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn(() => ({
    data: null,
    loading: false,
    refetch: mockRefetch,
  })),
  useMutation: vi.fn((document) => {
    if (document.definitions[0].name.value === 'SetAIConfig') {
      return [mockSetAIConfig, { loading: false, error: null }];
    }
    if (document.definitions[0].name.value === 'DeleteAIConfig') {
      return [mockDeleteAIConfig, { loading: false }];
    }
    return [vi.fn(), { loading: false }];
  }),
}));

// Mock workspace store
vi.mock('@/stores/workspaceStore', () => ({
  useWorkspaceId: vi.fn(() => 'workspace-1'),
}));

describe('AISettingsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render AI settings section', () => {
    render(<AISettingsSection />);

    expect(screen.getByText('AI Configuration')).toBeInTheDocument();
    expect(screen.getByText(/Configure AI provider and API keys/)).toBeInTheDocument();
    expect(screen.getByLabelText('AI Provider')).toBeInTheDocument();
    expect(screen.getByLabelText('Model')).toBeInTheDocument();
    expect(screen.getByLabelText('API Key')).toBeInTheDocument();
  });

  it('should display info banner about encryption', () => {
    render(<AISettingsSection />);

    expect(screen.getByText(/Your API keys are encrypted before being stored/)).toBeInTheDocument();
    expect(screen.getByText(/bring-your-own-license/)).toBeInTheDocument();
  });

  it('should disable save button when no API key is entered', () => {
    render(<AISettingsSection />);

    const saveButton = screen.getByRole('button', { name: /Save Configuration/i });
    expect(saveButton).toBeDisabled();
  });

  it('should enable save button when API key is entered', async () => {
    render(<AISettingsSection />);

    const apiKeyInput = screen.getByLabelText('API Key');
    fireEvent.change(apiKeyInput, { target: { value: 'sk-test-key' } });

    await waitFor(() => {
      const saveButton = screen.getByRole('button', { name: /Save Configuration/i });
      expect(saveButton).not.toBeDisabled();
    });
  });

  it('should call setAIConfig mutation on save', async () => {
    mockSetAIConfig.mockResolvedValueOnce({ data: {} });

    render(<AISettingsSection />);

    const apiKeyInput = screen.getByLabelText('API Key');
    fireEvent.change(apiKeyInput, { target: { value: 'sk-test-key' } });

    const saveButton = screen.getByRole('button', { name: /Save Configuration/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSetAIConfig).toHaveBeenCalledWith({
        variables: {
          workspaceId: 'workspace-1',
          provider: AiProvider.Openai,
          model: expect.any(String),
          apiKey: 'sk-test-key',
        },
      });
    });
  });

  it('should display success message after saving', async () => {
    mockSetAIConfig.mockResolvedValueOnce({ data: {} });

    render(<AISettingsSection />);

    const apiKeyInput = screen.getByLabelText('API Key');
    fireEvent.change(apiKeyInput, { target: { value: 'sk-test-key' } });

    const saveButton = screen.getByRole('button', { name: /Save Configuration/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/AI configuration saved successfully/i)).toBeInTheDocument();
    });
  });

  it('should display error message on save failure', async () => {
    const errorMessage = 'Invalid API key';
    mockSetAIConfig.mockRejectedValueOnce(new Error(errorMessage));

    const mockUseMutation = vi.fn((document) => {
      if (document.definitions[0].name.value === 'SetAIConfig') {
        return [mockSetAIConfig, { loading: false, error: { message: errorMessage } }];
      }
      return [vi.fn(), { loading: false }];
    });

    // @ts-expect-error - Mock doesn't need full Apollo Client type compatibility
    vi.mocked(await import('@apollo/client/react')).useMutation = mockUseMutation;

    render(<AISettingsSection />);

    // Error should be displayed from mutation error
    await waitFor(() => {
      if (screen.queryByText(errorMessage)) {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      }
    });
  });

  it('should not show delete button when no config exists', () => {
    render(<AISettingsSection />);

    expect(screen.queryByRole('button', { name: /Delete Configuration/i })).not.toBeInTheDocument();
  });

  it('should show delete button when config exists', async () => {
    const mockUseQuery = vi.fn(() => ({
      data: {
        getAIConfig: {
          id: 'config-1',
          provider: AiProvider.Openai,
          model: 'gpt-4',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      loading: false,
      refetch: mockRefetch,
    }));

        // @ts-expect-error - Mock doesn't need full Apollo Client type compatibility
vi.mocked(await import('@apollo/client/react')).useQuery = mockUseQuery;

    render(<AISettingsSection />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Delete Configuration/i })).toBeInTheDocument();
    });
  });

  it('should call deleteAIConfig mutation on delete', async () => {
    const mockUseQuery = vi.fn(() => ({
      data: {
        getAIConfig: {
          id: 'config-1',
          provider: AiProvider.Openai,
          model: 'gpt-4',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      loading: false,
      refetch: mockRefetch,
    }));

        // @ts-expect-error - Mock doesn't need full Apollo Client type compatibility
vi.mocked(await import('@apollo/client/react')).useQuery = mockUseQuery;

    // Mock window.confirm
    global.confirm = vi.fn(() => true);

    mockDeleteAIConfig.mockResolvedValueOnce({ data: {} });

    render(<AISettingsSection />);

    await waitFor(() => {
      const deleteButton = screen.getByRole('button', { name: /Delete Configuration/i });
      fireEvent.click(deleteButton);
    });

    await waitFor(() => {
      expect(mockDeleteAIConfig).toHaveBeenCalledWith({
        variables: { workspaceId: 'workspace-1' },
      });
    });
  });

  it('should show current configuration when config exists', async () => {
    const mockUseQuery = vi.fn(() => ({
      data: {
        getAIConfig: {
          id: 'config-1',
          provider: AiProvider.Anthropic,
          model: 'claude-3-opus-20240229',
          createdAt: new Date('2024-01-01').toISOString(),
          updatedAt: new Date('2024-01-02').toISOString(),
        },
      },
      loading: false,
      refetch: mockRefetch,
    }));

        // @ts-expect-error - Mock doesn't need full Apollo Client type compatibility
vi.mocked(await import('@apollo/client/react')).useQuery = mockUseQuery;

    render(<AISettingsSection />);

    await waitFor(() => {
      expect(screen.getByText('Current Configuration')).toBeInTheDocument();
      expect(screen.getByText(/ANTHROPIC/)).toBeInTheDocument();
      expect(screen.getByText(/claude-3-opus-20240229/)).toBeInTheDocument();
    });
  });
});
