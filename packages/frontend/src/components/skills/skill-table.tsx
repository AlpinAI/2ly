/**
 * SkillTable Component
 *
 * WHY: Displays skills in a table with search and filters.
 * Used by Skills Page as the master list.
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
import type { SubscribeSkillsSubscription } from '@/graphql/generated/graphql';
import { useScrollToEntity } from '@/hooks/useScrollToEntity';

type Skill = NonNullable<SubscribeSkillsSubscription['skills']>[number];

export interface SkillTableProps {
  skills: Skill[];
  selectedSkillId: string | null;
  onSelectSkill: (skillId: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  loading?: boolean;
}

export function SkillTable({
  skills,
  selectedSkillId,
  onSelectSkill,
  search,
  onSearchChange,
  loading,
}: SkillTableProps) {
  const scrollToEntity = useScrollToEntity();
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  const hasActiveFilters = search.length > 0;
  const { setOpen: setManageToolsOpen, setSelectedSkillId } = useManageToolsDialog();

  // Scroll to selected entity when ID changes and element is ready
  useEffect(() => {
    if (selectedSkillId && !loading) {
      const element = rowRefs.current.get(selectedSkillId);
      if (element) {
        setTimeout(() => {
          scrollToEntity(element);
        }, 100);
      }
    }
  }, [selectedSkillId, loading, scrollToEntity]);

  const handleClearFilters = () => {
    onSearchChange('');
  };

  const handleManageToolsClick = (e: React.MouseEvent, skillId: string) => {
    e.stopPropagation();
    setSelectedSkillId(skillId);
    setManageToolsOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with Search and Filters */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
        <Search
          placeholder="Search skills..."
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
            <p className="text-sm text-muted-foreground">Loading skills...</p>
          </div>
        ) : skills.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters ? 'No skills match your filters' : 'No skills found'}
              </p>
            </div>
          </div>
        ) : (
          <table className="w-full border-separate border-spacing-0">
            <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Skill
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
              {skills.map((skill) => {
                return (
                  <tr
                    key={skill.id}
                    ref={(el) => {
                      if (el) {
                        rowRefs.current.set(skill.id, el);
                      } else {
                        rowRefs.current.delete(skill.id);
                      }
                    }}
                    onClick={() => onSelectSkill(skill.id)}
                    className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selectedSkillId === skill.id ? 'bg-cyan-50 dark:bg-cyan-900/20' : ''
                    }`}
                  >
                    <td
                      className={`px-4 py-3 text-sm ${
                        selectedSkillId === skill.id ? 'border-l-4 border-cyan-500 pl-3' : ''
                      }`}
                    >
                      <div className="skill-name font-medium text-gray-900 dark:text-white">{skill.name}</div>
                      {skill.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-md">
                          {skill.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {skill.mcpTools?.length || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleManageToolsClick(e, skill.id)}
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
      {!loading && skills.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing {skills.length} {skills.length === 1 ? 'skill' : 'skills'}
          </p>
        </div>
      )}
    </div>
  );
}
