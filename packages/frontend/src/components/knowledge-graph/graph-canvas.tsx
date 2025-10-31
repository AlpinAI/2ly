/**
 * Graph Canvas Component
 *
 * WHY: Main ReactFlow canvas for rendering the knowledge graph.
 * Handles interactions, controls, and node selection.
 *
 * FEATURES:
 * - ReactFlow canvas with custom nodes
 * - Interactive controls (zoom, pan, fit view)
 * - Node click handling
 * - Background grid
 * - Dark mode support
 */

import { useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from './custom-nodes';
import { NodeDetailPanel } from './node-detail-panel';
import type { NodeData } from '@/hooks/useKnowledgeGraphData';

export interface GraphCanvasProps {
  nodes: Node[];
  edges: Edge[];
  loading?: boolean;
}

export function GraphCanvas({ nodes: initialNodes, edges: initialEdges, loading }: GraphCanvasProps) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);

  // Update nodes and edges when props change
  if (initialNodes !== nodes || initialEdges !== edges) {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    []
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.data as NodeData);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedNode(null);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 dark:text-gray-400">Loading graph...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
          maxZoom: 1,
        }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
          style: {
            stroke: '#94a3b8',
            strokeWidth: 2,
          },
        }}
        className="bg-gray-50 dark:bg-gray-900"
      >
        <Background
          color="#d1d5db"
          gap={20}
          size={1}
          className="dark:!bg-gray-800"
        />
        <Controls
          className="!bg-white dark:!bg-gray-800 !border-gray-200 dark:!border-gray-700"
        />
        <MiniMap
          nodeColor={(node) => {
            const colors: Record<string, string> = {
              source: '#06b6d4',
              tool: '#3b82f6',
              toolset: '#a855f7',
              runtime: '#10b981',
              agent: '#f97316',
            };
            return colors[node.type || 'source'] || '#94a3b8';
          }}
          className="!bg-white dark:!bg-gray-800 !border-gray-200 dark:!border-gray-700"
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>

      <NodeDetailPanel node={selectedNode} onClose={handleClosePanel} />
    </div>
  );
}
