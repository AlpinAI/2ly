/**
 * useToolSets Hook
 *
 * WHY: Fetches ToolSets with real-time updates and client-side filtering.
 * Replaces useAgents which filtered runtimes by "agent" capability.
 *
 * PATTERN: Query + subscription pattern (same as useMCPServers)
 * - useQuery with cache-only for instant data from cache
 * - useSubscription for real-time updates
 * - Subscription writes to query cache for persistence
 * - useMemo for client-side filtering
 * - Search includes tool names
 *
 * ARCHITECTURE:
 * - ToolSets are first-class entities (not filtered runtimes)
 * - Apollo cache automatically updates on subscription events
 * - No manual store management needed
 *
 * USAGE:
 * ```tsx
 * function ToolSetsPage() {
 *   const { toolSets, filteredToolSets, loading, error, filters } = useToolSets(workspaceId);
 *
 *   return (
 *     <div>
 *       <Search value={filters.search} onChange={filters.setSearch} />
 *       <ToolSetTable toolSets={filteredToolSets} />
 *     </div>
 *   );
 * }
 * ```
 */

import { useMemo, useState } from 'react';
import { useQuery, useSubscription } from '@apollo/client/react';
import {
  GetToolSetsDocument,
  SubscribeToolSetsDocument,
} from '@/graphql/generated/graphql';

export function useToolSets(workspaceId: string) {
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');

  // 1️⃣ Read cached toolsets first (fetchPolicy: cache-only)
  const { data: queryData, loading: queryLoading, error: queryError } = useQuery(
    GetToolSetsDocument,
    {
      variables: { workspaceId },
      skip: !workspaceId,
      fetchPolicy: 'cache-only', // use cache if available, otherwise fetch
    }
  );

  // 2️⃣ Start subscription for live updates
  useSubscription(SubscribeToolSetsDocument, {
    variables: { workspaceId },
    skip: !workspaceId,
    onData: ({ client, data }) => {
      const newToolSets = data?.data?.toolSets;
      if (newToolSets) {
        // 3️⃣ Merge subscription updates into Apollo cache
        client.writeQuery({
          query: GetToolSetsDocument,
          variables: { workspaceId },
          data: { toolSets: newToolSets },
        });
      }
    },
  });

  // 4️⃣ Extract toolsets from query cache (initial data + subscription updates)
  const allToolSets = queryData?.toolSets ?? [];

  // Client-side filtering
  const filteredToolSets = useMemo(() => {
    let result = [...allToolSets];

    // Search filter (name + description + tool names)
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      result = result.filter((toolSet) => {
        // Search in name and description
        const nameMatch = toolSet.name.toLowerCase().includes(query);
        const descMatch = toolSet.description?.toLowerCase().includes(query);

        // Search in tool names
        const toolMatch = toolSet.mcpTools?.some((tool: { name: string }) =>
          tool.name.toLowerCase().includes(query)
        );

        return nameMatch || descMatch || toolMatch;
      });
    }

    return result;
  }, [allToolSets, searchTerm]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: allToolSets.length,
      filtered: filteredToolSets.length,
    };
  }, [allToolSets, filteredToolSets]);

  return {
    toolSets: allToolSets,
    filteredToolSets,
    loading: queryLoading,
    error: queryError,
    stats,
    filters: {
      search: searchTerm,
      setSearch: setSearchTerm,
      reset: () => {
        setSearchTerm('');
      },
    },
  };
}
