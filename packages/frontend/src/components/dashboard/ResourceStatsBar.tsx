/**
 * ResourceStatsBar Component
 *
 * WHY: Displays a horizontal overview of system resources (Sources, Tools, Tool Sets).
 * Provides quick access to resource counts with visual indicators.
 *
 * FEATURES:
 * - Icon-driven card layout
 * - Gradient backgrounds for visual appeal
 * - Loading states
 * - Responsive grid layout
 * - Dark mode support
 */

import { Database, Wrench, Grid3X3, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ResourceStats {
  sources: number;
  tools: number;
  toolSets: number;
}

export interface ResourceStatsBarProps {
  stats: ResourceStats;
  loading?: boolean;
  className?: string;
}

const RESOURCE_ITEMS = [
  {
    key: 'sources' as const,
    label: 'Sources',
    Icon: Database,
    bgGradient: 'from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-900/10',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    key: 'tools' as const,
    label: 'Tools',
    Icon: Wrench,
    bgGradient: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    key: 'toolSets' as const,
    label: 'Tool Sets',
    Icon: Grid3X3,
    bgGradient: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
];

export function ResourceStatsBar({ stats, loading, className }: ResourceStatsBarProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-4', className)}>
      {RESOURCE_ITEMS.map((item) => (
        <div
          key={item.key}
          className={cn(
            'rounded-lg border border-gray-200 dark:border-gray-700 p-4',
            'bg-gradient-to-br',
            item.bgGradient,
            'transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5',
            'animate-in fade-in slide-in-from-bottom-2 duration-500'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/80 dark:bg-gray-800/80 rounded-lg">
              <item.Icon className={cn('h-5 w-5', item.iconColor)} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">{item.label}</p>
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              ) : (
                <p className={cn('text-2xl font-bold', item.iconColor)}>{stats[item.key]}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
