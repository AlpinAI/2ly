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
    const nodeIds = new Set<string>();

    // Helper to add node if not exists
    const addNode = (node: GraphNode) => {
      if (!nodeIds.has(node.id)) {
        nodes.push(node);
        nodeIds.add(node.id);
      }
    };

    // First pass: Add all nodes
    // Add MCP Servers as nodes
    (data.mcpServers ?? []).forEach((server) => {
      if (!server) return;

      addNode({
        id: server.id,
        label: server.name,
        type: 'server',
        metadata: {
          description: server.description,
          transport: server.transport,
          runOn: server.runOn,
        },
      });

      // Add runtime node if exists (minimal data from nested query)
      if (server.runtime) {
        addNode({
          id: server.runtime.id,
          label: server.runtime.name,
          type: 'runtime',
          metadata: {},
        });
      }

      // Add tool nodes from server (minimal data from nested query)
      (server.tools ?? []).forEach((tool) => {
        if (!tool) return;
        addNode({
          id: tool.id,
          label: tool.name,
          type: 'tool',
          metadata: {},
        });
      });
    });

    // Add MCP Tools as nodes
    (data.mcpTools ?? []).forEach((tool) => {
      if (!tool) return;

      addNode({
        id: tool.id,
        label: tool.name,
        type: 'tool',
        status: tool.status,
        metadata: {
          description: tool.description,
        },
      });

      // Add runtime nodes from tool (minimal data from nested query)
      (tool.runtimes ?? []).forEach((runtime) => {
        if (!runtime) return;
        addNode({
          id: runtime.id,
          label: runtime.name,
          type: 'runtime',
          metadata: {},
        });
      });

      // Add toolset nodes from tool (minimal data from nested query)
      (tool.toolSets ?? []).forEach((toolset) => {
        if (!toolset) return;
        addNode({
          id: toolset.id,
          label: toolset.name,
          type: 'toolset',
          metadata: {},
        });
      });
    });

    // Add Runtimes as nodes
    const workspaceData = data.workspace?.[0];
    (workspaceData?.runtimes ?? []).forEach((runtime) => {
      if (!runtime) return;

      addNode({
        id: runtime.id,
        label: runtime.name,
        type: 'runtime',
        status: runtime.status,
        metadata: {
          description: runtime.description,
        },
      });
    });

    // Add Tool Sets as nodes
    (workspaceData?.toolSets ?? []).forEach((toolset) => {
      if (!toolset) return;

      addNode({
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

        addNode({
          id: toolCall.id,
          label: `Call ${toolCall.id.substring(0, 8)}`,
          type: 'toolcall',
          status: toolCall.status,
          metadata: {
            calledAt: toolCall.calledAt,
          },
        });

        // Add tool node if exists (minimal data from nested query)
        if (toolCall.mcpTool) {
          addNode({
            id: toolCall.mcpTool.id,
            label: toolCall.mcpTool.name,
            type: 'tool',
            metadata: {},
          });
        }

        // Add runtime node if exists (minimal data from nested query)
        if (toolCall.calledBy) {
          addNode({
            id: toolCall.calledBy.id,
            label: toolCall.calledBy.name,
            type: 'runtime',
            metadata: {},
          });
        }
      });
    }

    // Second pass: Add edges (only if both nodes exist)
    const addEdge = (edge: GraphEdge) => {
      if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
        edges.push(edge);
      }
    };

    // Add edges from servers
    (data.mcpServers ?? []).forEach((server) => {
      if (!server) return;

      // Add edge from server to runtime (if exists)
      if (server.runtime) {
        addEdge({
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
        addEdge({
          id: `${server.id}-tool-${tool.id}`,
          source: server.id,
          target: tool.id,
          label: 'provides',
          type: 'server-tool',
        });
      });
    });

    // Add edges from tools
    (data.mcpTools ?? []).forEach((tool) => {
      if (!tool) return;

      // Add edges from tool to runtimes
      (tool.runtimes ?? []).forEach((runtime) => {
        if (!runtime) return;
        addEdge({
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
        addEdge({
          id: `${tool.id}-toolset-${toolset.id}`,
          source: tool.id,
          target: toolset.id,
          label: 'in',
          type: 'tool-toolset',
        });
      });
    });

    // Add edges from tool calls
    if (showToolCalls) {
      (data.toolCalls?.toolCalls ?? []).forEach((toolCall) => {
        if (!toolCall) return;

        // Add edge from toolcall to tool
        if (toolCall.mcpTool) {
          addEdge({
            id: `${toolCall.id}-tool-${toolCall.mcpTool.id}`,
            source: toolCall.id,
            target: toolCall.mcpTool.id,
            label: 'calls',
            type: 'toolcall-tool',
          });
        }

        // Add edge from runtime to toolcall (caller)
        if (toolCall.calledBy) {
          addEdge({
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
