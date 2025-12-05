/**
 * Tool Item Types
 *
 * WHY: Types for displaying MCP Tools in the Tools page.
 */

import type { GetMcpToolsQuery } from '@/graphql/generated/graphql';

// Extract base types from GraphQL queries
export type MCPTool = NonNullable<NonNullable<GetMcpToolsQuery['mcpTools']>[number]>;

// ToolItem is simply an MCPTool
export type ToolItem = MCPTool;

// Helper to get display name for a tool item
export function getToolItemName(item: ToolItem): string {
  return item.name;
}

// Helper to get display description for a tool item
export function getToolItemDescription(item: ToolItem): string | null | undefined {
  return item.description;
}

// Helper to get skills from a tool item
export function getToolItemSkills(item: ToolItem): { id: string; name: string; description?: string | null }[] {
  return item.skills ?? [];
}
