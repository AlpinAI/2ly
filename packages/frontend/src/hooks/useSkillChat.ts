/**
 * useSkillChat Hook
 *
 * Manages chat state and interactions for skill chat dialog.
 * Provides ephemeral conversation history and message handling.
 */

import { useState, useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { ChatWithSkillDocument, ChatMessageRole } from '@/graphql/generated/graphql';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export function useSkillChat(workspaceId: string, skillId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const [chatMutation] = useMutation(ChatWithSkillDocument);

  /**
   * Send a message and get AI response
   */
  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim() || isStreaming) return;

      // Add user message immediately
      const newUserMessage: ChatMessage = {
        role: 'user',
        content: userMessage.trim(),
      };

      setMessages((prev) => [...prev, newUserMessage]);
      setIsStreaming(true);

      try {
        // Build message history for context
        const messageHistory = [...messages, newUserMessage].map((msg) => ({
          role: msg.role.toUpperCase() as ChatMessageRole,
          content: msg.content,
        }));

        // Call GraphQL mutation
        const result = await chatMutation({
          variables: {
            workspaceId,
            skillId,
            messages: messageHistory,
          },
        });

        if (result.data?.chatWithSkill) {
          // Add assistant response
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: result.data.chatWithSkill,
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        // Add error message
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your message. Please try again.',
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsStreaming(false);
      }
    },
    [workspaceId, skillId, messages, isStreaming, chatMutation],
  );

  /**
   * Clear conversation history
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendMessage,
    clearMessages,
    isStreaming,
  };
}
