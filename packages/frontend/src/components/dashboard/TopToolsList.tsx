/**
 * TopToolsList Component
 *
 * WHY: Displays top tools by call volume or error rate for quick insights.
 * Helps identify most used tools or problematic tools requiring attention.
 *
 * FEATURES:
 * - Ranked list with visual indicators
 * - Success/error counts with color coding
 * - Loading and empty states
 * - Responsive layout
 */

import { TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToolStat {
  name: string;
  count: number;
  successRate?: number;
  errorRate?: number;
}

export interface TopToolsListProps {
  title: string;
  tools: ToolStat[];
  type: 'usage' | 'problems';
  loading?: boolean;
  className?: string;
}

export function TopToolsList({ title, tools, type, loading, className }: TopToolsListProps) {
  const Icon = type === 'usage' ? TrendingUp : AlertTriangle;
  const iconColor = type === 'usage' ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400';

  if (loading) {
    return (
      <div
        className={cn(
          'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6',
          className
        )}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Icon className={cn('h-5 w-5', iconColor)} />
          {title}
        </h3>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!tools || tools.length === 0) {
    return (
      <div
        className={cn(
          'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6',
          'animate-in fade-in slide-in-from-bottom-2 duration-500',
          className
        )}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Icon className={cn('h-5 w-5', iconColor)} />
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
          {type === 'usage' ? 'No tool usage data available' : 'No problematic tools detected'}
        </p>
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
        <Icon className={cn('h-5 w-5', iconColor)} />
        {title}
      </h3>

      <div className="space-y-3">
        {tools.map((tool, index) => {
          const maxCount = tools[0].count;
          const percentage = (tool.count / maxCount) * 100;

          return (
            <div key={tool.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-medium text-gray-500 dark:text-gray-400 w-5 flex-shrink-0">
                    #{index + 1}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white truncate">
                    {tool.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-gray-600 dark:text-gray-400">
                    {tool.count} {type === 'usage' ? 'calls' : 'errors'}
                  </span>
                  {tool.errorRate !== undefined && (
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        tool.errorRate > 20
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          : tool.errorRate > 10
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      )}
                    >
                      {tool.errorRate.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    type === 'usage'
                      ? 'bg-blue-500'
                      : tool.errorRate && tool.errorRate > 20
                        ? 'bg-red-500'
                        : tool.errorRate && tool.errorRate > 10
                          ? 'bg-orange-500'
                          : 'bg-yellow-500'
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
