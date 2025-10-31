/**
 * AgentTable Component
 *
 * WHY: Displays agent runtimes in a table with search and filters.
 * Used by Agents Page as the master list.
 *
 * COLUMNS:
 * - Name & Description
 * - Status (Active/Inactive)
 * - # Tools
 * - # Servers
 *
 * FEATURES:
 * - Search by name/description/tool names
 * - Filter by server(s), status
 * - Click row to select
 * - Highlight selected row
 */

import { useEffect, useRef } from 'react';
import { Search } from '@/components/ui/search';
import { CheckboxDropdown } from '@/components/ui/checkbox-dropdown';
import { Button } from '@/components/ui/button';
import { X, Cable, Settings } from 'lucide-react';
import { useManageToolsDialog, useConnectAgentDialog } from '@/stores/uiStore';
import type { SubscribeRuntimesSubscription } from '@/graphql/generated/graphql';
import { useScrollToEntity } from '@/hooks/useScrollToEntity';

type Runtime = NonNullable<SubscribeRuntimesSubscription['runtimes']>[number];

export interface AgentTableProps {
  agents: Runtime[];
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  serverFilter: string[];
  onServerFilterChange: (serverIds: string[]) => void;
  statusFilter: string[];
  onStatusFilterChange: (statuses: string[]) => void;
  availableServers: Array<{ id: string; name: string }>;
  loading?: boolean;
}

const STATUS_OPTIONS = [
  { id: 'ACTIVE', label: 'Active' },
  { id: 'INACTIVE', label: 'Inactive' },
];

export function AgentTable({
  agents,
  selectedAgentId,
  onSelectAgent,
  search,
  onSearchChange,
  serverFilter,
  onServerFilterChange,
  statusFilter,
  onStatusFilterChange,
  availableServers,
  loading,
}: AgentTableProps) {
  const scrollToEntity = useScrollToEntity();
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  const hasActiveFilters = search.length > 0 || serverFilter.length > 0 || statusFilter.length > 0;
  const { setOpen: setManageToolsOpen, setSelectedToolSetId } = useManageToolsDialog();
  const { setOpen: setConnectDialogOpen, setSelectedAgentId } = useConnectAgentDialog();

  // Scroll to selected entity when ID changes and element is ready
  useEffect(() => {
    if (selectedAgentId && !loading) {
      const element = rowRefs.current.get(selectedAgentId);
      if (element) {
        setTimeout(() => {
          scrollToEntity(element);
        }, 100);
      }
    }
  }, [selectedAgentId, loading, scrollToEntity]);

  const handleClearFilters = () => {
    onSearchChange('');
    onServerFilterChange([]);
    onStatusFilterChange([]);
  };

  const handleConnectClick = (e: React.MouseEvent, agentId: string) => {
    e.stopPropagation();
    setSelectedAgentId(agentId);
    setConnectDialogOpen(true);
  };

  const handleManageToolsClick = (e: React.MouseEvent, agentId: string) => {
    e.stopPropagation();
    setSelectedToolSetId(agentId);
    setManageToolsOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with Search and Filters */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
        <Search
          placeholder="Search tool sets..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />

        <div className="flex flex-wrap gap-2">
          <CheckboxDropdown
            label="Server"
            placeholder="All servers"
            items={availableServers.map((s) => ({ id: s.id, label: s.name }))}
            selectedIds={serverFilter}
            onChange={onServerFilterChange}
          />

          <CheckboxDropdown
            label="Status"
            placeholder="All status"
            items={STATUS_OPTIONS}
            selectedIds={statusFilter}
            onChange={onStatusFilterChange}
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
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Loading agents...</p>
          </div>
        ) : agents.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters ? 'No agents match your filters' : 'No agents found'}
              </p>
            </div>
          </div>
        ) : (
          <table className="w-full border-separate border-spacing-0">
            <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tool Set
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
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
              {agents.map((agent) => (
                <tr
                  key={agent.id}
                  ref={(el) => {
                    if (el) {
                      rowRefs.current.set(agent.id, el);
                    } else {
                      rowRefs.current.delete(agent.id);
                    }
                  }}
                  onClick={() => onSelectAgent(agent.id)}
                  className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    selectedAgentId === agent.id
                      ? 'bg-cyan-50 dark:bg-cyan-900/20'
                      : ''
                  }`}
                >
                  <td className={`px-4 py-3 text-sm ${
                    selectedAgentId === agent.id ? 'border-l-4 border-cyan-500 pl-3' : ''
                  }`}>
                    <div className="font-medium text-gray-900 dark:text-white">{agent.name}</div>
                    {agent.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-md">
                        {agent.description}
                      </div>
                    )}
                    {agent.hostname && (
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {agent.hostname}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        agent.status === 'ACTIVE'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {agent.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {agent.mcpToolCapabilities?.length || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleConnectClick(e, agent.id)}
                        className="h-7 w-7 p-0"
                        aria-label="Connect agent"
                      >
                        <Cable className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleManageToolsClick(e, agent.id)}
                        className="h-7 w-7 p-0"
                        aria-label="Manage tools"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer with count */}
      {!loading && agents.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing {agents.length} {agents.length === 1 ? 'tool set' : 'tool sets'}
          </p>
        </div>
      )}
    </div>
  );
}
