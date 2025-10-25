/**
 * ToolTester Component
 *
 * WHY: Allows testing MCP tools with schema-aware input generation and output display.
 * Uses SchemaInput for intelligent form rendering based on JSON Schema.
 *
 * FEATURES:
 * - Parse JSON Schema to generate appropriate form fields
 * - Schema-aware inputs (strings, numbers, booleans, enums, arrays, objects)
 * - Execute tool with callMCPTool mutation
 * - Validation before submission
 * - Display formatted output (JSON/text)
 *
 * USAGE:
 * ```tsx
 * <ToolTester toolId="tool-123" toolName="search" inputSchema={schema} />
 * ```
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { useMutation } from '@apollo/client/react';
import { Play, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CallMcpToolDocument } from '@/graphql/generated/graphql';
import { SchemaInput } from './schema-input';
import { parseJSONSchema, convertValueToType, validateSchemaValue } from '@/lib/jsonSchemaHelpers';

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
  const resultSectionRef = useRef<HTMLDivElement>(null);

  const [callTool, { loading: isExecuting }] = useMutation(CallMcpToolDocument);

  // Parse inputSchema using new helper
  const inputProperties = useMemo(() => {
    return parseJSONSchema(inputSchema);
  }, [inputSchema]);

  // Auto-scroll to result section when loading starts
  useEffect(() => {
    if (isExecuting) {
      // Use requestAnimationFrame to ensure DOM has updated with loading UI
      requestAnimationFrame(() => {
        resultSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  }, [isExecuting]);

  const handleInputChange = (name: string, value: unknown) => {
    setInputValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleTest = async () => {
    setExecutionResult(null);

    // Validate all inputs before submission
    const validationErrors: string[] = [];
    const processedInputs: ToolInput = {};

    for (const prop of inputProperties) {
      const value = inputValues[prop.name];

      // Validate
      const validation = validateSchemaValue(value, prop);
      if (!validation.valid) {
        validationErrors.push(`${prop.name}: ${validation.error}`);
        continue;
      }

      // Convert to proper type
      if (value !== undefined && value !== null) {
        processedInputs[prop.name] = convertValueToType(value, prop.type);
      }
    }

    // Show validation errors
    if (validationErrors.length > 0) {
      setExecutionResult({
        success: false,
        error: `Validation failed:\n${validationErrors.join('\n')}`,
      });
      return;
    }

    try {
      const response = await callTool({
        variables: {
          toolId,
          input: JSON.stringify(processedInputs),
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
            <SchemaInput
              key={prop.name}
              property={prop}
              value={inputValues[prop.name]}
              onChange={(value) => handleInputChange(prop.name, value)}
              className="space-y-1"
            />
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
          This tool does not require any input parameters.
        </div>
      )}

      {/* Execution Result */}
      <div ref={resultSectionRef} className="space-y-2">
        {isExecuting ? (
          <>
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400 animate-spin" />
              <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400">Testing tool...</span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
              </div>
            </div>
          </>
        ) : executionResult ? (
          <>
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
          </>
        ) : null}
      </div>
    </div>
  );
}
