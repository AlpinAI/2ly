/**
 * Graph Canvas Component
 *
 * WHY: Simple ReactFlow canvas showing database relationships.
 * Minimal complexity - just display nodes and edges as-is.
 */

import { useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
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

export function GraphCanvas({ nodes, edges, loading }: GraphCanvasProps) {
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.data as NodeData);
  }, []);

  const onPaneClick = useCallback(() => {
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
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
        }}
        defaultEdgeOptions={{
          type: 'default',
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

      <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
    </div>
  );
}
