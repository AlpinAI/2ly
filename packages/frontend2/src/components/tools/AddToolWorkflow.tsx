/**
 * AddToolWorkflow Component
 *
 * WHY: Multi-step workflow for adding tools with slide animations.
 * Step 1: Select tool category (MCP Server, API, Code)
 * Step 2: Browse and configure selected tool type
 *
 * ARCHITECTURE:
 * - Sliding panel from bottom
 * - Horizontal carousel for workflow steps (translateX)
 * - Category selection → MCP Browser → Configuration
 * - Closes with X button or ESC key
 * - Positioned directly below navigation menu
 */

import { useEffect, useState, useRef } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MCPServerBrowser } from './MCPServerBrowser';
import { MCPServerConfigure } from './MCPServerConfigure';
import type { SubscribeMcpRegistriesSubscription } from '@/graphql/generated/graphql';

// Extract server type
type MCPRegistryUpstreamServer = NonNullable<
  NonNullable<SubscribeMcpRegistriesSubscription['mcpRegistries']>[number]['servers']
>[number];

interface AddToolWorkflowProps {
  isOpen: boolean;
  onClose: () => void;
}

type WorkflowStep = 'selection' | 'mcp-browser' | 'mcp-config';
type ToolCategory = 'mcp' | 'api' | 'code';

interface CategoryOption {
  id: ToolCategory;
  title: string;
  description: string;
  icon: string;
  features: string[];
  comingSoon?: boolean;
}

const TOOL_CATEGORIES: CategoryOption[] = [
  {
    id: 'mcp',
    title: 'Add MCP Server',
    description: 'Plug a Model Context Protocol (MCP) server to give your agent superpowers.',
    icon: 'https://avatars.githubusercontent.com/u/182288589',
    features: ['Browse the official MCP registry', 'Or configure a server manually', 'Fast setup, secure by design'],
  },
  {
    id: 'api',
    title: 'Connect to an API',
    description: 'Turn any REST API into a tool your agent can call with confidence.',
    icon: '🌐',
    features: [
      'Quickly import a Swagger/OpenAPI file',
      'Auto-generate endpoints and parameters',
      'Auth helpers and validation',
    ],
    comingSoon: true,
  },
  {
    id: 'code',
    title: 'Code your own Tool',
    description: 'Build delightful custom tools that run right beside your agent.',
    icon: '🛠️',
    features: ['Write tools in Python or TypeScript', 'Local dev, smooth DX', 'Starter templates included'],
    comingSoon: true,
  },
];

export function AddToolWorkflow({ isOpen, onClose }: AddToolWorkflowProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [topOffset, setTopOffset] = useState(0);
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('selection');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | null>(null);
  const [selectedServer, setSelectedServer] = useState<MCPRegistryUpstreamServer | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate exact position below navigation
  useEffect(() => {
    const calculateTopOffset = () => {
      const navElement = document.querySelector('nav');
      if (navElement) {
        const rect = navElement.getBoundingClientRect();
        setTopOffset(rect.bottom);
      } else {
        setTopOffset(112);
      }
    };

    if (isOpen) {
      calculateTopOffset();
      window.addEventListener('resize', calculateTopOffset);
      return () => window.removeEventListener('resize', calculateTopOffset);
    }
  }, [isOpen]);

  // Handle mounting and animation timing
  useEffect(() => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    if (isOpen) {
      setIsAnimating(false);
      setShouldRender(true);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      animationTimeoutRef.current = setTimeout(() => {
        setShouldRender(false);
        // Reset workflow state when closing
        setCurrentStep('selection');
        setSelectedCategory(null);
        setSelectedServer(null);
        animationTimeoutRef.current = null;
      }, 300);
    }

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    };
  }, [isOpen]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (currentStep !== 'selection') {
          // Go back to selection if not on first step
          handleBack();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, currentStep]);

  const handleCategorySelect = (category: ToolCategory) => {
    setSelectedCategory(category);
    setCurrentStep('mcp-browser');
  };

  const handleBack = () => {
    if (currentStep === 'mcp-config') {
      setCurrentStep('mcp-browser');
      setSelectedServer(null);
    } else if (currentStep === 'mcp-browser') {
      setCurrentStep('selection');
      setSelectedCategory(null);
    }
  };

  const handleServerConfigure = (server: MCPRegistryUpstreamServer) => {
    setSelectedServer(server);
    setCurrentStep('mcp-config');
  };

  const getStepTitle = (): string => {
    if (currentStep === 'selection') return 'Add Tools';
    if (currentStep === 'mcp-browser') return 'Browse MCP Servers';
    if (currentStep === 'mcp-config') return `Configure: ${selectedServer?.title || selectedServer?.name}`;
    return 'Add Tools';
  };

  const getTranslateXValue = (): string => {
    if (currentStep === 'selection') return '0%';
    if (currentStep === 'mcp-browser') return '-100%';
    if (currentStep === 'mcp-config') return '-200%';
    return '0%';
  };

  if (!shouldRender) return null;

  return (
    <div
      ref={panelRef}
      className={`fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-2xl transition-transform duration-300 ease-out ${
        isAnimating ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{
        top: `${topOffset}px`,
      }}
    >
      {/* Panel Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {currentStep !== 'selection' && (
            <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full" aria-label="Go back">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{getStepTitle()}</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full" aria-label="Close">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Horizontal Carousel Container */}
      <div className="overflow-hidden" style={{ height: `calc(100vh - ${topOffset}px - 73px)` }}>
        <div
          className="flex transition-transform duration-500 ease-in-out h-full"
          style={{ transform: `translateX(${getTranslateXValue()})` }}
        >
          {/* Step 1: Category Selection */}
          <div className="flex-shrink-0 w-full overflow-y-auto">
            <div className="p-6 max-w-7xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Select the tool category</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose an option below and start adding tools to your workspace
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {TOOL_CATEGORIES.map((option) => (
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
                            <span className="mr-2">•</span>
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

          {/* Step 2: MCP Server Browser */}
          <div className="flex-shrink-0 w-full overflow-y-auto">
            <MCPServerBrowser onConfigure={handleServerConfigure} />
          </div>

          {/* Step 3: Configuration */}
          <div className="flex-shrink-0 w-full overflow-y-auto">
            {selectedServer ? (
              <MCPServerConfigure selectedServer={selectedServer} onBack={handleBack} onSuccess={onClose} />
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
        </div>
      </div>
    </div>
  );
}
