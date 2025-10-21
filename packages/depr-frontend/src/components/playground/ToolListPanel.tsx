import { Search, Wrench, Server } from 'lucide-react';
import { apolloResolversTypes } from '@2ly/common';
import { Card } from '../ui/Card';
import CheckboxDropdown from '../ui/CheckboxDropdown';
import { cn } from '../../utils/helpers';

interface ToolListPanelProps {
  tools: Array<{
    tool: apolloResolversTypes.McpTool;
    server: { id: string; name: string; description: string };
  }>;
  selectedToolId: string | null;
  onSelectTool: (toolId: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  servers: Array<{ id: string; name: string; description: string }>;
  selectedServerIds: string[];
  onServerFilterChange: (serverIds: string[]) => void;
  agents: apolloResolversTypes.Runtime[];
  selectedAgentIds: string[];
  onAgentFilterChange: (agentIds: string[]) => void;
  isLoading: boolean;
}

/**
 * Left panel component for displaying searchable and filterable tool list
 * Shows tools grouped by server with selection functionality
 */
export function ToolListPanel({
  tools,
  selectedToolId,
  onSelectTool,
  searchTerm,
  onSearchChange,
  servers,
  selectedServerIds,
  onServerFilterChange,
  agents,
  selectedAgentIds,
  onAgentFilterChange,
  isLoading,
}: ToolListPanelProps): JSX.Element {
  const agentItems = agents.map(agent => ({ id: agent.id, label: agent.name }));
  const serverItems = servers.map(server => ({ id: server.id, label: server.name }));

  return (
    <div className="flex flex-col h-full">
      {/* Search and Filters Section with Container Query */}
      <div className="@container mb-4">
        <div className="flex flex-col @[500px]:flex-row gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tools..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-8 w-full rounded-md border border-gray-300 bg-white pl-10 pr-4 text-xs focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Filter Dropdowns - Always side by side */}
          <div className="flex gap-2">
            {agents.length > 0 && (
              <CheckboxDropdown
                label={selectedAgentIds.length > 0 ? `Agents (${selectedAgentIds.length})` : 'Agents'}
                items={agentItems}
                selectedIds={selectedAgentIds}
                onChange={onAgentFilterChange}
                align="left"
              />
            )}
            {servers.length > 0 && (
              <CheckboxDropdown
                label={selectedServerIds.length > 0 ? `Servers (${selectedServerIds.length})` : 'Servers'}
                items={serverItems}
                selectedIds={selectedServerIds}
                onChange={onServerFilterChange}
                align="left"
              />
            )}
          </div>
        </div>
      </div>

      {/* Tools List */}
      <div className="flex-1 overflow-y-auto -mx-1 px-1 py-1">
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-sm text-gray-500">
              Loading tools...
            </div>
          ) : tools.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Wrench className="h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No tools found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            tools.map(({ tool, server }) => (
              <Card
                key={tool.id}
                onClick={() => onSelectTool(tool.id)}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  selectedToolId === tool.id
                    ? 'ring-2 ring-primary-500 bg-primary-50'
                    : 'hover:bg-gray-50',
                )}
              >
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-sm text-gray-900 leading-tight">
                      {tool.name}
                    </h3>
                    {selectedToolId === tool.id && (
                      <div className="flex-shrink-0 h-2 w-2 rounded-full bg-primary-500" />
                    )}
                  </div>

                  {tool.description && (
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{tool.description}</p>
                  )}

                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Server className="h-3 w-3" />
                    <span className="truncate">{server.name}</span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Tools Count */}
      {!isLoading && tools.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Showing {tools.length} tool{tools.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}