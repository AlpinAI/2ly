/**
 * ServerTable Component
 *
 * WHY: Displays MCP servers in a table with search and filters.
 * Used by Servers Page as the master list.
 *
 * COLUMNS:
 * - Name
 * - Transport (STREAM, STDIO, SSE)
 * - Run On (GLOBAL, AGENT, EDGE)
 * - # Tools
 *
 * FEATURES:
 * - Search by name/description
 * - Filter by transport, runOn, agent
 * - Click row to select
 * - Highlight selected row
 */

import { Search } from '@/components/ui/search';
import { CheckboxDropdown } from '@/components/ui/checkbox-dropdown';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { SubscribeMcpServersSubscription } from '@/graphql/generated/graphql';

type McpServer = NonNullable<SubscribeMcpServersSubscription['mcpServers']>[number];

export interface ServerTableProps {
  servers: McpServer[];
  selectedServerId: string | null;
  onSelectServer: (serverId: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
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
  { id: 'GLOBAL', label: 'Global' },
  { id: 'AGENT', label: 'Agent' },
  { id: 'EDGE', label: 'Edge' },
];

export function ServerTable({
  servers,
  selectedServerId,
  onSelectServer,
  search,
  onSearchChange,
  transportFilter,
  onTransportFilterChange,
  runOnFilter,
  onRunOnFilterChange,
  agentFilter,
  onAgentFilterChange,
  availableAgents,
  loading,
}: ServerTableProps) {
  const hasActiveFilters =
    search.length > 0 ||
    transportFilter.length > 0 ||
    runOnFilter.length > 0 ||
    agentFilter.length > 0;

  const handleClearFilters = () => {
    onSearchChange('');
    onTransportFilterChange([]);
    onRunOnFilterChange([]);
    onAgentFilterChange([]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with Search and Filters */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
        <Search
          placeholder="Search servers..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />

        <div className="flex flex-wrap gap-2">
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
            label="Agent"
            placeholder="All agents"
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
            <p className="text-sm text-muted-foreground">Loading servers...</p>
          </div>
        ) : servers.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters ? 'No servers match your filters' : 'No servers found'}
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
                  {servers.map((server) => (
                    <tr
                      key={server.id}
                      onClick={() => onSelectServer(server.id)}
                      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        selectedServerId === server.id
                          ? 'bg-cyan-50 dark:bg-cyan-900/20'
                          : ''
                      }`}
                    >
                      <td className={`px-4 py-3 text-sm ${
                        selectedServerId === server.id ? 'border-l-4 border-cyan-500 pl-3' : ''
                      }`}>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {server.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {server.description}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                          {server.transport}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {server.runOn ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                            {server.runOn}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {server.tools?.length || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Footer with count - now at bottom of table panel */}
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Showing {servers.length} {servers.length === 1 ? 'server' : 'servers'}
              </p>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
