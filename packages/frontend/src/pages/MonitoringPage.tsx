/**
 * MonitoringPage Component
 *
 * WHY: Real-time monitoring of tool calls with backend filtering and pagination.
 * Shows tool call history in a scalable way without overwhelming the UI or backend.
 *
 * ARCHITECTURE:
 * - Master-detail layout (table + detail panel)
 * - Backend filtering (not client-side) for scalability
 * - Polling instead of subscription (configurable interval)
 * - Stats cards at the top for quick overview
 *
 * FEATURES:
 * - Filter by status, tool, runtime
 * - Pagination for large datasets
 * - Expandable input/output in detail panel
 * - Real-time updates via polling (30s default)
 */

import { useState, useMemo, useEffect } from 'react';
import { Activity, AlertCircle, CheckCircle, Clock, Hash, Info } from 'lucide-react';
import { MasterDetailLayout } from '@/components/layout/master-detail-layout';
import { ToolCallsTable } from '@/components/monitoring/ToolCallsTable';
import { ToolCallDetail } from '@/components/monitoring/ToolCallDetail';
import { RefreshIntervalControl } from '@/components/monitoring/RefreshIntervalControl';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToolCalls } from '@/hooks/useToolCalls';
import { useUrlSync } from '@/hooks/useUrlSync';
import { estimateTokens } from '@/utils/tokenEstimation';

export default function MonitoringPage() {
  const { selectedId, setSelectedId } = useUrlSync();
  const [pollInterval, setPollInterval] = useState(30000);

  const { toolCalls, stats, loading, error, filters, sorting, pagination } = useToolCalls({
    pollInterval,
  });

  // Calculate total tokens from all tool calls
  const totalTokens = useMemo(() => {
    return toolCalls.reduce((acc, call) => {
      const inputTokens = estimateTokens(call.toolInput);
      const outputTokens = estimateTokens(call.toolOutput);
      return acc + inputTokens + outputTokens;
    }, 0);
  }, [toolCalls]);

  // Get selected tool call from URL
  const selectedToolCall = useMemo(
    () => toolCalls.find((tc) => tc.id === selectedId),
    [toolCalls, selectedId]
  );

  // Auto-open detail panel if ID in URL and tool call exists
  useEffect(() => {
    if (selectedId && !selectedToolCall && !loading) {
      // Tool call not found on current page - might need pagination handling
      // For now, just clear the selection
      // TODO: Implement backend pagination lookup
    }
  }, [selectedId, selectedToolCall, loading]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Error loading tool calls</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Monitoring</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time tool call monitoring and debugging</p>
        </div>
        <RefreshIntervalControl interval={pollInterval} onChange={setPollInterval} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Calls</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.failed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm relative">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-gray-400 dark:text-gray-500 absolute top-3 right-3 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                Proxy calculation based on characters / 4
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex items-center gap-3">
            <Hash className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Tokens</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTokens.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Master-Detail Layout */}
      <MasterDetailLayout
        table={
          <ToolCallsTable
            toolCalls={toolCalls}
            loading={loading}
            selectedToolCallId={selectedId}
            onSelectToolCall={setSelectedId}
            filters={filters}
            sorting={sorting}
            pagination={pagination}
          />
        }
        detail={selectedToolCall ? <ToolCallDetail toolCall={selectedToolCall} /> : null}
        onCloseDetail={() => setSelectedId(null)}
      />
    </div>
  );
}
