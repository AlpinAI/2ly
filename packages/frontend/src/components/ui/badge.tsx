/**
 * Badge Component
 *
 * WHY: Small label component for tags, statuses, and indicators.
 * Simple implementation following Radix UI patterns.
 */

import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'error';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        {
          'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900': variant === 'default',
          'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100': variant === 'secondary',
          'border border-gray-300 bg-transparent text-gray-700 dark:border-gray-600 dark:text-gray-300':
            variant === 'outline',
          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400': variant === 'success',
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400': variant === 'warning',
          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400': variant === 'error',
        },
        className
      )}
      {...props}
    />
  );
}
