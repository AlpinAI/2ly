/**
 * RegistryServerDetail Component
 *
 * WHY: Displays detailed information about a selected registry server.
 * Used by PrivateRegistrySection as the detail panel.
 *
 * DISPLAYS:
 * - Name
 * - Description
 * - Version
 * - Repository URL
 * - Configuration count
 * - Delete button (only enabled when 0 configurations)
 *
 * FEATURES:
 * - View-only (no editing)
 * - Clean, simple layout
 * - Proper scrolling for long content
 * - Delete server functionality with confirmation
 */

import { useMutation } from '@apollo/client/react';
import { Server, ExternalLink, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotification } from '@/contexts/NotificationContext';
import { GetRegistryServersQuery, RemoveServerFromRegistryDocument } from '@/graphql/generated/graphql';

type RegistryServer = GetRegistryServersQuery['getRegistryServers'][number];

export interface RegistryServerDetailProps {
  server: RegistryServer;
  onDeleted?: () => void;
}

export function RegistryServerDetail({ server, onDeleted }: RegistryServerDetailProps) {
  const { confirm } = useNotification();
  const [deleteServer, { loading: deleting }] = useMutation(RemoveServerFromRegistryDocument, {
    refetchQueries: ['GetRegistryServers'],
    onCompleted: () => {
      onDeleted?.();
    },
  });

  const configCount = server.configurations?.length ?? 0;
  const canDelete = configCount === 0;

  const handleDelete = async () => {
    if (!canDelete) return;

    const confirmed = await confirm({
      title: 'Delete Server',
      description: `Are you sure you want to delete "${server.name}"? This action cannot be undone. The server will be removed from your private registry.`,
      confirmLabel: 'Delete Server',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    });

    if (!confirmed) return;

    try {
      await deleteServer({
        variables: { serverId: server.id },
      });
    } catch (err) {
      console.error('Failed to delete server:', err);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
            <Server className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white break-words">
              {server.name}
            </h3>
            {server.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {server.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        {/* Version */}
        {server.version && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Version
            </h4>
            <span className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
              v{server.version}
            </span>
          </div>
        )}

        {/* Configuration Count */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Configurations
          </h4>
          <span className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            {configCount} {configCount === 1 ? 'configuration' : 'configurations'}
          </span>
        </div>

        {/* Repository URL */}
        {server.repositoryUrl && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Repository
            </h4>
            <a
              href={server.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-cyan-600 dark:text-cyan-400 hover:underline break-all"
            >
              {server.repositoryUrl}
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
            </a>
          </div>
        )}

        {/* Additional Info Section */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            This server is available in your private registry and can be configured for use with agents.
          </p>
        </div>

        {/* Delete Server Button */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-end">
            <Button
              variant="destructive"
              onClick={handleDelete}
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={!canDelete || deleting}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              {deleting ? 'Deleting...' : 'Delete Server'}
            </Button>
          </div>
          {!canDelete && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-start gap-1">
              <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
              <span>Cannot delete server with active configurations</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
