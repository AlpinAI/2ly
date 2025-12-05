/**
 * ToolDetail Component
 *
 * WHY: Displays details for an MCP tool.
 */

import { MCPToolDetail } from './mcp-tool-detail';
import type { ToolItem } from '@/types/tools';

export interface ToolDetailProps {
  item: ToolItem;
}

export function ToolDetail({ item }: ToolDetailProps) {
  return <MCPToolDetail tool={item} />;
}
