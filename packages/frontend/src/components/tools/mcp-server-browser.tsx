/**
 * MCPServerBrowser Component
 *
 * WHY: Displays searchable, filterable list of MCP registry servers.
 * Shows real data from workspace registries via useMCPRegistries hook.
 * Groups multiple versions of same server, displaying only latest by default.
 *
 * ARCHITECTURE:
 * - Uses useMCPRegistries hook for real-time updates
 * - Flattens servers from all registries
 * - Groups servers by name, separating latest from older versions
 * - Client-side search and filtering
 * - Responsive grid layout
 * - Infinite scroll/pagination support
 */

import { useState, useMemo } from 'react';
import { Search } from '@/components/ui/search';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Plus, PackagePlus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useMCPRegistries } from '@/hooks/useMCPRegistries';
import { useAddServerWorkflow } from '@/stores/uiStore';
import { MCPServerCard } from './mcp-server-card';
import { mcpRegistry } from '@skilder-ai/common';
import { GetRegistryServersQuery } from '@/graphql/generated/graphql';

// Use official MCP Registry schema types
type Package = mcpRegistry.components['schemas']['Package'];
type Transport = mcpRegistry.components['schemas']['Transport'];

// Extract server type from GraphQL query
type MCPRegistryServer = GetRegistryServersQuery['getRegistryServers'][number];

export interface ServerVersionGroup {
  name: string;
  latestVersion: MCPRegistryServer;
  olderVersions: MCPRegistryServer[];
}

interface MCPServerBrowserProps {
  onConfigure: (server: MCPRegistryServer) => void;
}

const TRANSPORT_TYPES = ['All', 'STDIO', 'SSE', 'STREAM'];
const ITEMS_PER_PAGE = 20;

/**
 * Parse _meta JSON and check if this is the latest version
 */
const isLatestVersion = (server: MCPRegistryServer): boolean => {
  try {
    if (!server._meta) return false;
    const meta = JSON.parse(server._meta);
    return meta['io.modelcontextprotocol.registry/official']?.isLatest === true;
  } catch {
    return false;
  }
};

/**
 * Group servers by name, separating latest from older versions
 */
const groupServersByName = (servers: MCPRegistryServer[]): ServerVersionGroup[] => {
  const groups = new Map<string, ServerVersionGroup>();

  for (const server of servers) {
    const name = server.name;
    const isLatest = isLatestVersion(server);

    if (!groups.has(name)) {
      // Initialize group - if this first server is latest, use it as latest
      // Otherwise, we'll need a placeholder that will be replaced
      groups.set(name, {
        name,
        latestVersion: isLatest ? server : server, // Will be updated if we find a latest
        olderVersions: isLatest ? [] : [server], // If not latest, add to older immediately
      });
      continue; // Skip to next server
    }

    const group = groups.get(name)!;

    if (isLatest) {
      // Found a server marked as latest
      // Move current latest to older versions only if it's different
      const currentLatest = group.latestVersion;
      if (currentLatest.id !== server.id) {
        // Check if current latest is actually marked as latest
        const currentIsLatest = isLatestVersion(currentLatest);
        if (!currentIsLatest) {
          // Current latest wasn't actually latest, remove it from olderVersions if present
          group.olderVersions = group.olderVersions.filter((v) => v.id !== currentLatest.id);
        } else {
          // Current latest was also marked latest, keep it in olderVersions
          group.olderVersions.push(currentLatest);
        }
      }
      group.latestVersion = server;
    } else {
      // Add to older versions
      group.olderVersions.push(server);
    }
  }

  // Sort older versions by version number (descending)
  for (const group of groups.values()) {
    group.olderVersions.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
  }

  return Array.from(groups.values());
};

