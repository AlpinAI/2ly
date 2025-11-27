/**
 * ToolCallsTable Component
 *
 * Displays a table of tool calls with filtering, pagination, and selection
 */

import { ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Clock, ArrowUpDown, X } from 'lucide-react';
import { useQuery } from '@apollo/client/react';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { CheckboxDropdown } from '@/components/ui/checkbox-dropdown';
import { Search } from '@/components/ui/search';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ToolCallStatus,
  OrderDirection,
  GetMcpToolsDocument,
  GetRuntimesDocument,
  GetToolCallsQuery,
} from '@/graphql/generated/graphql';
import { useWorkspaceId } from '@/stores/workspaceStore';
import { cn } from '@/lib/utils';
import { useScrollToEntity } from '@/hooks/useScrollToEntity';
import { estimateTokens, formatTokenCount, formatTokenCountExact } from '@/utils/tokenEstimation';

// Derive ToolCall type from the actual GraphQL query result
type ToolCall = GetToolCallsQuery['toolCalls']['toolCalls'][number];

interface ToolCallsTableProps {
  toolCalls: ToolCall[];
  loading: boolean;
  selectedToolCallId: string | null;
  onSelectToolCall: (id: string) => void;
  filters: {
    status: ToolCallStatus[];
    setStatus: (status: ToolCallStatus[]) => void;
    toolIds: string[];
    setToolIds: (toolIds: string[]) => void;
    runtimeIds: string[];
    setRuntimeIds: (runtimeIds: string[]) => void;
    search: string;
    setSearch: (search: string) => void;
    reset: () => void;
  };
  sorting: {
    orderDirection: OrderDirection;
    setOrderDirection: (direction: OrderDirection) => void;
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

const STATUS_OPTIONS = [
  { id: ToolCallStatus.Pending, label: 'Pending' },
  { id: ToolCallStatus.Completed, label: 'Completed' },
  { id: ToolCallStatus.Failed, label: 'Failed' },
];

const SORT_OPTIONS = [
  { direction: OrderDirection.Desc, label: 'Newest First' },
  { direction: OrderDirection.Asc, label: 'Oldest First' },
];

export function ToolCallsTable({
  toolCalls,
  loading,
  selectedToolCallId,
  onSelectToolCall,
  filters,
  sorting,
  pagination,
}: ToolCallsTableProps) {
  const workspaceId = useWorkspaceId();
  const scrollToEntity = useScrollToEntity();
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  // Fetch available tools for filter
  const { data: toolsData } = useQuery(GetMcpToolsDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId,
  });

  // Fetch available runtimes for filter
  const { data: runtimesData } = useQuery(GetRuntimesDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId,
  });

  const tools = toolsData?.mcpTools || [];
  const runtimes = runtimesData?.workspace?.runtimes || [];

  const toolOptions = tools.map((tool: { id: string; name: string; mcpServer: { name: string } }) => ({
    id: tool.id,
    label: `${tool.name} (${tool.mcpServer.name})`,
  }));

  const runtimeOptions = runtimes.map((runtime: { id: string; name: string }) => ({
    id: runtime.id,
    label: runtime.name,
  }));

  const activeFilterCount =
    filters.status.length +
    filters.toolIds.length +
    filters.runtimeIds.length +
    (filters.search ? 1 : 0);

  // Convert ToolCallStatus[] to string[] for CheckboxDropdown
  const handleStatusChange = (selectedIds: string[]) => {
    filters.setStatus(selectedIds as ToolCallStatus[]);
  };

  const handleSortChange = (direction: OrderDirection) => {
    sorting.setOrderDirection(direction);
  };

  const currentSort = SORT_OPTIONS.find((opt) => opt.direction === sorting.orderDirection);

  // Scroll to selected entity when ID changes and element is ready
  useEffect(() => {
    if (selectedToolCallId && !loading) {
      const element = rowRefs.current.get(selectedToolCallId);
      if (element) {
        // Use setTimeout to ensure the table has fully rendered
        setTimeout(() => {
          scrollToEntity(element);
        }, 100);
      }
    }
  }, [selectedToolCallId, loading, scrollToEntity]);

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

  // Calculate token count helper
  const calculateTokens = (toolInput: string, toolOutput: string | null) => {
    const inputTokens = estimateTokens(toolInput);
    const outputTokens = estimateTokens(toolOutput);
    return inputTokens + outputTokens;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Single-line Filter Bar */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 flex-nowrap">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <Search
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => filters.setSearch(e.target.value)}
              inputClassName="h-9"
            />
          </div>

          {/* Status Filter */}
          <CheckboxDropdown
            label="Status"
            placeholder="Status"
            items={STATUS_OPTIONS}
            selectedIds={filters.status as string[]}
            onChange={handleStatusChange}
            className="w-[130px] h-9"
          />

          {/* Tool Filter */}
          <CheckboxDropdown
            label="Tool"
            placeholder="Tool"
            items={toolOptions}
            selectedIds={filters.toolIds}
            onChange={filters.setToolIds}
            className="w-[130px] h-9"
          />

          {/* Runtime Filter */}
          <CheckboxDropdown
            label="Runtime"
            placeholder="Runtime"
            items={runtimeOptions}
            selectedIds={filters.runtimeIds}
            onChange={filters.setRuntimeIds}
            className="w-[130px] h-9"
          />

          {/* Sort (icon-only) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.direction}
                  onClick={() => handleSortChange(option.direction)}
                  className={cn(currentSort?.direction === option.direction && 'bg-accent')}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Reset Filters */}
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={filters.reset} className="h-9 px-2">
              <X className="h-4 w-4" />
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Tokens
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {toolCalls.map((call) => (
                <tr
                  key={call.id}
                  ref={(el) => {
                    if (el) {
                      rowRefs.current.set(call.id, el);
                    } else {
                      rowRefs.current.delete(call.id);
                    }
                  }}
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
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{call.isTest ? 'Test' : ''} {call.calledBy?.name}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(call.calledAt)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {calculateDuration(call.calledAt, call.completedAt)
                      ? `${calculateDuration(call.calledAt, call.completedAt)}ms`
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">
                            {formatTokenCount(calculateTokens(call.toolInput, call.toolOutput))}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {formatTokenCountExact(calculateTokens(call.toolInput, call.toolOutput))}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
