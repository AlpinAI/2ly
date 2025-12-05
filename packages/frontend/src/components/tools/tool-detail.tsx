/**
 * ToolDetail Component (Router)
 *
 * WHY: Routes to the appropriate detail component based on tool item type.
 * Displays MCPToolDetail for MCP tools, AgentDetail for agents.
 */

import { MCPToolDetail } from './mcp-tool-detail';
import { AgentDetail } from './agent-detail';
import type { ToolItem } from '@/types/tools';
import { isMCPTool } from '@/types/tools';

export interface ToolDetailProps {
  item: ToolItem;
}

export function ToolDetail({ item }: ToolDetailProps) {
  if (isMCPTool(item)) {
    return <MCPToolDetail tool={item} />;
  }
  return <AgentDetail agent={item} />;
}
