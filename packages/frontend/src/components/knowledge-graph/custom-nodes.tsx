/**
 * Custom Node Components for Knowledge Graph
 *
 * WHY: Provides distinct visual styling for each entity type in the graph.
 * Each node type has unique colors, icons, and styling to make relationships clear.
 *
 * FEATURES:
 * - Source nodes (MCP Servers): Cyan gradient
 * - Tool nodes: Blue gradient
 * - Tool Set nodes: Purple gradient
 * - Runtime nodes: Green gradient
 * - Agent nodes: Orange gradient
 * - Status indicators
 * - Click handler support
 */

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Database, Wrench, Grid3X3, Server, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NodeData } from '@/hooks/useKnowledgeGraphData';

interface BaseNodeProps {
  data: NodeData;
  bgGradient: string;
  borderColor: string;
  Icon: React.ComponentType<{ className?: string }>;
  selected?: boolean;
}

/**
 * Base node component with common styling
 */
function BaseNode({ data, bgGradient, borderColor, Icon, selected }: BaseNodeProps) {
  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 shadow-lg transition-all duration-200',
        'bg-gradient-to-br',
        bgGradient,
        borderColor,
        'min-w-[180px] max-w-[220px]',
        selected && 'ring-2 ring-blue-500 ring-offset-2'
      )}
    >
      {/* Input handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-gray-400 !border-2 !border-white"
      />

      {/* Node content */}
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 p-1.5 bg-white/90 dark:bg-gray-800/90 rounded">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
            {data.label}
          </div>
          {data.description && (
            <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-0.5">
              {data.description}
            </div>
          )}
          {data.status && (
            <div className="mt-1">
              <span
                className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full font-medium',
                  data.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                )}
              >
                {data.status}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Output handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-gray-400 !border-2 !border-white"
      />
    </div>
  );
}

/**
 * Source Node (MCP Servers)
 */
export const SourceNode = memo((props: NodeProps) => (
  <BaseNode
    data={props.data as NodeData}
    selected={props.selected}
    bgGradient="from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-900/10"
    borderColor="border-cyan-300 dark:border-cyan-700"
    Icon={Database}
  />
));
SourceNode.displayName = 'SourceNode';

/**
 * Tool Node
 */
export const ToolNode = memo((props: NodeProps) => (
  <BaseNode
    data={props.data as NodeData}
    selected={props.selected}
    bgGradient="from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10"
    borderColor="border-blue-300 dark:border-blue-700"
    Icon={Wrench}
  />
));
ToolNode.displayName = 'ToolNode';

/**
 * Tool Set Node
 */
export const ToolSetNode = memo((props: NodeProps) => (
  <BaseNode
    data={props.data as NodeData}
    selected={props.selected}
    bgGradient="from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10"
    borderColor="border-purple-300 dark:border-purple-700"
    Icon={Grid3X3}
  />
));
ToolSetNode.displayName = 'ToolSetNode';

/**
 * Runtime Node
 */
export const RuntimeNode = memo((props: NodeProps) => (
  <BaseNode
    data={props.data as NodeData}
    selected={props.selected}
    bgGradient="from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10"
    borderColor="border-green-300 dark:border-green-700"
    Icon={Server}
  />
));
RuntimeNode.displayName = 'RuntimeNode';

/**
 * Agent Node
 */
export const AgentNode = memo((props: NodeProps) => (
  <BaseNode
    data={props.data as NodeData}
    selected={props.selected}
    bgGradient="from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10"
    borderColor="border-orange-300 dark:border-orange-700"
    Icon={Bot}
  />
));
AgentNode.displayName = 'AgentNode';

/**
 * Node types map for ReactFlow
 */
export const nodeTypes = {
  source: SourceNode,
  tool: ToolNode,
  toolset: ToolSetNode,
  runtime: RuntimeNode,
  agent: AgentNode,
};
