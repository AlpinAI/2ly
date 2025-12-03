import { useState, useRef, useEffect } from 'react';
import { Bot, User, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import type { Capability } from '@/mocks/types';

interface SkillTryChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  capability: Capability;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Generate mock conversation based on skill's example tasks
const generateMockConversation = (capability: Capability): Message[] => {
  const skill = capability.skill;
  const exampleTask = skill.exampleTasks[0]; // Use first example task

  return [
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your ${skill.name} assistant. I can help you with tasks like:\n\n${skill.exampleTasks.map(task => `• ${task}`).join('\n')}\n\nWhat would you like me to do?`,
      timestamp: new Date(Date.now() - 60000),
    },
    {
      id: '2',
      role: 'user',
      content: exampleTask,
      timestamp: new Date(Date.now() - 45000),
    },
    {
      id: '3',
      role: 'assistant',
      content: `I'll help you with that. Let me use my tools to ${exampleTask.toLowerCase()}...\n\n✓ Connected to knowledge sources\n✓ Using ${skill.tools.length} specialized tools\n✓ Applying guardrails and best practices\n\nHere's what I found:\n\nBased on the data and using the configured tools, I've successfully completed your request. The results are optimized according to the scope and guardrails you've set up.`,
      timestamp: new Date(Date.now() - 30000),
    },
  ];
};

export function SkillTryChat({ open, onOpenChange, capability }: SkillTryChatProps) {
  const [messages, setMessages] = useState<Message[]>(() => generateMockConversation(capability));
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const skill = capability.skill;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim() || isTyping) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response after delay
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I understand you want to "${inputValue}". This is a demo conversation, so I'm showing you how I would respond using the ${skill.name} skill.\n\nIn a real scenario, I would:\n\n• Access the configured knowledge sources\n• Use the ${skill.tools.length} MCP tools you've set up\n• Follow the guardrails you've defined\n• Apply the scope guidelines\n\nThe actual implementation would provide real results based on your specific configuration and data sources.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[600px] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Try {skill.name} Skill
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            This is a demo conversation showing how your agent would interact using this skill
          </p>
        </DialogHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  message.role === 'user' ? 'bg-primary' : 'bg-muted'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="h-4 w-4 text-primary-foreground" />
                ) : (
                  <Bot className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div
                className={`flex flex-col gap-1 max-w-[80%] ${
                  message.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <Bot className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-muted px-4 py-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isTyping}
            />
            <Button onClick={handleSend} size="icon" disabled={!inputValue.trim() || isTyping}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            This is a simulated conversation. Actual results will depend on your configured tools and knowledge sources.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
