/**
 * RegistryServerTable Component
 *
 * WHY: Displays servers from the private registry in a table format.
 * Used by PrivateRegistrySection with MasterDetailLayout.
 *
 * COLUMNS:
 * - Name & Description
 * - Version
 * - Repository
 *
 * FEATURES:
 * - Click row to select
 * - Highlight selected row
 * - Loading state
 * - Empty state
 * - Footer with server count
 */

import { ExternalLink, Database } from 'lucide-react';
import type { GetMcpRegistriesQuery } from '@/graphql/generated/graphql';

export interface RegistryServerTableProps {
  servers: Array<NonNullable<NonNullable<GetMcpRegistriesQuery['mcpRegistries']>[number]['servers']>[number]>;
  selectedServerId: string | null;
  onSelectServer: (serverId: string) => void;
  loading?: boolean;
}

export function RegistryServerTable({
  servers,
  selectedServerId,
  onSelectServer,
  loading,
}: RegistryServerTableProps) {
  const serverList = servers || [];

  return (
    <div className="flex flex-col h-full">
      {/* Table */}
      <div className="flex-1 flex flex-col min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Loading servers...</p>
          </div>
        ) : serverList.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center py-12">
              <Database className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                No servers installed
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add your first MCP server to your private registry
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto">
              <table className="w-full border-separate border-spacing-0">
                <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Version
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Configurations
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Repository
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {serverList.map((server) => (
                    <tr
                      key={server.id}
                      onClick={() => onSelectServer(server.id)}
                      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        selectedServerId === server.id
                          ? 'bg-cyan-50 dark:bg-cyan-900/20'
                          : ''
                      }`}
                    >
                      <td className={`px-4 py-3 text-sm ${
                        selectedServerId === server.id ? 'border-l-4 border-cyan-500 pl-3' : ''
                      }`}>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {server.name}
                        </div>
                        {server.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {server.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {server.version ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            v{server.version}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {server.configurations?.length ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {server.repositoryUrl ? (
                          <a
                            href={server.repositoryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View
                          </a>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer with count */}
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Showing {serverList.length} {serverList.length === 1 ? 'server' : 'servers'}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
