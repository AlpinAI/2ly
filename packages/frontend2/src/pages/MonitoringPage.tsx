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
import { Activity, AlertCircle, CheckCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { MasterDetailLayout } from '@/components/layout/master-detail-layout';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToolCalls } from '@/hooks/useToolCalls';
import { ToolCallStatus } from '@/graphql/generated/graphql';
import { cn } from '@/lib/utils';

export default function MonitoringPage() {
  const [selectedToolCallId, setSelectedToolCallId] = useState<string | null>(null);
  const { toolCalls, stats, loading, error, filters, pagination } = useToolCalls();

  // Get selected tool call
  const selectedToolCall = useMemo(
    () => toolCalls.find((tc) => tc.id === selectedToolCallId),
    [toolCalls, selectedToolCallId]
  );

  // Format date helper
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  // Calculate duration helper
  const calculateDuration = (calledAt: Date, completedAt: Date | null) => {
    if (!completedAt) return null;
    return Math.round(new Date(completedAt).getTime() - new Date(calledAt).getTime());
  };

  // Status icon helper
  const getStatusIcon = (status: ToolCallStatus) => {
    switch (status) {
      case ToolCallStatus.Completed:
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case ToolCallStatus.Failed:
        return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case ToolCallStatus.Pending:
        return <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
    }
  };

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
          <div className="flex flex-col h-full">
            {/* Filters */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
              <div className="flex gap-2 items-center">
                <Select
                  value={filters.status.length > 0 ? filters.status[0] : 'all'}
                  onValueChange={(value) => filters.setStatus(value !== 'all' ? [value as ToolCallStatus] : [])}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value={ToolCallStatus.Pending}>Pending</SelectItem>
                    <SelectItem value={ToolCallStatus.Completed}>Completed</SelectItem>
                    <SelectItem value={ToolCallStatus.Failed}>Failed</SelectItem>
                  </SelectContent>
                </Select>

                {(filters.status.length > 0) && (
                  <Button variant="ghost" size="sm" onClick={filters.reset}>
                    Clear filters
                  </Button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              {loading && toolCalls.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">Loading tool calls...</p>
                </div>
              ) : toolCalls.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">No tool calls found</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Tool
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Called By
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {toolCalls.map((call) => (
                      <tr
                        key={call.id}
                        onClick={() => setSelectedToolCallId(call.id)}
                        className={cn(
                          'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                          selectedToolCallId === call.id && 'bg-cyan-50 dark:bg-cyan-900/20'
                        )}
                      >
                        <td className="px-4 py-3">{getStatusIcon(call.status)}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{call.mcpTool.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{call.mcpTool.mcpServer.name}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{call.calledBy.name}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(call.calledAt)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {calculateDuration(call.calledAt, call.completedAt)
                            ? `${calculateDuration(call.calledAt, call.completedAt)}ms`
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Footer */}
            {toolCalls.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} total)
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={pagination.prevPage} disabled={pagination.offset === 0}>
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button size="sm" variant="outline" onClick={pagination.nextPage} disabled={!pagination.hasMore}>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        }
        detail={
          selectedToolCall ? (
            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                {getStatusIcon(selectedToolCall.status)}
                <span
                  className={cn(
                    'px-3 py-1 rounded-full text-sm font-medium',
                    selectedToolCall.status === ToolCallStatus.Completed &&
                      'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
                    selectedToolCall.status === ToolCallStatus.Failed &&
                      'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
                    selectedToolCall.status === ToolCallStatus.Pending &&
                      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                  )}
                >
                  {selectedToolCall.status}
                </span>
              </div>

              {/* Tool Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {selectedToolCall.mcpTool.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedToolCall.mcpTool.description}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Server: {selectedToolCall.mcpTool.mcpServer.name}
                </p>
              </div>

              {/* Runtime Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Called By</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedToolCall.calledBy.name}</p>
                  {selectedToolCall.calledBy.hostname && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{selectedToolCall.calledBy.hostname}</p>
                  )}
                </div>
                {selectedToolCall.executedBy && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Executed By</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedToolCall.executedBy.name}
                    </p>
                    {selectedToolCall.executedBy.hostname && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{selectedToolCall.executedBy.hostname}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Timing Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Called At</p>
                  <p className="text-sm text-gray-900 dark:text-white">{formatDate(selectedToolCall.calledAt)}</p>
                </div>
                {selectedToolCall.completedAt && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Duration</p>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {calculateDuration(selectedToolCall.calledAt, selectedToolCall.completedAt)}ms
                    </p>
                  </div>
                )}
              </div>

              {/* Input */}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Input</p>
                <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto max-h-40">
                  <code>{(() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedToolCall.toolInput), null, 2);
                    } catch {
                      return selectedToolCall.toolInput;
                    }
                  })()}</code>
                </pre>
              </div>

              {/* Output or Error */}
              {selectedToolCall.status === ToolCallStatus.Failed && selectedToolCall.error ? (
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">Error</p>
                  <pre className="text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded border border-red-200 dark:border-red-800 overflow-x-auto max-h-40">
                    <code>{selectedToolCall.error}</code>
                  </pre>
                </div>
              ) : selectedToolCall.toolOutput ? (
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Output</p>
                  <pre className="text-xs bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800 overflow-x-auto max-h-40">
                    <code>{selectedToolCall.toolOutput}</code>
                  </pre>
                </div>
              ) : null}
            </div>
          ) : null
        }
        onCloseDetail={() => setSelectedToolCallId(null)}
      />
    </div>
  );
}
