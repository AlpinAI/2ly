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

import { MCPServerBrowser } from './MCPServerBrowser';
import type { SubscribeMcpRegistriesSubscription } from '@/graphql/generated/graphql';

// Extract server type
type MCPRegistryServer = NonNullable<
  NonNullable<SubscribeMcpRegistriesSubscription['mcpRegistries']>[number]['servers']
>[number];

export function ToolBrowserContent() {
  const handleConfigure = (server: MCPRegistryServer) => {
    // For now, just log - full configuration will be implemented next
    console.log('Configure server:', server);
    // TODO: Implement configuration flow
  };

  return <MCPServerBrowser onConfigure={handleConfigure} />;
}
