/**
 * useMCPRegistries Hook
 *
 * WHY: Wrapper around Apollo Client useSubscription with typed document node
 * - Real-time MCP registry updates via GraphQL subscription
 * - Automatic error handling
 * - Loading states
 * - Data transformation
 * - Apollo cache deduplication
 *
 * APOLLO v4 PATTERN: Use typed document nodes with Apollo's useSubscription hook
 * Apply this pattern to other entities (agents, tools, etc.)
 *
 * USAGE:
 * ```tsx
 * function MCPRegistriesList() {
 *   const { registries, loading, error } = useMCPRegistries();
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *
 *   return <div>{registries.map(r => <RegistryCard key={r.id} registry={r} />)}</div>;
 * }
 * ```
 */

import { useQuery } from '@apollo/client/react';
import { GetMcpRegistriesDocument } from '@/graphql/generated/graphql';
import { useWorkspaceId } from '@/stores/workspaceStore';

export function useMCPRegistries(pollInterval = 0) {
  const workspaceId = useWorkspaceId();

  // WHY: Use Apollo Client's useQuery with cache-first policy
  // Efficient caching reduces server load and improves performance.
  const { data, loading, error } = useQuery(GetMcpRegistriesDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId,
    fetchPolicy: 'cache-and-network',
    pollInterval,
  });

  // WHY: Extract registries from query data
  const registries = data?.mcpRegistries ?? [];

  // WHY: Calculate aggregate stats
  const stats = {
    total: registries.length,
    synced: registries.filter((r) => r.lastSyncAt).length,
    unsynced: registries.filter((r) => !r.lastSyncAt).length,
    totalServers: registries.reduce((sum, r) => sum + (r.servers?.length || 0), 0),
  };

  return {
    registries,
    stats,
    loading,
    error,
  };
}
