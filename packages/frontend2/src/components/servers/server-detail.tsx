/**
 * ServerDetail Component
 *
 * WHY: Displays detailed information about a selected MCP server.
 * Used by Servers Page as the detail panel.
 *
 * DISPLAYS:
 * - Name
 * - Description
 * - Transport
 * - Run On
 * - Config (with SecretValue for secrets)
 * - Repository URL
 * - Connected Runtime
 * - Tools list
 */

import { ExternalLink, Server } from 'lucide-react';
import { SecretValue } from '@/components/ui/secret-value';
import type { SubscribeMcpServersSubscription } from '@/graphql/generated/graphql';

type McpServer = NonNullable<SubscribeMcpServersSubscription['mcpServers']>[number];

export interface ServerDetailProps {
  server: McpServer;
}

export function ServerDetail({ server }: ServerDetailProps) {
  // Parse config JSON
  let configObj: Record<string, unknown> = {};
  try {
    configObj = JSON.parse(server.config);
  } catch {
    configObj = { raw: server.config };
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
            <Server className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{server.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{server.description}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        {/* Transport */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Transport
          </h4>
          <span className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
            {server.transport}
          </span>
        </div>

        {/* Run On */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Run On</h4>
          {server.runOn ? (
            <span className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
              {server.runOn}
            </span>
          ) : (
            <span className="text-sm text-gray-400 dark:text-gray-500">Not specified</span>
          )}
        </div>

        {/* Runtime */}
        {server.runtime && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Connected Runtime
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">{server.runtime.name}</p>
          </div>
        )}

        {/* Repository URL */}
        {server.repositoryUrl && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Repository
            </h4>
            <a
              href={server.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              {server.repositoryUrl}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* Configuration */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Configuration
          </h4>
          <div className="space-y-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
            {Object.entries(configObj).map(([key, value]) => {
              const isSecret =
                key.toLowerCase().includes('secret') ||
                key.toLowerCase().includes('key') ||
                key.toLowerCase().includes('password') ||
                key.toLowerCase().includes('token');

              return (
                <div key={key} className="space-y-1">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{key}</p>
                  {isSecret && typeof value === 'string' ? (
                    <SecretValue value={value} />
                  ) : (
                    <code className="block text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded font-mono text-gray-900 dark:text-gray-100">
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </code>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tools */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Tools ({server.tools?.length || 0})
          </h4>
          {server.tools && server.tools.length > 0 ? (
            <ul className="space-y-1">
              {server.tools.map((tool) => (
                <li
                  key={tool.id}
                  className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700"
                >
                  {tool.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">No tools discovered yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
