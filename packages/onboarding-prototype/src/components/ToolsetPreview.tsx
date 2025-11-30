import { Package, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import type { MockToolSet } from '@/mocks/types';

interface ToolsetPreviewProps {
  toolset: MockToolSet;
  onNext: () => void;
  onBack: () => void;
}

export function ToolsetPreview({ toolset, onNext, onBack }: ToolsetPreviewProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Your Toolset</h2>
        <p className="text-muted-foreground text-lg">
          Pre-configured MCP tools ready to use
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Toolset Header */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-card-foreground">
                {toolset.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {toolset.description}
              </p>
              <div className="mt-2">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {toolset.mcpTools.length} tools included
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tools List */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Available Tools
          </h4>
          <div className="space-y-2">
            {toolset.mcpTools.map((tool) => (
              <div
                key={tool.id}
                className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="font-mono font-medium text-sm text-card-foreground">
                        {tool.name}
                      </h5>
                      <span className="text-xs text-muted-foreground">
                        ({tool.mcpServerName})
                      </span>
                    </div>
                    {tool.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {tool.description}
                      </p>
                    )}
                    {tool.inputSchema.required && tool.inputSchema.required.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {tool.inputSchema.required.map((param) => (
                          <span
                            key={param}
                            className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground"
                          >
                            {param}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
          <p className="text-sm text-foreground">
            <span className="font-semibold">Note:</span> These tools are pre-configured
            and ready to use. You can add more tools or customize this toolset later.
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline" size="lg">
          Back
        </Button>
        <Button onClick={onNext} size="lg">
          Continue
        </Button>
      </div>
    </div>
  );
}
