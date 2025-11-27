/**
 * ToolCallDetail Component
 *
 * Displays detailed information about a selected tool call
 */

import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ToolCallStatus, GetToolCallsQuery } from '@/graphql/generated/graphql';
import { cn } from '@/lib/utils';
import { estimateTokens, formatTokenCountExact } from '@/utils/tokenEstimation';

// Derive ToolCall type from the actual GraphQL query result
type ToolCall = GetToolCallsQuery['toolCalls']['toolCalls'][number];

interface ToolCallDetailProps {
  toolCall: ToolCall;
}

export function ToolCallDetail({ toolCall }: ToolCallDetailProps) {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  // Format date helper
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  // Calculate duration helper
  const calculateDuration = (calledAt: Date, completedAt: Date | null) => {
    if (!completedAt) return null;
    return Math.round(new Date(completedAt).getTime() - new Date(calledAt).getTime());
  };

  // Status icon helper
  const getStatusIcon = (status: ToolCallStatus) => {
    switch (status) {
      case ToolCallStatus.Completed:
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case ToolCallStatus.Failed:
        return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case ToolCallStatus.Pending:
        return <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Status Badge */}
      <div className="flex items-center gap-3">
        {getStatusIcon(toolCall.status)}
        <span
          className={cn(
            'px-3 py-1 rounded-full text-sm font-medium',
            toolCall.status === ToolCallStatus.Completed &&
              'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
            toolCall.status === ToolCallStatus.Failed &&
              'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
            toolCall.status === ToolCallStatus.Pending &&
              'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
          )}
        >
          {toolCall.status}
        </span>
      </div>

      {/* Tool Info */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          <Link
            to={`/w/${workspaceId}/tools?id=${toolCall.mcpTool.id}`}
            className="hover:text-cyan-600 dark:hover:text-cyan-400 hover:underline"
          >
            {toolCall.mcpTool.name}
          </Link>
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Server:{' '}
          <Link
            to={`/w/${workspaceId}/sources?id=${toolCall.mcpTool.mcpServer.id}`}
            className="hover:text-cyan-600 dark:hover:text-cyan-400 hover:underline"
          >
            {toolCall.mcpTool.mcpServer.name}
          </Link>
        </p>
      </div>

      {/* Runtime Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Called By</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {toolCall.isTest ? 'Test' : ''} {toolCall.calledBy?.name}
          </p>
        </div>
        {(toolCall.executedByAgent || toolCall.executedBy) && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Executed By</p>
            {toolCall.executedByAgent ? (
              <p className="text-sm font-medium text-gray-900 dark:text-white">Agent's runtime</p>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {toolCall.executedBy!.name}
                </p>
                {toolCall.executedBy!.hostname && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{toolCall.executedBy!.hostname}</p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Timing Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Called At</p>
          <p className="text-sm text-gray-900 dark:text-white">{formatDate(toolCall.calledAt)}</p>
        </div>
        {toolCall.completedAt && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Duration</p>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {calculateDuration(toolCall.calledAt, toolCall.completedAt)}ms
            </p>
          </div>
        )}
      </div>

      {/* Token Usage */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Input Tokens</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {formatTokenCountExact(estimateTokens(toolCall.toolInput))}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Output Tokens</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {formatTokenCountExact(estimateTokens(toolCall.toolOutput))}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Tokens</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {formatTokenCountExact(estimateTokens(toolCall.toolInput) + estimateTokens(toolCall.toolOutput))}
          </p>
        </div>
      </div>

      {/* Input */}
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Input</p>
        <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto max-h-40">
          <code>{(() => {
            try {
              return JSON.stringify(JSON.parse(toolCall.toolInput), null, 2);
            } catch {
              return toolCall.toolInput;
            }
          })()}</code>
        </pre>
      </div>

      {/* Output or Error */}
      {toolCall.status === ToolCallStatus.Failed && toolCall.error ? (
        <div>
          <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">Error</p>
          <pre className="text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded border border-red-200 dark:border-red-800 overflow-x-auto max-h-40">
            <code>{toolCall.error}</code>
          </pre>
        </div>
      ) : toolCall.toolOutput ? (
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Output</p>
          <pre className="text-xs bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800 overflow-x-auto max-h-40">
            <code>{toolCall.toolOutput}</code>
          </pre>
        </div>
      ) : null}
    </div>
  );
}
