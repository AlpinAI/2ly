import { Copy, Check, Terminal } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import type { MockToolSet } from '@/mocks/types';

interface ConnectionInstructionsProps {
  toolset: MockToolSet;
  onBack: () => void;
}

export function ConnectionInstructions({
  toolset,
  onBack,
}: ConnectionInstructionsProps) {
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);

  const configExample = {
    mcpServers: {
      '2ly': {
        command: 'npx',
        args: ['-y', '@2ly/runtime'],
        env: {
          TOOLSET_NAME: toolset.name,
          BACKEND_URL: 'http://localhost:3000',
        },
      },
    },
  };

  const configJson = JSON.stringify(configExample, null, 2);

  const copyToClipboard = async (text: string, type: 'config' | 'command') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'config') {
        setCopiedConfig(true);
        setTimeout(() => setCopiedConfig(false), 2000);
      } else {
        setCopiedCommand(true);
        setTimeout(() => setCopiedCommand(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">
          Connect Your AI Agent
        </h2>
        <p className="text-muted-foreground text-lg">
          Follow these steps to connect Claude Desktop, Cline, or any MCP-compatible agent
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Step 1 */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
              1
            </div>
            <h3 className="text-xl font-semibold text-card-foreground">
              Install 2ly Runtime
            </h3>
          </div>
          <p className="text-sm text-muted-foreground ml-11">
            The runtime connects your AI agent to the 2ly backend and provides access to your toolset.
          </p>
          <div className="ml-11">
            <div className="relative rounded-lg bg-muted p-4 font-mono text-sm">
              <div className="flex items-center justify-between gap-2">
                <code className="text-foreground">npm install -g @2ly/runtime</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard('npm install -g @2ly/runtime', 'command')}
                  className="flex-shrink-0"
                >
                  {copiedCommand ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
              2
            </div>
            <h3 className="text-xl font-semibold text-card-foreground">
              Configure Your MCP Client
            </h3>
          </div>
          <p className="text-sm text-muted-foreground ml-11">
            Add this configuration to your MCP client's config file:
          </p>
          <div className="ml-11 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Terminal className="h-4 w-4" />
              <span className="font-mono">~/.config/claude-desktop/config.json</span>
            </div>
            <div className="relative rounded-lg bg-muted p-4">
              <pre className="text-sm overflow-x-auto">
                <code className="text-foreground">{configJson}</code>
              </pre>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(configJson, 'config')}
                className="absolute top-2 right-2"
              >
                {copiedConfig ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
              3
            </div>
            <h3 className="text-xl font-semibold text-card-foreground">
              Restart Your AI Agent
            </h3>
          </div>
          <p className="text-sm text-muted-foreground ml-11">
            Close and reopen your MCP client (Claude Desktop, Cline, etc.) to load the new configuration.
          </p>
        </div>

        {/* Step 4 */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
              4
            </div>
            <h3 className="text-xl font-semibold text-card-foreground">
              Start Using Your Tools
            </h3>
          </div>
          <p className="text-sm text-muted-foreground ml-11">
            Your AI agent now has access to the <span className="font-semibold">{toolset.name}</span> toolset
            with {toolset.mcpTools.length} tools. Try asking it to:
          </p>
          <div className="ml-11 space-y-2">
            <div className="rounded-lg bg-muted/50 p-3 text-sm text-foreground">
              "What tools do you have available?"
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-sm text-foreground">
              {toolset.mcpTools[0]?.description || 'Use one of the available tools'}
            </div>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
          <h4 className="font-semibold text-foreground mb-2">Need Help?</h4>
          <p className="text-sm text-foreground">
            For more detailed instructions and troubleshooting, visit the{' '}
            <a href="#" className="text-primary hover:underline">
              2ly documentation
            </a>
            .
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
