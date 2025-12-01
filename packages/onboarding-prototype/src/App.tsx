import { useState, useEffect } from 'react';
import { CapabilitySelector } from './components/CapabilitySelector';
import { ToolsetPreview } from './components/ToolsetPreview';
import { FrameworkIntegration } from './components/FrameworkIntegration';
import { capabilities } from './mocks/capabilities';
import type { Capability } from './mocks/types';

type WizardStep = 'capability' | 'toolset' | 'integration';

const STORAGE_KEY = 'onboarding-wizard-state';

interface WizardState {
  currentStep: WizardStep;
  selectedCapability: Capability | null;
}

function App() {
  const [state, setState] = useState<WizardState>(() => {
    // Load state from localStorage on mount
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Restore capability from capabilities array to ensure functions are preserved
        if (parsed.selectedCapability) {
          parsed.selectedCapability = capabilities.find(
            (c) => c.id === parsed.selectedCapability.id
          );
        }
        return parsed;
      } catch {
        // Ignore parse errors
      }
    }
    return {
      currentStep: 'capability' as WizardStep,
      selectedCapability: null,
    };
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const handleCapabilitySelect = (capability: Capability) => {
    setState((prev) => ({ ...prev, selectedCapability: capability }));
  };

  const handleCapabilityNext = () => {
    setState((prev) => ({ ...prev, currentStep: 'toolset' }));
  };

  const handleToolsetNext = () => {
    setState((prev) => ({ ...prev, currentStep: 'integration' }));
  };

  const handleToolsetBack = () => {
    setState((prev) => ({ ...prev, currentStep: 'capability' }));
  };

  const handleIntegrationBack = () => {
    setState((prev) => ({ ...prev, currentStep: 'toolset' }));
  };

  const handleComplete = () => {
    // Reset wizard or show completion message
    alert('Skill setup complete! Your skill is ready to integrate.');
    resetWizard();
  };

  const resetWizard = () => {
    setState({
      currentStep: 'capability',
      selectedCapability: null,
    });
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xl">
                2
              </div>
              <div>
                <h1 className="text-xl font-bold text-card-foreground">
                  2ly Onboarding Prototype
                </h1>
                <p className="text-xs text-muted-foreground">
                  Capability-driven wizard flow
                </p>
              </div>
            </div>
            {state.currentStep !== 'capability' && (
              <button
                onClick={resetWizard}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Start Over
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-2">
            {['capability', 'toolset', 'integration'].map((step, index) => {
              const stepNames = {
                capability: 'Choose Skill',
                toolset: 'Configure Skill',
                integration: 'Integrate Skill',
              };
              const isActive = state.currentStep === step;
              const isCompleted =
                (step === 'capability' && state.selectedCapability) ||
                (step === 'toolset' && state.currentStep === 'integration');

              return (
                <div key={step} className="flex items-center">
                  {index > 0 && (
                    <div
                      className={`w-12 h-0.5 ${
                        isCompleted ? 'bg-primary' : 'bg-border'
                      }`}
                    />
                  )}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-card">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        isCompleted
                          ? 'bg-primary text-primary-foreground'
                          : isActive
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? '✓' : index + 1}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {stepNames[step as keyof typeof stepNames]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {state.currentStep === 'capability' && (
          <CapabilitySelector
            capabilities={capabilities}
            selectedCapability={state.selectedCapability}
            onSelect={handleCapabilitySelect}
            onNext={handleCapabilityNext}
          />
        )}

        {state.currentStep === 'toolset' && state.selectedCapability && (
          <ToolsetPreview
            capability={state.selectedCapability}
            onNext={handleToolsetNext}
            onBack={handleToolsetBack}
          />
        )}

        {state.currentStep === 'integration' && state.selectedCapability && (
          <FrameworkIntegration
            capability={state.selectedCapability}
            onBack={handleIntegrationBack}
            onComplete={handleComplete}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            This is a prototype demonstration. Running on port 8889.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
