/**
 * Onboarding Step Metadata
 *
 * WHY: Centralized metadata for onboarding steps to keep UI content maintainable.
 * This provides titles, descriptions, and icons for each step.
 *
 * USAGE:
 * ```tsx
 * import { STEP_METADATA, ONBOARDING_STEPS } from '@/constants/onboarding-steps';
 * 
 * const metadata = STEP_METADATA[ONBOARDING_STEPS.CHOOSE_REGISTRY];
 * // metadata.title, metadata.description, metadata.icon
 * ```
 */

export const ONBOARDING_STEPS = {
  INSTALL_SERVER: 'install-mcp-server',
  CREATE_TOOL_SET: 'create-tool-set',
  CONNECT_AGENT: 'connect-tool-set-to-agent',
} as const;

export interface StepMetadata {
  title: string;
  description: string;
  icon: string;
}

/**
 * Step metadata for UI display
 *
 * WHY: Provides consistent titles, descriptions, and icons for each onboarding step.
 * Icons are Lucide React icon names that can be imported dynamically.
 */
export const STEP_METADATA: Record<string, StepMetadata> = {
  [ONBOARDING_STEPS.INSTALL_SERVER]: {
    title: 'Install an MCP Server',
    description: 'Add your first MCP server to start using tools in your agents.',
    icon: 'server',
  },
  [ONBOARDING_STEPS.CREATE_TOOL_SET]: {
    title: 'Create Your First Tool Set',
    description: 'Create a tool set with at least one tool to start enriching your agents.',
    icon: 'package',
  },
  [ONBOARDING_STEPS.CONNECT_AGENT]: {
    title: 'Connect your Agent',
    description: 'Connect your tool set to an agent to start using your tools in AI workflows.',
    icon: 'link',
  },
};
