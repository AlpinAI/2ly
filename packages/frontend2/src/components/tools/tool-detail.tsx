/**
 * ToolDetail Component
 *
 * WHY: Displays detailed information about a selected MCP tool.
 * Used by Tools Page as the detail panel.
 *
 * DISPLAYS:
 * - Tool name and description
 * - Link to MCP Server
 * - Links to agents that use this tool
 * - ToolTester component for testing
 */

import { ExternalLink, Wrench, Server, Bot } from 'lucide-react';
import { ToolTester } from './tool-tester';
import type { SubscribeMcpToolsSubscription } from '@/graphql/generated/graphql';

type McpTool = NonNullable<NonNullable<SubscribeMcpToolsSubscription['mcpTools']>[number]>;

export interface ToolDetailProps {
  tool: McpTool;
}

export function ToolDetail({ tool }: ToolDetailProps) {
  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
            <Wrench className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{tool.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{tool.description}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        {/* Status */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Status</h4>
          <span
            className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${
              tool.status === 'ACTIVE'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
            }`}
          >
            {tool.status}
          </span>
        </div>

        {/* MCP Server */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            MCP Server
          </h4>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700">
            <Server className="h-4 w-4 text-gray-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{tool.mcpServer.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{tool.mcpServer.description}</p>
            </div>
            {tool.mcpServer.repositoryUrl && (
              <a
                href={tool.mcpServer.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        {/* Agents */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Available on Agents ({tool.runtimes?.length || 0})
          </h4>
          {tool.runtimes && tool.runtimes.length > 0 ? (
            <ul className="space-y-1">
              {tool.runtimes.map((runtime) => (
                <li
                  key={runtime.id}
                  className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700"
                >
                  <Bot className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{runtime.name}</p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      runtime.status === 'ACTIVE'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                    }`}
                  >
                    {runtime.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">Not available on any agents yet</p>
          )}
        </div>

        {/* Tool Tester */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <ToolTester toolId={tool.id} toolName={tool.name} inputSchema={tool.inputSchema} />
        </div>
      </div>
    </div>
  );
}
