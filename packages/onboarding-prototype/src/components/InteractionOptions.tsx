import { MessageSquare, Code } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface InteractionOptionsProps {
  selectedOption: 'chat' | 'connect' | null;
  onSelect: (option: 'chat' | 'connect') => void;
  onBack: () => void;
}

export function InteractionOptions({
  selectedOption,
  onSelect,
  onBack,
}: InteractionOptionsProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">
          Choose Your Experience
        </h2>
        <p className="text-muted-foreground text-lg">
          Try the embedded chat or connect to your own AI agent
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-2">
        {/* Embedded Chat Option */}
        <button
          onClick={() => onSelect('chat')}
          className={cn(
            'relative rounded-lg border-2 p-8 text-left transition-all hover:shadow-lg',
            selectedOption === 'chat'
              ? 'border-primary bg-primary/5'
              : 'border-border bg-card hover:border-primary/50'
          )}
        >
          <div className="space-y-4">
            <div
              className={cn(
                'flex h-16 w-16 items-center justify-center rounded-lg',
                selectedOption === 'chat'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <MessageSquare className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-xl text-card-foreground">
                Try Embedded Chat
              </h3>
              <p className="text-sm text-muted-foreground">
                Experience a mock chat interface with pre-loaded conversation examples.
                See how tools are called in real-time.
              </p>
            </div>

            <div className="pt-2">
              <div className="inline-flex items-center rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600">
                Recommended for quick demo
              </div>
            </div>

            {selectedOption === 'chat' && (
              <div className="absolute top-6 right-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </button>

        {/* Connect Option */}
        <button
          onClick={() => onSelect('connect')}
          className={cn(
            'relative rounded-lg border-2 p-8 text-left transition-all hover:shadow-lg',
            selectedOption === 'connect'
              ? 'border-primary bg-primary/5'
              : 'border-border bg-card hover:border-primary/50'
          )}
        >
          <div className="space-y-4">
            <div
              className={cn(
                'flex h-16 w-16 items-center justify-center rounded-lg',
                selectedOption === 'connect'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <Code className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-xl text-card-foreground">
                Connection Instructions
              </h3>
              <p className="text-sm text-muted-foreground">
                Get instructions to connect your AI agent (Claude Desktop, Cline, etc.)
                to this toolset via MCP.
              </p>
            </div>

            <div className="pt-2">
              <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                For production use
              </div>
            </div>

            {selectedOption === 'connect' && (
              <div className="absolute top-6 right-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </button>
      </div>

      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline" size="lg">
          Back
        </Button>
      </div>
    </div>
  );
}
