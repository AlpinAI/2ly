/**
 * RuntimeConnectionStatus Component
 *
 * WHY: Displays real-time connection status of all runtimes/tool sets.
 * Provides quick visual health check of system connectivity.
 *
 * FEATURES:
 * - Visual status indicators (green/red dots)
 * - Runtime names with last-seen timestamps
 * - Grouped by status (active/inactive)
 * - Loading states
 * - Empty state handling
 */

import { Server, Circle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export interface RuntimeStatus {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  lastSeenAt: Date | null;
}

export interface RuntimeConnectionStatusProps {
  runtimes: RuntimeStatus[];
  loading?: boolean;
  className?: string;
}

export function RuntimeConnectionStatus({ runtimes, loading, className }: RuntimeConnectionStatusProps) {
  if (loading) {
    return (
      <div
        className={cn(
          'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6',
          className
        )}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Server className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          Runtime Connection Status
        </h3>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!runtimes || runtimes.length === 0) {
    return (
      <div
        className={cn(
          'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6',
          'animate-in fade-in slide-in-from-bottom-2 duration-500',
          className
        )}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Server className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          Runtime Connection Status
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
          No tool sets configured
        </p>
      </div>
    );
  }

  const activeRuntimes = runtimes.filter((r) => r.status === 'ACTIVE');
  const inactiveRuntimes = runtimes.filter((r) => r.status === 'INACTIVE');

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6',
        'animate-in fade-in slide-in-from-bottom-2 duration-500',
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Server className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          Runtime Connection Status
        </h3>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <Circle className="h-3 w-3 fill-green-500 text-green-500" />
            <span className="text-gray-600 dark:text-gray-400">{activeRuntimes.length} Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Circle className="h-3 w-3 fill-gray-400 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">{inactiveRuntimes.length} Inactive</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {/* Active Runtimes */}
        {activeRuntimes.length > 0 && (
          <div className="space-y-2">
            {activeRuntimes.map((runtime) => (
              <div
                key={runtime.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30"
              >
                <Circle className="h-3 w-3 fill-green-500 text-green-500 flex-shrink-0 animate-pulse" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {runtime.name}
                  </p>
                  {runtime.lastSeenAt && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      <Clock className="h-3 w-3" />
                      Active {formatDistanceToNow(new Date(runtime.lastSeenAt), { addSuffix: true })}
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium text-green-700 dark:text-green-400 flex-shrink-0">
                  Connected
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Inactive Runtimes */}
        {inactiveRuntimes.length > 0 && (
          <div className="space-y-2">
            {inactiveRuntimes.map((runtime) => (
              <div
                key={runtime.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700"
              >
                <Circle className="h-3 w-3 fill-gray-400 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {runtime.name}
                  </p>
                  {runtime.lastSeenAt && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      <Clock className="h-3 w-3" />
                      Last seen {formatDistanceToNow(new Date(runtime.lastSeenAt), { addSuffix: true })}
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">
                  Disconnected
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
