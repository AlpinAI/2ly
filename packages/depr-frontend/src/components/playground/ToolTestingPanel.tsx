import { useState, useEffect } from 'react';
import { Play, AlertCircle, CheckCircle2, Loader2, Server, Info } from 'lucide-react';
import { apolloResolversTypes } from '@2ly/common';
import Button from '../ui/Button';
import { JsonSchemaForm } from './JsonSchemaForm';
import CodeBox from '../ui/CodeBox';

interface ToolTestingPanelProps {
  tool: apolloResolversTypes.McpTool | null;
  server: { id: string; name: string; description: string; runOn?: 'GLOBAL' | 'AGENT' | 'EDGE' | null } | null;
  onCallTool: (toolId: string, input: Record<string, unknown>) => Promise<void>;
  isExecuting: boolean;
  executionResult: {
    success: boolean;
    result?: unknown;
    error?: string;
  } | null;
}

/**
 * Right panel component for testing the selected tool
 * Shows tool details, dynamic form based on input schema, and execution results
 */
export function ToolTestingPanel({
  tool,
  server,
  onCallTool,
  isExecuting,
  executionResult,
}: ToolTestingPanelProps): JSX.Element {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [inputSchema, setInputSchema] = useState<Record<string, unknown> | null>(null);

  // Parse input schema when tool changes
  useEffect(() => {
    if (tool?.inputSchema) {
      try {
        const parsed = JSON.parse(tool.inputSchema);
        setInputSchema(parsed);
      } catch (error) {
        console.error('Failed to parse input schema:', error);
        setInputSchema(null);
      }
    } else {
      setInputSchema(null);
    }
    setFormData({});
  }, [tool]);

  const isValidJsonSchema = (
    schema: Record<string, unknown> | null,
  ): schema is { type?: string; properties?: Record<string, unknown>; required?: string[] } => {
    return schema !== null && typeof schema === 'object';
  };

  const handleCallTool = async () => {
    if (!tool) return;
    await onCallTool(tool.id, formData);
  };

  if (!tool || !server) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="rounded-full bg-gray-100 p-4 mb-4">
          <Play className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tool Selected</h3>
        <p className="text-sm text-gray-500 max-w-md">
          Select a tool from the list to start testing its functionality
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tool Information Header - Fixed */}
      <div className="flex-shrink-0 mb-6 pb-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{tool.name}</h2>
        {tool.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{tool.description}</p>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Server className="h-3.5 w-3.5" />
          <span>{server.name}</span>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Input Form Section */}
        <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Input Parameters</h3>
        {inputSchema && isValidJsonSchema(inputSchema) ? (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <JsonSchemaForm
              schema={inputSchema as { type?: string; properties?: Record<string, never>; required?: string[] }}
              onChange={setFormData}
            />
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center text-sm text-gray-500">
            No input parameters required
          </div>
        )}
      </div>

      {/* Call Tool Button */}
      <div className="mb-6">
        <Button
          onClick={handleCallTool}
          disabled={isExecuting}
          isLoading={isExecuting}
          leftIcon={!isExecuting ? <Play className="h-4 w-4" /> : undefined}
          className="w-full"
          size="lg"
        >
          {isExecuting ? 'Executing Tool...' : 'Call Tool'}
        </Button>

        {/* Agent-side execution notice */}
        {server?.runOn === 'AGENT' && (
          <div className="mt-3 flex items-start gap-2 rounded-md bg-blue-50 border border-blue-200 p-3">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-900">
              This server is configured to run on the agent side. The tool will be executed from your workspace's default testing runtime.
            </p>
          </div>
        )}
      </div>

        {/* Execution Result Section */}
        <div className="mb-6">
          {executionResult && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                {executionResult.success ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <h3 className="text-sm font-semibold text-green-900">Execution Successful</h3>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h3 className="text-sm font-semibold text-red-900">Execution Failed</h3>
                  </>
                )}
              </div>

              <div>
                {executionResult.success ? (
                  <CodeBox
                    code={JSON.stringify(executionResult.result, null, 2)}
                    language="json"
                  />
                ) : (
                  <div className="bg-red-50 rounded-lg border border-red-200 p-4">
                    <p className="text-sm font-medium text-red-900 mb-1">Error:</p>
                    <p className="text-sm text-red-700">{executionResult.error || 'Unknown error occurred'}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Executing State */}
          {isExecuting && !executionResult && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-primary-600 animate-spin mb-4" />
              <p className="text-sm text-gray-600">Executing tool...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}