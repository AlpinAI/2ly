/**
 * UpstreamRegistryBrowser Component
 *
 * WHY: Browse and search MCP servers from upstream registries.
 * Similar to MCPServerBrowser but with registry selection and "Install" action.
 *
 * FEATURES:
 * - Upstream registry URL selector (Official, custom)
 * - Search and filter servers
 * - Registry badge indicator on each server card
 * - Install button to add to private registry
 *
 * DIFFERENCES FROM BROWSE MCP SERVERS:
 * - Shows registry source badge
 * - "Install" instead of "Configure"
 * - Can switch between multiple upstream registries
 */

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { Search, Download, ExternalLink, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWorkspaceId } from '@/stores/workspaceStore';
import { AddServerToRegistryDocument } from '@/graphql/generated/graphql';
import { useUpstreamRegistryServers } from '@/hooks/useUpstreamRegistryServers';
import type { UpstreamServer } from '@/hooks/useUpstreamRegistryServers';
import { REGISTRY_CONFIGURATIONS, CUSTOM_REGISTRY_ID, getRegistryUrl, getRegistryById } from '@/config/registries';

interface UpstreamRegistryBrowserProps {
  onServerAdded: (serverId: string) => void;
  onCancel: () => void;
}

export function UpstreamRegistryBrowser({
  onServerAdded,
  onCancel,
}: UpstreamRegistryBrowserProps) {
  const workspaceId = useWorkspaceId();

  const [selectedRegistryId, setSelectedRegistryId] = useState(REGISTRY_CONFIGURATIONS[0].id);
  const [customUrl, setCustomUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [installingServerId, setInstallingServerId] = useState<string | null>(null);

  const [addServerToRegistry] = useMutation(AddServerToRegistryDocument, {
    refetchQueries: ['GetRegistryServers'],
    onError: (err) => {
      console.error('[UpstreamRegistryBrowser] Install server error:', err);
    },
  });

  const activeUrl = getRegistryUrl(selectedRegistryId, customUrl);
  const selectedRegistry = getRegistryById(selectedRegistryId);
  const upstreamDestination = selectedRegistryId === CUSTOM_REGISTRY_ID 
    ? customUrl 
    : selectedRegistry?.upstreamUrl;

  // Fetch servers from upstream registry
  const {
    servers,
    loading,
    error,
    refetch,
  } = useUpstreamRegistryServers({
    registryUrl: activeUrl,
    searchQuery,
    limit: 50,
    enabled: !!activeUrl, // Only fetch if URL is provided
  });

  const handleInstall = async (server: UpstreamServer) => {
    if (!workspaceId) {
      console.error('No workspace ID found');
      return;
    }

    setInstallingServerId(server.id);
    try {
      const result = await addServerToRegistry({
        variables: {
          workspaceId,
          name: server.name,
          description: server.description,
          title: server.title,
          repositoryUrl: server.repositoryUrl,
          version: server.version,
          packages: server.packages,
          remotes: server.remotes,
        },
      });

      const serverId = result.data?.addServerToRegistry?.id;
      if (serverId) {
        onServerAdded(serverId);
      } else {
        throw new Error('Server ID not returned from mutation');
      }
    } catch (error) {
      console.error('Failed to install server:', error);
    } finally {
      setInstallingServerId(null);
    }
  };

  const getRegistryName = () => {
    if (selectedRegistryId === CUSTOM_REGISTRY_ID) {
      return 'Custom Registry';
    }
    const registry = getRegistryById(selectedRegistryId);
    return registry?.name || 'Registry';
  };

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Registry Selector */}
        <div className="space-y-2">
          <Label>Upstream Registry</Label>
          <div className="flex gap-2">
            <Select value={selectedRegistryId} onValueChange={setSelectedRegistryId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGISTRY_CONFIGURATIONS.map((registry) => (
                  <SelectItem key={registry.id} value={registry.id}>
                    {registry.name}
                  </SelectItem>
                ))}
                <SelectItem value={CUSTOM_REGISTRY_ID}>
                  Custom URL...
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedRegistryId === CUSTOM_REGISTRY_ID && (
            <Input
              placeholder="https://example.com/registry"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="mt-2"
            />
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Browse servers from: {upstreamDestination || 'Select a registry'}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search servers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            disabled={loading || !!error}
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-900 dark:text-red-200 mb-1">
                  Failed to Load Registry
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                  {error}
                </p>
                <Button
                  onClick={refetch}
                  size="sm"
                  variant="outline"
                  className="border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 animate-pulse"
              >
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Server Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {servers.map((server) => (
            <div
              key={server.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
            >
              {/* Registry Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {getRegistryName()}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {server.title || server.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {server.name}
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                {server.description}
              </p>

              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span>v{server.version}</span>
                {server.repositoryUrl && (
                  <a
                    href={server.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" />
                    Repository
                  </a>
                )}
              </div>

              <Button
                onClick={() => handleInstall(server)}
                disabled={installingServerId === server.id}
                size="sm"
                className="w-full"
              >
                {installingServerId === server.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Installing...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Install
                  </>
                )}
              </Button>
            </div>
          ))}

            {/* Empty State */}
            {servers.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Search className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
                <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-white">
                  No servers found
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {searchQuery
                    ? 'Try adjusting your search query'
                    : 'No servers available in this registry'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
