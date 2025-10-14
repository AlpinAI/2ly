/**
 * MCPServerCard Component
 *
 * WHY: Displays an individual MCP Registry Server with key information
 * and a split configure button (main action + version dropdown).
 *
 * ARCHITECTURE:
 * - Used in MCPServerBrowser grid
 * - Shows server metadata from registry (latest version)
 * - Split button: Configure latest or select older version
 * - Dropdown appears only if older versions exist
 * - Styled with Tailwind + Radix UI patterns
 */

import { useState } from 'react';
import { ExternalLink, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SplitButton } from '@/components/ui/split-button';
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import type { ServerVersionGroup } from './mcp-server-browser';
import type { SubscribeMcpRegistriesSubscription } from '@/graphql/generated/graphql';

// Extract the server type from the subscription
type MCPRegistryServer = NonNullable<
  NonNullable<SubscribeMcpRegistriesSubscription['mcpRegistries']>[number]['servers']
>[number];

interface MCPServerCardProps {
  serverGroup: ServerVersionGroup;
  onConfigure: (server: MCPRegistryServer) => void;
}

/**
 * Extracts transport type from packages or remotes JSON
 */
const getTransportType = (server: MCPRegistryServer): string => {
  try {
    // Try packages first
    if (server.packages) {
      const packages = JSON.parse(server.packages);
      if (Array.isArray(packages) && packages[0]?.transport?.type) {
        return packages[0].transport.type.toUpperCase();
      }
    }
    // Try remotes
    if (server.remotes) {
      const remotes = JSON.parse(server.remotes);
      if (Array.isArray(remotes) && remotes[0]?.type) {
        return remotes[0].type.toUpperCase();
      }
    }
  } catch {
    // Ignore JSON parse errors
  }
  return 'STDIO'; // Default fallback
};

/**
 * Gets display name, preferring title over name
 */
const getDisplayName = (server: MCPRegistryServer): string => {
  return server.title || server.name;
};

export function MCPServerCard({ serverGroup, onConfigure }: MCPServerCardProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { latestVersion, olderVersions } = serverGroup;
  const hasOlderVersions = olderVersions.length > 0;

  const transportType = getTransportType(latestVersion);
  const displayName = getDisplayName(latestVersion);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
      {/* Card Header */}
      <div className="flex items-start gap-3 mb-3 flex-1">
        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">{displayName}</h4>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 font-medium">
              {transportType}
            </span>
            {latestVersion.version && (
              <span className="text-xs text-gray-500 dark:text-gray-400">v{latestVersion.version}</span>
            )}
            {hasOlderVersions && (
              <span className="text-xs text-gray-400 dark:text-gray-500">+{olderVersions.length} older</span>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{latestVersion.description}</p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        {latestVersion.repositoryUrl && (
          <a
            href={latestVersion.repositoryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
            View Repo
          </a>
        )}

        {/* Configure Button - Split when older versions exist */}
        {hasOlderVersions ? (
          <SplitButton
            size="sm"
            primaryLabel="Configure"
            onPrimaryAction={() => onConfigure(latestVersion)}
            dropdownContent={
              <>
                <DropdownMenuItem onClick={() => onConfigure(latestVersion)}>
                  <Check className="h-4 w-4 mr-2" />
                  Latest (v{latestVersion.version})
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {olderVersions.map((version) => (
                  <DropdownMenuItem
                    key={version.id}
                    onClick={() => {
                      onConfigure(version);
                      setDropdownOpen(false);
                    }}
                  >
                    <span className="w-6" /> {/* Spacer for alignment */}v{version.version}
                  </DropdownMenuItem>
                ))}
              </>
            }
            dropdownOpen={dropdownOpen}
            onDropdownOpenChange={setDropdownOpen}
            dropdownAriaLabel="Select version"
            className="ml-auto"
          />
        ) : (
          <Button size="sm" onClick={() => onConfigure(latestVersion)} className="ml-auto">
            Configure
          </Button>
        )}
      </div>
    </div>
  );
}
