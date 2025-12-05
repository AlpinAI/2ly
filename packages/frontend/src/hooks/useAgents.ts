/**
 * useAgents Hook
 *
 * WHY: Fetches agents with client-side filtering.
 * Used by Tools Page to display agents alongside MCP tools.
 *
 * PATTERN: Query without polling (manual refetch when needed)
 * - useQuery with cache-and-network for fresh data on mount
 * - refetch() exposed for manual updates after mutations
 * - useMemo for client-side filtering
 *
 * USAGE:
 * ```tsx
 * function AgentList() {
 *   const { agents, filteredAgents, loading, error, filters } = useAgents();
 *
 *   return (
 *     <div>
 *       <Search value={filters.search} onChange={filters.setSearch} />
 *       <AgentTable agents={filteredAgents} />
 *     </div>
 *   );
 * }
 * ```
 */

import { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@apollo/client/react';
import { GetAgentsDocument } from '@/graphql/generated/graphql';
import { useWorkspaceId } from '@/stores/workspaceStore';

export function useAgents() {
  const workspaceId = useWorkspaceId();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);

  // Query agents without polling (use refetch for manual updates)
  // Data freshness maintained via:
  // - Manual refetch after mutations
  // - Apollo re-fetches on component mount/navigation
  const { data, loading, error, refetch } = useQuery(GetAgentsDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId,
    fetchPolicy: 'cache-and-network',
  });

  // Extract agents from query
  const allAgents = (data?.getAgentsByWorkspace ?? []).filter(
    (agent): agent is NonNullable<typeof agent> => agent !== null,
  );

  // Client-side filtering
  const filteredAgents = useMemo(() => {
    let result = [...allAgents];

    // Search filter (name + description)
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      result = result.filter(
        (agent) =>
          agent.name.toLowerCase().includes(query) ||
          (agent.description?.toLowerCase().includes(query) ?? false),
      );
    }

    // Skill filter (agents available in specific skills)
    if (selectedSkillIds.length > 0) {
      result = result.filter((agent) =>
        agent.skills?.some((skill) => selectedSkillIds.includes(skill.id)),
      );
    }

    return result;
  }, [allAgents, searchTerm, selectedSkillIds]);

  // Calculate stats
  const stats = useMemo(
    () => ({
      total: allAgents.length,
      filtered: filteredAgents.length,
    }),
    [allAgents.length, filteredAgents.length],
  );

  // Memoize the reset function
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedSkillIds([]);
  }, []);

  // Memoize the filters object
  const filters = useMemo(
    () => ({
      search: searchTerm,
      setSearch: setSearchTerm,
      skillIds: selectedSkillIds,
      setSkillIds: setSelectedSkillIds,
      reset: resetFilters,
    }),
    [searchTerm, selectedSkillIds, resetFilters],
  );

  return {
    agents: allAgents,
    filteredAgents,
    loading,
    error,
    stats,
    filters,
    refetch,
  };
}
