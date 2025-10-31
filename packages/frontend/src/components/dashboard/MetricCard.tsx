/**
 * MetricCard Component
 *
 * WHY: Reusable card component for displaying key metrics on the dashboard.
 * Provides consistent styling and layout for metrics with icons, values, and trends.
 *
 * FEATURES:
 * - Icon support with customizable colors
 * - Large value display with loading state
 * - Optional trend indicator
 * - Optional subtitle/description
 * - Hover effects and animations
 * - Dark mode support
 */

import { type LucideIcon, Loader2 } from 'lucide-react';
import { TrendIndicator } from './TrendIndicator';
import { cn } from '@/lib/utils';

export interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  /** Tailwind color classes for icon background (e.g., 'bg-cyan-100 dark:bg-cyan-900/30') */
  iconBgColor?: string;
  /** Tailwind color classes for icon (e.g., 'text-cyan-600 dark:text-cyan-400') */
  iconColor?: string;
  /** Tailwind color classes for value (e.g., 'text-cyan-600') */
  valueColor?: string;
  trend?: number;
  /** If true, positive trends show as red (useful for error metrics) */
  inverseTrend?: boolean;
  subtitle?: string;
  loading?: boolean;
  className?: string;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  iconBgColor = 'bg-gray-100 dark:bg-gray-800',
  iconColor = 'text-gray-600 dark:text-gray-400',
  valueColor = 'text-gray-900 dark:text-white',
  trend,
  inverseTrend,
  subtitle,
  loading,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm',
        'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
        'animate-in fade-in slide-in-from-bottom-2 duration-500',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn('p-2 rounded-lg', iconBgColor)}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
        {trend !== undefined && <TrendIndicator value={trend} inverse={inverseTrend} />}
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>

      {loading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
        </div>
      ) : (
        <>
          <p className={cn('text-3xl font-bold', valueColor)}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </>
      )}
    </div>
  );
}
