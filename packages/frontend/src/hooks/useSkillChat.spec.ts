/**
 * Tests for useSkillChat hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSkillChat } from './useSkillChat';
import { useMutation } from '@apollo/client/react';
import { ChatMessageRole } from '@/graphql/generated/graphql';

// Mock Apollo Client
vi.mock('@apollo/client/react', () => ({
  useMutation: vi.fn(),
}));

describe('useSkillChat', () => {
  const mockChatMutation = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useMutation).mockReturnValue([
      mockChatMutation,
      { loading: false, error: undefined, data: undefined },
    ] as never);
  });

  it('should initialize with empty messages', () => {
    const { result } = renderHook(() => useSkillChat('workspace-1', 'skill-1'));

    expect(result.current.messages).toEqual([]);
    expect(result.current.isStreaming).toBe(false);
  });

  it('should add user message and call mutation on sendMessage', async () => {
    mockChatMutation.mockResolvedValue({
      data: { chatWithSkill: 'Assistant response' },
    });

    const { result } = renderHook(() => useSkillChat('workspace-1', 'skill-1'));

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2);
    });

    expect(result.current.messages[0]).toEqual({
      role: 'user',
      content: 'Hello',
    });

    expect(result.current.messages[1]).toEqual({
      role: 'assistant',
      content: 'Assistant response',
    });

    expect(mockChatMutation).toHaveBeenCalledWith({
      variables: {
        workspaceId: 'workspace-1',
        skillId: 'skill-1',
        messages: [
          {
            role: ChatMessageRole.User,
            content: 'Hello',
          },
        ],
      },
    });
  });

  it('should maintain conversation history', async () => {
    mockChatMutation
      .mockResolvedValueOnce({
        data: { chatWithSkill: 'First response' },
      })
      .mockResolvedValueOnce({
        data: { chatWithSkill: 'Second response' },
      });

    const { result } = renderHook(() => useSkillChat('workspace-1', 'skill-1'));

    // First message
    await act(async () => {
      await result.current.sendMessage('First message');
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2);
    });

    // Second message
    await act(async () => {
      await result.current.sendMessage('Second message');
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(4);
    });

    expect(result.current.messages).toEqual([
      { role: 'user', content: 'First message' },
      { role: 'assistant', content: 'First response' },
      { role: 'user', content: 'Second message' },
      { role: 'assistant', content: 'Second response' },
    ]);

    // Check that second call includes full history
    expect(mockChatMutation).toHaveBeenNthCalledWith(2, {
      variables: {
        workspaceId: 'workspace-1',
        skillId: 'skill-1',
        messages: [
          { role: ChatMessageRole.User, content: 'First message' },
          { role: ChatMessageRole.Assistant, content: 'First response' },
          { role: ChatMessageRole.User, content: 'Second message' },
        ],
      },
    });
  });

  it('should handle mutation error gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockChatMutation.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useSkillChat('workspace-1', 'skill-1'));

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2);
    });

    expect(result.current.messages[0]).toEqual({
      role: 'user',
      content: 'Hello',
    });

    expect(result.current.messages[1].role).toBe('assistant');
    expect(result.current.messages[1].content).toContain('error');

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should trim whitespace from messages', async () => {
    mockChatMutation.mockResolvedValue({
      data: { chatWithSkill: 'Response' },
    });

    const { result } = renderHook(() => useSkillChat('workspace-1', 'skill-1'));

    await act(async () => {
      await result.current.sendMessage('  Hello  ');
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2);
    });

    expect(result.current.messages[0].content).toBe('Hello');
  });

  it('should not send empty messages', async () => {
    const { result } = renderHook(() => useSkillChat('workspace-1', 'skill-1'));

    await act(async () => {
      await result.current.sendMessage('');
    });

    expect(result.current.messages).toHaveLength(0);
    expect(mockChatMutation).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.sendMessage('   ');
    });

    expect(result.current.messages).toHaveLength(0);
    expect(mockChatMutation).not.toHaveBeenCalled();
  });

  it('should not send message when already streaming', async () => {
    mockChatMutation.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ data: { chatWithSkill: 'Response' } }), 100);
        })
    );

    const { result } = renderHook(() => useSkillChat('workspace-1', 'skill-1'));

    // Send first message
    act(() => {
      result.current.sendMessage('First');
    });

    // Try to send second message while first is processing
    await act(async () => {
      await result.current.sendMessage('Second');
    });

    // Wait for first message to complete
    await waitFor(
      () => {
        expect(result.current.isStreaming).toBe(false);
      },
      { timeout: 200 }
    );

    // Should only have called mutation once
    expect(mockChatMutation).toHaveBeenCalledTimes(1);
  });

  it('should set isStreaming to true during message processing', async () => {
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockChatMutation.mockReturnValue(promise);

    const { result } = renderHook(() => useSkillChat('workspace-1', 'skill-1'));

    expect(result.current.isStreaming).toBe(false);

    act(() => {
      result.current.sendMessage('Hello');
    });

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(true);
    });

    // Resolve the promise
    await act(async () => {
      resolvePromise!({ data: { chatWithSkill: 'Response' } });
    });

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(false);
    });
  });

  it('should clear all messages', () => {
    const { result } = renderHook(() => useSkillChat('workspace-1', 'skill-1'));

    // Manually set messages (simulating state after some conversation)
    act(() => {
      result.current.sendMessage('Test');
    });

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toEqual([]);
  });
});
