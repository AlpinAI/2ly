/**
 * ToolDetail Component
 *
 * WHY: Displays detailed information about a selected MCP tool.
 * Used by Tools Page as the detail panel.
 *
 * DISPLAYS:
 * - Tool name and description
 * - Link to MCP Server
 * - Links to agents that use this tool
 * - ToolTester component for testing
 */

import { ExternalLink, Wrench, Server, Bot, Plus, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useMutation } from '@apollo/client/react';
import { ToolTester } from './tool-tester';
import { LinkToolDialog } from './link-tool-dialog';
import { Button } from '@/components/ui/button';
import { useRuntimeData } from '@/stores/runtimeStore';
import { useNotification } from '@/contexts/NotificationContext';
import type { GetMcpToolsQuery } from '@/graphql/generated/graphql';
import { UnlinkMcpToolFromRuntimeDocument } from '@/graphql/generated/graphql';

type McpTool = NonNullable<NonNullable<GetMcpToolsQuery['mcpTools']>[number]>;

export interface ToolDetailProps {
  tool: McpTool;
}

export function ToolDetail({ tool }: ToolDetailProps) {
  const { runtimes } = useRuntimeData();
  const { toast } = useNotification();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  // Mutations
  const [unlinkTool] = useMutation(UnlinkMcpToolFromRuntimeDocument);

  // Get available agents (runtimes with 'agent' capability)
  const availableAgents = useMemo(() => {
    return runtimes.filter((runtime) => runtime.capabilities?.includes('agent'));
  }, [runtimes]);

  // Get agents not yet linked to this tool
  const unlinkedAgents = useMemo(() => {
    const linkedAgentIds = new Set(tool.runtimes?.map((r) => r.id) || []);
    return availableAgents.filter((agent) => !linkedAgentIds.has(agent.id));
  }, [availableAgents, tool.runtimes]);

  // Handle unlinking tool from agent
  const handleUnlinkTool = async (agentId: string) => {
    setLoadingStates((prev) => ({ ...prev, [agentId]: true }));
    
    try {
      await unlinkTool({
        variables: {
          mcpToolId: tool.id,
          runtimeId: agentId,
        },
        refetchQueries: ['GetMCPTools'], // Force refresh tools query
      });
      
      toast({
        title: 'Tool unlinked successfully',
        description: 'Tool has been unlinked from the agent.',
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
      setLoadingStates((prev) => ({ ...prev, [agentId]: false }));
    }
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
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
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{tool.mcpServer.name}</p>
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

        {/* Agents */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Available on Agents ({tool.runtimes?.length || 0})
            </h4>
            {unlinkedAgents.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => setLinkDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          {tool.runtimes && tool.runtimes.length > 0 ? (
            <ul className="space-y-1">
              {tool.runtimes.map((runtime) => (
                <li
                  key={runtime.id}
                  className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700"
                >
                  <Bot className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{runtime.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        runtime.status === 'ACTIVE'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {runtime.status}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      onClick={() => handleUnlinkTool(runtime.id)}
                      disabled={loadingStates[runtime.id]}
                    >
                      {loadingStates[runtime.id] ? (
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">Not available on any agents yet</p>
          )}
        </div>

        {/* Tool Tester */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <ToolTester toolId={tool.id} toolName={tool.name} inputSchema={tool.inputSchema} />
        </div>
      </div>

      {/* Link Tool Dialog */}
      <LinkToolDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        tool={tool}
      />
    </div>
  );
}
