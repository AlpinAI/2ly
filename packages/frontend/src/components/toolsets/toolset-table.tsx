/**
 * ToolsetTable Component
 *
 * WHY: Displays toolsets in a table with search and filters.
 * Used by Toolsets Page as the master list.
 *
 * COLUMNS:
 * - Name & Description
 * - # Tools
 *
 * FEATURES:
 * - Search by name/description/tool names
 * - Click row to select
 * - Highlight selected row
 */

import { useEffect, useRef } from 'react';
import { Search } from '@/components/ui/search';
import { Button } from '@/components/ui/button';
import { X, Settings } from 'lucide-react';
import { useManageToolsDialog } from '@/stores/uiStore';
import type { SubscribeToolSetsSubscription } from '@/graphql/generated/graphql';
import { useScrollToEntity } from '@/hooks/useScrollToEntity';

type ToolSet = NonNullable<SubscribeToolSetsSubscription['toolSets']>[number];

export interface ToolsetTableProps {
  toolSets: ToolSet[];
  selectedToolsetId: string | null;
  onSelectToolSet: (toolSetId: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  loading?: boolean;
}

export function ToolsetTable({
  toolSets,
  selectedToolsetId,
  onSelectToolSet,
  search,
  onSearchChange,
  loading,
}: ToolsetTableProps) {
  const scrollToEntity = useScrollToEntity();
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  const hasActiveFilters = search.length > 0;
  const { setOpen: setManageToolsOpen, setSelectedToolsetId } = useManageToolsDialog();

  // Scroll to selected entity when ID changes and element is ready
  useEffect(() => {
    if (selectedToolsetId && !loading) {
      const element = rowRefs.current.get(selectedToolsetId);
      if (element) {
        setTimeout(() => {
          scrollToEntity(element);
        }, 100);
      }
    }
  }, [selectedToolsetId, loading, scrollToEntity]);

  const handleClearFilters = () => {
    onSearchChange('');
  };

  const handleManageToolsClick = (e: React.MouseEvent, toolSetId: string) => {
    e.stopPropagation();
    setSelectedToolsetId(toolSetId);
    setManageToolsOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with Search and Filters */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
        <Search
          placeholder="Search toolsets..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Loading toolsets...</p>
          </div>
        ) : toolSets.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters ? 'No toolsets match your filters' : 'No toolsets found'}
              </p>
            </div>
          </div>
        ) : (
          <table className="w-full border-separate border-spacing-0">
            <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Toolset
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tools
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {toolSets.map((toolSet) => {
                return (
                  <tr
                    key={toolSet.id}
                    ref={(el) => {
                      if (el) {
                        rowRefs.current.set(toolSet.id, el);
                      } else {
                        rowRefs.current.delete(toolSet.id);
                      }
                    }}
                    onClick={() => onSelectToolSet(toolSet.id)}
                    className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selectedToolsetId === toolSet.id ? 'bg-cyan-50 dark:bg-cyan-900/20' : ''
                    }`}
                  >
                    <td
                      className={`px-4 py-3 text-sm ${
                        selectedToolsetId === toolSet.id ? 'border-l-4 border-cyan-500 pl-3' : ''
                      }`}
                    >
                      <div className="tool-set-name font-medium text-gray-900 dark:text-white">{toolSet.name}</div>
                      {toolSet.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-md">
                          {toolSet.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {toolSet.mcpTools?.length || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleManageToolsClick(e, toolSet.id)}
                          className="h-7 w-7 p-0"
                          aria-label="Manage tools"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer with count */}
      {!loading && toolSets.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing {toolSets.length} {toolSets.length === 1 ? 'toolset' : 'toolsets'}
          </p>
        </div>
      )}
    </div>
  );
}
