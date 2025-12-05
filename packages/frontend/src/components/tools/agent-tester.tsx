/**
 * AgentTester Component
 *
 * WHY: Allows testing an agent by sending a message and viewing the response.
 * Since agents are "Agent as Tool", they are called with a simple message input.
 *
 * FEATURES:
 * - Single textarea for message input
 * - Test button to call the agent
 * - Display response or error
 * - Disable testing for agents running on AGENT execution target
 */

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { Play, Loader2, Info, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AutoGrowTextarea } from '@/components/ui/autogrow-textarea';
import { CallAgentDocument, ExecutionTarget } from '@/graphql/generated/graphql';

export interface AgentTesterProps {
  agentId: string;
  agentName: string;
  executionTarget?: ExecutionTarget | null;
}

interface TestResult {
  success: boolean;
  response?: string;
  error?: string;
}

export function AgentTester({ agentId, agentName, executionTarget }: AgentTesterProps) {
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<TestResult | null>(null);

  const [callAgent, { loading }] = useMutation(CallAgentDocument);

  const isAgentMode = executionTarget === ExecutionTarget.Agent;
  const canTest = !isAgentMode && message.trim().length > 0;

  const handleTest = async () => {
    if (!canTest) return;

    setResult(null);

    try {
      const response = await callAgent({
        variables: {
          agentId,
          userMessages: [message.trim()],
        },
      });

      setResult({
        success: true,
        response: response.data?.callAgent || 'No response received',
      });
    } catch (error) {
      console.error('Error calling agent:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey && canTest && !loading) {
      e.preventDefault();
      handleTest();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Test Agent
        </h4>
        <Button
          size="sm"
          onClick={handleTest}
          disabled={loading || !canTest}
          className="h-7 px-3 text-xs gap-1"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Play className="h-3 w-3" />
          )}
          Test
        </Button>
      </div>

      {/* Agent mode warning */}
      {isAgentMode && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Testing is not available for agents running on Agent Side. Select an Edge runtime to enable testing.
          </p>
        </div>
      )}

      {/* Message input */}
      <AutoGrowTextarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isAgentMode ? 'Testing disabled for Agent Side execution' : 'Enter a message to test the agent...'}
        className="font-mono text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded"
        minRows={3}
        maxRows={10}
        disabled={isAgentMode}
      />

      {/* Keyboard shortcut hint */}
      {!isAgentMode && message.trim().length > 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Cmd</kbd> +{' '}
          <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Enter</kbd> to test
        </p>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Calling {agentName}...
          </p>
        </div>
      )}

      {/* Result display */}
      {result && !loading && (
        <div
          className={`p-3 rounded-lg border ${
            result.success
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}
        >
          <div className="flex items-start gap-2">
            {result.success ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium mb-1 ${
                result.success
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {result.success ? 'Response' : 'Error'}
              </p>
              <pre className={`text-sm whitespace-pre-wrap font-mono ${
                result.success
                  ? 'text-green-800 dark:text-green-200'
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {result.success ? result.response : result.error}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
