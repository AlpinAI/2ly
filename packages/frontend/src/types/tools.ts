/**
 * Tool Item Types
 *
 * WHY: Unified types for displaying MCP Tools and Agents together in the Tools page.
 * Uses discriminated union pattern for type-safe handling of both item types.
 */

import type { GetMcpToolsQuery, GetAgentsQuery } from '@/graphql/generated/graphql';

// Enum for distinguishing tool item types
export enum ToolItemType {
  MCP_TOOL = 'MCP_TOOL',
  AGENT = 'AGENT',
}

// Extract base types from GraphQL queries
export type MCPTool = NonNullable<NonNullable<GetMcpToolsQuery['mcpTools']>[number]>;
export type Agent = NonNullable<NonNullable<GetAgentsQuery['getAgentsByWorkspace']>[number]>;

// Wrapped types with discriminator
export type MCPToolItem = MCPTool & { itemType: ToolItemType.MCP_TOOL };
export type AgentItem = Agent & { itemType: ToolItemType.AGENT };

// Unified ToolItem type (discriminated union)
export type ToolItem = MCPToolItem | AgentItem;

// Type guards for safe type narrowing
export function isMCPTool(item: ToolItem): item is MCPToolItem {
  return item.itemType === ToolItemType.MCP_TOOL;
}

export function isAgentItem(item: ToolItem): item is AgentItem {
  return item.itemType === ToolItemType.AGENT;
}

// Filter options for the Tools page type filter
export const TOOL_ITEM_TYPE_OPTIONS = [
  { id: ToolItemType.MCP_TOOL, label: 'MCP Tools' },
  { id: ToolItemType.AGENT, label: 'Agents' },
] as const;

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
