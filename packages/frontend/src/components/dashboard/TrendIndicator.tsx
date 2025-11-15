/**
 * TrendIndicator Component
 *
 * WHY: Displays trend information with visual indicators (arrows and percentages).
 * Used in metric cards to show changes over time.
 *
 * FEATURES:
 * - Up/down arrow icons based on trend direction
 * - Color coding (green for positive, red for negative)
 * - Percentage display with formatting
 * - Optional neutral state for zero change
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TrendIndicatorProps {
  value: number;
  className?: string;
  /** If true, positive trends are red and negative are green (e.g., for error rates) */
  inverse?: boolean;
}

export function TrendIndicator({ value, className, inverse = false }: TrendIndicatorProps) {
  const isPositive = value > 0;
  const isNeutral = value === 0;

  // Determine color based on direction and inverse flag
  const colorClass = isNeutral
    ? 'text-gray-500 dark:text-gray-400'
    : isPositive
      ? inverse
        ? 'text-red-600 dark:text-red-400'
        : 'text-green-600 dark:text-green-400'
      : inverse
        ? 'text-green-600 dark:text-green-400'
        : 'text-red-600 dark:text-red-400';

  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

  return (
    <div className={cn('flex items-center gap-1', colorClass, className)}>
      <Icon className="h-3 w-3" />
      <span className="text-xs font-medium">
        {isNeutral ? '0%' : `${Math.abs(value).toFixed(1)}%`}
      </span>
    </div>
  );
}
