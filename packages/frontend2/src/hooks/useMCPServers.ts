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

import { useQuery, useSubscription } from '@apollo/client/react';
import { useMemo } from 'react';
import { SubscribeMcpServersDocument, GetMcpServersDocument } from '@/graphql/generated/graphql';
import { useWorkspaceId } from '@/stores/workspaceStore';

export function useMCPServers() {
  const workspaceId = useWorkspaceId();

  // 1️⃣ Read cached servers first (fetchPolicy: cache-only)
  const { data: queryData, loading: queryLoading, error: queryError } = useQuery(
    GetMcpServersDocument,
    {
      variables: { workspaceId: workspaceId || '' },
      skip: !workspaceId,
      fetchPolicy: 'cache-only', // use cache if available, otherwise fetch
    }
  );

  // 2️⃣ Start subscription for live updates
  useSubscription(SubscribeMcpServersDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId,
    onData: ({ client, data }) => {
      const newServers = data?.data?.mcpServers;
      if (newServers) {
        // 3️⃣ Merge subscription updates into Apollo cache
        client.writeQuery({
          query: GetMcpServersDocument,
          variables: { workspaceId: workspaceId || '' },
          data: { mcpServers: newServers },
        });
      }
    },
  });

  // 4️⃣ Extract servers from query cache (initial data + subscription updates)
  const servers = queryData?.mcpServers ?? [];

  // 5️⃣ Aggregate stats (memoized to prevent recreating on every render)
  const stats = useMemo(() => ({
    total: servers.length,
    withTools: servers.filter((s) => s.tools && s.tools.length > 0).length,
    withoutTools: servers.filter((s) => !s.tools || s.tools.length === 0).length,
  }), [servers]);

  return {
    servers,
    stats,
    loading: queryLoading,
    error: queryError,
  };
}
