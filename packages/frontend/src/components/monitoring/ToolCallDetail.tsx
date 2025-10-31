/**
 * ToolCallDetail Component
 *
 * Displays detailed information about a selected tool call
 */

import { useState } from 'react';
import { AlertCircle, CheckCircle, Clock, Maximize2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ToolCallStatus } from '@/graphql/generated/graphql';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CodeViewerDialog } from '@/components/ui/code-viewer-dialog';

interface ToolCall {
  id: string;
  status: ToolCallStatus;
  calledAt: Date;
  completedAt: Date | null;
  toolInput: string;
  toolOutput: string | null;
  error: string | null;
  mcpTool: {
    id: string;
    name: string;
    description?: string;
    mcpServer: {
      id: string;
      name: string;
    };
  };
  calledBy: {
    id: string;
    name: string;
    hostname: string | null;
  };
  executedBy?: {
    id: string;
    name: string;
    hostname: string | null;
  } | null;
}

interface ToolCallDetailProps {
  toolCall: ToolCall;
}

export function ToolCallDetail({ toolCall }: ToolCallDetailProps) {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerContent, setViewerContent] = useState<{ title: string; content: string; language: 'json' | 'text' }>({ title: '', content: '', language: 'json' });

  // Format date helper
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  // Open viewer with content
  const openViewer = (title: string, content: string, language: 'json' | 'text' = 'json') => {
    setViewerContent({ title, content, language });
    setViewerOpen(true);
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
            {toolCall.calledBy.name}
          </p>
          {toolCall.calledBy.hostname && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{toolCall.calledBy.hostname}</p>
          )}
        </div>
        {toolCall.executedBy && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Executed By</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {toolCall.executedBy.name}
            </p>
            {toolCall.executedBy.hostname && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{toolCall.executedBy.hostname}</p>
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

      {/* Input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-900 dark:text-white">Input</p>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openViewer('Tool Input', toolCall.toolInput, 'json')}
            className="h-7 w-7 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
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
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">Error</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openViewer('Error', toolCall.error || '', 'text')}
              className="h-7 w-7 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
          <pre className="text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded border border-red-200 dark:border-red-800 overflow-x-auto max-h-40">
            <code>{toolCall.error}</code>
          </pre>
        </div>
      ) : toolCall.toolOutput ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Output</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openViewer('Tool Output', toolCall.toolOutput || '', 'json')}
              className="h-7 w-7 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
          <pre className="text-xs bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800 overflow-x-auto max-h-40">
            <code>{toolCall.toolOutput}</code>
          </pre>
        </div>
      ) : null}

      {/* Code Viewer Dialog */}
      <CodeViewerDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        title={viewerContent.title}
        content={viewerContent.content}
        language={viewerContent.language}
      />
    </div>
  );
}
