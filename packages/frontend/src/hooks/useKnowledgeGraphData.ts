/**
 * useKnowledgeGraphData Hook
 *
 * WHY: Fetches and transforms all entities (Sources, Tools, Tool Sets, Runtimes, Agents)
 * into ReactFlow nodes and edges for knowledge graph visualization.
 *
 * FEATURES:
 * - Fetches all entity data with real-time polling
 * - Transforms entities into ReactFlow nodes with distinct styling
 * - Generates edges based on relationships:
 *   - Tool Set → Tools (tools in the set)
 *   - Runtime → Tool Sets (registered to runtime)
 *   - Agent → Runtime (agent uses runtime)
 *   - Tool → Source (tool comes from MCP server source)
 * - Auto-layout positioning with dagre
 * - Real-time updates via polling
 *
 * USAGE:
 * ```tsx
 * function KnowledgeGraphPage() {
 *   const { nodes, edges, loading, error } = useKnowledgeGraphData();
 *   return <ReactFlow nodes={nodes} edges={edges} />;
 * }
 * ```
 */

import { useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { Node, Edge } from '@xyflow/react';
import { GetKnowledgeGraphDataDocument } from '@/graphql/generated/graphql';
import { useWorkspaceId } from '@/stores/workspaceStore';
import dagre from '@dagrejs/dagre';

export type EntityType = 'source' | 'tool' | 'toolset' | 'runtime' | 'agent';

export interface NodeData extends Record<string, unknown> {
  label: string;
  entityType: EntityType;
  description?: string;
  status?: string;
  entityId: string;
}

/**
 * Auto-layout nodes using dagre
 */
function layoutNodes(nodes: Node[], edges: Edge[]): Node[] {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 150 });

  // Add nodes to dagre
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 200, height: 80 });
  });

  // Add edges to dagre
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Apply layout to nodes
  return nodes.map((node) => {
    const position = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: position.x - 100, // Center the node
        y: position.y - 40,
      },
    };
  });
}

export function useKnowledgeGraphData() {
  const workspaceId = useWorkspaceId();

  // Fetch all knowledge graph data with polling for real-time updates
  const { data, loading, error } = useQuery(GetKnowledgeGraphDataDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId,
    fetchPolicy: 'cache-and-network',
    pollInterval: 5000, // Poll every 5 seconds for real-time updates
  });

  // Transform data into ReactFlow nodes and edges
  const { nodes, edges } = useMemo(() => {
    if (!data) {
      return { nodes: [], edges: [] };
    }

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const workspace = data.workspace?.[0];
    const mcpServers = data.mcpServers ?? [];
    const mcpTools = data.mcpTools ?? [];
    const toolSets = workspace?.toolSets ?? [];
    const runtimes = workspace?.runtimes ?? [];

    // Create nodes for MCP Servers (Sources)
    mcpServers.forEach((server) => {
      if (!server) return;
      nodes.push({
        id: `source-${server.id}`,
        type: 'source',
        data: {
          label: server.name,
          entityType: 'source',
          description: server.description,
          status: server.status || undefined,
          entityId: server.id,
        },
        position: { x: 0, y: 0 }, // Will be set by layout
      });
    });

    // Create nodes for MCP Tools
    mcpTools.forEach((tool) => {
      if (!tool) return;
      nodes.push({
        id: `tool-${tool.id}`,
        type: 'tool',
        data: {
          label: tool.name,
          entityType: 'tool',
          description: tool.description,
          status: tool.status,
          entityId: tool.id,
        },
        position: { x: 0, y: 0 },
      });

      // Create edge: Tool → Source (tool comes from MCP server)
      if (tool.mcpServer) {
        edges.push({
          id: `edge-tool-${tool.id}-source-${tool.mcpServer.id}`,
          source: `source-${tool.mcpServer.id}`,
          target: `tool-${tool.id}`,
          type: 'smoothstep',
          animated: false,
        });
      }
    });

    // Create nodes for Tool Sets
    toolSets.forEach((toolSet) => {
      if (!toolSet) return;
      nodes.push({
        id: `toolset-${toolSet.id}`,
        type: 'toolset',
        data: {
          label: toolSet.name,
          entityType: 'toolset',
          description: toolSet.description || undefined,
          status: toolSet.status,
          entityId: toolSet.id,
        },
        position: { x: 0, y: 0 },
      });

      // Create edges: Tool Set → Tools
      toolSet.mcpToolCapabilities?.forEach((tool) => {
        if (!tool) return;
        edges.push({
          id: `edge-toolset-${toolSet.id}-tool-${tool.id}`,
          source: `toolset-${toolSet.id}`,
          target: `tool-${tool.id}`,
          type: 'smoothstep',
          animated: false,
        });
      });
    });

    // Create nodes for Runtimes and Agents
    runtimes.forEach((runtime) => {
      if (!runtime) return;

      // Determine if runtime is an agent (has 'agent' capability)
      const isAgent = runtime.capabilities?.includes('agent');
      const nodeType = isAgent ? 'agent' : 'runtime';
      const entityType: EntityType = isAgent ? 'agent' : 'runtime';

      nodes.push({
        id: `${nodeType}-${runtime.id}`,
        type: nodeType,
        data: {
          label: runtime.name,
          entityType,
          description: runtime.description || undefined,
          status: runtime.status,
          entityId: runtime.id,
        },
        position: { x: 0, y: 0 },
      });

      // Create edges: Runtime → Tool Sets (runtime has tools)
      runtime.mcpToolCapabilities?.forEach((tool) => {
        if (!tool) return;
        // Find the tool set that contains this tool
        toolSets.forEach((toolSet) => {
          if (toolSet?.mcpToolCapabilities?.some((t) => t?.id === tool.id)) {
            edges.push({
              id: `edge-${nodeType}-${runtime.id}-toolset-${toolSet.id}`,
              source: `${nodeType}-${runtime.id}`,
              target: `toolset-${toolSet.id}`,
              type: 'smoothstep',
              animated: isAgent, // Animate edges for agents
            });
          }
        });
      });

      // Create edges: Runtime → MCP Servers
      runtime.mcpServers?.forEach((server) => {
        if (!server) return;
        edges.push({
          id: `edge-${nodeType}-${runtime.id}-source-${server.id}`,
          source: `${nodeType}-${runtime.id}`,
          target: `source-${server.id}`,
          type: 'smoothstep',
          animated: false,
        });
      });
    });

    // Apply auto-layout
    const layoutedNodes = layoutNodes(nodes, edges);

    return { nodes: layoutedNodes, edges };
  }, [data]);

  return {
    nodes,
    edges,
    loading,
    error,
  };
}
