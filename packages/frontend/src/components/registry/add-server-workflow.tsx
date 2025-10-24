/**
 * AddServerWorkflow Component
 *
 * WHY: Multi-step workflow for adding MCP servers to the private registry.
 * Uses horizontal carousel pattern similar to Add Source workflow.
 *
 * STEPS:
 * 1. Selection: Choose between "From Upstream Registry" or "Manual Setup"
 * 2a. Upstream Browser: Browse and search servers from upstream registries
 * 2b. Manual Form: Manually configure a server
 * → After adding server, automatically opens Add Source workflow at config step
 *
 * ARCHITECTURE:
 * - Bottom panel container with slide-up animation
 * - Horizontal carousel with CSS transforms
 * - Smart back navigation with state cleanup
 * - Auto-close on route navigation
 * - Seamless transition to configuration workflow
 */

import { useState, useEffect, useCallback } from 'react';
import { X, ArrowLeft, Database, Zap, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomPanel } from '@/components/ui/bottom-panel';
import { useAddServerWorkflow, useUIStore } from '@/stores/uiStore';
import { useCloseOnNavigation } from '@/hooks/useCloseOnNavigation';
import { cn } from '@/lib/utils';
import { UpstreamRegistryBrowser } from './upstream-registry-browser';
import { EasyManualServerForm } from './easy-manual-server-form';
import { AdvancedManualServerForm } from './advanced-manual-server-form';

type WorkflowStep = 'selection' | 'upstream' | 'easy-manual' | 'advanced-manual';

// Animation timing constants
const ANIMATION_DURATION_MS = 300;

