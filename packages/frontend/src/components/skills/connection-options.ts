/**
 * Connection Options Configuration
 *
 * WHY: Defines available platform/framework options for connecting agents to Skilder.
 * Provides metadata for each platform including display name, description, and icon.
 *
 * PLATFORMS:
 * - Langchain/Langgraph: Python integration via langchain_skilder package
 * - Langflow: MCP Server node in Langflow workflows
 * - N8N: MCP Client Tool in N8N workflows
 * - JSON: Generic configuration for custom integrations
 */

import {
  Code2,
  Workflow,
  Network,
  FileJson,
  type LucideIcon,
} from 'lucide-react';

/**
 * Platform selection options
 */
export type PlatformOption = 'langchain' | 'langflow' | 'n8n' | 'json';

/**
 * Platform configuration interface
 */
export interface ConnectionOption {
  id: PlatformOption;
  title: string;
  Icon: LucideIcon;
  disabled?: boolean;
}

/**
 * Available connection platforms
 *
 * WHY use lucide-react icons instead of external URLs:
 * - Consistent with frontend design system
 * - Better performance (no external requests)
 * - Works offline
 * - Easier to customize colors/sizes
 */
export const CONNECTION_OPTIONS: ConnectionOption[] = [
  {
    id: 'n8n',
    title: 'N8N',
    Icon: Network,
  },
  {
    id: 'langflow',
    title: 'Langflow',
    Icon: Workflow,
  },
  {
    id: 'langchain',
    title: 'Langchain/Langgraph',
    Icon: Code2,
    disabled: true,
  },
  {
    id: 'json',
    title: 'Manual Configuration',
    Icon: FileJson,
  },
];
