/**
 * ToolTester Component
 *
 * WHY: Allows testing MCP tools with input generation and output display.
 * Inspired by PlaygroundPage testing functionality.
 *
 * FEATURES:
 * - Parse inputSchema JSON to generate form fields
 * - Execute tool with callMCPTool mutation
 * - Show loading/success/error states
 * - Display formatted output (JSON/text)
 *
 * USAGE:
 * ```tsx
 * <ToolTester toolId="tool-123" inputSchema={schema} />
 * ```
 */

import { useState, useMemo } from 'react';
import { useMutation } from '@apollo/client/react';
import { Play, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CallMcpToolDocument } from '@/graphql/generated/graphql';

export interface ToolTesterProps {
  toolId: string;
  toolName: string;
  inputSchema: string;
}

interface ToolInput {
  [key: string]: unknown;
}

export function ToolTester({ toolId, inputSchema }: ToolTesterProps) {
  const [inputValues, setInputValues] = useState<ToolInput>({});
  const [executionResult, setExecutionResult] = useState<{
    success: boolean;
    result?: string;
    error?: string;
  } | null>(null);

  const [callTool, { loading: isExecuting }] = useMutation(CallMcpToolDocument);

  // Parse inputSchema to extract properties
  const inputProperties = useMemo(() => {
    try {
      const schema = JSON.parse(inputSchema);
      const properties = schema.properties || {};
      const required = schema.required || [];

      return Object.entries(properties).map(([key, prop]) => {
        const propObj = prop as Record<string, unknown>;
        return {
          name: key,
          type: (propObj.type as string) || 'string',
          description: (propObj.description as string) || '',
          required: required.includes(key),
          default: propObj.default,
        };
      });
    } catch {
      return [];
    }
  }, [inputSchema]);

  const handleInputChange = (name: string, value: string) => {
    setInputValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleTest = async () => {
    setExecutionResult(null);

    try {
      const response = await callTool({
        variables: {
          toolId,
          input: JSON.stringify(inputValues),
        },
      });

      if (response.data?.callMCPTool) {
        const { success, result } = response.data.callMCPTool;

        if (success) {
          // Try to parse result as JSON for pretty display
          let parsedResult = result;
          try {
            parsedResult = JSON.stringify(JSON.parse(result), null, 2);
          } catch {
            // Keep as is if not JSON
          }

          setExecutionResult({
            success: true,
            result: parsedResult,
          });
        } else {
          setExecutionResult({
            success: false,
            error: 'Tool execution failed',
          });
        }
      }
    } catch (error) {
      console.error('Error calling tool:', error);
      setExecutionResult({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Test Tool</h4>
        <Button onClick={handleTest} disabled={isExecuting} size="sm" className="gap-2">
          {isExecuting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Test
            </>
          )}
        </Button>
      </div>

      {/* Input Fields */}
      {inputProperties.length > 0 ? (
        <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Input Parameters</p>
          {inputProperties.map((prop) => (
            <div key={prop.name} className="space-y-1">
              <Label htmlFor={prop.name} className="text-xs">
                {prop.name}
                {prop.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {prop.description && <p className="text-xs text-gray-500 dark:text-gray-400">{prop.description}</p>}
              <Input
                id={prop.name}
                type={prop.type === 'number' ? 'number' : 'text'}
                placeholder={prop.default ? `Default: ${prop.default}` : ''}
                value={(inputValues[prop.name] as string) || ''}
                onChange={(e) => handleInputChange(prop.name, e.target.value)}
                className="text-sm"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
          This tool does not require any input parameters.
        </div>
      )}

      {/* Execution Result */}
      {executionResult && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {executionResult.success ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Success</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">Error</span>
              </>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
            {executionResult.success ? (
              <pre className="text-xs font-mono text-gray-900 dark:text-gray-100 overflow-auto">
                {executionResult.result}
              </pre>
            ) : (
              <p className="text-sm text-red-600 dark:text-red-400">{executionResult.error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