export function MCPServerBrowser({ onConfigure }: MCPServerBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransport, setSelectedTransport] = useState('All');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // Get registry servers data via hook
  const { registryServers, loading, error } = useMCPRegistries();

  // Add server workflow control
  const { setOpen: setAddServerWorkflowOpen } = useAddServerWorkflow();

  // All servers are already flat (no need to flatMap)
  const allServers = useMemo(() => {
    return registryServers || [];
  }, [registryServers]);

  // Group servers by name (latest + older versions)
  const groupedServers = useMemo(() => {
    return groupServersByName(allServers);
  }, [allServers]);

  // Apply filters to grouped servers
  const filteredGroups = useMemo(() => {
    let filtered = groupedServers;

    // Search filter - check latest version fields
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((group) => {
        const server = group.latestVersion;
        return (
          server.name.toLowerCase().includes(query) ||
          server.title?.toLowerCase().includes(query) ||
          server.description?.toLowerCase().includes(query)
        );
      });
    }

    // Transport filter - check latest version transport
    if (selectedTransport !== 'All') {
      filtered = filtered.filter((group) => {
        const server = group.latestVersion;
        try {
          // Check packages
          if (server.packages) {
            const packages = JSON.parse(server.packages) as Package[];
            if (Array.isArray(packages)) {
              const hasMatch = packages.some((pkg) => pkg.transport?.type?.toUpperCase() === selectedTransport);
              if (hasMatch) return true;
            }
          }
          // Check remotes
          if (server.remotes) {
            const remotes = JSON.parse(server.remotes) as Transport[];
            if (Array.isArray(remotes)) {
              const hasMatch = remotes.some((remote) => remote.type?.toUpperCase() === selectedTransport);
              if (hasMatch) return true;
            }
          }
        } catch {
          // Ignore JSON parse errors
        }
        return false;
      });
    }

    return filtered;
  }, [groupedServers, searchQuery, selectedTransport]);

  // Paginate results
  const visibleGroups = useMemo(() => {
    return filteredGroups.slice(0, visibleCount);
  }, [filteredGroups, visibleCount]);

  const hasMore = visibleCount < filteredGroups.length;

  const loadMore = () => {
    setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading servers from registries...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive" className="mx-6 my-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load registry servers: {error.message}</AlertDescription>
      </Alert>
    );
  }

  // Empty registries state
  if (allServers.length === 0) {
    return (
      <div className="text-center py-12 px-6">
        <p className="text-gray-600 dark:text-gray-400 mb-4">No MCP servers available in your registries.</p>
        <p className="text-sm text-gray-500 dark:text-gray-500">Go to Settings to add and sync MCP registries first.</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      {/* Search Bar and Add Button */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <Search
          placeholder="Search servers by name or description..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setVisibleCount(ITEMS_PER_PAGE); // Reset pagination on search
          }}
          className="flex-1 max-w-4xl"
        />
        <Button
          onClick={() => setAddServerWorkflowOpen(true)}
          className="flex items-center gap-2 whitespace-nowrap flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add MCP Server
        </Button>
      </div>

      {/* Transport Type Filters */}
      <div className="mb-8 flex flex-wrap gap-2">
        {TRANSPORT_TYPES.map((transport) => (
          <Button
            key={transport}
            variant={selectedTransport === transport ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setSelectedTransport(transport);
              setVisibleCount(ITEMS_PER_PAGE); // Reset pagination on filter change
            }}
            className={cn('rounded-full transition-all', selectedTransport === transport && 'shadow-sm')}
          >
            {transport}
          </Button>
        ))}
      </div>

      {/* Results Count */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {filteredGroups.length} {filteredGroups.length === 1 ? 'server' : 'servers'} available
        {searchQuery && ` matching "${searchQuery}"`}
      </p>

      {/* Server Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {visibleGroups.map((group) => (
          <MCPServerCard key={group.latestVersion.id} serverGroup={group} onConfigure={onConfigure} />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center">
          <Button variant="outline" onClick={loadMore}>
            Load More ({filteredGroups.length - visibleCount} remaining)
          </Button>
        </div>
      )}

      {/* Empty State (after filtering) - Placeholder Card CTA */}
      {filteredGroups.length === 0 && (
        <div className="flex justify-center">
          <div
            onClick={() => setAddServerWorkflowOpen(true)}
            className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 shadow-sm hover:shadow-md hover:border-cyan-500 dark:hover:border-cyan-500 transition-all cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setAddServerWorkflowOpen(true);
              }
            }}
          >
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <PackagePlus className="h-16 w-16 text-gray-400 dark:text-gray-500" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No servers found
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Try adjusting your search or filter criteria, or add a new MCP server to your private registry.
              </p>
              <Button className="flex items-center gap-2 mx-auto">
                <Plus className="h-4 w-4" />
                Add MCP Server
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
