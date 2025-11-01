/**
 * useWorkspaceVisualization Hook
 *
 * WHY: Fetches all workspace entities and relationships for graph visualization.
 * Transforms GraphQL data into graph nodes and edges suitable for D3 force-directed layout.
 *
 * PATTERN: Similar to useMCPTools
 * - useQuery with cache-and-network for optimal performance
 * - useMemo for graph transformation
 * - Client-side filtering by entity type
 *
 * GRAPH DATA STRUCTURE:
 * - Nodes: Each entity (server, tool, runtime, toolset, toolcall) becomes a node
 * - Edges: Relationships between entities (server→tool, runtime→server, etc.)
 *
 * USAGE:
 * ```tsx
 * function VisualizationPage() {
 *   const { nodes, edges, loading, error, filters } = useWorkspaceVisualization();
 *
 *   return (
 *     <div>
 *       <FilterControls filters={filters} />
 *       <ForceGraph nodes={nodes} edges={edges} />
 *     </div>
 *   );
 * }
 * ```
 */

import { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@apollo/client/react';
import { GetWorkspaceVisualizationDocument } from '@/graphql/generated/graphql';
import { useWorkspaceId } from '@/stores/workspaceStore';

// Node types for the graph
export type NodeType = 'server' | 'tool' | 'runtime' | 'toolset' | 'toolcall';

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  status?: string;
  metadata?: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function useWorkspaceVisualization() {
  const workspaceId = useWorkspaceId();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<NodeType[]>([]);
  const [showToolCalls, setShowToolCalls] = useState(false);

  // Fetch all workspace data
  const { data, loading, error } = useQuery(GetWorkspaceVisualizationDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId,
    fetchPolicy: 'cache-and-network',
  });

  // Transform GraphQL data into graph structure
  const graphData = useMemo((): GraphData => {
    if (!data) {
      return { nodes: [], edges: [] };
    }

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Add MCP Servers as nodes
    (data.mcpServers ?? []).forEach((server) => {
      if (!server) return;

      nodes.push({
        id: server.id,
        label: server.name,
        type: 'server',
        metadata: {
          description: server.description,
          transport: server.transport,
          runOn: server.runOn,
        },
      });

      // Add edge from server to runtime (if exists)
      if (server.runtime) {
        edges.push({
          id: `${server.id}-runtime-${server.runtime.id}`,
          source: server.id,
          target: server.runtime.id,
          label: 'runs on',
          type: 'server-runtime',
        });
      }

      // Add edges from server to its tools
      (server.tools ?? []).forEach((tool) => {
        if (!tool) return;
        edges.push({
          id: `${server.id}-tool-${tool.id}`,
          source: server.id,
          target: tool.id,
          label: 'provides',
          type: 'server-tool',
        });
      });
    });

    // Add MCP Tools as nodes
    (data.mcpTools ?? []).forEach((tool) => {
      if (!tool) return;

      // Only add if not already added
      if (!nodes.find((n) => n.id === tool.id)) {
        nodes.push({
          id: tool.id,
          label: tool.name,
          type: 'tool',
          status: tool.status,
          metadata: {
            description: tool.description,
          },
        });
      }

      // Add edges from tool to runtimes
      (tool.runtimes ?? []).forEach((runtime) => {
        if (!runtime) return;
        edges.push({
          id: `${tool.id}-runtime-${runtime.id}`,
          source: tool.id,
          target: runtime.id,
          label: 'available on',
          type: 'tool-runtime',
        });
      });

      // Add edges from tool to toolsets
      (tool.toolSets ?? []).forEach((toolset) => {
        if (!toolset) return;
        edges.push({
          id: `${tool.id}-toolset-${toolset.id}`,
          source: tool.id,
          target: toolset.id,
          label: 'in',
          type: 'tool-toolset',
        });
      });
    });

    // Add Runtimes as nodes
    const workspaceData = data.workspace?.[0];
    (workspaceData?.runtimes ?? []).forEach((runtime) => {
      if (!runtime) return;

      // Only add if not already added
      if (!nodes.find((n) => n.id === runtime.id)) {
        nodes.push({
          id: runtime.id,
          label: runtime.name,
          type: 'runtime',
          status: runtime.status,
          metadata: {
            description: runtime.description,
          },
        });
      }
    });

    // Add Tool Sets as nodes
    (workspaceData?.toolSets ?? []).forEach((toolset) => {
      if (!toolset) return;

      nodes.push({
        id: toolset.id,
        label: toolset.name,
        type: 'toolset',
        status: toolset.status,
        metadata: {
          description: toolset.description,
        },
      });
    });

    // Add Tool Calls as nodes (if enabled)
    if (showToolCalls) {
      (data.toolCalls?.toolCalls ?? []).forEach((toolCall) => {
        if (!toolCall) return;

        nodes.push({
          id: toolCall.id,
          label: `Call ${toolCall.id.substring(0, 8)}`,
          type: 'toolcall',
          status: toolCall.status,
          metadata: {
            calledAt: toolCall.calledAt,
          },
        });

        // Add edge from toolcall to tool
        if (toolCall.mcpTool) {
          edges.push({
            id: `${toolCall.id}-tool-${toolCall.mcpTool.id}`,
            source: toolCall.id,
            target: toolCall.mcpTool.id,
            label: 'calls',
            type: 'toolcall-tool',
          });
        }

        // Add edge from runtime to toolcall (caller)
        if (toolCall.calledBy) {
          edges.push({
            id: `${toolCall.calledBy.id}-toolcall-${toolCall.id}`,
            source: toolCall.calledBy.id,
            target: toolCall.id,
            label: 'invoked',
            type: 'runtime-toolcall',
          });
        }
      });
    }

    return { nodes, edges };
  }, [data, showToolCalls]);

  // Apply client-side filters
  const filteredGraphData = useMemo((): GraphData => {
    let filteredNodes = [...graphData.nodes];
    let filteredEdges = [...graphData.edges];

    // Search filter (name matches)
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filteredNodes = filteredNodes.filter((node) => node.label.toLowerCase().includes(query));

      // Keep only edges where both source and target are in filtered nodes
      const nodeIds = new Set(filteredNodes.map((n) => n.id));
      filteredEdges = filteredEdges.filter(
        (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
      );
    }

    // Type filter
    if (selectedTypes.length > 0) {
      filteredNodes = filteredNodes.filter((node) => selectedTypes.includes(node.type));

      // Keep only edges where both source and target are in filtered nodes
      const nodeIds = new Set(filteredNodes.map((n) => n.id));
      filteredEdges = filteredEdges.filter(
        (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
      );
    }

    return { nodes: filteredNodes, edges: filteredEdges };
  }, [graphData, searchTerm, selectedTypes]);

  // Calculate stats
  const stats = useMemo(() => {
    const nodesByType = graphData.nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {} as Record<NodeType, number>);

    return {
      totalNodes: graphData.nodes.length,
      totalEdges: graphData.edges.length,
      servers: nodesByType.server || 0,
      tools: nodesByType.tool || 0,
      runtimes: nodesByType.runtime || 0,
      toolsets: nodesByType.toolset || 0,
      toolcalls: nodesByType.toolcall || 0,
      filtered: filteredGraphData.nodes.length,
    };
  }, [graphData, filteredGraphData]);

  // Reset filters
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedTypes([]);
    setShowToolCalls(false);
  }, []);

  // Highlight node by ID
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);

  return {
    nodes: filteredGraphData.nodes,
    edges: filteredGraphData.edges,
    allNodes: graphData.nodes,
    allEdges: graphData.edges,
    loading,
    error,
    stats,
    filters: {
      search: searchTerm,
      setSearch: setSearchTerm,
      types: selectedTypes,
      setTypes: setSelectedTypes,
      showToolCalls,
      setShowToolCalls,
      reset: resetFilters,
    },
    highlightedNodeId,
    setHighlightedNodeId,
  };
}
