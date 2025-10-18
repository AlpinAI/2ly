/**
 * ToolCallsTable Component
 *
 * Displays a table of tool calls with filtering, pagination, and selection
 */

import { ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToolCallStatus } from '@/graphql/generated/graphql';
import { cn } from '@/lib/utils';

interface ToolCall {
  id: string;
  status: ToolCallStatus;
  calledAt: Date;
  completedAt: Date | null;
  mcpTool: {
    name: string;
    mcpServer: {
      name: string;
    };
  };
  calledBy: {
    name: string;
  };
}

interface ToolCallsTableProps {
  toolCalls: ToolCall[];
  loading: boolean;
  selectedToolCallId: string | null;
  onSelectToolCall: (id: string) => void;
  filters: {
    status: ToolCallStatus[];
    setStatus: (status: ToolCallStatus[]) => void;
    reset: () => void;
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    offset: number;
    hasMore: boolean;
    prevPage: () => void;
    nextPage: () => void;
  };
}

export function ToolCallsTable({
  toolCalls,
  loading,
  selectedToolCallId,
  onSelectToolCall,
  filters,
  pagination,
}: ToolCallsTableProps) {
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

  // Format date helper
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  // Calculate duration helper
  const calculateDuration = (calledAt: Date, completedAt: Date | null) => {
    if (!completedAt) return null;
    return Math.round(new Date(completedAt).getTime() - new Date(calledAt).getTime());
  };

  return (
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

          {filters.status.length > 0 && (
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
                  onClick={() => onSelectToolCall(call.id)}
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
  );
}
