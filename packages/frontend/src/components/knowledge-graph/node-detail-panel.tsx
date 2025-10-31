/**
 * Node Detail Panel Component
 *
 * WHY: Displays detailed information about a selected node in an inline panel.
 * Shows entity-specific information and relationships.
 *
 * FEATURES:
 * - Inline panel that appears when node is clicked
 * - Entity-specific information display
 * - Close button
 * - Dark mode support
 */

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { NodeData } from '@/hooks/useKnowledgeGraphData';

export interface NodeDetailPanelProps {
  node: NodeData | null;
  onClose: () => void;
}

export function NodeDetailPanel({ node, onClose }: NodeDetailPanelProps) {
  if (!node) return null;

  const entityTypeLabels: Record<typeof node.entityType, string> = {
    source: 'MCP Server (Source)',
    tool: 'Tool',
    toolset: 'Tool Set',
    runtime: 'Runtime',
    agent: 'Agent',
  };

  const entityColors: Record<typeof node.entityType, string> = {
    source: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20',
    tool: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
    toolset: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
    runtime: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    agent: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
  };

  return (
    <div
      className={cn(
        'absolute top-4 right-4 z-10',
        'w-80 bg-white dark:bg-gray-800',
        'border border-gray-200 dark:border-gray-700',
        'rounded-lg shadow-xl',
        'animate-in slide-in-from-right-5 duration-300'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-xs font-medium px-2 py-1 rounded-full',
              entityColors[node.entityType]
            )}
          >
            {entityTypeLabels[node.entityType]}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Name */}
        <div>
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Name
          </div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {node.label}
          </div>
        </div>

        {/* Description */}
        {node.description && (
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Description
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {node.description}
            </div>
          </div>
        )}

        {/* Status */}
        {node.status && (
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Status
            </div>
            <span
              className={cn(
                'inline-block text-xs px-2 py-1 rounded-full font-medium',
                node.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
              )}
            >
              {node.status}
            </span>
          </div>
        )}

        {/* Entity ID (for debugging/reference) */}
        <div>
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            ID
          </div>
          <div className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate">
            {node.entityId}
          </div>
        </div>
      </div>
    </div>
  );
}
