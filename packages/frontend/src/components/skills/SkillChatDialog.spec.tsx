/**
 * Tests for SkillChatDialog component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SkillChatDialog } from './SkillChatDialog';
import * as uiStore from '@/stores/uiStore';
import { useSkillChat } from '@/hooks/useSkillChat';
import { useQuery } from '@apollo/client/react';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('@/stores/uiStore', () => ({
  useSkillChatDialog: vi.fn(),
}));

vi.mock('@/hooks/useSkillChat', () => ({
  useSkillChat: vi.fn(),
}));

vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ workspaceId: 'test-workspace' }),
  };
});

const mockSkill = {
  __typename: 'Skill' as const,
  id: 'skill-1',
  name: 'Test Skill',
  description: 'Test skill description',
  mcpTools: [
    {
      __typename: 'MCPTool' as const,
      id: 'tool-1',
      name: 'Test Tool',
      description: 'Test tool description',
    },
  ],
};

describe('SkillChatDialog', () => {
  const mockSetOpen = vi.fn();
  const mockSetSelectedSkillId = vi.fn();
  const mockSendMessage = vi.fn();
  const mockClearMessages = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when selectedSkillId is null', () => {
    vi.mocked(uiStore.useSkillChatDialog).mockReturnValue({
      open: true,
      setOpen: mockSetOpen,
      selectedSkillId: null,
      setSelectedSkillId: mockSetSelectedSkillId,
    });

    vi.mocked(useSkillChat).mockReturnValue({
      messages: [],
      sendMessage: mockSendMessage,
      clearMessages: mockClearMessages,
      isStreaming: false,
    });

    vi.mocked(useQuery).mockReturnValue({
      data: null,
      loading: false,
      error: undefined,
    } as never);

    const { container } = render(
      <BrowserRouter>
        <SkillChatDialog />
      </BrowserRouter>
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render dialog when open with selected skill', () => {
    vi.mocked(uiStore.useSkillChatDialog).mockReturnValue({
      open: true,
      setOpen: mockSetOpen,
      selectedSkillId: 'skill-1',
      setSelectedSkillId: mockSetSelectedSkillId,
    });

    vi.mocked(useSkillChat).mockReturnValue({
      messages: [],
      sendMessage: mockSendMessage,
      clearMessages: mockClearMessages,
      isStreaming: false,
    });

    vi.mocked(useQuery).mockReturnValue({
      data: { skills: [mockSkill] },
      loading: false,
      error: undefined,
    } as never);

    render(
      <BrowserRouter>
        <SkillChatDialog />
      </BrowserRouter>
    );

    expect(screen.getByText('Chat about Test Skill')).toBeInTheDocument();
    expect(screen.getByText('Ask questions about this skill and its tools')).toBeInTheDocument();
  });

  it('should display empty state when no messages', () => {
    vi.mocked(uiStore.useSkillChatDialog).mockReturnValue({
      open: true,
      setOpen: mockSetOpen,
      selectedSkillId: 'skill-1',
      setSelectedSkillId: mockSetSelectedSkillId,
    });

    vi.mocked(useSkillChat).mockReturnValue({
      messages: [],
      sendMessage: mockSendMessage,
      clearMessages: mockClearMessages,
      isStreaming: false,
    });

    vi.mocked(useQuery).mockReturnValue({
      data: { skills: [mockSkill] },
      loading: false,
      error: undefined,
    } as never);

    render(
      <BrowserRouter>
        <SkillChatDialog />
      </BrowserRouter>
    );

    expect(screen.getByText('Start a conversation about this skill')).toBeInTheDocument();
  });

  it('should display messages when present', () => {
    const messages = [
      { role: 'user' as const, content: 'Hello, what can this skill do?' },
      { role: 'assistant' as const, content: 'This skill can help you with testing.' },
    ];

    vi.mocked(uiStore.useSkillChatDialog).mockReturnValue({
      open: true,
      setOpen: mockSetOpen,
      selectedSkillId: 'skill-1',
      setSelectedSkillId: mockSetSelectedSkillId,
    });

    vi.mocked(useSkillChat).mockReturnValue({
      messages,
      sendMessage: mockSendMessage,
      clearMessages: mockClearMessages,
      isStreaming: false,
    });

    vi.mocked(useQuery).mockReturnValue({
      data: { skills: [mockSkill] },
      loading: false,
      error: undefined,
    } as never);

    render(
      <BrowserRouter>
        <SkillChatDialog />
      </BrowserRouter>
    );

    expect(screen.getByText('Hello, what can this skill do?')).toBeInTheDocument();
    expect(screen.getByText('This skill can help you with testing.')).toBeInTheDocument();
  });

  it('should send message when send button clicked', async () => {
    vi.mocked(uiStore.useSkillChatDialog).mockReturnValue({
      open: true,
      setOpen: mockSetOpen,
      selectedSkillId: 'skill-1',
      setSelectedSkillId: mockSetSelectedSkillId,
    });

    vi.mocked(useSkillChat).mockReturnValue({
      messages: [],
      sendMessage: mockSendMessage,
      clearMessages: mockClearMessages,
      isStreaming: false,
    });

    vi.mocked(useQuery).mockReturnValue({
      data: { skills: [mockSkill] },
      loading: false,
      error: undefined,
    } as never);

    render(
      <BrowserRouter>
        <SkillChatDialog />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText('Ask about this skill...');
    const sendButton = screen.getByRole('button', { name: 'Send message' });

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('Test message');
    });
  });

  it('should send message when Enter key pressed', async () => {
    vi.mocked(uiStore.useSkillChatDialog).mockReturnValue({
      open: true,
      setOpen: mockSetOpen,
      selectedSkillId: 'skill-1',
      setSelectedSkillId: mockSetSelectedSkillId,
    });

    vi.mocked(useSkillChat).mockReturnValue({
      messages: [],
      sendMessage: mockSendMessage,
      clearMessages: mockClearMessages,
      isStreaming: false,
    });

    vi.mocked(useQuery).mockReturnValue({
      data: { skills: [mockSkill] },
      loading: false,
      error: undefined,
    } as never);

    render(
      <BrowserRouter>
        <SkillChatDialog />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText('Ask about this skill...');

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('Test message');
    });
  });

  it('should disable input and send button when streaming', () => {
    vi.mocked(uiStore.useSkillChatDialog).mockReturnValue({
      open: true,
      setOpen: mockSetOpen,
      selectedSkillId: 'skill-1',
      setSelectedSkillId: mockSetSelectedSkillId,
    });

    vi.mocked(useSkillChat).mockReturnValue({
      messages: [],
      sendMessage: mockSendMessage,
      clearMessages: mockClearMessages,
      isStreaming: true,
    });

    vi.mocked(useQuery).mockReturnValue({
      data: { skills: [mockSkill] },
      loading: false,
      error: undefined,
    } as never);

    render(
      <BrowserRouter>
        <SkillChatDialog />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText('Ask about this skill...');
    expect(input).toBeDisabled();
  });

  it('should clear messages when dialog closes', async () => {
    vi.mocked(uiStore.useSkillChatDialog).mockReturnValue({
      open: true,
      setOpen: mockSetOpen,
      selectedSkillId: 'skill-1',
      setSelectedSkillId: mockSetSelectedSkillId,
    });

    vi.mocked(useSkillChat).mockReturnValue({
      messages: [{ role: 'user', content: 'Test' }],
      sendMessage: mockSendMessage,
      clearMessages: mockClearMessages,
      isStreaming: false,
    });

    vi.mocked(useQuery).mockReturnValue({
      data: { skills: [mockSkill] },
      loading: false,
      error: undefined,
    } as never);

    render(
      <BrowserRouter>
        <SkillChatDialog />
      </BrowserRouter>
    );

    // Click close button
    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);

    // Verify setOpen was called
    expect(mockSetOpen).toHaveBeenCalledWith(false);

    // Wait for cleanup to complete (300ms timeout in component)
    await waitFor(
      () => {
        expect(mockClearMessages).toHaveBeenCalled();
        expect(mockSetSelectedSkillId).toHaveBeenCalledWith(null);
      },
      { timeout: 500 }
    );
  });
});
