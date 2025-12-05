/**
 * AddSourceWorkflow Component
 *
 * WHY: Multi-step workflow for adding sources with slide animations.
 * Step 1: Select source category (MCP Server, Agent, REST API)
 * Step 2: Browse and configure selected source type
 *
 * ARCHITECTURE:
 * - Sliding panel from bottom
 * - Horizontal carousel for workflow steps (translateX)
 * - Category selection → MCP Browser → Configuration
 * - Category selection → Agent Configuration
 * - Closes with X button or ESC key
 * - Positioned directly below navigation menu
 * - Self-contained: manages own state via UIStore
 * - Auto-closes on navigation via useCloseOnNavigation hook
 */

import { useEffect, useState, useCallback } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomPanel } from '@/components/ui/bottom-panel';
import { MCPServerBrowser } from '@/components/tools/mcp-server-browser';
import { MCPServerConfigure } from '@/components/tools/mcp-server-configure';
import { AgentConfigure } from '@/components/agents/agent-configure';
import { useUIStore } from '@/stores/uiStore';
import { useCloseOnNavigation } from '@/hooks/useCloseOnNavigation';
import type { GetRegistryServersQuery } from '@/graphql/generated/graphql';
import { useMCPRegistries } from '@/hooks/useMCPRegistries';

// Extract server type
type MCPRegistryServer = GetRegistryServersQuery['getRegistryServers'][number];

type WorkflowStep = 'selection' | 'mcp-browser' | 'mcp-config' | 'agent-config';
type SourceCategory = 'mcp' | 'agent' | 'api';

interface CategoryOption {
  id: SourceCategory;
  title: string;
  description: string;
  icon: string;
  features: string[];
  comingSoon?: boolean;
}

// Export WorkflowStep type for UIStore
export type { WorkflowStep };

const SOURCE_CATEGORIES: CategoryOption[] = [
  {
    id: 'mcp',
    title: 'Add MCP Server',
    description: 'Plug a Model Context Protocol (MCP) server to give your agent superpowers.',
    icon: 'https://avatars.githubusercontent.com/u/182288589',
    features: ['Browse the official MCP registry', 'Or configure a server manually', 'Fast setup, secure by design'],
  },
  {
    id: 'agent',
    title: 'Create Agent',
    description: 'Configure an AI agent with custom system prompts and model settings.',
    icon: 'https://cdn-icons-png.flaticon.com/512/4712/4712139.png',
    features: ['Custom system prompts', 'Choose from configured AI models', 'Set temperature and token limits'],
  },
  {
    id: 'api',
    title: 'Connect to an API',
    description: 'Turn any REST API into a tool your agent can call with confidence.',
    icon: 'https://cdn-icons-png.flaticon.com/512/1163/1163624.png',
    features: [
      'Quickly import a Swagger/OpenAPI file',
      'Auto-generate endpoints and parameters',
      'Auth helpers and validation',
    ],
    comingSoon: true,
  },
];

