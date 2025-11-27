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
 * - Disables testing for tools that run on AGENT mode (not currently supported)
 * - Validation before submission
 * - Display formatted output (JSON/text)
 *
 * USAGE:
 * ```tsx
 * <ToolTester toolId="tool-123" toolName="search" inputSchema={schema} runOn="TOOLSET" />
 * ```
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { useMutation } from '@apollo/client/react';
import { Play, Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CallMcpToolDocument, McpServerRunOn } from '@/graphql/generated/graphql';
import { SchemaInput } from './schema-input';
import { parseJSONSchema, convertValueToType, validateSchemaValue } from '@/lib/jsonSchemaHelpers';

export interface ToolTesterProps {
  toolId: string;
  toolName: string;
  inputSchema: string;
  runOn?: McpServerRunOn | null;
}

interface ToolInput {
  [key: string]: unknown;
}

export function ToolTester({ toolId, inputSchema, runOn }: ToolTesterProps) {
  const [inputValues, setInputValues] = useState<ToolInput>({});
  const [executionResult, setExecutionResult] = useState<{
    success: boolean;
    result?: string;
    error?: string;
  } | null>(null);
  const resultSectionRef = useRef<HTMLDivElement>(null);

  // Check if tool runs on AGENT (testing not supported)
  const isAgentTool = runOn === McpServerRunOn.Agent;

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
      }).catch((err) => {
        // Apollo mutation error - handle it here to access error details
        console.error('Apollo mutation error caught:', err);

        let errorMessage = 'An unexpected error occurred';

        // Extract GraphQL error messages
        if (err.graphQLErrors && Array.isArray(err.graphQLErrors) && err.graphQLErrors.length > 0) {
          errorMessage = err.graphQLErrors.map((e: { message: string }) => e.message).join('\n');
        } else if (err.message) {
          errorMessage = err.message;
        }

        setExecutionResult({
          success: false,
          error: errorMessage,
        });

        // Return a signal object instead of null
        return { __handled: true };
      });

      // If error was handled in catch above
      if (response && '__handled' in response) {
        return;
      }

      // Check for GraphQL errors in response - both singular 'error' and plural 'errors'
      const responseError = response.error;
      if (responseError) {
        console.log('GraphQL error found in response:', responseError);
        // Extract message from error object
        const errorMessage = responseError.message || responseError.toString() || 'An error occurred';
        setExecutionResult({
          success: false,
          error: errorMessage,
        });
        return;
      }


      // Check if we have data
      if (!response || !response.data) {
        console.warn('No data in response:', response);
        setExecutionResult({
          success: false,
          error: 'No response data received from server',
        });
        return;
      }

      if (response.data.callMCPTool) {
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
            error: result || 'Tool execution failed',
          });
        }
      } else {
        console.warn('No callMCPTool in response.data:', response.data);
        setExecutionResult({
          success: false,
          error: 'No response data received from server',
        });
      }
    } catch (error) {
      // Catch any unexpected errors that weren't handled above
      console.error('Unexpected error calling tool:', error);

      let errorMessage = 'An unexpected error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      setExecutionResult({
        success: false,
        error: errorMessage,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Test Tool</h4>
        <Button
          onClick={handleTest}
          disabled={isExecuting || isAgentTool}
          size="sm"
          className="gap-2"
        >
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

      {/* Info message for AGENT tools */}
      {isAgentTool && (
        <div className="flex items-start gap-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>Testing is not currently supported for tools running on agent mode.</p>
        </div>
      )}

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
