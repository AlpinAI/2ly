/**
 * ToolDetail Component
 *
 * WHY: Displays detailed information about a selected MCP tool.
 * Used by Tools Page as the detail panel.
 *
 * DISPLAYS:
 * - Tool name and description
 * - Link to MCP Server
 * - Links to tool sets that contain this tool
 * - ToolTester component for testing
 */

import { ExternalLink, Wrench, Server, Settings, Plus, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation } from '@apollo/client/react';
import { ToolTester } from './tool-tester';
import { LinkToolSetDialog } from './link-toolset-dialog';
import { Button } from '@/components/ui/button';
import { useToolSets } from '@/hooks/useToolSets';
import { useNotification } from '@/contexts/NotificationContext';
import type { GetMcpToolsQuery } from '@/graphql/generated/graphql';
import { RemoveMcpToolFromToolSetDocument } from '@/graphql/generated/graphql';

type McpTool = NonNullable<NonNullable<GetMcpToolsQuery['mcpTools']>[number]>;

export interface ToolDetailProps {
  tool: McpTool;
}

export function ToolDetail({ tool }: ToolDetailProps) {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { toolSets } = useToolSets(workspaceId!);
  const { toast } = useNotification();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  // Mutations
  const [unlinkTool] = useMutation(RemoveMcpToolFromToolSetDocument);

  // Get toolsets not yet linked to this tool
  const unlinkedToolSets = useMemo(() => {
    const linkedToolSetIds = new Set(tool.toolSets?.map((ts) => ts.id) || []);
    return toolSets.filter((toolSet) => !linkedToolSetIds.has(toolSet.id));
  }, [toolSets, tool.toolSets]);

  // Handle unlinking tool from toolset
  const handleUnlinkTool = async (toolSetId: string) => {
    setLoadingStates((prev) => ({ ...prev, [toolSetId]: true }));

    try {
      await unlinkTool({
        variables: {
          mcpToolId: tool.id,
          toolSetId: toolSetId,
        },
      });

      toast({
        title: 'Tool unlinked successfully',
        description: 'Tool has been unlinked from the tool set.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error unlinking tool:', error);
      toast({
        title: 'Failed to unlink tool',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'error',
      });
    } finally {
      setLoadingStates((prev) => ({ ...prev, [toolSetId]: false }));
    }
  };

  return (
    <div className="flex flex-col h-full overflow-auto scroll-smooth">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
            <Wrench className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{tool.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-4">{tool.description}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        {/* Status */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Status</h4>
          <span
            className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${
              tool.status === 'ACTIVE'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
            }`}
          >
            {tool.status}
          </span>
        </div>

        {/* MCP Server */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            MCP Server
          </h4>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700">
            <Server className="h-4 w-4 text-gray-400" />
            <div className="flex-1 min-w-0">
              <Link
                to={`/w/${workspaceId}/sources?id=${tool.mcpServer.id}`}
                className="text-sm font-medium text-gray-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 hover:underline truncate block"
              >
                {tool.mcpServer.name}
              </Link>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{tool.mcpServer.description}</p>
            </div>
            {tool.mcpServer.repositoryUrl && (
              <a
                href={tool.mcpServer.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        {/* Tool Sets */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Available in Tool Sets ({tool.toolSets?.length || 0})
            </h4>
            <Button
              variant="ghost"
              size="sm"
              disabled={unlinkedToolSets.length === 0}
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={() => setLinkDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {tool.toolSets && tool.toolSets.length > 0 ? (
            <ul className="space-y-1">
              {tool.toolSets.map((toolSet) => (
                <li
                  key={toolSet.id}
                  className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700"
                >
                  <Settings className="h-4 w-4 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/w/${workspaceId}/toolsets?id=${toolSet.id}`}
                      className="text-sm font-medium text-gray-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 hover:underline truncate block"
                    >
                      {toolSet.name}
                    </Link>
                    {toolSet.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{toolSet.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    onClick={() => handleUnlinkTool(toolSet.id)}
                    disabled={loadingStates[toolSet.id]}
                  >
                    {loadingStates[toolSet.id] ? (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">Not available in any tool sets yet</p>
          )}
        </div>

        {/* Tool Tester */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <ToolTester toolId={tool.id} toolName={tool.name} inputSchema={tool.inputSchema} runOn={tool.mcpServer.runOn} />
        </div>
      </div>

      {/* Link ToolSet Dialog */}
      <LinkToolSetDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        tool={tool}
      />
    </div>
  );
}
