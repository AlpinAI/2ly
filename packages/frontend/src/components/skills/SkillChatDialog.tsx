/**
 * SkillChatDialog Component
 *
 * WHY: Provides a chat interface for users to interact with an LLM about a selected skill.
 * The LLM has full context about the skill's configuration and tools.
 *
 * FEATURES:
 * - Ephemeral chat (cleared when dialog closes)
 * - Conversation history with user and assistant messages
 * - Auto-scrolling to latest message
 * - Input field with send button
 * - Uses default AI provider from workspace
 *
 * USAGE:
 * ```tsx
 * const { setOpen, setSelectedSkillId } = useSkillChatDialog();
 *
 * // Open dialog for a skill
 * setSelectedSkillId(skillId);
 * setOpen(true);
 * ```
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSkillChatDialog } from '@/stores/uiStore';
import { useParams } from 'react-router-dom';
import { useSkillChat } from '@/hooks/useSkillChat';
import { useQuery } from '@apollo/client/react';
import { SubscribeSkillsDocument } from '@/graphql/generated/graphql';

export function SkillChatDialog() {
  const { open, setOpen, selectedSkillId, setSelectedSkillId } = useSkillChatDialog();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get skill data
  const { data: skillsData } = useQuery(SubscribeSkillsDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId || !selectedSkillId,
  });

  const skill = skillsData?.skills?.find((s) => s.id === selectedSkillId);

  // Chat hook
  const { messages, sendMessage, clearMessages, isStreaming } = useSkillChat(
    workspaceId || '',
    selectedSkillId || '',
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle dialog close
  const handleClose = useCallback(() => {
    setOpen(false);
    // Clear messages and reset state after animation
    setTimeout(() => {
      clearMessages();
      setInputValue('');
      setSelectedSkillId(null);
    }, 300);
  }, [setOpen, clearMessages, setSelectedSkillId]);

  // Handle open change from Radix
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        handleClose();
      }
    },
    [handleClose],
  );

  // Handle send message
  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming) return;

    const message = inputValue.trim();
    setInputValue('');
    await sendMessage(message);
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!selectedSkillId || !workspaceId) return null;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-2xl translate-x-[-50%] translate-y-[-50%] rounded-lg border border-gray-200 bg-white shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] dark:border-gray-700 dark:bg-gray-800 z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex-shrink-0">
                  <MessageSquare className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    Chat about {skill?.name || 'Skill'}
                  </Dialog.Title>
                  <Dialog.Description className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    Ask questions about this skill and its tools
                  </Dialog.Description>
                </div>
              </div>

              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0" aria-label="Close">
                  <X className="h-5 w-5" />
                </Button>
              </Dialog.Close>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Start a conversation about this skill</p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-cyan-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isStreaming && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex gap-2">
              <Input
                placeholder="Ask about this skill..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
                className="flex-1"
                autoFocus
              />
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || isStreaming}
                size="icon"
                className="flex-shrink-0"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
