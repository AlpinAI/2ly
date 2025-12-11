/**
 * useUpstreamRegistryServers Hook
 *
 * WHY: Fetch MCP servers from upstream registry REST APIs with search support.
 *
 * FEATURES:
 * - Fetches servers from any upstream registry URL
 * - Debounced search (300ms)
 * - Loading and error states
 * - Pagination support with cursor
 * - Type-safe API response handling
 *
 * USAGE:
 * ```tsx
 * const { servers, loading, error, refetch } = useUpstreamRegistryServers({
 *   registryUrl: 'https://registry.modelcontextprotocol.io/v0/servers',
 *   searchQuery: 'filesystem',
 *   limit: 50,
 * });
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { mcpRegistry } from '@skilder-ai/common';

type ServerListResponse = mcpRegistry.components['schemas']['ServerListResponse'];
type ServerResponse = mcpRegistry.components['schemas']['ServerResponse'];

export interface UpstreamServer {
  id: string;
  name: string;
  title: string;
  description: string;
  version: string;
  repositoryUrl: string;
  packages: string | null;
  remotes: string | null;
}

interface UseUpstreamRegistryServersOptions {
  registryUrl: string;
  searchQuery?: string;
  limit?: number;
  enabled?: boolean; // Allow disabling the fetch
}

interface UseUpstreamRegistryServersResult {
  servers: UpstreamServer[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  hasMore: boolean;
  nextCursor: string | null;
}

/**
 * Transform API ServerJSON to component UpstreamServer format
 */
function transformServer(serverResponse: ServerResponse): UpstreamServer {
  const server = serverResponse.server;

  return {
    // Generate a unique ID from the server name
    id: server.name,
    name: server.name,
    // Use name as title if no separate title field exists
    title: server.name,
    description: server.description,
    version: server.version,
    repositoryUrl: server.repository?.url || '',
    packages: server.packages ? JSON.stringify(server.packages) : null,
    remotes: server.remotes ? JSON.stringify(server.remotes) : null,
  };
}

/**
 * Custom hook to fetch servers from upstream registry with search
 */
export function useUpstreamRegistryServers({
  registryUrl,
  searchQuery = '',
  limit = 50,
  enabled = true,
}: UseUpstreamRegistryServersOptions): UseUpstreamRegistryServersResult {
  const [servers, setServers] = useState<UpstreamServer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // Debounced search state
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  // Debounce search query (300ms)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const fetchServers = useCallback(async (signal?: AbortSignal) => {
    if (!enabled || !registryUrl) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (debouncedSearchQuery) {
        params.set('search', debouncedSearchQuery);
      }
      params.set('limit', limit.toString());
      // Always fetch latest versions
      params.set('version', 'latest');

      const url = `${registryUrl}?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal, // Pass abort signal to fetch
      });

      if (!response.ok) {
        throw new Error(`Registry API returned ${response.status}: ${response.statusText}`);
      }

      const data: ServerListResponse = await response.json();

      // Transform servers
      const transformedServers = (data.servers || []).map(transformServer);

      setServers(transformedServers);
      setNextCursor(data.metadata.nextCursor || null);
      setError(null);
    } catch (err) {
      // Ignore abort errors (component unmounted or new request started)
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      console.error('[useUpstreamRegistryServers] Fetch error:', err);

      let errorMessage = 'Failed to fetch servers from registry';

      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        errorMessage = 'Network error: Unable to connect to registry. Check your internet connection or registry URL.';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setServers([]);
    } finally {
      setLoading(false);
    }
  }, [registryUrl, debouncedSearchQuery, limit, enabled]);

  // Refetch function for manual retry
  const refetch = useCallback(() => {
    fetchServers();
  }, [fetchServers]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    const abortController = new AbortController();
    fetchServers(abortController.signal);

    // Cleanup: abort the request if component unmounts or dependencies change
    return () => {
      abortController.abort();
    };
  }, [fetchServers]);

  return {
    servers,
    loading,
    error,
    refetch,
    hasMore: !!nextCursor,
    nextCursor,
  };
}
