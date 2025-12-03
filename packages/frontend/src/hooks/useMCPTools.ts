/**
 * useMCPTools Hook
 *
 * WHY: Fetches MCP tools with real-time updates and client-side filtering.
 * Used by Tools Page to display and filter tool list.
 *
 * PATTERN: Query + subscription pattern (same as useMCPServers)
 * - useQuery with cache-only for instant data from cache
 * - useSubscription for real-time updates
 * - Subscription writes to query cache for persistence
 * - useMemo for client-side filtering
 * - Multi-select filters for servers and skills
 *
 * USAGE:
 * ```tsx
 * function ToolsPage() {
 *   const { tools, filteredTools, loading, error, filters } = useMCPTools();
 *
 *   return (
 *     <div>
 *       <Search value={filters.search} onChange={filters.setSearch} />
 *       <ToolTable tools={filteredTools} />
 *     </div>
 *   );
 * }
 * ```
 */

import { useMemo, useState, useCallback } from 'react';
import { useQuery, useSubscription } from '@apollo/client/react';
import { GetMcpToolsDocument, SubscribeMcpToolsDocument } from '@/graphql/generated/graphql';
import { useWorkspaceId } from '@/stores/workspaceStore';

export function useMCPTools() {
  const workspaceId = useWorkspaceId();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServerIds, setSelectedServerIds] = useState<string[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);

  // 1️⃣ Read cached tools first (fetchPolicy: cache-only)
  const { data: queryData, loading: queryLoading, error: queryError } = useQuery(GetMcpToolsDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId,
    fetchPolicy: 'cache-only', // use cache if available, otherwise fetch
  });

  // 2️⃣ Start subscription for live updates
  useSubscription(SubscribeMcpToolsDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId,
    onData: ({ client, data }) => {
      const newTools = data?.data?.mcpTools;
      if (newTools) {
        // 3️⃣ Merge subscription updates into Apollo cache
        client.writeQuery({
          query: GetMcpToolsDocument,
          variables: { workspaceId: workspaceId || '' },
          data: { mcpTools: newTools },
        });
      }
    },
  });

  // 4️⃣ Extract tools from query cache (initial data + subscription updates)
  const allTools = (queryData?.mcpTools ?? []).filter((tool): tool is NonNullable<typeof tool> => tool !== null);

  // Client-side filtering
  const filteredTools = useMemo(() => {
    let result = [...allTools];

    // Search filter (name + description)
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      result = result.filter(
        (tool) => tool.name.toLowerCase().includes(query) || tool.description.toLowerCase().includes(query),
      );
    }

    // Server filter
    if (selectedServerIds.length > 0) {
      result = result.filter((tool) => selectedServerIds.includes(tool.mcpServer.id));
    }

    // Skill filter (tools available in specific skills)
    // Note: Tools don't directly have skills in current schema, filtering disabled for now
    // TODO: Update schema to add skills relationship to MCPTool
    if (selectedSkillIds.length > 0) {
      // Placeholder - this would need schema changes to work
      // For now, just log a warning
      console.warn('Skill filtering not yet implemented - requires schema update');
    }

    return result;
  }, [allTools, searchTerm, selectedServerIds, selectedSkillIds]);

  // Calculate stats
  const stats = {
    total: allTools.length,
    filtered: filteredTools.length,
    active: allTools.filter((t) => t.status === 'ACTIVE').length,
    inactive: allTools.filter((t) => t.status === 'INACTIVE').length,
  };

  // Memoize the reset function to prevent recreating it on every render
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedServerIds([]);
    setSelectedSkillIds([]);
  }, []);

  // Memoize the filters object to prevent recreating it on every render
  const filters = useMemo(() => ({
    search: searchTerm,
    setSearch: setSearchTerm,
    serverIds: selectedServerIds,
    setServerIds: setSelectedServerIds,
    skillIds: selectedSkillIds,
    setSkillIds: setSelectedSkillIds,
    reset: resetFilters,
  }), [searchTerm, selectedServerIds, selectedSkillIds, resetFilters]);

  // Memoize the stats object to prevent recreating it on every render
  const memoizedStats = useMemo(() => stats, [stats.total, stats.filtered, stats.active, stats.inactive]);

  return {
    tools: allTools,
    filteredTools,
    loading: queryLoading,
    error: queryError,
    stats: memoizedStats,
    filters,
  };
}
