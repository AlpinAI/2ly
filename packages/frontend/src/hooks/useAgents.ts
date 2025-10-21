/**
 * useAgents Hook
 *
 * WHY: Fetches runtimes with "agent" capability and client-side filtering.
 * Used by Agents Page to display and filter agent list.
 *
 * PATTERN: 
 * - Filter runtimes with "agent" capability
 * - useMemo for client-side filtering
 * - Search includes tool names
 *
 * ARCHITECTURE:
 * - This hook adds agent-specific filtering logic
 * - No cache conflicts from duplicate subscriptions
 *
 * USAGE:
 * ```tsx
 * function AgentsPage() {
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

import { useMemo, useState } from 'react';
import { type SubscribeRuntimesSubscription } from '@/graphql/generated/graphql';

export function useAgents(allRuntimes: SubscribeRuntimesSubscription['runtimes']) {
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServerIds, setSelectedServerIds] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  // Filter for agents only (runtimes with "agent" capability)
  const allAgents = useMemo(() => {
    return allRuntimes?.filter((runtime) => {
      return runtime.capabilities?.includes('agent');
    }) ?? [];
  }, [allRuntimes]);

  // Client-side filtering
  const filteredAgents = useMemo(() => {
    let result = [...allAgents];

    // Search filter (name + description + tool names)
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      result = result.filter((agent) => {
        // Search in name and description
        const nameMatch = agent.name.toLowerCase().includes(query);
        const descMatch = agent.description?.toLowerCase().includes(query);

        // Search in tool names
        const toolMatch = agent.mcpToolCapabilities?.some((tool) =>
          tool.name.toLowerCase().includes(query)
        );

        return nameMatch || descMatch || toolMatch;
      });
    }

    // Server filter (agents connected to specific servers)
    if (selectedServerIds.length > 0) {
      result = result.filter((agent) => {
        if (!agent.mcpServers || agent.mcpServers.length === 0) return false;
        return agent.mcpServers.some((server) => selectedServerIds.includes(server.id));
      });
    }

    // Status filter
    if (selectedStatuses.length > 0) {
      result = result.filter((agent) => selectedStatuses.includes(agent.status));
    }

    return result;
  }, [allAgents, searchTerm, selectedServerIds, selectedStatuses]);

  // Calculate stats
  const stats = {
    total: allAgents.length,
    filtered: filteredAgents.length,
    active: allAgents.filter((a) => a.status === 'ACTIVE').length,
    inactive: allAgents.filter((a) => a.status === 'INACTIVE').length,
  };

  return {
    agents: allAgents,
    filteredAgents,
    stats,
    filters: {
      search: searchTerm,
      setSearch: setSearchTerm,
      serverIds: selectedServerIds,
      setServerIds: setSelectedServerIds,
      statuses: selectedStatuses,
      setStatuses: setSelectedStatuses,
      reset: () => {
        setSearchTerm('');
        setSelectedServerIds([]);
        setSelectedStatuses([]);
      },
    },
  };
}
