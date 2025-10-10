/**
 * Settings Page
 *
 * WHY: Application and user settings, including MCP Registry management.
 * Manages upstream registry connections and synchronization.
 *
 * ARCHITECTURE:
 * - Uses AppLayout (header + navigation are automatic)
 * - Apollo subscriptions for real-time registry updates
 * - Follows same patterns as DashboardPage
 */

import { useState } from 'react';
import { useMutation, useSubscription } from '@apollo/client/react';
import { Loader2, AlertCircle, Plus, Trash2, RefreshCw, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWorkspaceId } from '@/stores/workspaceStore';
import { SubscribeMcpRegistriesDocument, CreateMcpRegistryDocument, DeleteMcpRegistryDocument, SyncUpstreamRegistryDocument } from '@/graphql/generated/graphql';
import type { SubscribeMcpRegistriesSubscription } from '@/graphql/generated/graphql';
import type { components } from '@2ly/common';

// Generated types from MCP Registry OpenAPI schema - available for future use
// @ts-expect-error - Imported for documentation and future use
type ServerJSON = components['schemas']['ServerJSON'];
// @ts-expect-error - Imported for documentation and future use
type ServerResponse = components['schemas']['ServerResponse'];

const OFFICIAL_MCP_REGISTRY = {
  name: 'Official MCP Registry',
  upstreamUrl: 'https://registry.modelcontextprotocol.io/v0/servers',
} satisfies { name: string; upstreamUrl: string };

export default function SettingsPage() {
  const workspaceId = useWorkspaceId();
  const [name, setName] = useState('');
  const [upstreamUrl, setUpstreamUrl] = useState('');
  const [syncingId, setSyncingId] = useState<string | null>(null);

  console.log('[SettingsPage] Rendering with workspaceId:', workspaceId);

  // Subscribe to registries
  const { data, loading, error } = useSubscription<SubscribeMcpRegistriesSubscription>(SubscribeMcpRegistriesDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId,
    onError: (err) => {
      console.error('[SettingsPage] Subscription error:', err);
    },
  });

  console.log('[SettingsPage] Subscription state:', { data, loading, error: error?.message });

  // Mutations
  const [createRegistry, { loading: creating }] = useMutation(CreateMcpRegistryDocument, {
    onCompleted: () => {
      setName('');
      setUpstreamUrl('');
    },
    onError: (err) => {
      console.error('[SettingsPage] Create registry error:', err);
    },
  });

  const [deleteRegistry] = useMutation(DeleteMcpRegistryDocument, {
    onError: (err) => {
      console.error('[SettingsPage] Delete registry error:', err);
    },
  });

  const [syncRegistry] = useMutation(SyncUpstreamRegistryDocument, {
    onCompleted: () => {
      setSyncingId(null);
    },
    onError: (err) => {
      console.error('[SettingsPage] Sync registry error:', err);
      setSyncingId(null);
    },
  });

  const registries = data?.mcpRegistries || [];

  // Check if official MCP registry is already added
  const hasOfficialRegistry = registries.some(
    (reg) => reg.upstreamUrl === OFFICIAL_MCP_REGISTRY.upstreamUrl
  );

  const handleCreateRegistry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !upstreamUrl.trim() || !workspaceId) return;

    await createRegistry({
      variables: {
        workspaceId,
        name: name.trim(),
        upstreamUrl: upstreamUrl.trim(),
      },
    });
  };

  const handleAddOfficialRegistry = async () => {
    if (!workspaceId) return;

    await createRegistry({
      variables: {
        workspaceId,
        name: OFFICIAL_MCP_REGISTRY.name,
        upstreamUrl: OFFICIAL_MCP_REGISTRY.upstreamUrl,
      },
    });
  };

  const handleDeleteRegistry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this registry and all its synced servers?')) {
      return;
    }
    await deleteRegistry({ variables: { id } });
  };

  const handleSyncRegistry = async (id: string) => {
    setSyncingId(id);
    await syncRegistry({ variables: { registryId: id } });
  };

  const formatDate = (dateValue: Date | string | null | undefined) => {
    if (!dateValue) return 'Never';
    return new Date(dateValue).toLocaleString();
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Settings
      </h2>

      {/* MCP Registry Management Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            MCP Registry Management
          </h3>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Connect to upstream MCP registries to sync available servers and tools.
        </p>

        {/* Quick Add Official Registry */}
        <div className="mb-6">
          <Button
            onClick={handleAddOfficialRegistry}
            disabled={creating || hasOfficialRegistry || !workspaceId}
            variant="outline"
            className="w-full md:w-auto"
          >
            {hasOfficialRegistry ? (
              <>
                <Database className="h-4 w-4" />
                Official MCP Registry Added
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add Official MCP Registry
              </>
            )}
          </Button>
          {hasOfficialRegistry && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              The official MCP registry is already configured.
            </p>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                Failed to load registries
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error.message}
              </p>
            </div>
          </div>
        )}

        {/* Add Registry Form */}
        <form onSubmit={handleCreateRegistry} className="space-y-4 mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Registry Name</Label>
              <Input
                id="name"
                placeholder="Official MCP Registry"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={creating}
              />
            </div>
            <div>
              <Label htmlFor="upstreamUrl">Upstream URL</Label>
              <Input
                id="upstreamUrl"
                placeholder="https://registry.modelcontextprotocol.io/v0/servers"
                value={upstreamUrl}
                onChange={(e) => setUpstreamUrl(e.target.value)}
                disabled={creating}
              />
            </div>
          </div>
          <Button type="submit" disabled={creating || !name.trim() || !upstreamUrl.trim()}>
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add Registry
              </>
            )}
          </Button>
        </form>

        {/* Registries List */}
        {loading && registries.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Loading registries...
            </span>
          </div>
        ) : registries.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 py-8 text-center">
            No registries configured. Add your first registry to get started.
          </p>
        ) : (
          <div className="space-y-4">
            {registries.map((registry) => (
              <div
                key={registry.id}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
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
                      onClick={() => handleSyncRegistry(registry.id)}
                      disabled={syncingId === registry.id}
                    >
                      {syncingId === registry.id ? (
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
                      onClick={() => handleDeleteRegistry(registry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
