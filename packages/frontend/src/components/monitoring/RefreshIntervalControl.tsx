/**
 * RefreshIntervalControl Component
 *
 * WHY: Allows users to control the auto-refresh polling interval.
 * Provides options to refresh at different intervals or disable auto-refresh.
 *
 * FEATURES:
 * - Predefined intervals: 5s, 10s, 30s, 60s
 * - Option to disable auto-refresh
 * - Shows current interval selection
 */

import { RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RefreshIntervalControlProps {
  interval: number;
  onChange: (interval: number) => void;
}

const INTERVAL_OPTIONS = [
  { value: '0', label: 'Off' },
  { value: '5000', label: '5 seconds' },
  { value: '10000', label: '10 seconds' },
  { value: '30000', label: '30 seconds' },
  { value: '60000', label: '60 seconds' },
];

export function RefreshIntervalControl({ interval, onChange }: RefreshIntervalControlProps) {
  const handleChange = (value: string) => {
    onChange(parseInt(value, 10));
  };

  return (
    <div className="flex items-center gap-2">
      <RefreshCw className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      <span className="text-sm text-gray-600 dark:text-gray-400">Auto-refresh:</span>
      <Select value={interval.toString()} onValueChange={handleChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {INTERVAL_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
