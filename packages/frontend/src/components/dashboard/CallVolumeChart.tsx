/**
 * CallVolumeChart Component
 *
 * WHY: Displays tool call volume over time using a simple SVG-based bar chart.
 * Provides visual insights into system activity patterns without external charting libraries.
 *
 * FEATURES:
 * - SVG-based bar chart (no external dependencies)
 * - Color-coded bars: Success (green) vs Failed (red)
 * - Hover interactions with tooltips
 * - Auto-scaling Y-axis based on data
 * - Responsive sizing
 * - Loading and empty states
 * - Smooth animations
 */

import { useState } from 'react';
import { Loader2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChartDataPoint {
  label: string;
  success: number;
  failed: number;
  timestamp: Date;
}

export interface CallVolumeChartProps {
  data: ChartDataPoint[];
  loading?: boolean;
  className?: string;
}

export function CallVolumeChart({ data, loading, className }: CallVolumeChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (loading) {
    return (
      <div
        className={cn(
          'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6',
          className
        )}
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        className={cn(
          'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6',
          className
        )}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          Tool Call Activity
          <Info className="h-4 w-4 text-gray-400" />
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          No data available for the selected time range
        </div>
      </div>
    );
  }

  // Calculate chart dimensions and scaling
  const maxValue = Math.max(...data.map((d) => d.success + d.failed), 1);
  const chartHeight = 240;
  const barWidth = Math.max(100 / data.length - 2, 20); // percentage per bar with gap
  const yAxisSteps = 5;
  const yAxisMax = Math.ceil(maxValue / yAxisSteps) * yAxisSteps || yAxisSteps;

  const getBarHeight = (value: number) => {
    return (value / yAxisMax) * chartHeight;
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6',
        'animate-in fade-in slide-in-from-bottom-2 duration-500',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          Tool Call Activity
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-gray-600 dark:text-gray-400">Success</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-gray-600 dark:text-gray-400">Failed</span>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
          {Array.from({ length: yAxisSteps + 1 }).map((_, i) => {
            const value = yAxisMax - (i * yAxisMax) / yAxisSteps;
            return (
              <div key={i} className="text-right pr-2">
                {Math.round(value)}
              </div>
            );
          })}
        </div>

        {/* Chart area */}
        <div className="ml-12">
          <svg
            width="100%"
            height={chartHeight + 40}
            className="overflow-visible"
            role="img"
            aria-label="Tool call volume chart"
          >
            {/* Grid lines */}
            {Array.from({ length: yAxisSteps + 1 }).map((_, i) => {
              const y = (i / yAxisSteps) * chartHeight;
              return (
                <line
                  key={i}
                  x1="0"
                  y1={y}
                  x2="100%"
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-gray-200 dark:text-gray-700"
                  opacity="0.5"
                />
              );
            })}

            {/* Bars */}
            {data.map((point, index) => {
              const xPosition = (index / data.length) * 100;
              const successHeight = getBarHeight(point.success);
              const failedHeight = getBarHeight(point.failed);
              const totalHeight = successHeight + failedHeight;
              const isHovered = hoveredIndex === index;

              return (
                <g
                  key={index}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="cursor-pointer transition-opacity"
                  opacity={hoveredIndex === null || isHovered ? 1 : 0.6}
                >
                  {/* Failed (red) bar on top */}
                  <rect
                    x={`${xPosition}%`}
                    y={chartHeight - totalHeight}
                    width={`${barWidth}%`}
                    height={failedHeight}
                    fill="currentColor"
                    className="text-red-500 transition-all duration-200"
                    rx="2"
                  />
                  {/* Success (green) bar on bottom */}
                  <rect
                    x={`${xPosition}%`}
                    y={chartHeight - successHeight}
                    width={`${barWidth}%`}
                    height={successHeight}
                    fill="currentColor"
                    className="text-green-500 transition-all duration-200"
                    rx="2"
                  />

                  {/* X-axis label */}
                  <text
                    x={`${xPosition + barWidth / 2}%`}
                    y={chartHeight + 20}
                    textAnchor="middle"
                    className="text-xs fill-gray-600 dark:fill-gray-400"
                  >
                    {point.label}
                  </text>

                  {/* Hover tooltip */}
                  {isHovered && (
                    <g>
                      <rect
                        x={`${xPosition}%`}
                        y={chartHeight - totalHeight - 60}
                        width="120"
                        height="50"
                        fill="currentColor"
                        className="text-gray-900 dark:text-gray-700"
                        rx="4"
                        opacity="0.95"
                      />
                      <text
                        x={`${xPosition}%`}
                        y={chartHeight - totalHeight - 42}
                        className="text-xs fill-white dark:fill-gray-200 font-medium"
                        dx="8"
                      >
                        {point.label}
                      </text>
                      <text
                        x={`${xPosition}%`}
                        y={chartHeight - totalHeight - 28}
                        className="text-xs fill-green-400"
                        dx="8"
                      >
                        ✓ Success: {point.success}
                      </text>
                      <text
                        x={`${xPosition}%`}
                        y={chartHeight - totalHeight - 14}
                        className="text-xs fill-red-400"
                        dx="8"
                      >
                        ✗ Failed: {point.failed}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
