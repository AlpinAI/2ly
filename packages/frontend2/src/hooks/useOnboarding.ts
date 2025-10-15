/**
 * useOnboarding Hook
 *
 * WHY: Provides access to onboarding steps and mutation handlers.
 * Centralizes onboarding logic and provides computed values for UI.
 *
 * WHAT IT PROVIDES:
 * - Pending onboarding steps (filtered and sorted)
 * - All onboarding steps
 * - Mutation handlers for completing/dismissing steps
 * - Computed state for UI components
 *
 * USAGE:
 * ```tsx
 * function OnboardingSection() {
 *   const { pendingSteps, completeStep, dismissStep } = useOnboarding();
 *   
 *   return (
 *     <div>
 *       {pendingSteps.map(step => (
 *         <OnboardingCard 
 *           key={step.id} 
 *           step={step}
 *           onComplete={() => completeStep(step.stepId)}
 *           onDismiss={() => dismissStep(step.stepId)}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */

import { useMemo } from 'react';
import { useMutation } from '@apollo/client/react';
import { useWorkspaceId } from '@/stores/workspaceStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { 
  CompleteOnboardingStepDocument, 
  DismissOnboardingStepDocument,
  type OnboardingStep 
} from '@/graphql/generated/graphql';

export function useOnboarding() {
  const workspaceId = useWorkspaceId();
  const onboardingSteps = useWorkspaceStore((state) => state.onboardingSteps);
  
  const [completeStepMutation] = useMutation(CompleteOnboardingStepDocument);
  const [dismissStepMutation] = useMutation(DismissOnboardingStepDocument);
  
  // Filter and sort pending onboarding steps
  const pendingSteps = useMemo(() => 
    onboardingSteps
      .filter(step => step.status === 'PENDING' && step.type === 'ONBOARDING')
      .sort((a, b) => (a.priority || 0) - (b.priority || 0)),
    [onboardingSteps]
  );
  
  // Check if onboarding is complete
  const isOnboardingComplete = useMemo(() => 
    pendingSteps.length === 0,
    [pendingSteps.length]
  );
  
  // Get step by ID
  const getStep = (stepId: string): OnboardingStep | undefined => 
    onboardingSteps.find(step => step.stepId === stepId);
  
  // Mutation handlers
  const completeStep = async (stepId: string) => {
    if (!workspaceId) return;
    
    try {
      await completeStepMutation({
        variables: { 
          workspaceId, 
          stepId, 
          now: new Date().toISOString() 
        },
      });
    } catch (error) {
      console.error('[useOnboarding] Failed to complete step:', error);
    }
  };
  
  const dismissStep = async (stepId: string) => {
    if (!workspaceId) return;
    
    try {
      await dismissStepMutation({
        variables: { workspaceId, stepId },
      });
    } catch (error) {
      console.error('[useOnboarding] Failed to dismiss step:', error);
    }
  };
  
  return {
    // Data
    pendingSteps,
    allSteps: onboardingSteps,
    isOnboardingComplete,
    
    // Actions
    completeStep,
    dismissStep,
    getStep,
  };
}
