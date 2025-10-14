/**
 * useMCPServers Hook
 *
 * WHY: Wrapper around Apollo Client useSubscription with typed document node
 * - Real-time MCP server updates via GraphQL subscription
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
 * function MCPServersList() {
 *   const { servers, loading, error } = useMCPServers();
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *
 *   return <div>{servers.map(s => <MCPServerCard key={s.id} server={s} />)}</div>;
 * }
 * ```
 */

import { useSubscription } from '@apollo/client/react';
import { SubscribeMcpServersDocument } from '@/graphql/generated/graphql';
import { useWorkspaceId } from '@/stores/workspaceStore';

export function useMCPServers() {
  const workspaceId = useWorkspaceId();

  // WHY: Use Apollo Client's useSubscription for real-time updates
  // No more polling! Backend pushes changes immediately.
  const { data, loading, error } = useSubscription(SubscribeMcpServersDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId
  });

  // WHY: Extract servers from subscription data
  const servers = data?.mcpServers ?? [];

  // WHY: Calculate aggregate stats
  const stats = {
    total: servers.length,
    withTools: servers.filter((s) => s.tools && s.tools.length > 0).length,
    withoutTools: servers.filter((s) => !s.tools || s.tools.length === 0).length,
  };

  return {
    servers,
    stats,
    loading,
    error,
  };
}
