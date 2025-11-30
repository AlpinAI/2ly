import { useState, useEffect, useRef } from 'react';
import { Send, Wrench, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/mocks/types';

interface EmbeddedChatMockProps {
  messages: ChatMessage[];
  capabilityName: string;
  onBack: () => void;
}

export function EmbeddedChatMock({
  messages,
  capabilityName,
  onBack,
}: EmbeddedChatMockProps) {
  const [displayedMessages, setDisplayedMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [autoPlayIndex, setAutoPlayIndex] = useState(0);

  // Auto-play messages one by one
  useEffect(() => {
    if (autoPlayIndex < messages.length) {
      const timer = setTimeout(() => {
        setDisplayedMessages((prev) => [...prev, messages[autoPlayIndex]]);
        setAutoPlayIndex((prev) => prev + 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoPlayIndex, messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedMessages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">
          {capabilityName} - Live Demo
        </h2>
        <p className="text-muted-foreground text-lg">
          Watch how AI interacts with your tools in real-time
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Chat Container */}
        <div className="rounded-lg border bg-card shadow-lg overflow-hidden">
          {/* Chat Header */}
          <div className="border-b bg-muted/30 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-card-foreground">
                  AI Assistant
                </h3>
                <p className="text-xs text-muted-foreground">
                  Connected to {capabilityName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-background/50">
            {displayedMessages.map((message) => (
              <div key={message.id}>
                <div
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground flex-shrink-0">
                      AI
                    </div>
                  )}

                  <div
                    className={cn(
                      'max-w-[70%] rounded-lg px-4 py-3',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-card-foreground'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={cn(
                        'text-xs mt-1',
                        message.role === 'user'
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      )}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>

                  {message.role === 'user' && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground flex-shrink-0">
                      You
                    </div>
                  )}
                </div>

                {/* Tool Calls */}
                {message.toolCalls && message.toolCalls.length > 0 && (
                  <div
                    className={cn(
                      'flex gap-3 mt-2',
                      message.role === 'user' ? 'justify-end' : 'justify-start ml-11'
                    )}
                  >
                    <div className="max-w-[70%] space-y-2">
                      {message.toolCalls.map((toolCall, toolIndex) => (
                        <div
                          key={toolIndex}
                          className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2"
                        >
                          <Wrench className="h-4 w-4 text-primary" />
                          <span className="text-sm font-mono text-card-foreground">
                            {toolCall.toolName}
                          </span>
                          {toolCall.status === 'success' && (
                            <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t bg-muted/30 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type a message... (demo only)"
                disabled
                className="flex-1 rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <Button disabled size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              This is a demonstration with pre-loaded messages
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-6 rounded-lg bg-primary/5 border border-primary/20 p-4">
          <p className="text-sm text-foreground">
            <span className="font-semibold">What you are seeing:</span> This chat
            demonstrates how your AI assistant uses the configured tools to answer
            questions and complete tasks. In production, you will connect your own AI
            agent (Claude Desktop, Cline, etc.) to interact with real data.
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <Button onClick={onBack} variant="outline" size="lg">
          Back to Options
        </Button>
      </div>
    </div>
  );
}
