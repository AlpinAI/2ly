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
  type ActiveStatus,
} from '@/graphql/generated/graphql';

export function useToolSets(workspaceId: string) {
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

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

    // Status filter (based on tool statuses)
    if (selectedStatuses.length > 0) {
      result = result.filter((toolSet) => {
        if (!toolSet.mcpTools || toolSet.mcpTools.length === 0) {
          return selectedStatuses.includes('INACTIVE');
        }
        // ToolSet is active if any of its tools are active
        const hasActiveTool = toolSet.mcpTools.some(
          (tool: { status: ActiveStatus }) => tool.status === 'ACTIVE'
        );
        const status = hasActiveTool ? 'ACTIVE' : 'INACTIVE';
        return selectedStatuses.includes(status);
      });
    }

    return result;
  }, [allToolSets, searchTerm, selectedStatuses]);

  // Calculate stats
  const stats = useMemo(() => {
    const activeCount = allToolSets.filter((toolSet) => {
      if (!toolSet.mcpTools || toolSet.mcpTools.length === 0) return false;
      return toolSet.mcpTools.some((tool: { status: ActiveStatus }) => tool.status === 'ACTIVE');
    }).length;

    return {
      total: allToolSets.length,
      filtered: filteredToolSets.length,
      active: activeCount,
      inactive: allToolSets.length - activeCount,
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
      statuses: selectedStatuses,
      setStatuses: setSelectedStatuses,
      reset: () => {
        setSearchTerm('');
        setSelectedStatuses([]);
      },
    },
  };
}
