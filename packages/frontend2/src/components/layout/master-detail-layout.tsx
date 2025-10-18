/**
 * MasterDetailLayout Component
 *
 * WHY: Reusable layout for pages with table (2/3 width) + detail panel (1/3 width).
 * Used by Servers, Tools, and Agents pages to maintain consistent UX.
 *
 * ARCHITECTURE:
 * - Grid-based layout with responsive columns (full width)
 * - Left panel: Table with search/filters (scrollable, fills height)
 * - Right panel: Detail view (scrollable, fills height)
 * - Empty state when no item selected
 * - Close button to dismiss detail panel
 * - Proper overflow handling for both panels
 * - Always reaches bottom of screen with proper margins
 *
 * USAGE:
 * ```tsx
 * <MasterDetailLayout
 *   table={<ServerTable />}
 *   detail={selectedServer ? <ServerDetail server={selectedServer} /> : null}
 *   onCloseDetail={() => setSelectedServer(null)}
 * />
 * ```
 */

import * as React from 'react';
import { X, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface MasterDetailLayoutProps {
  table: React.ReactNode;
  detail: React.ReactNode;
  className?: string;
  onCloseDetail?: () => void;
}

export function MasterDetailLayout({ table, detail, className, onCloseDetail }: MasterDetailLayoutProps) {
  return (
    <div className={cn('h-full flex flex-col min-h-0', className)}>
      {/* Grid container that fills remaining height and full width */}
      <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Left Panel - Table (2/3 width on large screens) */}
        <div className="lg:col-span-2 flex flex-col min-h-0">
          <div className="h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-auto">
            {table}
          </div>
        </div>

        {/* Right Panel - Detail (1/3 width on large screens) */}
        <div className="lg:col-span-1 flex flex-col min-h-0">
          <div className="relative h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-auto">
            {detail ? (
              <>
                {/* Close button - positioned absolutely in top-right */}
                {onCloseDetail && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onCloseDetail}
                    className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Close detail panel"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                {detail}
              </>
            ) : (
              <div className="h-full flex items-center justify-center p-6">
                <div className="text-center">
                  <div className="flex justify-center mb-3">
                    <List className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Select an item to view details
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
