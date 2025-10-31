/**
 * TimeRangeSelector Component
 *
 * WHY: Allows users to switch between different time ranges for dashboard metrics.
 * Provides a pill-style toggle interface for 24h/7d/30d selection.
 *
 * FEATURES:
 * - Pill-style button group with active state highlighting
 * - Keyboard navigation support
 * - Callback for time range changes
 * - Accessible with ARIA labels
 */

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type TimeRange = '24h' | '7d' | '30d';

export interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  className?: string;
}

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '24h', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
];

export function TimeRangeSelector({ value, onChange, className }: TimeRangeSelectorProps) {
  return (
    <div
      className={cn('inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1', className)}
      role="group"
      aria-label="Time range selector"
    >
      {TIME_RANGE_OPTIONS.map((option) => (
        <Button
          key={option.value}
          variant="ghost"
          size="sm"
          onClick={() => onChange(option.value)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium transition-all',
            value === option.value
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
          )}
          aria-pressed={value === option.value}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
