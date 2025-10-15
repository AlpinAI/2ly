/**
 * DashboardPage Component
 *
 * WHY: Demonstrates centralized runtime management via Zustand store.
 *
 * WHAT IT SHOWS:
 * 1. Runtime data from Zustand store (centralized subscription)
 * 2. Real-time updates without duplicate subscriptions
 * 3. Loading and error states
 * 4. Clean separation of concerns
 *
 * ARCHITECTURE:
 * - Runtime data comes from Zustand store (updated via subscription in WorkspaceLoader)
 * - No direct Apollo Client usage in components
 * - ErrorBoundary handles subscription errors
 * - Uses AppLayout (header + navigation provided automatically)
 */

import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRuntimeData } from '@/stores/runtimeStore';
import { useOnboarding } from '@/hooks/useOnboarding';
import { OnboardingSection } from '@/components/onboarding/onboarding-section';

export default function DashboardPage() {
  // WHY: Get runtimes from Zustand store (centralized runtime management)
  // Data is updated in real-time via subscription in WorkspaceLoader
  const { runtimes, stats, loading, error } = useRuntimeData();
  
  // WHY: Get onboarding steps for new users
  const { visibleSteps } = useOnboarding();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Onboarding Section - only shown with visible steps */}
      {visibleSteps.length > 0 && (
        <OnboardingSection steps={visibleSteps} />
      )}
      
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Dashboard Overview
      </h2>

      {/* WHY: Show error state if GraphQL query fails */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Failed to load dashboard data
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {error.message}
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid - Real data from Apollo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* WHY: Total Runtimes from Zustand */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Runtimes</p>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          ) : (
            <p className="text-2xl font-bold text-cyan-600">{stats.total}</p>
          )}
        </div>

        {/* WHY: Active Runtimes from Apollo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Active Runtimes</p>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          ) : (
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          )}
        </div>

        {/* WHY: Inactive Runtimes from Apollo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Inactive Runtimes</p>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          ) : (
            <p className="text-2xl font-bold text-orange-600">{stats.inactive}</p>
          )}
        </div>

        {/* WHY: Placeholder for future metric */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Uptime</p>
          <p className="text-2xl font-bold text-purple-600">--</p>
        </div>
      </div>

      {/* Runtime List - Real data from Apollo */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Runtimes
          </h3>
          {loading && (
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          )}
        </div>

        {/* WHY: Show loading state on first load */}
        {loading && runtimes.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Loading runtimes...
            </span>
          </div>
        ) : runtimes.length === 0 ? (
          /* WHY: Empty state when no runtimes exist */
          <p className="text-gray-600 dark:text-gray-400 py-8 text-center">
            No runtimes found. Create your first runtime to get started.
          </p>
        ) : (
          /* WHY: Display runtime list from Apollo cache */
          <div className="space-y-2">
            {runtimes.map((runtime) => (
              <div
                key={runtime.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full',
                      runtime.status === 'ACTIVE'
                        ? 'bg-green-500'
                        : 'bg-gray-400'
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {runtime.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {runtime.id}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={cn(
                      'text-xs font-medium px-2 py-1 rounded',
                      runtime.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                    )}
                  >
                    {runtime.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
