/**
 * AgentDetail Component
 *
 * WHY: Displays detailed information about a selected agent runtime.
 * Used by Agents Page as the detail panel.
 *
 * DISPLAYS:
 * - Name and description
 * - Status
 * - Capabilities
 * - Host information
 * - Available Tools (with links)
 * - Last seen timestamp
 */

import { Bot, Wrench, Clock, Cpu, Settings, Cable, Trash2, Sparkles } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useManageToolsDialog, useConnectAgentDialog, useAISuggesterDialog } from '@/stores/uiStore';
import { useMutation } from '@apollo/client/react';
import { useNotification } from '@/contexts/NotificationContext';
import { DeleteRuntimeDocument } from '@/graphql/generated/graphql';
import type { SubscribeRuntimesSubscription } from '@/graphql/generated/graphql';

type Runtime = NonNullable<SubscribeRuntimesSubscription['runtimes']>[number];

export interface AgentDetailProps {
  agent: Runtime;
}

export function AgentDetail({ agent }: AgentDetailProps) {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { setOpen, setSelectedToolSetId } = useManageToolsDialog();
  const { setOpen: setConnectDialogOpen, setSelectedAgentId } = useConnectAgentDialog();
  const { setOpen: setAISuggesterOpen, setSelectedToolSetId: setAISuggesterToolSetId } = useAISuggesterDialog();
  const { confirm } = useNotification();
  const [deleteAgent] = useMutation(DeleteRuntimeDocument);

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleString();
  };

  const handleManageTools = () => {
    setSelectedToolSetId(agent.id);
    setOpen(true);
  };

  const handleConnectAgent = () => {
    setSelectedAgentId(agent.id);
    setConnectDialogOpen(true);
  };

  const handleAISuggester = () => {
    setAISuggesterToolSetId(agent.id);
    setAISuggesterOpen(true);
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Tool Set',
      description: `Are you sure you want to delete "${agent.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete Tool Set',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    });

    if (!confirmed) return;

    try {
      await deleteAgent({
        variables: {
          id: agent.id,
        },
        refetchQueries: ['SubscribeRuntimes'],
      });
    } catch (error) {
      console.error('Failed to delete tool set:', error);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
              <Bot className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{agent.name}</h3>
              {agent.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{agent.description}</p>}
            </div>
          </div>

        </div>

        {/* Action Bar */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleConnectAgent}
            className="h-8 px-3 text-sm"
          >
            <Cable className="h-4 w-4 mr-2" />
            Connect
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleManageTools}
            className="h-8 px-3 text-sm"
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage Tools
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAISuggester}
            className="h-8 px-3 text-sm"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Build with AI
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 space-y-4">
          {/* Status */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Status</h4>
            <span
              className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${
                agent.status === 'ACTIVE'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
              }`}
            >
              {agent.status}
            </span>
          </div>

          {/* Capabilities */}
          {agent.capabilities && agent.capabilities.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Capabilities
              </h4>
              <div className="flex flex-wrap gap-1">
                {agent.capabilities.map((capability) => (
                  <span
                    key={capability}
                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                  >
                    {capability}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Host Information */}
          {(agent.hostname || agent.hostIP || agent.mcpClientName) && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Cpu className="h-3 w-3" />
                Host Information
              </h4>
              <div className="space-y-1 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-sm">
                {agent.hostname && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Hostname:</span>
                    <span className="text-gray-900 dark:text-white font-mono">{agent.hostname}</span>
                  </div>
                )}
                {agent.hostIP && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">IP:</span>
                    <span className="text-gray-900 dark:text-white font-mono">{agent.hostIP}</span>
                  </div>
                )}
                {agent.mcpClientName && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">MCP Client:</span>
                    <span className="text-gray-900 dark:text-white font-mono">{agent.mcpClientName}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Last Seen */}
          {agent.lastSeenAt && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last Seen
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(agent.lastSeenAt)}</p>
            </div>
          )}


          {/* Tools */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-2">
              <Wrench className="h-3 w-3" />
              Available Tools ({agent.mcpToolCapabilities?.length || 0})
            </h4>
            {agent.mcpToolCapabilities && agent.mcpToolCapabilities.length > 0 ? (
              <ul className="space-y-1 max-h-64 overflow-auto">
                {agent.mcpToolCapabilities.map((tool) => (
                  <li
                    key={tool.id}
                    className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700"
                  >
                    <Wrench className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <Link
                      to={`/w/${workspaceId}/tools?id=${tool.id}`}
                      className="text-sm text-gray-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 hover:underline truncate"
                    >
                      {tool.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">No tools available</p>
            )}
          </div>

          {/* Delete Agent Button */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <Button
              variant="destructive"
              onClick={handleDelete}
              size="sm"
              className="h-7 px-2 text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete Tool Set
            </Button>
          </div>
        </div>
      </div>
  );
}