export function AddSourceWorkflow() {
  // Read from UIStore
  const isOpen = useUIStore((state) => state.addSourceWorkflowOpen);
  const setOpen = useUIStore((state) => state.setAddSourceWorkflowOpen);
  const initialStep = useUIStore((state) => state.addSourceWorkflowInitialStep);
  const setInitialStep = useUIStore((state) => state.setAddSourceWorkflowInitialStep);
  const serverId = useUIStore((state) => state.addSourceWorkflowServerId);
  const setServerId = useUIStore((state) => state.setAddSourceWorkflowServerId);

  // Get registries data to fetch server by ID
  const { registryServers } = useMCPRegistries();

  // Local workflow state
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('selection');
  const [selectedCategory, setSelectedCategory] = useState<SourceCategory | null>(null);
  const [selectedServer, setSelectedServer] = useState<MCPRegistryServer | null>(null);
  // Track when transitioning back from agent to keep MCP hidden during animation
  const [isTransitioningFromAgent, setIsTransitioningFromAgent] = useState(false);

  // Close handler with cleanup
  const handleClose = useCallback(() => {
    setOpen(false);
    setInitialStep(null);
    setServerId(null);
    // Reset workflow state
    setCurrentStep('selection');
    setSelectedCategory(null);
    setSelectedServer(null);
    setIsTransitioningFromAgent(false);
  }, [setOpen, setInitialStep, setServerId]);

  // Auto-close on navigation
  useCloseOnNavigation(handleClose);

  // Effect 1: Handle panel open/close and initial step changes
  // NOTE: Does not depend on registries to avoid resetting when data refetches
  useEffect(() => {
    if (isOpen) {
      // Set initial step and category based on initialStep from store
      if (initialStep) {
        setCurrentStep(initialStep as WorkflowStep);
        if (initialStep === 'mcp-browser' || initialStep === 'mcp-config') {
          setSelectedCategory('mcp');
        } else if (initialStep === 'agent-config') {
          setSelectedCategory('agent');
        }
      } else {
        setCurrentStep('selection');
        setSelectedCategory(null);
      }
    } else {
      // Reset workflow state when closing
      setCurrentStep('selection');
      setSelectedCategory(null);
      setSelectedServer(null);
      setIsTransitioningFromAgent(false);
    }
  }, [isOpen, initialStep]);

  // Effect 2: Handle server lookup when serverId changes (for direct navigation to config)
  // This is separate to prevent registry refetches from resetting workflow state
  useEffect(() => {
    if (isOpen && initialStep === 'mcp-config' && serverId) {
      const server = registryServers
        .find((s) => s.id === serverId);
      if (server) {
        setSelectedServer(server as MCPRegistryServer);
      }
    }
  }, [isOpen, initialStep, serverId, registryServers]);

  const handleCategorySelect = (category: SourceCategory) => {
    setSelectedCategory(category);
    if (category === 'mcp') {
      setCurrentStep('mcp-browser');
    } else if (category === 'agent') {
      setCurrentStep('agent-config');
    }
  };

  const handleBack = () => {
    if (currentStep === 'mcp-config') {
      setCurrentStep('mcp-browser');
      setSelectedServer(null);
    } else if (currentStep === 'agent-config') {
      // Keep MCP hidden during back animation, then reset after animation completes
      setIsTransitioningFromAgent(true);
      setCurrentStep('selection');
      setTimeout(() => {
        setSelectedCategory(null);
        setIsTransitioningFromAgent(false);
      }, 500); // Match animation duration
    } else if (currentStep === 'mcp-browser') {
      setCurrentStep('selection');
      setSelectedCategory(null);
    }
  };

  const handleServerConfigure = (server: MCPRegistryServer) => {
    setSelectedServer(server);
    setCurrentStep('mcp-config');
  };

  const getStepTitle = (): string => {
    if (currentStep === 'selection') return 'Add Sources';
    if (currentStep === 'mcp-browser') return 'Browse Private Registry';
    if (currentStep === 'mcp-config') return 'Configure MCP Server';
    if (currentStep === 'agent-config') return 'Create Agent';
    return 'Add Sources';
  };

  const getTranslateXValue = (): string => {
    if (currentStep === 'selection') return '0%';
    if (currentStep === 'mcp-browser') return '-100%';
    if (currentStep === 'mcp-config') return '-200%';
    if (currentStep === 'agent-config') {
      // When agent path is selected, Agent Config is at position 2 (right after selection)
      // because MCP steps are not rendered
      return selectedCategory === 'agent' ? '-100%' : '-300%';
    }
    return '0%';
  };

  // Custom escape handler - go back if not on first step, otherwise close
  const handleEscape = () => {
    if (currentStep !== 'selection') {
      handleBack();
    } else {
      handleClose();
    }
  };

  return (
    <BottomPanel isOpen={isOpen} onClose={handleClose} onEscape={handleEscape}>
      {/* Panel Header - natural height, no flex grow */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {currentStep !== 'selection' && (
            <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full" aria-label="Go back">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{getStepTitle()}</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full" aria-label="Close">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Horizontal Carousel Container - flex-1 takes all remaining space */}
      <div className="flex-1 overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out h-full"
          style={{ transform: `translateX(${getTranslateXValue()})` }}
        >
          {/* Step 1: Category Selection */}
          <div className="flex-shrink-0 w-full overflow-y-auto">
            <div className="p-6 max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Select the source category</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose an option below and start adding sources to your workspace
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {SOURCE_CATEGORIES.map((option) => (
                  <div
                    key={option.id}
                    className={`relative p-6 border-2 rounded-lg transition-all duration-200 select-none bg-white/80 dark:bg-gray-800/80 backdrop-blur ${
                      option.comingSoon
                        ? 'cursor-not-allowed opacity-60 border-gray-200 dark:border-gray-700'
                        : 'cursor-pointer hover:shadow-lg border-gray-200 dark:border-gray-700 hover:border-cyan-500 dark:hover:border-cyan-500'
                    } ${
                      selectedCategory === option.id
                        ? 'border-cyan-500 dark:border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                        : ''
                    }`}
                    onClick={option.comingSoon ? undefined : () => handleCategorySelect(option.id)}
                    role={option.comingSoon ? undefined : 'button'}
                    tabIndex={option.comingSoon ? -1 : 0}
                    onKeyDown={
                      option.comingSoon
                        ? undefined
                        : (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleCategorySelect(option.id);
                            }
                          }
                    }
                  >
                    {option.comingSoon && (
                      <span className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
                        Coming soon
                      </span>
                    )}
                    <div className="text-center">
                      <div className="text-4xl mb-3 flex justify-center">
                        {option.icon.startsWith('http') ? (
                          <img src={option.icon} alt={option.title} className="w-12 h-12 object-contain" />
                        ) : (
                          option.icon
                        )}
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{option.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{option.description}</p>
                      <ul className="text-xs text-gray-500 dark:text-gray-500 space-y-1 text-left">
                        {option.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="mr-2">-</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step 2: MCP Server Browser - hidden on agent path and during back transition */}
          {selectedCategory !== 'agent' && !isTransitioningFromAgent && (
            <div className="flex-shrink-0 w-full overflow-y-auto">
              <MCPServerBrowser onConfigure={handleServerConfigure} />
            </div>
          )}

          {/* Step 3: MCP Configuration - hidden on agent path and during back transition */}
          {selectedCategory !== 'agent' && !isTransitioningFromAgent && (
            <div className="flex-shrink-0 w-full overflow-y-auto">
              {selectedServer ? (
                <MCPServerConfigure selectedServer={selectedServer} onBack={handleBack} onSuccess={handleClose} />
              ) : (
                <div className="p-6 max-w-4xl mx-auto">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                      No Server Selected
                    </h4>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Please go back and select a server to configure.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Agent Configuration */}
          <div className="flex-shrink-0 w-full overflow-y-auto">
            <AgentConfigure onBack={handleBack} onSuccess={handleClose} />
          </div>
        </div>
      </div>
    </BottomPanel>
  );
}
