import { useState } from 'react';
import { Package, Plus, X, ArrowRight, Sparkles, Boxes } from 'lucide-react';
import { Button } from './ui/button';
import type { MockToolSet, MockMCPTool } from '@/mocks/types';
import { allAvailableTools } from '@/mocks/tools';

interface ToolsetPreviewProps {
  toolset: MockToolSet;
  onNext: () => void;
  onBack: () => void;
}

export function ToolsetPreview({ toolset, onNext, onBack }: ToolsetPreviewProps) {
  const [selectedTools, setSelectedTools] = useState<MockMCPTool[]>(toolset.mcpTools);
  const [showToolPicker, setShowToolPicker] = useState(false);

  const addTool = (tool: MockMCPTool) => {
    if (!selectedTools.find(t => t.id === tool.id)) {
      setSelectedTools([...selectedTools, tool]);
    }
  };

  const removeTool = (toolId: string) => {
    setSelectedTools(selectedTools.filter(t => t.id !== toolId));
  };

  const availableToAdd = allAvailableTools.filter(
    tool => !selectedTools.find(t => t.id === tool.id)
  );

  // Categorize tools by type for composition view
  const categorizedTools = {
    input: selectedTools.filter(t => t.category === 'input'),
    processing: selectedTools.filter(t => t.category === 'processing'),
    output: selectedTools.filter(t => t.category === 'output'),
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Boxes className="h-8 w-8 text-primary" />
          <h2 className="text-3xl font-bold text-foreground">Compose Your Toolset</h2>
        </div>
        <p className="text-muted-foreground text-lg">
          Mix and match tools to create powerful workflows
        </p>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Toolset Header with Composition Stats */}
        <div className="rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Package className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-card-foreground">
                {toolset.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {toolset.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {selectedTools.length} tools composed
                </span>
                {categorizedTools.input.length > 0 && (
                  <span className="inline-flex items-center rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-medium text-blue-600">
                    {categorizedTools.input.length} Input
                  </span>
                )}
                {categorizedTools.processing.length > 0 && (
                  <span className="inline-flex items-center rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1 text-xs font-medium text-purple-600">
                    {categorizedTools.processing.length} Processing
                  </span>
                )}
                {categorizedTools.output.length > 0 && (
                  <span className="inline-flex items-center rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1 text-xs font-medium text-green-600">
                    {categorizedTools.output.length} Output
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Composition Flow Visualization */}
        <div className="rounded-lg border bg-card p-6">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            Tool Composition Flow
          </h4>
          <div className="grid grid-cols-3 gap-4">
            {/* Input Stage */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                Input
              </div>
              {categorizedTools.input.length > 0 ? (
                categorizedTools.input.map(tool => (
                  <div key={tool.id} className="rounded-md border border-blue-500/20 bg-blue-500/5 p-2">
                    <div className="font-mono text-xs font-medium text-card-foreground">
                      {tool.name}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-dashed border-muted p-2 text-xs text-muted-foreground">
                  No input tools
                </div>
              )}
            </div>

            {/* Processing Stage */}
            <div className="space-y-2 relative">
              {categorizedTools.input.length > 0 && categorizedTools.processing.length > 0 && (
                <div className="absolute -left-4 top-8 text-muted-foreground">
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
              <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                Processing
              </div>
              {categorizedTools.processing.length > 0 ? (
                categorizedTools.processing.map(tool => (
                  <div key={tool.id} className="rounded-md border border-purple-500/20 bg-purple-500/5 p-2">
                    <div className="font-mono text-xs font-medium text-card-foreground">
                      {tool.name}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-dashed border-muted p-2 text-xs text-muted-foreground">
                  No processing tools
                </div>
              )}
            </div>

            {/* Output Stage */}
            <div className="space-y-2 relative">
              {categorizedTools.processing.length > 0 && categorizedTools.output.length > 0 && (
                <div className="absolute -left-4 top-8 text-muted-foreground">
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
              <div className="text-xs font-semibold text-green-600 uppercase tracking-wide flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                Output
              </div>
              {categorizedTools.output.length > 0 ? (
                categorizedTools.output.map(tool => (
                  <div key={tool.id} className="rounded-md border border-green-500/20 bg-green-500/5 p-2">
                    <div className="font-mono text-xs font-medium text-card-foreground">
                      {tool.name}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-dashed border-muted p-2 text-xs text-muted-foreground">
                  No output tools
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Tool List with Add/Remove */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Building Blocks ({selectedTools.length} selected)
            </h4>
            <Button
              onClick={() => setShowToolPicker(!showToolPicker)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add More Tools
            </Button>
          </div>

          {/* Tool Picker Modal */}
          {showToolPicker && availableToAdd.length > 0 && (
            <div className="rounded-lg border-2 border-primary bg-primary/5 p-4 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-sm font-semibold text-foreground">Available Tools to Add</h5>
                <button
                  onClick={() => setShowToolPicker(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {availableToAdd.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => addTool(tool)}
                    className="text-left rounded-md border bg-card p-3 hover:bg-accent transition-colors"
                  >
                    <div className="font-mono text-xs font-medium text-card-foreground">
                      {tool.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {tool.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected Tools Grid */}
          <div className="grid grid-cols-2 gap-3">
            {selectedTools.map((tool) => (
              <div
                key={tool.id}
                className="group relative rounded-lg border bg-card p-4 transition-all hover:shadow-md hover:border-primary/50"
              >
                <button
                  onClick={() => removeTool(tool.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-full p-1"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="flex items-start gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded ${
                    tool.category === 'input' ? 'bg-blue-500/10 text-blue-600' :
                    tool.category === 'processing' ? 'bg-purple-500/10 text-purple-600' :
                    'bg-green-500/10 text-green-600'
                  }`}>
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="font-mono font-medium text-sm text-card-foreground">
                        {tool.name}
                      </h5>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tool.mcpServerName}
                    </p>
                    {tool.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {tool.description}
                      </p>
                    )}
                    {tool.inputSchema.required && tool.inputSchema.required.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {tool.inputSchema.required.slice(0, 3).map((param) => (
                          <span
                            key={param}
                            className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground"
                          >
                            {param}
                          </span>
                        ))}
                        {tool.inputSchema.required.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{tool.inputSchema.required.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Composability Info Box */}
        <div className="rounded-lg bg-gradient-to-r from-primary/10 via-purple-500/10 to-green-500/10 border-2 border-primary/20 p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">
                The Power of Composition
              </p>
              <p className="text-sm text-muted-foreground">
                These tools work together seamlessly. Input tools gather data, processing tools transform it,
                and output tools deliver results. Add or remove tools to create custom workflows that match
                your exact needs. Every toolset is unique and composable.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline" size="lg">
          Back
        </Button>
        <Button onClick={onNext} size="lg" disabled={selectedTools.length === 0}>
          Continue with {selectedTools.length} {selectedTools.length === 1 ? 'Tool' : 'Tools'}
        </Button>
      </div>
    </div>
  );
}
