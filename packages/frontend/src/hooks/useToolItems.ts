/**
 * useToolItems Hook
 *
 * WHY: Hook that provides MCP Tools for the Tools page.
 *
 * PATTERN: Wrapper around useMCPTools
 * - Provides consistent interface for Tools page
 * - Preserves hook filters (search, server, skill)
 *
 * USAGE:
 * ```tsx
 * function ToolsPage() {
 *   const { items, filteredItems, loading, filters } = useToolItems();
 *
 *   return (
 *     <ToolTable items={filteredItems} />
 *   );
 * }
 * ```
 */

import { useMemo, useCallback } from 'react';
import { useMCPTools } from './useMCPTools';
import type { ToolItem } from '@/types/tools';

export function useToolItems() {
  const {
    tools,
    filteredTools,
    loading,
    error,
    filters: toolFilters,
  } = useMCPTools();

  // Convert to ToolItem type (simple alias)
  const allItems = useMemo<ToolItem[]>(() => {
    return [...tools].sort((a, b) => a.name.localeCompare(b.name));
  }, [tools]);

  const filteredItems = useMemo<ToolItem[]>(() => {
    return [...filteredTools].sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredTools]);

  // Calculate stats
  const stats = useMemo(
    () => ({
      total: allItems.length,
      filtered: filteredItems.length,
      mcpTools: tools.length,
    }),
    [allItems.length, filteredItems.length, tools.length],
  );

  // Reset all filters
  const resetFilters = useCallback(() => {
    toolFilters.reset();
  }, [toolFilters]);

  // Filters object
  const filters = useMemo(
    () => ({
      // Search filter
      search: toolFilters.search,
      setSearch: toolFilters.setSearch,
      // Server filter
      serverIds: toolFilters.serverIds,
      setServerIds: toolFilters.setServerIds,
      // Skill filter
      skillIds: toolFilters.skillIds,
      setSkillIds: toolFilters.setSkillIds,
      // Reset all
      reset: resetFilters,
    }),
    [toolFilters, resetFilters],
  );

  return {
    items: allItems,
    filteredItems,
    loading,
    error,
    stats,
    filters,
  };
}
