/**
 * ForceGraph Component
 *
 * WHY: Renders a force-directed graph visualization using D3.js.
 * Provides interactive zoom, pan, and node selection.
 *
 * WHAT IT PROVIDES:
 * - D3 force simulation for automatic layout
 * - Interactive zoom and pan
 * - Node click for details
 * - Color-coded nodes by type
 * - Highlighted node support
 * - Responsive SVG container
 *
 * ARCHITECTURE:
 * - Uses D3.js for force simulation and rendering
 * - React refs for DOM access
 * - useEffect for D3 initialization and updates
 * - Cleanup on unmount
 *
 * USAGE:
 * ```tsx
 * <ForceGraph
 *   nodes={nodes}
 *   edges={edges}
 *   onNodeClick={(node) => console.log(node)}
 *   highlightedNodeId="some-id"
 * />
 * ```
 */

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { GraphNode, GraphEdge } from '@/hooks/useWorkspaceVisualization';

interface ForceGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (node: GraphNode) => void;
  highlightedNodeId?: string | null;
  width?: number;
  height?: number;
}

// D3 node interface with simulation properties
interface D3Node extends GraphNode {
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

// D3 link interface with simulation properties
interface D3Link {
  id: string;
  source: string | D3Node;
  target: string | D3Node;
  label?: string;
  type: string;
}

// Color palette for node types
const NODE_COLORS: Record<string, string> = {
  server: '#06b6d4', // cyan-500
  tool: '#8b5cf6', // violet-500
  runtime: '#10b981', // emerald-500
  toolset: '#f59e0b', // amber-500
  toolcall: '#ef4444', // red-500
};

const NODE_RADIUS = 8;
const LINK_DISTANCE = 100;
const CHARGE_STRENGTH = -300;

export function ForceGraph({
  nodes,
  edges,
  onNodeClick,
  highlightedNodeId,
  width = 1200,
  height = 800,
}: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    // Clear previous render
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current);

    // Create container group for zoom/pan
    const container = svg.append('g');

    // Setup zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Copy data to avoid mutation
    const nodeData: D3Node[] = nodes.map((d) => ({ ...d }));
    const linkData: D3Link[] = edges.map((d) => ({ ...d }));

    // Create force simulation
    const simulation = d3
      .forceSimulation<D3Node>(nodeData)
      .force(
        'link',
        d3
          .forceLink<D3Node, D3Link>(linkData)
          .id((d) => d.id)
          .distance(LINK_DISTANCE),
      )
      .force('charge', d3.forceManyBody<D3Node>().strength(CHARGE_STRENGTH))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<D3Node>().radius(NODE_RADIUS * 2));

    simulationRef.current = simulation;

    // Draw links
    const link = container
      .append('g')
      .selectAll('line')
      .data(linkData)
      .join('line')
      .attr('stroke', '#94a3b8') // gray-400
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1.5);

    // Draw nodes
    const node = container
      .append('g')
      .selectAll<SVGCircleElement, D3Node>('circle')
      .data(nodeData)
      .join('circle')
      .attr('r', NODE_RADIUS)
      .attr('fill', (d) => NODE_COLORS[d.type] || '#6b7280')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        if (onNodeClick) {
          onNodeClick(d);
        }
      })
      .call(
        d3
          .drag<SVGCircleElement, D3Node>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }),
      );

    // Add labels
    const label = container
      .append('g')
      .selectAll('text')
      .data(nodeData)
      .join('text')
      .text((d) => d.label)
      .attr('font-size', 10)
      .attr('font-family', 'monospace')
      .attr('fill', '#1f2937') // gray-800
      .attr('text-anchor', 'middle')
      .attr('dy', NODE_RADIUS + 12)
      .style('pointer-events', 'none')
      .style('user-select', 'none');

    // Update positions on each tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as D3Node).x ?? 0)
        .attr('y1', (d) => (d.source as D3Node).y ?? 0)
        .attr('x2', (d) => (d.target as D3Node).x ?? 0)
        .attr('y2', (d) => (d.target as D3Node).y ?? 0);

      node.attr('cx', (d) => d.x ?? 0).attr('cy', (d) => d.y ?? 0);

      label.attr('x', (d) => d.x ?? 0).attr('y', (d) => d.y ?? 0);
    });

    // Cleanup on unmount
    return () => {
      simulation.stop();
    };
  }, [nodes, edges, width, height, onNodeClick]);

  // Update highlighted node when selection changes
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    svg
      .selectAll<SVGCircleElement, D3Node>('circle')
      .attr('stroke', (d) => (d.id === highlightedNodeId ? '#facc15' : '#fff')) // yellow-400 for highlight
      .attr('stroke-width', (d) => (d.id === highlightedNodeId ? 4 : 2))
      .attr('r', (d) => (d.id === highlightedNodeId ? NODE_RADIUS * 1.5 : NODE_RADIUS));
  }, [highlightedNodeId]);

  return (
    <div className="relative w-full h-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <svg ref={svgRef} width={width} height={height} className="w-full h-full">
        {/* D3 will render here */}
      </svg>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-lg">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Entity Types</h4>
        <div className="space-y-1.5">
          {Object.entries(NODE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-700 dark:text-gray-300 capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-lg">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <span className="font-semibold">Drag</span> to move nodes
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <span className="font-semibold">Scroll</span> to zoom
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <span className="font-semibold">Click</span> for details
        </p>
      </div>
    </div>
  );
}
