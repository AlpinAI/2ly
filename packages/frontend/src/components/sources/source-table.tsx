/**
 * SourceTable Component
 *
 * WHY: Displays sources (MCP servers, REST APIs) in a unified table with search and filters.
 * Used by Sources Page as the master list.
 *
 * COLUMNS:
 * - Name
 * - Type (MCP Server, REST API)
 * - Transport (STREAM, STDIO, SSE) - MCP only
 * - Run On (AGENT, EDGE) - MCP only
 * - # Tools
 *
 * FEATURES:
 * - Search by name/description
 * - Filter by type, transport, runOn, agent
 * - Click row to select
 * - Highlight selected row
 * - Conditional columns based on source type
 */

import { useEffect, useRef } from 'react';
import { Search } from '@/components/ui/search';
import { CheckboxDropdown } from '@/components/ui/checkbox-dropdown';
import { Button } from '@/components/ui/button';
import { X, Server, Globe } from 'lucide-react';
import { SOURCE_TYPE_OPTIONS, SOURCE_TYPE_LABELS, SourceType, type Source } from '@/types/sources';
import { useScrollToEntity } from '@/hooks/useScrollToEntity';

export interface SourceTableProps {
  sources: Source[];
  selectedSourceId: string | null;
  onSelectSource: (sourceId: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  typeFilter: string[];
  onTypeFilterChange: (types: string[]) => void;
  transportFilter: string[];
  onTransportFilterChange: (transports: string[]) => void;
  runOnFilter: string[];
  onRunOnFilterChange: (runOns: string[]) => void;
  agentFilter: string[];
  onAgentFilterChange: (agentIds: string[]) => void;
  availableAgents: Array<{ id: string; name: string }>;
  loading?: boolean;
}

const TRANSPORT_OPTIONS = [
  { id: 'STREAM', label: 'Stream' },
  { id: 'STDIO', label: 'STDIO' },
  { id: 'SSE', label: 'SSE' },
];

const RUN_ON_OPTIONS = [
  { id: 'AGENT', label: 'Agent' },
  { id: 'EDGE', label: 'Edge' },
];

export function SourceTable({
  sources,
  selectedSourceId,
  onSelectSource,
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  transportFilter,
  onTransportFilterChange,
  runOnFilter,
  onRunOnFilterChange,
  agentFilter,
  onAgentFilterChange,
  availableAgents,
  loading,
}: SourceTableProps) {
  const scrollToEntity = useScrollToEntity();
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  const hasActiveFilters =
    search.length > 0 ||
    typeFilter.length > 0 ||
    transportFilter.length > 0 ||
    runOnFilter.length > 0 ||
    agentFilter.length > 0;

  // Scroll to selected entity when ID changes and element is ready
  useEffect(() => {
    if (selectedSourceId && !loading) {
      const element = rowRefs.current.get(selectedSourceId);
      if (element) {
        setTimeout(() => {
          scrollToEntity(element);
        }, 100);
      }
    }
  }, [selectedSourceId, loading, scrollToEntity]);

  const handleClearFilters = () => {
    onSearchChange('');
    onTypeFilterChange([]);
    onTransportFilterChange([]);
    onRunOnFilterChange([]);
    onAgentFilterChange([]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with Search and Filters */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
        <Search
          placeholder="Search sources..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />

        <div className="flex flex-wrap gap-2">
          <CheckboxDropdown
            label="Type"
            placeholder="All types"
            items={SOURCE_TYPE_OPTIONS}
            selectedIds={typeFilter}
            onChange={onTypeFilterChange}
          />

          <CheckboxDropdown
            label="Transport"
            placeholder="All transports"
            items={TRANSPORT_OPTIONS}
            selectedIds={transportFilter}
            onChange={onTransportFilterChange}
          />

          <CheckboxDropdown
            label="Run On"
            placeholder="All locations"
            items={RUN_ON_OPTIONS}
            selectedIds={runOnFilter}
            onChange={onRunOnFilterChange}
          />

          <CheckboxDropdown
            label="Skill"
            placeholder="All skills"
            items={availableAgents.map((a) => ({ id: a.id, label: a.name }))}
            selectedIds={agentFilter}
            onChange={onAgentFilterChange}
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
            <p className="text-sm text-muted-foreground">Loading sources...</p>
          </div>
        ) : sources.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters ? 'No sources match your filters' : 'No sources found'}
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
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Transport
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Run On
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tools
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {sources.map((source) => (
                    <tr
                      key={source.id}
                      ref={(el) => {
                        if (el) {
                          rowRefs.current.set(source.id, el);
                        } else {
                          rowRefs.current.delete(source.id);
                        }
                      }}
                      onClick={() => onSelectSource(source.id)}
                      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        selectedSourceId === source.id
                          ? 'bg-cyan-50 dark:bg-cyan-900/20'
                          : ''
                      }`}
                    >
                      <td className={`px-4 py-3 text-sm ${
                        selectedSourceId === source.id ? 'border-l-4 border-cyan-500 pl-3' : ''
                      }`}>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {source.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {source.description}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          source.type === SourceType.MCP_SERVER
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        }`}>
                          {source.type === SourceType.MCP_SERVER ? (
                            <Server className="h-3 w-3" />
                          ) : (
                            <Globe className="h-3 w-3" />
                          )}
                          {SOURCE_TYPE_LABELS[source.type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {source.type === SourceType.MCP_SERVER && 'transport' in source ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            {source.transport}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {source.type === SourceType.MCP_SERVER && 'runOn' in source ? (
                          source.runOn ? (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                              {source.runOn}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                          )
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {source.type === SourceType.MCP_SERVER && 'tools' in source ? source.tools?.length || 0 : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Footer with count - now at bottom of table panel */}
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Showing {sources.length} {sources.length === 1 ? 'source' : 'sources'}
              </p>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
