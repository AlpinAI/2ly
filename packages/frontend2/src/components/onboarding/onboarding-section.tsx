/**
 * OnboardingSection Component
 *
 * WHY: Container component for onboarding cards with grid layout.
 * Only shows when there are pending onboarding steps.
 *
 * WHAT IT SHOWS:
 * - Section title "Get Started with 2LY"
 * - Grid layout for onboarding cards
 * - Responsive design (1 column on mobile, 3 on desktop)
 *
 * USAGE:
 * ```tsx
 * import { OnboardingSection } from '@/components/onboarding/onboarding-section';
 * import { useOnboarding } from '@/hooks/useOnboarding';
 * 
 * function DashboardPage() {
 *   const { pendingSteps } = useOnboarding();
 *   
 *   return (
 *     <div>
 *       {pendingSteps.length > 0 && (
 *         <OnboardingSection steps={pendingSteps} />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */

import { OnboardingCard } from './onboarding-card';
import type { OnboardingStep } from '@/graphql/generated/graphql';

interface OnboardingSectionProps {
  steps: OnboardingStep[];
}

export function OnboardingSection({ steps }: OnboardingSectionProps) {
  if (steps.length === 0) {
    return null;
  }
  
  return (
    <div className="mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Get Started with 2LY
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Complete these steps to set up your workspace and start using MCP tools.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {steps.map((step) => (
          <OnboardingCard key={step.id} step={step} />
        ))}
      </div>
    </div>
  );
}
