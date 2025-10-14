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

import { useSubscription } from '@apollo/client/react';
import { SubscribeMcpRegistriesDocument } from '@/graphql/generated/graphql';
import { useWorkspaceId } from '@/stores/workspaceStore';

export function useMCPRegistries() {
  const workspaceId = useWorkspaceId();

  // WHY: Use Apollo Client's useSubscription for real-time updates
  // No more polling! Backend pushes changes immediately.
  const { data, loading, error } = useSubscription(SubscribeMcpRegistriesDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId,
  });

  // WHY: Extract registries from subscription data
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
