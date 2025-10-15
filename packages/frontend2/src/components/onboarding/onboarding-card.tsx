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
import { 
  CheckCircle, 
  Circle, 
  Database, 
  Server, 
  Bot, 
  Plus, 
  ExternalLink,
  Check,
  RefreshCw,
  Loader2
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
import { useMCPServers } from '@/hooks/useMCPServers';
import { useRegistrySyncStore } from '@/stores/registrySyncStore';
import { useRuntimeData } from '@/stores/runtimeStore';
import { useAgents } from '@/hooks/useAgents';
import type { OnboardingStep } from '@/graphql/generated/graphql';

interface OnboardingCardProps {
  step: OnboardingStep;
  onComplete?: () => void;
  isCurrentStep?: boolean;
}

export function OnboardingCard({ step, isCurrentStep = false }: OnboardingCardProps) {
  const workspaceId = useWorkspaceId();
  const setAddToolWorkflowOpen = useUIStore((state) => state.setAddToolWorkflowOpen);
  const [isAddingRegistry, setIsAddingRegistry] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [pendingRegistryId, setPendingRegistryId] = useState<string | null>(null);
  
  const [createRegistry] = useMutation(CreateMcpRegistryDocument);
  const { autoSyncRegistry } = useRegistryAutoSync();
  const { isSyncing } = useRegistrySyncStore();
  
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
        setPendingRegistryId(registryId);
        await autoSyncRegistry(registryId);
      }
      
      // Don't call onComplete here - completion will come via workspace subscription
      // once backend marks the step complete after sync
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
              <div className="rounded-lg bg-green-400/20 dark:bg-green-900/20 p-3">
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
        
        const isSyncingNow = pendingRegistryId ? isSyncing(pendingRegistryId) : false;
        
        // Find the pending registry to get server count
        const pendingRegistry = pendingRegistryId 
          ? registries.find(r => r.id === pendingRegistryId) 
          : null;
        const serverCount = pendingRegistry?.servers?.length || 0;
        
        return (
          <div className="space-y-3">
            {isSyncingNow ? (
              <Button
                className="w-full"
                variant={isCurrentStep ? "default" : "outline"}
                disabled
              >
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing ({serverCount} servers found)
              </Button>
            ) : (
              <RegistrySplitButton
                onSelectRegistry={handleAddRegistry}
                isLoading={isAddingRegistry}
                existingRegistryUrls={existingUrls}
                className="w-full"
                variant={isCurrentStep ? "default" : "outline"}
              />
            )}
          </div>
        );
      }
        
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
            onClick={() => setAddToolWorkflowOpen(true)}
            className="w-full"
            variant={isCurrentStep ? "default" : "outline"}
          >
            <Plus className="mr-2 h-4 w-4" />
            Browse MCP Servers
          </Button>
        );
      }
        
      case ONBOARDING_STEPS.CONNECT_AGENT: {
        const { runtimes } = useRuntimeData();
        const { agents } = useAgents(runtimes);
        const firstAgent = agents[0];

        if (isCompleted && firstAgent) {
          return (
            <div className="space-y-3">
              <div className="rounded-lg bg-green-400/20 dark:bg-green-900/20 p-3">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <span className="flex items-center">
                    <Bot className="mr-2 h-4 w-4" />
                    <span className="font-medium truncate max-w-xs overflow-hidden whitespace-nowrap" title={firstAgent.name}>
                      {firstAgent.name}
                    </span>
                  </span>
                </p>
              </div>
            </div>
          );
        }

        return (
          <Button
            onClick={handleCopyCommand}
            className="w-full"
            variant={isCurrentStep ? "default" : "outline"}
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
