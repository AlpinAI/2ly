/**
 * Knowledge Graph Page
 *
 * WHY: Provides an interactive visualization of relationships between all key entities
 * in the 2ly system (Sources, Tools, Tool Sets, Runtimes, Agents).
 *
 * FEATURES:
 * - Interactive graph visualization with ReactFlow
 * - Real-time updates via polling
 * - Node click for detailed information
 * - Zoom, pan, and fit controls
 * - Dark mode support
 * - Loading and error states
 */

import { GraphCanvas } from '@/components/knowledge-graph/graph-canvas';
import { useKnowledgeGraphData } from '@/hooks/useKnowledgeGraphData';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function KnowledgeGraphPage() {
  const { nodes, edges, loading, error } = useKnowledgeGraphData();

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Failed to load knowledge graph
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  if (loading && nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Loading Knowledge Graph
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Fetching relationships between entities...
          </p>
        </div>
      </div>
    );
  }

  if (nodes.length === 0 && !loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Data Available
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            There are no entities to display in the knowledge graph yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Knowledge Graph
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Explore relationships between Sources, Tools, Tool Sets, Runtimes, and Agents.
            Click on any node to see more details.
          </p>
        </div>
      </div>

      {/* Graph Canvas */}
      <div className="flex-1 relative">
        <GraphCanvas nodes={nodes} edges={edges} loading={loading} />
      </div>
    </div>
  );
}
