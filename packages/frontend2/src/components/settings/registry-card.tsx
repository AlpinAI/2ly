/**
 * RegistryCard Component
 *
 * WHY: Displays a single MCP registry with its details and actions
 *
 * WHAT IT SHOWS:
 * - Registry name and upstream URL
 * - Sync and delete action buttons
 * - Last sync timestamp and server count
 * - Expandable list of synced servers
 */

import { useState } from 'react';
import { Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface Registry {
  id: string;
  name: string;
  upstreamUrl: string;
  lastSyncAt?: Date | string | null;
  servers?: Array<{
    id: string;
    name: string;
    title?: string | null;
    description?: string | null;
    version?: string | null;
    repositoryUrl?: string | null;
  }> | null;
}

interface RegistryCardProps {
  registry: Registry;
  onSync: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isSyncing: boolean;
}

export function RegistryCard({ registry, onSync, onDelete, isSyncing }: RegistryCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this registry and all its synced servers?')) {
      return;
    }
    setIsDeleting(true);
    try {
      await onDelete(registry.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateValue: Date | string | null | undefined) => {
    if (!dateValue) return 'Never';
    return new Date(dateValue).toLocaleString();
  };

  return (
    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            {registry.name}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {registry.upstreamUrl}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSync(registry.id)}
            disabled={isSyncing || isDeleting}
          >
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Sync
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            disabled={isSyncing || isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600 dark:text-gray-400">Last Sync:</span>
          <span className="ml-2 text-gray-900 dark:text-white">
            {formatDate(registry.lastSyncAt)}
          </span>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Servers:</span>
          <span className="ml-2 text-gray-900 dark:text-white">
            {registry.servers?.length || 0}
          </span>
        </div>
      </div>

      {registry.servers && registry.servers.length > 0 && (
        <details className="mt-3">
          <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white">
            View Synced Servers ({registry.servers.length})
          </summary>
          <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
            {registry.servers.map((server) => (
              <div
                key={server.id}
                className="text-xs p-2 bg-gray-100 dark:bg-gray-800 rounded"
              >
                <div className="font-medium text-gray-900 dark:text-white">
                  {server.title || server.name}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {server.description}
                </div>
                <div className="text-gray-500 dark:text-gray-500 mt-1">
                  v{server.version} • {server.repositoryUrl}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
