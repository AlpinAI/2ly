/**
 * Source Types
 *
 * WHY: Define types for different source types (MCP Server, REST API).
 * Used to add type discrimination to unified source table.
 *
 * USAGE:
 * - SourceType enum for type checking
 * - SOURCE_TYPE_LABELS for display names
 * - SOURCE_TYPE_OPTIONS for filter dropdowns
 */

import type { SubscribeMcpServersSubscription } from '@/graphql/generated/graphql';

/**
 * Source Type Enum
 *
 * MCP_SERVER: Model Context Protocol servers (currently implemented)
 * REST_API: REST API sources (coming soon)
 */
export enum SourceType {
  MCP_SERVER = 'MCP_SERVER',
  REST_API = 'REST_API',
}

/**
 * Human-readable labels for source types
 */
export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  [SourceType.MCP_SERVER]: 'MCP Server',
  [SourceType.REST_API]: 'REST API',
};

/**
 * Source type options for filter dropdowns
 */
export const SOURCE_TYPE_OPTIONS = [
  { id: SourceType.MCP_SERVER, label: SOURCE_TYPE_LABELS[SourceType.MCP_SERVER] },
  { id: SourceType.REST_API, label: SOURCE_TYPE_LABELS[SourceType.REST_API] },
];

/**
 * MCP Server type from GraphQL
 */
export type McpServer = NonNullable<SubscribeMcpServersSubscription['mcpServers']>[number];

/**
 * REST API Source type (placeholder for future implementation)
 */
export interface RESTAPISource {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  authType: 'API_KEY' | 'OAUTH2' | 'BASIC';
  endpointCount: number;
  endpoints?: Array<{
    id: string;
    method: string;
    path: string;
  }>;
}

/**
 * Unified Source type with discriminated union
 *
 * For now, only MCP servers exist, so we use a simple intersection.
 * When REST API is implemented, this will become:
 * type Source =
 *   | (McpServer & { type: SourceType.MCP_SERVER })
 *   | (RESTAPISource & { type: SourceType.REST_API });
 */
export type Source = McpServer & { type: SourceType };

/**
 * Type guard to check if a source is an MCP Server
 */
export function isMCPServer(source: Source): source is McpServer & { type: SourceType.MCP_SERVER } {
  return source.type === SourceType.MCP_SERVER;
}

/**
 * Type guard to check if a source is a REST API Source
 * NOTE: Currently REST API sources are not implemented, so this always returns false
 */
export function isRESTAPISource(source: Source): boolean {
  return source.type === SourceType.REST_API;
}
