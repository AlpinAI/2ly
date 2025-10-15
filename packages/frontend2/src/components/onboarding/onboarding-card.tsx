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
 * - Step 1: "Add Official Registry" button + "Browse Registries" link
 * - Step 2: "Browse MCP Servers" button (opens Add Tool Workflow)
 * - Step 3: Runtime connection instructions embedded in card
 */

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  Circle, 
  Database, 
  Server, 
  Bot, 
  Plus, 
  ExternalLink,
  Check,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useWorkspaceId } from '@/stores/workspaceStore';
import { useUIStore } from '@/stores/uiStore';
import { CreateMcpRegistryDocument } from '@/graphql/generated/graphql';
import { STEP_METADATA, ONBOARDING_STEPS } from '@/constants/onboarding-steps';
import { RegistrySplitButton } from '@/components/registry/registry-split-button';
import { useMCPRegistries } from '@/hooks/useMCPRegistries';
import { useRegistryAutoSync } from '@/hooks/useRegistryAutoSync';
import type { OnboardingStep } from '@/graphql/generated/graphql';

interface OnboardingCardProps {
  step: OnboardingStep;
  onComplete?: () => void;
}

export function OnboardingCard({ step, onComplete }: OnboardingCardProps) {
  const navigate = useNavigate();
  const workspaceId = useWorkspaceId();
  const setAddToolWorkflowOpen = useUIStore((state) => state.setAddToolWorkflowOpen);
  const [isAddingRegistry, setIsAddingRegistry] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);
  
  const [createRegistry] = useMutation(CreateMcpRegistryDocument);
  const { autoSyncRegistry } = useRegistryAutoSync();
  
  const metadata = STEP_METADATA[step.stepId];
  const isCompleted = step.status === 'COMPLETED';
  
  // Get icon component based on metadata
  const getIcon = () => {
    switch (metadata?.icon) {
      case 'database':
        return <Database className="h-6 w-6" />;
      case 'server':
        return <Server className="h-6 w-6" />;
      case 'bot':
        return <Bot className="h-6 w-6" />;
      default:
        return <Circle className="h-6 w-6" />;
    }
  };
  
  // Handle adding registry with auto-sync
  const handleAddRegistry = async (name: string, upstreamUrl: string) => {
    if (!workspaceId) return;
    
    setIsAddingRegistry(true);
    try {
      const result = await createRegistry({
        variables: {
          workspaceId,
          name,
          upstreamUrl,
        },
      });
      
      // Auto-sync the newly created registry
      const registryId = result.data?.createMCPRegistry?.id;
      if (registryId) {
        await autoSyncRegistry(registryId);
      }
      
      onComplete?.();
    } catch (error) {
      console.error('Failed to add registry:', error);
    } finally {
      setIsAddingRegistry(false);
    }
  };
  
  // Handle copying runtime connection command
  const handleCopyCommand = async () => {
    const command = `npx @2ly/runtime --workspace-id=${workspaceId} --capabilities=agent`;
    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommand(true);
      setTimeout(() => setCopiedCommand(false), 2000);
    } catch (error) {
      console.error('Failed to copy command:', error);
    }
  };
  
  // Render step-specific content
  const renderStepContent = () => {
    switch (step.stepId) {
      case ONBOARDING_STEPS.CHOOSE_REGISTRY: {
        const { registries } = useMCPRegistries();
        const existingUrls = registries.map(r => r.upstreamUrl);
        const firstRegistry = registries[0];
        
        if (isCompleted && firstRegistry) {
          return (
            <div className="space-y-3">
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3">
                <p className="text-sm text-green-800 dark:text-green-200">
                <span className="flex items-center">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  <span className="font-medium">{firstRegistry.name}</span>
                </span>
                </p>
              </div>
            </div>
          );
        }
        
        return (
          <div className="space-y-3">
            <RegistrySplitButton
              onSelectRegistry={handleAddRegistry}
              isLoading={isAddingRegistry}
              existingRegistryUrls={existingUrls}
              className="w-full"
            />
          </div>
        );
      }
        
      case ONBOARDING_STEPS.INSTALL_SERVER:
        return (
          <Button
            onClick={() => setAddToolWorkflowOpen(true)}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Browse MCP Servers
          </Button>
        );
        
      case ONBOARDING_STEPS.CONNECT_AGENT:
        return (
          <Button
            onClick={handleCopyCommand}
            className="w-full"
          >
            {copiedCommand ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                Get instructions
              </>
            )}
          </Button>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className={cn(
      "relative rounded-lg border p-6 transition-all duration-200",
      isCompleted 
        ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 opacity-60" 
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
            ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
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
