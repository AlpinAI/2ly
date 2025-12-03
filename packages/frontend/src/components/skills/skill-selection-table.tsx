/**
 * ToolsetSelectionTable Component
 *
 * WHY: Displays tools grouped by MCP server with checkbox selection for tool management.
 * Used by ToolsetManagementPanel to show available tools and their selection state.
 *
 * FEATURES:
 * - Tools grouped by MCP server (collapsible sections)
 * - Checkbox per tool + checkbox per server group
 * - Search highlighting
 * - Tool status indicators
 * - Responsive design
 * - Select all/none functionality
 */

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { GetMcpToolsQuery } from '@/graphql/generated/graphql';

type McpTool = NonNullable<NonNullable<GetMcpToolsQuery['mcpTools']>[number]>;

interface GroupedServer {
  id: string;
  name: string;
  description: string;
  tools: McpTool[];
}

export interface ToolsetSelectionTableProps {
  servers: GroupedServer[];
  selectedToolIds: Set<string>;
  onToolToggle: (toolId: string) => void;
  onServerToggle: (serverId: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  searchTerm: string;
  showSelectedOnly?: boolean;
  loading?: boolean;
}

export function ToolsetSelectionTable({
  servers,
  selectedToolIds,
  onToolToggle,
  onServerToggle,
  onSelectAll,
  onSelectNone,
  searchTerm,
  showSelectedOnly = false,
  loading,
}: ToolsetSelectionTableProps) {
  const [collapsedServers, setCollapsedServers] = useState<Set<string>>(new Set());

  // Filter servers and tools based on showSelectedOnly
  const filteredServers = useMemo(() => {
    if (!showSelectedOnly) {
      return servers;
    }

    // Filter to only show servers with selected tools
    return servers
      .map((server) => ({
        ...server,
        tools: server.tools.filter((tool) => selectedToolIds.has(tool.id)),
      }))
      .filter((server) => server.tools.length > 0);
  }, [servers, selectedToolIds, showSelectedOnly]);

  // Calculate selection state
  const allToolIds = useMemo(() => {
    const ids: string[] = [];
    filteredServers.forEach(server => server.tools.forEach(tool => ids.push(tool.id)));
    return ids;
  }, [filteredServers]);

  const selectedCount = selectedToolIds.size;
  const totalCount = allToolIds.length;
  const allSelected = totalCount > 0 && allToolIds.every(id => selectedToolIds.has(id));
  const someSelected = selectedCount > 0 && !allSelected;

  // Server selection state
  const getServerSelectionState = (server: GroupedServer) => {
    const serverToolIds = server.tools.map(tool => tool.id);
    const selectedInServer = serverToolIds.filter(id => selectedToolIds.has(id));
    
    if (selectedInServer.length === 0) return 'none';
    if (selectedInServer.length === serverToolIds.length) return 'all';
    return 'partial';
  };

  const toggleServerCollapse = (serverId: string) => {
    setCollapsedServers(prev => {
      const next = new Set(prev);
      if (next.has(serverId)) {
        next.delete(serverId);
      } else {
        next.add(serverId);
      }
      return next;
    });
  };

  const highlightSearchTerm = (text: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredServers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        {showSelectedOnly
          ? 'No selected tools.'
          : searchTerm
            ? 'No tools found matching your search.'
            : 'No tools available.'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selection Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            ref={(el) => {
              if (el) {
                (el as HTMLInputElement).indeterminate = someSelected;
              }
            }}
            onCheckedChange={(checked) => {
              if (checked) {
                onSelectAll();
              } else {
                onSelectNone();
              }
            }}
          />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {selectedCount > 0 ? `${selectedCount} of ${totalCount} tools selected` : 'Select tools'}
          </span>
        </div>
        
        {selectedCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSelectNone}
            className="h-8 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      {/* Server Groups */}
      {filteredServers.map((server) => {
        const isCollapsed = collapsedServers.has(server.id);
        const serverSelectionState = getServerSelectionState(server);
        // const serverToolIds = server.tools.map(tool => tool.id);

        return (
          <div
            key={server.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            {/* Server Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 p-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleServerCollapse(server.id)}
                  className="h-6 w-6"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>

                <Checkbox
                  checked={serverSelectionState === 'all'}
                  ref={(el) => {
                    if (el) {
                      (el as HTMLInputElement).indeterminate = serverSelectionState === 'partial';
                    }
                  }}
                  onCheckedChange={() => onServerToggle(server.id)}
                />

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {highlightSearchTerm(server.name)}
                  </h3>
                  {server.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {highlightSearchTerm(server.description)}
                    </p>
                  )}
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {server.tools.length} tool{server.tools.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Tools List */}
            {!isCollapsed && (
              <div className="bg-gray-50 dark:bg-gray-900">
                {server.tools.map((tool) => (
                  <div
                    key={tool.id}
                    className="tool-row flex items-center gap-3 p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                  >
                    <Checkbox
                      checked={selectedToolIds.has(tool.id)}
                      onCheckedChange={() => onToolToggle(tool.id)}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {highlightSearchTerm(tool.name)}
                        </h4>
                        <span
                          className={cn(
                            'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
                            tool.status === 'ACTIVE'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                          )}
                        >
                          {tool.status}
                        </span>
                      </div>
                      {tool.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                          {highlightSearchTerm(tool.description)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
