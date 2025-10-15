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
  CHOOSE_REGISTRY: 'choose-mcp-registry',
  INSTALL_SERVER: 'install-mcp-server',
  CONNECT_AGENT: 'connect-agent',
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
  [ONBOARDING_STEPS.CHOOSE_REGISTRY]: {
    title: 'Choose an MCP Registry',
    description: 'Enable the servers from the registry to be configured',
    icon: 'database',
  },
  [ONBOARDING_STEPS.INSTALL_SERVER]: {
    title: 'Install an MCP Server',
    description: 'Add your first MCP server to start using tools in your agents.',
    icon: 'server',
  },
  [ONBOARDING_STEPS.CONNECT_AGENT]: {
    title: 'Connect an Agent Runtime',
    description: 'Connect your first agent runtime to execute tools and interact with servers.',
    icon: 'bot',
  },
};
