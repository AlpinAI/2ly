/**
 * Search Input Component
 *
 * WHY: Global search input with keyboard shortcut hint.
 * Reusable search component for header and other locations.
 *
 * DESIGN: Based on input.tsx with search-specific styling.
 */

import * as React from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Show keyboard shortcut hint (e.g., "⌘K")
   */
  showShortcut?: boolean;
  /**
   * Custom shortcut text
   */
  shortcutText?: string;
}

const Search = React.forwardRef<HTMLInputElement, SearchProps>(
  ({ className, showShortcut = false, shortcutText = '⌘K', ...props }, ref) => {
    return (
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          className={cn(
            'flex h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            showShortcut && 'pr-12',
            className
          )}
          ref={ref}
          {...props}
        />
        {showShortcut && (
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            {shortcutText}
          </kbd>
        )}
      </div>
    );
  }
);
Search.displayName = 'Search';

export { Search };
