/**
 * ToolsetDetail Component
 *
 * WHY: Displays detailed information about a selected toolset.
 * Used by Toolsets Page as the detail panel.
 *
 * DISPLAYS:
 * - Name and description
 * - Available Tools (with links)
 * - Created/Updated timestamps
 */

import { useState } from 'react';
import { Bot, Wrench, Clock, Settings, Trash2, Cable, Eye, EyeOff, Copy } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useManageToolsDialog, useConnectToolsetDialog, useConnectToolsetDialogNew } from '@/stores/uiStore';
import { useMutation, useLazyQuery } from '@apollo/client/react';
import { useNotification } from '@/contexts/NotificationContext';
import { DeleteToolSetDocument, GetToolsetKeyDocument, GetKeyValueDocument } from '@/graphql/generated/graphql';
import type { SubscribeToolSetsSubscription } from '@/graphql/generated/graphql';

type ToolSet = NonNullable<SubscribeToolSetsSubscription['toolSets']>[number];

export interface ToolsetDetailProps {
  toolSet: ToolSet;
}

export function ToolsetDetail({ toolSet }: ToolsetDetailProps) {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { setOpen, setSelectedToolsetId } = useManageToolsDialog();
  const { setOpen: setConnectDialogOpen, setSelectedToolsetName, setSelectedToolsetId: setConnectToolsetId } = useConnectToolsetDialog();
  const { setOpen: setConnectDialogNewOpen, setSelectedToolsetName: setConnectToolsetNameNew, setSelectedToolsetId: setConnectToolsetIdNew } = useConnectToolsetDialogNew();
  const { confirm, toast } = useNotification();
  const [deleteToolSet] = useMutation(DeleteToolSetDocument);

  // Key visibility state
  const [keyVisible, setKeyVisible] = useState(false);
  const [keyValue, setKeyValue] = useState<string | null>(null);
  const [getToolsetKey, { loading: loadingKey }] = useLazyQuery(GetToolsetKeyDocument);
  const [getKeyValue, { loading: loadingKeyValue }] = useLazyQuery(GetKeyValueDocument);

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleString();
  };

  const handleManageTools = () => {
    setSelectedToolsetId(toolSet.id);
    setOpen(true);
  };

  const handleConnect = () => {
    // Use the toolSet name as a pseudo-agent ID for connection instructions
    // The ConnectToolsetDialog will show instructions for this name
    setSelectedToolsetName(toolSet.name);
    setConnectToolsetId(toolSet.id);
    setConnectDialogOpen(true);
  };

  const handleConnectNew = () => {
    setConnectToolsetNameNew(toolSet.name);
    setConnectToolsetIdNew(toolSet.id);
    setConnectDialogNewOpen(true);
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Toolset',
      description: `Are you sure you want to delete "${toolSet.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete Toolset',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    });

    if (!confirmed) return;

    try {
      await deleteToolSet({
        variables: {
          id: toolSet.id,
        },
        refetchQueries: ['SubscribeToolSets'],
      });
    } catch (error) {
      console.error('Failed to delete toolset:', error);
    }
  };

  const handleToggleKeyVisibility = async () => {
    if (keyVisible) {
      // Hide the key
      setKeyVisible(false);
      setKeyValue(null);
    } else {
      // Fetch and show the key
      try {
        // First get the key metadata
        const keyResult = await getToolsetKey({ variables: { toolsetId: toolSet.id } });
        if (keyResult.data?.toolsetKey) {
          // Then get the actual key value
          const valueResult = await getKeyValue({ variables: { keyId: keyResult.data.toolsetKey.id } });
          if (valueResult.data?.keyValue) {
            setKeyValue(valueResult.data.keyValue);
            setKeyVisible(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch key:', error);
        toast({
          description: 'Failed to fetch toolset key',
          variant: 'error',
        });
      }
    }
  };

  const handleCopyKey = () => {
    if (keyValue) {
      navigator.clipboard.writeText(keyValue);
      toast({
        description: 'Key copied to clipboard',
        variant: 'success',
      });
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {toolSet.name}
            </h3>
            {toolSet.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{toolSet.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={handleConnect}
          className="h-8 px-3 text-sm"
        >
          <Cable className="h-4 w-4 mr-2" />
          Connect
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleConnectNew}
          className="h-8 px-3 text-sm"
        >
          <Cable className="h-4 w-4 mr-2" />
          Connect New
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
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        {/* Identity Key */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Identity Key
          </h4>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono text-gray-900 dark:text-white truncate">
                {keyVisible && keyValue ? keyValue : '••••••••••••••••••••••••••••••••'}
              </code>
              {keyVisible && keyValue && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyKey}
                  className="h-7 w-7 p-0 hover:bg-cyan-100 dark:hover:bg-cyan-900/30"
                  title="Copy to clipboard"
                >
                  <Copy className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleKeyVisibility}
                disabled={loadingKey || loadingKeyValue}
                className="h-7 w-7 p-0"
                title={keyVisible ? 'Hide key' : 'Show key'}
              >
                {keyVisible ? (
                  <EyeOff className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Eye className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Created/Updated */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Timestamps
          </h4>
          <div className="space-y-1 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Created:</span>
              <span className="text-gray-900 dark:text-white">{formatDate(toolSet.createdAt)}</span>
            </div>
            {toolSet.updatedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Updated:</span>
                <span className="text-gray-900 dark:text-white">{formatDate(toolSet.updatedAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tools */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-2">
            <Wrench className="h-3 w-3" />
            Tools ({toolSet.mcpTools?.length || 0})
          </h4>
          {toolSet.mcpTools && toolSet.mcpTools.length > 0 ? (
            <ul className="space-y-1 max-h-64 overflow-auto">
              {toolSet.mcpTools.map((tool) => (
                <li
                  key={tool.id}
                  className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700"
                >
                  <Wrench className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/w/${workspaceId}/tools?id=${tool.id}`}
                      className="text-sm text-gray-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 hover:underline truncate block"
                    >
                      {tool.name}
                    </Link>
                    {tool.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {tool.description}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">No tools in this set</p>
          )}
        </div>

        {/* Delete Toolset Button */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <Button variant="destructive" onClick={handleDelete} size="sm" className="h-7 px-2 text-xs">
            <Trash2 className="h-3 w-3 mr-1" />
            Delete Toolset
          </Button>
        </div>
      </div>
    </div>
  );
}
