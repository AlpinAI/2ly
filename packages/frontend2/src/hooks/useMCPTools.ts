/**
 * useMCPTools Hook
 *
 * WHY: Fetches MCP tools with real-time updates and client-side filtering.
 * Used by Tools Page to display and filter tool list.
 *
 * PATTERN: Similar to useMCPServers
 * - useSubscription for real-time updates
 * - useMemo for client-side filtering
 * - Multi-select filters for servers and agents
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

import { useMemo, useState } from 'react';
import { useSubscription } from '@apollo/client/react';
import { SubscribeMcpToolsDocument } from '@/graphql/generated/graphql';
import { useWorkspaceId } from '@/stores/workspaceStore';

export function useMCPTools() {
  const workspaceId = useWorkspaceId();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServerIds, setSelectedServerIds] = useState<string[]>([]);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);

  // Fetch tools with subscription
  const { data, loading, error } = useSubscription(SubscribeMcpToolsDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId,
  });

  const allTools = (data?.mcpTools ?? []).filter((tool): tool is NonNullable<typeof tool> => tool !== null);

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

    // Agent filter (tools available on specific agents/runtimes)
    if (selectedAgentIds.length > 0) {
      result = result.filter((tool) => {
        if (!tool.runtimes || tool.runtimes.length === 0) return false;
        return tool.runtimes.some((runtime) => selectedAgentIds.includes(runtime.id));
      });
    }

    return result;
  }, [allTools, searchTerm, selectedServerIds, selectedAgentIds]);

  // Calculate stats
  const stats = {
    total: allTools.length,
    filtered: filteredTools.length,
    active: allTools.filter((t) => t.status === 'ACTIVE').length,
    inactive: allTools.filter((t) => t.status === 'INACTIVE').length,
  };

  return {
    tools: allTools,
    filteredTools,
    loading,
    error,
    stats,
    filters: {
      search: searchTerm,
      setSearch: setSearchTerm,
      serverIds: selectedServerIds,
      setServerIds: setSelectedServerIds,
      agentIds: selectedAgentIds,
      setAgentIds: setSelectedAgentIds,
      reset: () => {
        setSearchTerm('');
        setSelectedServerIds([]);
        setSelectedAgentIds([]);
      },
    },
  };
}
