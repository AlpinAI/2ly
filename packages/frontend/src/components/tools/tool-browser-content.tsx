/**
 * ToolBrowserContent Component
 *
 * WHY: Displays searchable, filterable list of MCP registry servers.
 * Uses real data from GraphQL subscriptions.
 *
 * ARCHITECTURE:
 * - Wraps MCPServerBrowser for backward compatibility
 * - Can be deprecated in favor of direct MCPServerBrowser usage
 */

import { MCPServerBrowser } from './mcp-server-browser';
import type { GetRegistryServersQuery } from '@/graphql/generated/graphql';

// Extract server type
type MCPRegistryServer = GetRegistryServersQuery['getRegistryServers'][number];

export function ToolBrowserContent() {
  const handleConfigure = (server: MCPRegistryServer) => {
    // For now, just log - full configuration will be implemented next
    console.log('Configure server:', server);
    // TODO: Implement configuration flow
  };

  return <MCPServerBrowser onConfigure={handleConfigure} />;
}
