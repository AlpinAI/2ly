/**
 * Onboarding Step Definitions
 *
 * WHY: Centralized definitions for onboarding steps to keep them maintainable.
 * This allows adding new steps in future updates without duplicates.
 *
 * USAGE:
 * - Used by WorkspaceRepository to initialize onboarding steps
 * - Step IDs are used throughout the system for consistency
 * - Priority determines display order (lower number = higher priority)
 */

export interface OnboardingStepDefinition {
  stepId: string;
  type: 'ONBOARDING' | 'ANNOUNCEMENT' | 'LEARNING';
  priority: number;
}

/**
 * Initial onboarding steps for new workspaces
 *
 * WHY: These 3 steps guide users through the core 2LY setup:
 * 1. Install MCP server (add tools to workspace)
 * 2. Create skill with tools (organize and manage tools)
 * 3. Connect skill to an agent (integrate with AI workflows)
 */
export const INITIAL_ONBOARDING_STEPS: OnboardingStepDefinition[] = [
  {
    stepId: 'install-mcp-server',
    type: 'ONBOARDING',
    priority: 1,
  },
  {
    stepId: 'create-skill',
    type: 'ONBOARDING',
    priority: 2,
  },
  {
    stepId: 'connect-skill-to-agent',
    type: 'ONBOARDING',
    priority: 3,
  },
];
