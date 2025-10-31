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
 *   - Tool → Source (tools come from MCP servers)
 *   - Tool Set → Tools (tools grouped in sets)
 *   - Runtime → Tools (runtimes have access to tools)
 *   - Runtime → Sources (runtimes manage MCP servers)
 * - Circular layout for initial positioning
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

export type EntityType = 'source' | 'tool' | 'toolset' | 'runtime' | 'agent';

export interface NodeData extends Record<string, unknown> {
  label: string;
  entityType: EntityType;
  description?: string;
  status?: string;
  entityId: string;
}

/**
 * Simple circular layout for initial positioning
 * ReactFlow will handle the rest with its built-in force simulation
 */
function layoutNodes(nodes: Node[]): Node[] {
  const radius = Math.max(300, nodes.length * 30);
  const angleStep = (2 * Math.PI) / Math.max(nodes.length, 1);

  return nodes.map((node, index) => {
    const angle = index * angleStep;
    return {
      ...node,
      position: {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
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

    // Find the correct workspace by ID
    const workspace = data.workspace?.find(w => w?.id === workspaceId) || data.workspace?.[0];
    const mcpServers = data.mcpServers ?? [];
    const mcpTools = data.mcpTools ?? [];
    const toolSets = workspace?.toolSets ?? [];
    const runtimes = workspace?.runtimes ?? [];

    // Debug logging
    console.log('Knowledge Graph Data:', {
      workspaceId,
      foundWorkspace: workspace?.id,
      totalWorkspaces: data.workspace?.length || 0,
      servers: mcpServers.length,
      tools: mcpTools.length,
      toolSets: toolSets.length,
      runtimes: runtimes.length,
    });

    if (toolSets.length > 0) {
      console.log('Tool Sets:', toolSets.map(ts => ({
        id: ts?.id,
        name: ts?.name,
        toolCount: ts?.mcpToolCapabilities?.length || 0,
      })));
    }

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
      const toolSetEdgeCount = toolSet.mcpToolCapabilities?.length || 0;
      console.log(`Creating ${toolSetEdgeCount} edges for tool set ${toolSet.name}`);

      toolSet.mcpToolCapabilities?.forEach((tool) => {
        if (!tool) return;
        const edgeId = `edge-toolset-${toolSet.id}-tool-${tool.id}`;
        console.log(`  Edge: ${toolSet.name} → tool-${tool.id}`);
        edges.push({
          id: edgeId,
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

      // Create edges: Runtime → Tools (direct connection to tools)
      runtime.mcpToolCapabilities?.forEach((tool) => {
        if (!tool) return;
        edges.push({
          id: `edge-${nodeType}-${runtime.id}-tool-${tool.id}`,
          source: `${nodeType}-${runtime.id}`,
          target: `tool-${tool.id}`,
          type: 'smoothstep',
          animated: isAgent, // Animate edges for agents
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

    // Apply circular layout for initial positioning
    const layoutedNodes = layoutNodes(nodes);

    console.log('Knowledge Graph Summary:', {
      totalNodes: layoutedNodes.length,
      totalEdges: edges.length,
      nodesByType: {
        sources: layoutedNodes.filter(n => n.type === 'source').length,
        tools: layoutedNodes.filter(n => n.type === 'tool').length,
        toolsets: layoutedNodes.filter(n => n.type === 'toolset').length,
        runtimes: layoutedNodes.filter(n => n.type === 'runtime').length,
        agents: layoutedNodes.filter(n => n.type === 'agent').length,
      },
      edgeTypes: {
        toolToSource: edges.filter(e => e.source.startsWith('source-')).length,
        toolsetToTool: edges.filter(e => e.source.startsWith('toolset-')).length,
        runtimeToTool: edges.filter(e => e.source.startsWith('runtime-') && e.target.startsWith('tool-')).length,
        agentToTool: edges.filter(e => e.source.startsWith('agent-') && e.target.startsWith('tool-')).length,
      }
    });

    return { nodes: layoutedNodes, edges };
  }, [data, workspaceId]);

  return {
    nodes,
    edges,
    loading,
    error,
  };
}
