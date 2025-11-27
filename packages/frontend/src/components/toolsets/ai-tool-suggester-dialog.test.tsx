/**
 * AI Tool Suggester Dialog Component Tests
 *
 * WHY: Verify AI tool suggester dialog works correctly for tool suggestions.
 * Tests natural language input, AI suggestions display, and tool selection.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIToolSuggesterDialog } from './ai-tool-suggester-dialog';

// Mock Apollo Client hooks
const mockGetSuggestions = vi.fn();
const mockLinkTool = vi.fn();

vi.mock('@apollo/client/react', () => ({
  useLazyQuery: vi.fn(() => [
    mockGetSuggestions,
    { loading: false, error: null },
  ]),
  useMutation: vi.fn(() => [mockLinkTool, { loading: false }]),
}));

// Mock workspace store
vi.mock('@/stores/workspaceStore', () => ({
  useWorkspaceId: vi.fn(() => 'workspace-1'),
}));

describe('AIToolSuggesterDialog', () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dialog when open', () => {
    render(
      <AIToolSuggesterDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        toolSetId="toolset-1"
        toolSetName="Email Tools"
      />,
    );

    expect(screen.getByText('AI Tool Suggester')).toBeInTheDocument();
    expect(screen.getByText(/Email Tools/)).toBeInTheDocument();
  });

  it('should not render dialog when closed', () => {
    render(
      <AIToolSuggesterDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        toolSetId="toolset-1"
        toolSetName="Email Tools"
      />,
    );

    expect(screen.queryByText('AI Tool Suggester')).not.toBeInTheDocument();
  });

  it('should render description textarea', () => {
    render(
      <AIToolSuggesterDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        toolSetId="toolset-1"
        toolSetName="Email Tools"
      />,
    );

    const textarea = screen.getByPlaceholderText(/I want to send email/i);
    expect(textarea).toBeInTheDocument();
  });

  it('should disable Get AI Suggestions button when description is empty', () => {
    render(
      <AIToolSuggesterDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        toolSetId="toolset-1"
        toolSetName="Email Tools"
      />,
    );

    const button = screen.getByRole('button', { name: /Get AI Suggestions/i });
    expect(button).toBeDisabled();
  });

  it('should enable Get AI Suggestions button when description is entered', async () => {
    render(
      <AIToolSuggesterDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        toolSetId="toolset-1"
        toolSetName="Email Tools"
      />,
    );

    const textarea = screen.getByPlaceholderText(/I want to send email/i);
    fireEvent.change(textarea, { target: { value: 'I want to send email' } });

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /Get AI Suggestions/i });
      expect(button).not.toBeDisabled();
    });
  });

  it('should call getSuggestions on button click', async () => {
    render(
      <AIToolSuggesterDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        toolSetId="toolset-1"
        toolSetName="Email Tools"
      />,
    );

    const textarea = screen.getByPlaceholderText(/I want to send email/i);
    fireEvent.change(textarea, { target: { value: 'I want to send email' } });

    const button = screen.getByRole('button', { name: /Get AI Suggestions/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockGetSuggestions).toHaveBeenCalledWith({
        variables: {
          workspaceId: 'workspace-1',
          description: 'I want to send email',
        },
      });
    });
  });

  it('should display tool suggestions', async () => {
    const mockUseLazyQuery = vi.fn(() => [
      mockGetSuggestions,
      { loading: false, error: null },
    ]);

    // Call onCompleted callback with mock data
    // @ts-expect-error - Mock implementation for testing
    mockUseLazyQuery.mockImplementation((document, options) => {
      if (options?.onCompleted) {
        setTimeout(() => {
          options.onCompleted({
            suggestToolsForToolSet: {
              suggestions: [
                {
                  toolId: 'tool-1',
                  toolName: 'send_email',
                  reason: 'Sends emails to recipients',
                  confidence: 0.95,
                },
              ],
              externalSuggestions: [],
            },
          });
        }, 0);
      }
      return [mockGetSuggestions, { loading: false, error: null }];
    });

        // @ts-expect-error - Mock doesn't need full Apollo Client type compatibility
vi.mocked(await import('@apollo/client/react')).useLazyQuery = mockUseLazyQuery;

    render(
      <AIToolSuggesterDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        toolSetId="toolset-1"
        toolSetName="Email Tools"
      />,
    );

    const textarea = screen.getByPlaceholderText(/I want to send email/i);
    fireEvent.change(textarea, { target: { value: 'I want to send email' } });

    const button = screen.getByRole('button', { name: /Get AI Suggestions/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('send_email')).toBeInTheDocument();
      expect(screen.getByText(/Sends emails to recipients/)).toBeInTheDocument();
      expect(screen.getByText('95% match')).toBeInTheDocument();
    });
  });

  it('should display external suggestions', async () => {
    // @ts-expect-error - Mock implementation for testing
    const mockUseLazyQuery = vi.fn((document, options) => {
      if (options?.onCompleted) {
        setTimeout(() => {
          options.onCompleted({
            suggestToolsForToolSet: {
              suggestions: [],
              externalSuggestions: ['gmail', 'outlook'],
            },
          });
        }, 0);
      }
      return [mockGetSuggestions, { loading: false, error: null }];
    });

        // @ts-expect-error - Mock doesn't need full Apollo Client type compatibility
vi.mocked(await import('@apollo/client/react')).useLazyQuery = mockUseLazyQuery;

    render(
      <AIToolSuggesterDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        toolSetId="toolset-1"
        toolSetName="Email Tools"
      />,
    );

    const textarea = screen.getByPlaceholderText(/I want to send email/i);
    fireEvent.change(textarea, { target: { value: 'I want to send email' } });

    const button = screen.getByRole('button', { name: /Get AI Suggestions/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('External MCP Servers')).toBeInTheDocument();
      expect(screen.getByText('gmail')).toBeInTheDocument();
      expect(screen.getByText('outlook')).toBeInTheDocument();
    });
  });

  it('should close dialog on cancel', () => {
    render(
      <AIToolSuggesterDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        toolSetId="toolset-1"
        toolSetName="Email Tools"
      />,
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('should display no suggestions message', async () => {
    // @ts-expect-error - Mock implementation for testing
    const mockUseLazyQuery = vi.fn((document, options) => {
      if (options?.onCompleted) {
        setTimeout(() => {
          options.onCompleted({
            suggestToolsForToolSet: {
              suggestions: [],
              externalSuggestions: [],
            },
          });
        }, 0);
      }
      return [mockGetSuggestions, { loading: false, error: null }];
    });

        // @ts-expect-error - Mock doesn't need full Apollo Client type compatibility
vi.mocked(await import('@apollo/client/react')).useLazyQuery = mockUseLazyQuery;

    render(
      <AIToolSuggesterDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        toolSetId="toolset-1"
        toolSetName="Email Tools"
      />,
    );

    const textarea = screen.getByPlaceholderText(/I want to send email/i);
    fireEvent.change(textarea, { target: { value: 'I want to send email' } });

    const button = screen.getByRole('button', { name: /Get AI Suggestions/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/No tool suggestions found/i)).toBeInTheDocument();
    });
  });
});
