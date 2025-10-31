/**
 * RecentErrorsTable Component
 *
 * WHY: Displays the most recent failed tool calls for quick issue identification.
 * Helps users identify and troubleshoot problems at a glance.
 *
 * FEATURES:
 * - Table layout with tool name, error message, time, and runtime
 * - Truncated error messages with hover tooltips
 * - Relative time display (e.g., "5 mins ago")
 * - Clickable rows for navigation to monitoring page
 * - Empty state for when no errors exist
 * - Loading state with skeleton
 * - Failed status badges
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle, Clock, Server, Wrench, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export interface RecentErrorsTableProps {
  errors: Array<{
    id: string;
    error: string | null;
    calledAt: Date;
    mcpTool: {
      id: string;
      name: string;
    };
    calledBy: {
      id: string;
      name: string;
    };
  }>;
  loading?: boolean;
  className?: string;
}

export function RecentErrorsTable({ errors, loading, className }: RecentErrorsTableProps) {
  const navigate = useNavigate();
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const handleRowClick = (errorId: string) => {
    navigate(`/monitoring?toolCallId=${errorId}`);
  };

  if (loading) {
    return (
      <div
        className={cn(
          'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6',
          className
        )}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          Recent Errors
        </h3>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!errors || errors.length === 0) {
    return (
      <div
        className={cn(
          'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6',
          'animate-in fade-in slide-in-from-bottom-2 duration-500',
          className
        )}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          Recent Errors
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
          <p className="text-gray-900 dark:text-white font-medium mb-1">All systems operational</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No errors detected in the selected time range
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6',
        'animate-in fade-in slide-in-from-bottom-2 duration-500',
        className
      )}
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
        Recent Errors
        <span className="ml-auto text-sm font-normal text-gray-500 dark:text-gray-400">
          Last 10
        </span>
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tool
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Error
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Time
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Runtime
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {errors.map((error) => {
              const isHovered = hoveredRow === error.id;
              const errorMessage = error.error || 'Unknown error';
              const truncatedError =
                errorMessage.length > 50 ? `${errorMessage.substring(0, 50)}...` : errorMessage;

              return (
                <tr
                  key={error.id}
                  onClick={() => handleRowClick(error.id)}
                  onMouseEnter={() => setHoveredRow(error.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={cn(
                    'border-b border-gray-100 dark:border-gray-700/50 transition-colors cursor-pointer',
                    isHovered
                      ? 'bg-gray-50 dark:bg-gray-700/50'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                  )}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleRowClick(error.id);
                    }
                  }}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                        {error.mcpTool.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="group relative">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {truncatedError}
                      </span>
                      {errorMessage.length > 50 && (
                        <div className="invisible group-hover:visible absolute z-10 left-0 top-full mt-1 p-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded shadow-lg max-w-md">
                          {errorMessage}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDistanceToNow(new Date(error.calledAt), { addSuffix: true })}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <Server className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
                        {error.calledBy.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs font-medium">
                      <AlertCircle className="h-3 w-3" />
                      Failed
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
