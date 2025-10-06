/**
 * useToolCatalog Hook
 *
 * WHY: Combines Apollo data (server state) with Zustand filters (client state).
 * This demonstrates the integration pattern between Apollo and Zustand.
 *
 * WHAT IT DOES:
 * 1. Fetches tools from Apollo (backend data)
 * 2. Gets filter settings from Zustand (UI state)
 * 3. Applies client-side filtering and sorting
 * 4. Returns filtered results
 *
 * WHY CLIENT-SIDE FILTERING:
 * - Faster than server filtering (no network round trip)
 * - Works with cached data (no refetch needed)
 * - Good for <1000 items
 * - For larger datasets, use server-side filtering with Apollo variables
 *
 * USAGE:
 * ```tsx
 * function ToolCatalog() {
 *   const { tools, loading, filters } = useToolCatalog();
 *
 *   return (
 *     <div>
 *       <SearchInput
 *         value={filters.search}
 *         onChange={filters.setSearch}
 *       />
 *       <ToolGrid tools={tools} />
 *     </div>
 *   );
 * }
 * ```
 */

import { useMemo } from 'react';
import { useGetMcpToolsQuery } from '@/graphql/generated/graphql';
import { useToolFilters } from '@/stores/uiStore';
import { useWorkspaceId } from '@/stores/workspaceStore';

export function useToolCatalog() {
  // WHY: Get workspace ID from Zustand
  const workspaceId = useWorkspaceId();

  // WHY: Get filters from Zustand
  const filters = useToolFilters();

  // WHY: Fetch tools from Apollo
  const { data, loading, error, refetch } = useGetMcpToolsQuery({
    variables: {
      workspaceId: workspaceId ?? '', // Provide fallback for null
    },
    // WHY: Skip query if no workspace selected
    skip: !workspaceId,

    // WHY: Tools don't change often, cache-first is good
    fetchPolicy: 'cache-first',
  });

  // WHY: Extract tools from nested structure
  const allTools = data?.workspaceMCPTools?.mcpTools ?? [];

  // WHY: Apply client-side filtering and sorting
  const filteredTools = useMemo(() => {
    let result = [...allTools];

    // Filter by search query
    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter(
        (tool) =>
          tool.name.toLowerCase().includes(query) ||
          tool.description.toLowerCase().includes(query)
      );
    }

    // Filter by category
    // TODO: Add category to schema or use tags
    // if (filters.category !== 'all') {
    //   result = result.filter(tool => tool.category === filters.category);
    // }

    // Sort
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'recent':
          return (
            new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
          );
        // TODO: Add rating and popularity to schema
        case 'rating':
        case 'popular':
        default:
          return 0;
      }
    });

    return result;
  }, [allTools, filters.search, filters.sortBy]);

  return {
    tools: filteredTools,
    allTools,
    loading,
    error,
    refetch,
    filters,
    workspaceId,
  };
}
