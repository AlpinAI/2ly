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

import { useState, useMemo } from 'react';
import { Activity, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { MasterDetailLayout } from '@/components/layout/master-detail-layout';
import { ToolCallsTable } from '@/components/monitoring/ToolCallsTable';
import { ToolCallDetail } from '@/components/monitoring/ToolCallDetail';
import { useToolCalls } from '@/hooks/useToolCalls';

export default function MonitoringPage() {
  const [selectedToolCallId, setSelectedToolCallId] = useState<string | null>(null);
  const { toolCalls, stats, loading, error, filters, pagination } = useToolCalls();

  // Get selected tool call
  const selectedToolCall = useMemo(
    () => toolCalls.find((tc) => tc.id === selectedToolCallId),
    [toolCalls, selectedToolCallId]
  );

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
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Monitoring</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time tool call monitoring and debugging</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
      </div>

      {/* Master-Detail Layout */}
      <MasterDetailLayout
        table={
          <ToolCallsTable
            toolCalls={toolCalls}
            loading={loading}
            selectedToolCallId={selectedToolCallId}
            onSelectToolCall={setSelectedToolCallId}
            filters={filters}
            pagination={pagination}
          />
        }
        detail={selectedToolCall ? <ToolCallDetail toolCall={selectedToolCall} /> : null}
        onCloseDetail={() => setSelectedToolCallId(null)}
      />
    </div>
  );
}
