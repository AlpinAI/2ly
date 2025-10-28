/**
 * OnboardingCard Component
 *
 * WHY: Large card component for each onboarding step with step-specific actions.
 * Provides a consistent UI for all onboarding steps while allowing custom content.
 *
 * WHAT IT SHOWS:
 * - Step number badge (priority)
 * - Completion status icon
 * - Title and description from STEP_METADATA
 * - Step-specific action content
 *
 * STEP-SPECIFIC CONTENT:
 * - Step 1: "Browse MCP Servers" button (opens Add Source Workflow)
 * - Step 2: "Create Tool Set" button (opens Create Tool Set dialog, then Manage Tools dialog)
 * - Step 3: "Connect" button (opens Connect Agent dialog for the first agent with tools)
 */

import {
  CheckCircle,
  Circle,
  Server,
  Package,
  Plus,
  Link
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUIStore, useCreateToolSetDialog, useManageToolsDialog, useConnectAgentDialog } from '@/stores/uiStore';
import { STEP_METADATA, ONBOARDING_STEPS } from '@/constants/onboarding-steps';
import { useMCPServers } from '@/hooks/useMCPServers';
import { useRuntimeData } from '@/stores/runtimeStore';
import { useAgents } from '@/hooks/useAgents';
import type { OnboardingStep } from '@/graphql/generated/graphql';

interface OnboardingCardProps {
  step: OnboardingStep;
  onComplete?: () => void;
  isCurrentStep?: boolean;
}

export function OnboardingCard({ step, isCurrentStep = false }: OnboardingCardProps) {
  const setAddSourceWorkflowOpen = useUIStore((state) => state.setAddSourceWorkflowOpen);

  const { openDialog: openCreateToolSetDialog } = useCreateToolSetDialog();
  const manageToolsDialog = useManageToolsDialog();
  const { setOpen: setConnectAgentDialogOpen, setSelectedAgentId } = useConnectAgentDialog();

  const metadata = STEP_METADATA[step.stepId];
  const isCompleted = step.status === 'COMPLETED';

  // Get icon component based on metadata
  const getIcon = () => {
    switch (metadata?.icon) {
      case 'server':
        return <Server className="h-6 w-6" />;
      case 'package':
        return <Package className="h-6 w-6" />;
      case 'link':
        return <Link className="h-6 w-6" />;
      default:
        return <Circle className="h-6 w-6" />;
    }
  };
  
  // Handle creating tool set with callback to open manage tools dialog
  const handleCreateToolSet = () => {
    openCreateToolSetDialog((toolSetId) => {
      manageToolsDialog.setSelectedToolSetId(toolSetId);
      manageToolsDialog.setOpen(true);
    });
  };

  // Render step-specific content
  const renderStepContent = () => {
    switch (step.stepId) {
      case ONBOARDING_STEPS.INSTALL_SERVER: {
        const { servers } = useMCPServers();
        const firstServer = servers[0];

        if (isCompleted && firstServer) {
          return (
            <div className="space-y-3">
              <div className="rounded-lg bg-green-400/20 dark:bg-green-900/20 p-3">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <span className="flex items-center">
                    <Server className="mr-2 h-4 w-4" />
                    <span className="font-medium truncate max-w-xs overflow-hidden whitespace-nowrap" title={firstServer.name}>
                      {firstServer.name}
                    </span>
                  </span>
                </p>
              </div>
            </div>
          );
        }

        return (
          <Button
            onClick={() => setAddSourceWorkflowOpen(true)}
            className="w-full"
            variant={isCurrentStep ? "default" : "outline"}
          >
            <Plus className="mr-2 h-4 w-4" />
            Browse MCP Servers
          </Button>
        );
      }
        
      case ONBOARDING_STEPS.CREATE_TOOL_SET: {
        const { runtimes } = useRuntimeData();
        const { agents } = useAgents(runtimes);

        // Find first agent with at least one tool
        const firstAgentWithTools = agents.find(agent =>
          agent.mcpToolCapabilities && agent.mcpToolCapabilities.length > 0
        );

        if (isCompleted && firstAgentWithTools) {
          const toolCount = firstAgentWithTools.mcpToolCapabilities?.length || 0;
          return (
            <div className="space-y-3">
              <div className="rounded-lg bg-green-400/20 dark:bg-green-900/20 p-3">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <span className="flex items-center">
                    <Package className="mr-2 h-4 w-4" />
                    <span className="font-medium truncate max-w-xs overflow-hidden whitespace-nowrap" title={firstAgentWithTools.name}>
                      {firstAgentWithTools.name} ({toolCount} {toolCount === 1 ? 'tool' : 'tools'})
                    </span>
                  </span>
                </p>
              </div>
            </div>
          );
        }

        return (
          <Button
            onClick={handleCreateToolSet}
            className="w-full"
            variant={isCurrentStep ? "default" : "outline"}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Tool Set
          </Button>
        );
      }

      case ONBOARDING_STEPS.CONNECT_AGENT: {
        const { runtimes } = useRuntimeData();
        const { agents } = useAgents(runtimes);

        // Find first agent with tools
        const firstAgentWithTools = agents.find(agent =>
          agent.mcpToolCapabilities && agent.mcpToolCapabilities.length > 0
        );

        if (isCompleted && firstAgentWithTools) {
          return (
            <div className="space-y-3">
              <div className="rounded-lg bg-green-400/20 dark:bg-green-900/20 p-3">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <span className="flex items-center">
                    <Link className="mr-2 h-4 w-4" />
                    <span className="font-medium truncate max-w-xs overflow-hidden whitespace-nowrap" title={firstAgentWithTools.name}>
                      {firstAgentWithTools.name} connected
                    </span>
                  </span>
                </p>
              </div>
            </div>
          );
        }

        // Need to have an agent with tools first
        if (!firstAgentWithTools) {
          return (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                Create a tool set first to connect to an agent.
              </p>
            </div>
          );
        }

        return (
          <Button
            onClick={() => {
              setSelectedAgentId(firstAgentWithTools.id);
              setConnectAgentDialogOpen(true);
            }}
            className="w-full"
            variant={isCurrentStep ? "default" : "outline"}
          >
            <Link className="mr-2 h-4 w-4" />
            Connect
          </Button>
        );
      }

      default:
        return null;
    }
  };
  
  return (
    <div className={cn(
      "relative rounded-lg border p-6 transition-all duration-200",
      isCompleted 
        ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20" 
        : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 hover:shadow-md"
    )}>
      {/* Step number badge */}
      <div className="absolute -top-3 -left-3">
        <div className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold",
          isCompleted
            ? "border-green-500 bg-green-500 text-white"
            : "border-gray-300 bg-white text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
        )}>
          {step.priority}
        </div>
      </div>
      
      {/* Completion status icon */}
      <div className="mb-4 flex items-center justify-between">
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-lg",
          isCompleted
            ? "bg-green-400/20 text-green-600 dark:bg-green-900/30 dark:text-green-400"
            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
        )}>
          {isCompleted ? <CheckCircle className="h-6 w-6" /> : getIcon()}
        </div>
        {isCompleted && (
          <div className="text-sm text-green-600 dark:text-green-400 font-medium">
            Completed
          </div>
        )}
      </div>
      
      {/* Title and description */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {metadata?.title || 'Onboarding Step'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {metadata?.description || 'Complete this step to continue with your setup.'}
        </p>
      </div>
      
      {/* Step-specific content */}
      <div className="mt-4">
        {renderStepContent()}
      </div>
    </div>
  );
}
