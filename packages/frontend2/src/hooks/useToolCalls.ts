/**
 * useToolCalls Hook
 *
 * WHY: Fetches tool calls with backend filtering and pagination.
 * Used by Monitoring Page to display tool call history with scalable queries.
 *
 * PATTERN: Query with polling instead of subscription for scalability
 * - useQuery with cache-and-network
 * - Optional pollInterval for real-time updates (default 30s)
 * - Backend filtering via GraphQL variables
 * - Pagination support
 *
 * USAGE:
 * ```tsx
 * function MonitoringPage() {
 *   const { toolCalls, stats, loading, error, filters, pagination } = useToolCalls();
 *
 *   return (
 *     <div>
 *       <Stats data={stats} />
 *       <ToolCallTable toolCalls={toolCalls} filters={filters} />
 *       <Pagination {...pagination} />
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@apollo/client/react';
import { GetToolCallsDocument, ToolCallStatus } from '@/graphql/generated/graphql';
import { useWorkspaceId } from '@/stores/workspaceStore';

export function useToolCalls(pollInterval = 30000) {
  const workspaceId = useWorkspaceId();

  // Filter state
  const [statusFilter, setStatusFilter] = useState<ToolCallStatus[]>([]);
  const [toolFilter, setToolFilter] = useState<string[]>([]);
  const [runtimeFilter, setRuntimeFilter] = useState<string[]>([]);

  // Pagination state
  const [limit] = useState(100);
  const [offset, setOffset] = useState(0);

  // Query with backend filtering and optional polling
  const { data, loading, error, refetch } = useQuery(GetToolCallsDocument, {
    variables: {
      workspaceId: workspaceId || '',
      limit,
      offset,
      filters: {
        status: statusFilter.length > 0 ? statusFilter : undefined,
        mcpToolIds: toolFilter.length > 0 ? toolFilter : undefined,
        runtimeIds: runtimeFilter.length > 0 ? runtimeFilter : undefined,
      },
    },
    skip: !workspaceId,
    fetchPolicy: 'cache-and-network',
    pollInterval,
  });

  // Extract data
  const toolCalls = data?.toolCalls?.toolCalls ?? [];
  const stats = data?.toolCalls?.stats;
  const totalCount = data?.toolCalls?.totalCount ?? 0;
  const hasMore = data?.toolCalls?.hasMore ?? false;

  // Pagination handlers
  const nextPage = useCallback(() => {
    if (hasMore) {
      setOffset((prev) => prev + limit);
    }
  }, [hasMore, limit]);

  const prevPage = useCallback(() => {
    setOffset((prev) => Math.max(0, prev - limit));
  }, [limit]);

  const resetPagination = useCallback(() => {
    setOffset(0);
  }, []);

  // Filter handlers (reset pagination when filters change)
  const handleSetStatusFilter = useCallback(
    (status: ToolCallStatus[]) => {
      setStatusFilter(status);
      resetPagination();
    },
    [resetPagination]
  );

  const handleSetToolFilter = useCallback(
    (toolIds: string[]) => {
      setToolFilter(toolIds);
      resetPagination();
    },
    [resetPagination]
  );

  const handleSetRuntimeFilter = useCallback(
    (runtimeIds: string[]) => {
      setRuntimeFilter(runtimeIds);
      resetPagination();
    },
    [resetPagination]
  );

  const resetFilters = useCallback(() => {
    setStatusFilter([]);
    setToolFilter([]);
    setRuntimeFilter([]);
    resetPagination();
  }, [resetPagination]);

  // Memoize objects to prevent unnecessary re-renders
  const filters = useMemo(
    () => ({
      status: statusFilter,
      setStatus: handleSetStatusFilter,
      toolIds: toolFilter,
      setToolIds: handleSetToolFilter,
      runtimeIds: runtimeFilter,
      setRuntimeIds: handleSetRuntimeFilter,
      reset: resetFilters,
    }),
    [statusFilter, handleSetStatusFilter, toolFilter, handleSetToolFilter, runtimeFilter, handleSetRuntimeFilter, resetFilters]
  );

  const pagination = useMemo(
    () => ({
      offset,
      limit,
      totalCount,
      hasMore,
      nextPage,
      prevPage,
      currentPage: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(totalCount / limit),
    }),
    [offset, limit, totalCount, hasMore, nextPage, prevPage]
  );

  return {
    toolCalls,
    stats: stats || { total: 0, pending: 0, completed: 0, failed: 0, avgDuration: null },
    loading,
    error,
    filters,
    pagination,
    refetch,
  };
}
