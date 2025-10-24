/**
 * SettingsSection Component
 *
 * WHY: Reusable container for all settings sections to maintain consistent styling.
 *
 * WHAT IT PROVIDES:
 * - Card-style container with consistent spacing
 * - Section header with icon
 * - Optional description text
 * - Consistent styling across all settings sections
 */

import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsSectionProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}

export function SettingsSection({
  title,
  description,
  icon: Icon,
  children,
  className,
  headerAction,
}: SettingsSectionProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm',
        className
      )}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
        {headerAction && <div>{headerAction}</div>}
      </div>

      {/* Optional Description */}
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {description}
        </p>
      )}

      {/* Section Content */}
      {children}
    </div>
  );
}
