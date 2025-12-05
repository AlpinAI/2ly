/**
 * ToolTable Component
 *
 * WHY: Displays MCP tools in a table with search and filters.
 * Used by Tools Page as the master list.
 *
 * COLUMNS:
 * - Name & Description
 * - Server
 * - # Skills
 * - Status
 *
 * FEATURES:
 * - Search by name/description
 * - Filter by server(s), skill(s)
 * - Click row to select
 * - Highlight selected row
 */

import { useEffect, useRef } from 'react';
import { Search } from '@/components/ui/search';
import { CheckboxDropdown } from '@/components/ui/checkbox-dropdown';
import { Button } from '@/components/ui/button';
import { X, Wrench } from 'lucide-react';
import type { ToolItem } from '@/types/tools';
import { useScrollToEntity } from '@/hooks/useScrollToEntity';

export interface ToolTableProps {
  items: ToolItem[];
  selectedItemId: string | null;
  onSelectItem: (itemId: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  serverFilter: string[];
  onServerFilterChange: (serverIds: string[]) => void;
  skillFilter: string[];
  onSkillFilterChange: (skillIds: string[]) => void;
  availableServers: Array<{ id: string; name: string }>;
  availableSkills: Array<{ id: string; name: string }>;
  loading?: boolean;
}

export function ToolTable({
  items,
  selectedItemId,
  onSelectItem,
  search,
  onSearchChange,
  serverFilter,
  onServerFilterChange,
  skillFilter,
  onSkillFilterChange,
  availableServers,
  availableSkills,
  loading,
}: ToolTableProps) {
  const scrollToEntity = useScrollToEntity();
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  const hasActiveFilters = search.length > 0 || serverFilter.length > 0 || skillFilter.length > 0;

  // Scroll to selected entity when ID changes and element is ready
  useEffect(() => {
    if (selectedItemId && !loading) {
      const element = rowRefs.current.get(selectedItemId);
      if (element) {
        setTimeout(() => {
          scrollToEntity(element);
        }, 100);
      }
    }
  }, [selectedItemId, loading, scrollToEntity]);

  const handleClearFilters = () => {
    onSearchChange('');
    onServerFilterChange([]);
    onSkillFilterChange([]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with Search and Filters */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
        <Search placeholder="Search tools..." value={search} onChange={(e) => onSearchChange(e.target.value)} />

        <div className="flex flex-wrap gap-2">
          <CheckboxDropdown
            label="Server"
            placeholder="All servers"
            items={availableServers.map((s) => ({ id: s.id, label: s.name }))}
            selectedIds={serverFilter}
            onChange={onServerFilterChange}
          />

          <CheckboxDropdown
            label="Skill"
            placeholder="All skills"
            items={availableSkills.map((ts) => ({ id: ts.id, label: ts.name }))}
            selectedIds={skillFilter}
            onChange={onSkillFilterChange}
          />

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 flex flex-col min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Loading tools...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters ? 'No tools match your filters' : 'No tools found'}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto">
              <table className="w-full border-separate border-spacing-0">
                <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Server
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Skills
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      ref={(el) => {
                        if (el) {
                          rowRefs.current.set(item.id, el);
                        } else {
                          rowRefs.current.delete(item.id);
                        }
                      }}
                      onClick={() => onSelectItem(item.id)}
                      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        selectedItemId === item.id ? 'bg-cyan-50 dark:bg-cyan-900/20' : ''
                      }`}
                    >
                      {/* Name Column */}
                      <td
                        className={`px-4 py-3 text-sm ${
                          selectedItemId === item.id ? 'border-l-4 border-cyan-500 pl-3' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 max-w-md">
                              {item.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Server Column */}
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{item.mcpServer.name}</td>
                      {/* Skills Column */}
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{item.skills?.length || 0}</td>
                      {/* Status Column */}
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            item.status === 'ACTIVE'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer with count - now at bottom of table panel */}
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Showing {items.length} {items.length === 1 ? 'tool' : 'tools'}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
