/**
 * useMCPRegistries Hook
 *
 * WHY: Wrapper around Apollo Client useQuery to fetch workspace registry servers
 * - Fetches MCP registry servers directly from workspace
 * - Automatic error handling
 * - Loading states
 * - Data transformation
 * - Apollo cache deduplication
 *
 * APOLLO v4 PATTERN: Use typed document nodes with Apollo's useQuery hook
 * Apply this pattern to other entities (agents, tools, etc.)
 *
 * USAGE:
 * ```tsx
 * function MCPRegistryServersList() {
 *   const { registryServers, loading, error } = useMCPRegistries();
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *
 *   return <div>{registryServers.map(s => <ServerCard key={s.id} server={s} />)}</div>;
 * }
 * ```
 */

import { useQuery } from '@apollo/client/react';
import { GetRegistryServersDocument } from '@/graphql/generated/graphql';
import { useWorkspaceId } from '@/stores/workspaceStore';

export function useMCPRegistries(pollInterval = 0) {
  const workspaceId = useWorkspaceId();

  // WHY: Use Apollo Client's useQuery with cache-and-network policy
  // Efficient caching reduces server load and improves performance.
  const { data, loading, error } = useQuery(GetRegistryServersDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId,
    fetchPolicy: 'cache-and-network',
    pollInterval,
  });

  // WHY: Extract registry servers directly from query result
  const registryServers = data?.getRegistryServers ?? [];

  // WHY: Calculate aggregate stats
  const stats = {
    total: registryServers.length,
    configured: registryServers.filter((s) => s.configurations && s.configurations.length > 0).length,
    unconfigured: registryServers.filter((s) => !s.configurations || s.configurations.length === 0).length,
    totalServers: registryServers.length,
  };

  return {
    registryServers,
    stats,
    loading,
    error,
  };
}
