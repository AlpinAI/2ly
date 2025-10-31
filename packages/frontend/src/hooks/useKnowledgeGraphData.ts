/**
 * useKnowledgeGraphData Hook
 *
 * WHY: Simple 1:1 mapping of GraphQL database relationships to graph nodes and edges.
 * No complex logic, just direct representation of what's in the database.
 *
 * RELATIONSHIPS (from GraphQL schema):
 * - MCPTool.mcpServer → MCPServer (tool belongs to server)
 * - MCPTool.runtimes → Runtime (tool available on runtimes)
 * - MCPTool.toolSets → ToolSet (tool in tool sets)
 * - Runtime.mcpToolCapabilities → MCPTool (runtime has tools)
 * - Runtime.mcpServers → MCPServer (runtime manages servers)
 * - ToolSet.mcpToolCapabilities → MCPTool (tool set contains tools)
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

export function useKnowledgeGraphData() {
  const workspaceId = useWorkspaceId();

  const { data, loading, error } = useQuery(GetKnowledgeGraphDataDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId,
    fetchPolicy: 'cache-and-network',
    pollInterval: 5000,
  });

  const { nodes, edges } = useMemo(() => {
    if (!data) {
      return { nodes: [], edges: [] };
    }

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Get data
    const workspace = data.workspace?.find(w => w?.id === workspaceId) || data.workspace?.[0];
    const mcpServers = data.mcpServers ?? [];
    const mcpTools = data.mcpTools ?? [];
    const toolSets = workspace?.toolSets ?? [];
    const runtimes = workspace?.runtimes ?? [];

    console.log('=== Knowledge Graph Data ===');
    console.log('Servers:', mcpServers.length);
    console.log('Tools:', mcpTools.length);
    console.log('ToolSets:', toolSets.length);
    console.log('Runtimes:', runtimes.length);

    // Create nodes for MCP Servers
    mcpServers.forEach((server) => {
      if (!server) return;
      nodes.push({
        id: `server-${server.id}`,
        type: 'source',
        data: {
          label: server.name,
          entityType: 'source',
          description: server.description,
          status: server.status || undefined,
          entityId: server.id,
        },
        position: { x: 0, y: 0 },
      });
    });

    // Create nodes for Tools
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

      // Edge: Tool → Server (MCPTool.mcpServer)
      if (tool.mcpServer) {
        edges.push({
          id: `tool-${tool.id}-to-server-${tool.mcpServer.id}`,
          source: `tool-${tool.id}`,
          target: `server-${tool.mcpServer.id}`,
          label: 'belongs to',
        });
      }

      // Edges: Tool → Runtimes (MCPTool.runtimes)
      tool.runtimes?.forEach((runtime) => {
        if (!runtime) return;
        edges.push({
          id: `tool-${tool.id}-to-runtime-${runtime.id}`,
          source: `tool-${tool.id}`,
          target: `runtime-${runtime.id}`,
          label: 'available on',
        });
      });

      // Edges: Tool → ToolSets (MCPTool.toolSets)
      tool.toolSets?.forEach((toolSet) => {
        if (!toolSet) return;
        edges.push({
          id: `tool-${tool.id}-to-toolset-${toolSet.id}`,
          source: `tool-${tool.id}`,
          target: `toolset-${toolSet.id}`,
          label: 'in set',
        });
      });
    });

    // Create nodes for ToolSets
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
    });

    // Create nodes for Runtimes
    runtimes.forEach((runtime) => {
      if (!runtime) return;
      const isAgent = runtime.capabilities?.includes('agent');
      nodes.push({
        id: `runtime-${runtime.id}`,
        type: isAgent ? 'agent' : 'runtime',
        data: {
          label: runtime.name,
          entityType: isAgent ? 'agent' : 'runtime',
          description: runtime.description || undefined,
          status: runtime.status,
          entityId: runtime.id,
        },
        position: { x: 0, y: 0 },
      });

      // Edges: Runtime → Servers (Runtime.mcpServers)
      runtime.mcpServers?.forEach((server) => {
        if (!server) return;
        edges.push({
          id: `runtime-${runtime.id}-to-server-${server.id}`,
          source: `runtime-${runtime.id}`,
          target: `server-${server.id}`,
          label: 'manages',
        });
      });
    });

    // Simple grid layout
    const cols = Math.ceil(Math.sqrt(nodes.length));
    nodes.forEach((node, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      node.position = {
        x: col * 300,
        y: row * 200,
      };
    });

    console.log('=== Graph Summary ===');
    console.log('Total Nodes:', nodes.length);
    console.log('Total Edges:', edges.length);
    console.log('Nodes by type:', {
      servers: nodes.filter(n => n.type === 'source').length,
      tools: nodes.filter(n => n.type === 'tool').length,
      toolsets: nodes.filter(n => n.type === 'toolset').length,
      runtimes: nodes.filter(n => n.type === 'runtime').length,
      agents: nodes.filter(n => n.type === 'agent').length,
    });

    return { nodes, edges };
  }, [data, workspaceId]);

  return {
    nodes,
    edges,
    loading,
    error,
  };
}
