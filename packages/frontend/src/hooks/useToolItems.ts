/**
 * useToolItems Hook
 *
 * WHY: Unified hook that combines MCP Tools and Agents into a single list.
 * Used by Tools Page to display both item types in a mixed table.
 *
 * PATTERN: Composition of useMCPTools and useAgents
 * - Merges data from both hooks
 * - Adds type filter for filtering by MCP_TOOL / AGENT
 * - Preserves individual hook filters (search, server, skill)
 *
 * USAGE:
 * ```tsx
 * function ToolsPage() {
 *   const { items, filteredItems, loading, filters } = useToolItems();
 *
 *   return (
 *     <div>
 *       <TypeFilter types={filters.types} onChange={filters.setTypes} />
 *       <ToolTable items={filteredItems} />
 *     </div>
 *   );
 * }
 * ```
 */

import { useMemo, useState, useCallback } from 'react';
import { useMCPTools } from './useMCPTools';
import { useAgents } from './useAgents';
import type { ToolItem, MCPToolItem, AgentItem } from '@/types/tools';
import { ToolItemType } from '@/types/tools';

export function useToolItems() {
  const {
    tools,
    filteredTools,
    loading: toolsLoading,
    error: toolsError,
    filters: toolFilters,
  } = useMCPTools();

  const {
    agents,
    filteredAgents,
    loading: agentsLoading,
    error: agentsError,
  } = useAgents();

  // Type filter state (empty = show all)
  const [selectedTypes, setSelectedTypes] = useState<ToolItemType[]>([]);

  // Convert tools and agents to unified ToolItem type
  const allItems = useMemo<ToolItem[]>(() => {
    const mcpItems: MCPToolItem[] = tools.map((tool) => ({
      ...tool,
      itemType: ToolItemType.MCP_TOOL,
    }));

    const agentItems: AgentItem[] = agents.map((agent) => ({
      ...agent,
      itemType: ToolItemType.AGENT,
    }));

    // Sort by name for consistent ordering
    return [...mcpItems, ...agentItems].sort((a, b) => a.name.localeCompare(b.name));
  }, [tools, agents]);

  // Convert filtered tools and agents to unified ToolItem type
  const preFilteredItems = useMemo<ToolItem[]>(() => {
    const mcpItems: MCPToolItem[] = filteredTools.map((tool) => ({
      ...tool,
      itemType: ToolItemType.MCP_TOOL,
    }));

    const agentItems: AgentItem[] = filteredAgents.map((agent) => ({
      ...agent,
      itemType: ToolItemType.AGENT,
    }));

    // Sort by name for consistent ordering
    return [...mcpItems, ...agentItems].sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredTools, filteredAgents]);

  // Apply type filter
  const filteredItems = useMemo<ToolItem[]>(() => {
    if (selectedTypes.length === 0) {
      return preFilteredItems;
    }
    return preFilteredItems.filter((item) => selectedTypes.includes(item.itemType));
  }, [preFilteredItems, selectedTypes]);

  // Calculate stats
  const stats = useMemo(
    () => ({
      total: allItems.length,
      filtered: filteredItems.length,
      mcpTools: tools.length,
      agents: agents.length,
      filteredMcpTools: filteredItems.filter((i) => i.itemType === ToolItemType.MCP_TOOL).length,
      filteredAgents: filteredItems.filter((i) => i.itemType === ToolItemType.AGENT).length,
    }),
    [allItems.length, filteredItems, tools.length, agents.length],
  );

  // Reset all filters (type filter + tool filters)
  const resetFilters = useCallback(() => {
    setSelectedTypes([]);
    toolFilters.reset();
  }, [toolFilters]);

  // Combined filters object
  const filters = useMemo(
    () => ({
      // Type filter
      types: selectedTypes,
      setTypes: setSelectedTypes,
      // Search filter (from tools)
      search: toolFilters.search,
      setSearch: toolFilters.setSearch,
      // Server filter (from tools, only applies to MCP tools)
      serverIds: toolFilters.serverIds,
      setServerIds: toolFilters.setServerIds,
      // Skill filter (from tools)
      skillIds: toolFilters.skillIds,
      setSkillIds: toolFilters.setSkillIds,
      // Reset all
      reset: resetFilters,
    }),
    [selectedTypes, toolFilters, resetFilters],
  );

  return {
    items: allItems,
    filteredItems,
    loading: toolsLoading || agentsLoading,
    error: toolsError || agentsError,
    stats,
    filters,
  };
}
