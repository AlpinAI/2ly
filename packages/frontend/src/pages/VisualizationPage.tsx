/**
 * VisualizationPage Component
 *
 * WHY: Provides a comprehensive workspace visualization showing relationships
 * between all entities (servers, tools, runtimes, toolsets, tool calls).
 *
 * WHAT IT PROVIDES:
 * - Force-directed graph visualization
 * - Filter controls (search, entity types, tool calls)
 * - Stats panel showing entity counts
 * - Node selection with details panel
 * - Loading and error states
 *
 * ARCHITECTURE:
 * - Uses useWorkspaceVisualization hook for data
 * - ForceGraph component for rendering
 * - Radix UI components for filters
 * - Responsive layout with controls sidebar
 *
 * USAGE:
 * Rendered at route /w/:workspaceId/visualization
 */

import { useState } from 'react';
import { Loader2, AlertCircle, Network, Search, Filter, X } from 'lucide-react';
import { useWorkspaceVisualization, type NodeType, type GraphNode } from '@/hooks/useWorkspaceVisualization';
import { ForceGraph } from '@/components/visualization/force-graph';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NODE_TYPE_LABELS: Record<NodeType, string> = {
  server: 'Servers',
  tool: 'Tools',
  runtime: 'Runtimes',
  toolset: 'Tool Sets',
  toolcall: 'Tool Calls',
};

export default function VisualizationPage() {
  const {
    nodes,
    edges,
    loading,
    error,
    stats,
    filters,
    highlightedNodeId,
    setHighlightedNodeId,
  } = useWorkspaceVisualization();

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    setHighlightedNodeId(node.id);
  };

  const handleCloseDetails = () => {
    setSelectedNode(null);
    setHighlightedNodeId(null);
  };

  const toggleType = (type: NodeType) => {
    const current = filters.types;
    if (current.includes(type)) {
      filters.setTypes(current.filter((t) => t !== type));
    } else {
      filters.setTypes([...current, type]);
    }
  };

  return (
    <div className="max-w-full mx-auto h-[calc(100vh-12rem)]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Network className="h-8 w-8 text-cyan-600" />
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Workspace Visualization
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Interactive graph showing relationships between all entities
            </p>
          </div>
        </div>

        {/* Reset filters button */}
        {(filters.search || filters.types.length > 0 || filters.showToolCalls) && (
          <Button variant="outline" size="sm" onClick={filters.reset}>
            <X className="h-4 w-4 mr-2" />
            Reset Filters
          </Button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Failed to load visualization data
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error.message}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6 h-full">
        {/* Left sidebar - Filters and Stats */}
        <div className="col-span-3 space-y-6">
          {/* Stats panel */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Graph Statistics
            </h3>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Total Nodes:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{stats.totalNodes}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Total Edges:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{stats.totalEdges}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Filtered:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{stats.filtered}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Servers:</span>
                  <span className="font-semibold text-cyan-600">{stats.servers}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Tools:</span>
                  <span className="font-semibold text-violet-600">{stats.tools}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Runtimes:</span>
                  <span className="font-semibold text-emerald-600">{stats.runtimes}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Tool Sets:</span>
                  <span className="font-semibold text-amber-600">{stats.toolsets}</span>
                </div>
                {stats.toolcalls > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Tool Calls:</span>
                    <span className="font-semibold text-red-600">{stats.toolcalls}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Search filter */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <Label htmlFor="search" className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search Entities
            </Label>
            <Input
              id="search"
              type="text"
              placeholder="Filter by name..."
              value={filters.search}
              onChange={(e) => filters.setSearch(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Type filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Filter by Type
            </h3>
            <div className="space-y-2">
              {(Object.entries(NODE_TYPE_LABELS) as [NodeType, string][]).map(([type, label]) => {
                // Don't show toolcall filter unless we're showing toolcalls
                if (type === 'toolcall') return null;

                return (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={filters.types.includes(type)}
                      onCheckedChange={() => toggleType(type)}
                    />
                    <label
                      htmlFor={`type-${type}`}
                      className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      {label}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Show tool calls toggle */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-toolcalls"
                checked={filters.showToolCalls}
                onCheckedChange={(checked) => filters.setShowToolCalls(Boolean(checked))}
              />
              <label
                htmlFor="show-toolcalls"
                className="text-sm font-semibold text-gray-900 dark:text-white cursor-pointer"
              >
                Show Tool Calls (last 100)
              </label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Display recent tool call invocations in the graph
            </p>
          </div>
        </div>

        {/* Main graph area */}
        <div className="col-span-9 relative">
          {loading && nodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <Loader2 className="h-12 w-12 animate-spin text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading workspace data...</p>
            </div>
          ) : nodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <Network className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No entities to visualize</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Add servers, tools, or runtimes to see the graph
              </p>
            </div>
          ) : (
            <ForceGraph
              nodes={nodes}
              edges={edges}
              onNodeClick={handleNodeClick}
              highlightedNodeId={highlightedNodeId}
            />
          )}

          {/* Node details panel */}
          {selectedNode && (
            <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-xl max-w-sm">
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Node Details
                </h4>
                <button
                  onClick={handleCloseDetails}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Type:</span>
                  <p className={cn(
                    "text-sm font-medium capitalize",
                    selectedNode.type === 'server' && "text-cyan-600",
                    selectedNode.type === 'tool' && "text-violet-600",
                    selectedNode.type === 'runtime' && "text-emerald-600",
                    selectedNode.type === 'toolset' && "text-amber-600",
                    selectedNode.type === 'toolcall' && "text-red-600",
                  )}>
                    {selectedNode.type}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Name:</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedNode.label}
                  </p>
                </div>
                {selectedNode.status && (
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Status:</span>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedNode.status}
                    </p>
                  </div>
                )}
                {selectedNode.metadata?.description ? (
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Description:</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {typeof selectedNode.metadata.description === 'string'
                        ? selectedNode.metadata.description
                        : String(selectedNode.metadata.description)}
                    </p>
                  </div>
                ) : null}
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">ID:</span>
                  <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">
                    {selectedNode.id}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