export function AddServerWorkflow() {
  const { open, setOpen, initialStep, setInitialStep } = useAddServerWorkflow();
  const setAddSourceWorkflowOpen = useUIStore((state) => state.setAddSourceWorkflowOpen);
  const setAddSourceWorkflowInitialStep = useUIStore((state) => state.setAddSourceWorkflowInitialStep);
  const setAddSourceWorkflowServerId = useUIStore((state) => state.setAddSourceWorkflowServerId);

  const [currentStep, setCurrentStep] = useState<WorkflowStep>('selection');

  // Jump to initial step if provided (e.g., from command palette)
  useEffect(() => {
    if (initialStep && open) {
      setCurrentStep(initialStep);
    }
  }, [initialStep, open]);

  const handleClose = useCallback(() => {
    setOpen(false);
    // Reset state after animation completes
    setTimeout(() => {
      setCurrentStep('selection');
      setInitialStep(null);
    }, ANIMATION_DURATION_MS);
  }, [setOpen, setInitialStep]);

  // Auto-close on navigation
  useCloseOnNavigation(handleClose);

  function handleBack() {
    if (currentStep === 'upstream' || currentStep === 'easy-manual' || currentStep === 'advanced-manual') {
      setCurrentStep('selection');
    }
  }

  function handleEscape() {
    if (currentStep !== 'selection') {
      handleBack();
    } else {
      handleClose();
    }
  }

  function handleSourceSelect(source: 'upstream' | 'easy-manual' | 'advanced-manual') {
    setCurrentStep(source);
  }

  function handleServerAdded(serverId: string) {
    // Close this workflow
    handleClose();

    // Open Add Source workflow at the config step with the server ID
    setTimeout(() => {
      setAddSourceWorkflowServerId(serverId);
      setAddSourceWorkflowInitialStep('mcp-config');
      setAddSourceWorkflowOpen(true);
    }, ANIMATION_DURATION_MS);
  }

  // Calculate transform based on current step
  const getTranslateXValue = () => {
    switch (currentStep) {
      case 'selection':
        return '0%';
      case 'upstream':
      case 'easy-manual':
      case 'advanced-manual':
        return '-100%';
      default:
        return '0%';
    }
  };

  // Get header title based on step
  const getTitle = () => {
    switch (currentStep) {
      case 'selection':
        return 'Add MCP Server';
      case 'upstream':
        return 'Browse Upstream Registry';
      case 'easy-manual':
        return 'Easy Manual Setup';
      case 'advanced-manual':
        return 'Advanced Manual Setup';
      default:
        return 'Add MCP Server';
    }
  };

  return (
    <BottomPanel isOpen={open} onClose={handleClose} onEscape={handleEscape}>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {currentStep !== 'selection' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {getTitle()}
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content - Horizontal Carousel */}
      <div className="flex-1 overflow-hidden">
        <div
          className="flex h-full transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(${getTranslateXValue()})` }}
        >
          {/* Step 1: Selection */}
          <div className="flex-shrink-0 w-full overflow-y-auto">
            <div className="p-6 max-w-6xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  Choose how to add an MCP server
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Select an option below to add an MCP server to your private registry
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* From Upstream Registry Card */}
                <div
                  className={cn(
                    "relative p-6 border-2 rounded-lg transition-all duration-200 select-none",
                    "cursor-pointer hover:shadow-lg hover:border-cyan-500 dark:hover:border-cyan-500",
                    "bg-white/80 dark:bg-gray-800/80 backdrop-blur",
                    "border-gray-200 dark:border-gray-700"
                  )}
                  onClick={() => handleSourceSelect('upstream')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSourceSelect('upstream');
                    }
                  }}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3 flex justify-center">
                      <Database className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                      From MCP Registry
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Browse and install servers from the official MCP registry.
                    </p>
                    <ul className="text-xs text-gray-500 dark:text-gray-500 space-y-1 text-left">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Browse curated MCP servers</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>One-click installation</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Pre-configured and verified</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Easy Manual Setup Card */}
                <div
                  className={cn(
                    "relative p-6 border-2 rounded-lg transition-all duration-200 select-none",
                    "cursor-pointer hover:shadow-lg hover:border-cyan-500 dark:hover:border-cyan-500",
                    "bg-white/80 dark:bg-gray-800/80 backdrop-blur",
                    "border-gray-200 dark:border-gray-700"
                  )}
                  onClick={() => handleSourceSelect('easy-manual')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSourceSelect('easy-manual');
                    }
                  }}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3 flex justify-center">
                      <Zap className="h-12 w-12 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                      Easy Manual
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Quick setup for common MCP servers with fixed values.
                    </p>
                    <ul className="text-xs text-gray-500 dark:text-gray-500 space-y-1 text-left">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Simple form-based setup</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Common server types</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Minimal configuration needed</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Advanced Manual Setup Card */}
                <div
                  className={cn(
                    "relative p-6 border-2 rounded-lg transition-all duration-200 select-none",
                    "cursor-not-allowed opacity-60",
                    "bg-white/80 dark:bg-gray-800/80 backdrop-blur",
                    "border-gray-200 dark:border-gray-700"
                  )}
                >
                  <span className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
                    Coming soon
                  </span>
                  <div className="text-center">
                    <div className="text-4xl mb-3 flex justify-center">
                      <Wrench className="h-12 w-12 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                      Advanced Manual
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Full control with JSON configuration for packages and remotes.
                    </p>
                    <ul className="text-xs text-gray-500 dark:text-gray-500 space-y-1 text-left">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Direct JSON editing</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Custom env vars and args</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Maximum flexibility</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2a/2b/2c: Browser or Forms */}
          <div className="flex-shrink-0 w-full h-full overflow-y-auto">
            {currentStep === 'upstream' ? (
              <UpstreamRegistryBrowser
                onServerAdded={handleServerAdded}
                onCancel={handleBack}
              />
            ) : currentStep === 'easy-manual' ? (
              <EasyManualServerForm
                onServerAdded={handleServerAdded}
                onCancel={handleBack}
              />
            ) : currentStep === 'advanced-manual' ? (
              <AdvancedManualServerForm
                onServerAdded={handleServerAdded}
                onCancel={handleBack}
              />
            ) : null}
          </div>
        </div>
      </div>
    </BottomPanel>
  );
}
