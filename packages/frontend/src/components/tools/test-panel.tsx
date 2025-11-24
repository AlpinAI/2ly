/**
 * TestPanel Component
 *
 * WHY: Displays test status for MCP server configuration with visual feedback.
 * Shows idle placeholder, running animation, success with tools, or error states.
 *
 * ARCHITECTURE:
 * - Gradient background with decorative blur circles
 * - Pulsing animation during testing
 * - Tools list on success (max 3 + count)
 * - Retry option on timeout/error
 * - Consistent with frontend design system (cyan/indigo palette)
 */

import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock, FlaskConical, Package, Play, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TestStatus = 'idle' | 'running' | 'success' | 'timeout' | 'error';
export type LifecycleStage = 'INSTALLING' | 'STARTING' | 'LISTING_TOOLS' | null;

interface TestPanelProps {
  status: TestStatus;
  serverName: string;
  tools?: Array<{ id: string; name: string }>;
  error?: string;
  lifecycleStage?: LifecycleStage;
  lifecycleMessage?: string;
  onRetry?: () => void;
  onConfigureAnother?: () => void;
  onFinish?: () => void;
}

// Stage progress indicator component
function StageIndicator({ stage }: { stage: LifecycleStage }) {
  const stageIndex = stage === 'INSTALLING' ? 0 : stage === 'STARTING' ? 1 : stage === 'LISTING_TOOLS' ? 2 : -1;

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={cn(
            'w-2.5 h-2.5 rounded-full transition-all duration-300',
            index < stageIndex
              ? 'bg-cyan-500 dark:bg-cyan-400' // Completed
              : index === stageIndex
                ? 'bg-cyan-500 dark:bg-cyan-400 animate-pulse' // Current
                : 'bg-gray-300 dark:bg-gray-600' // Pending
          )}
        />
      ))}
    </div>
  );
}

// Get stage-specific icon
function getStageIcon(stage: LifecycleStage) {
  switch (stage) {
    case 'INSTALLING':
      return <Package className="h-12 w-12 text-cyan-600 dark:text-cyan-400 mb-4 mx-auto" />;
    case 'STARTING':
      return <Play className="h-12 w-12 text-cyan-600 dark:text-cyan-400 mb-4 mx-auto" />;
    case 'LISTING_TOOLS':
      return <Search className="h-12 w-12 text-cyan-600 dark:text-cyan-400 mb-4 mx-auto" />;
    default:
      return <FlaskConical className="h-12 w-12 text-cyan-600 dark:text-cyan-400 mb-4 mx-auto" />;
  }
}

// Get stage-specific title
function getStageTitle(stage: LifecycleStage): string {
  switch (stage) {
    case 'INSTALLING':
      return 'Installing dependencies...';
    case 'STARTING':
      return 'Starting server...';
    case 'LISTING_TOOLS':
      return 'Discovering tools...';
    default:
      return 'Preparing test...';
  }
}

export function TestPanel({
  status,
  serverName,
  tools = [],
  error,
  lifecycleStage,
  lifecycleMessage,
  onRetry,
  onConfigureAnother,
  onFinish,
}: TestPanelProps) {
  const renderContent = () => {
    switch (status) {
      case 'idle':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <FlaskConical className="h-16 w-16 text-cyan-600 dark:text-cyan-400 mb-4" />
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Ready to test</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
              Configure your server and click "Test Server" to discover available tools
            </p>
          </div>
        );

      case 'running':
        return (
          <div className="flex flex-col items-center justify-center h-full relative">
            {/* Pulsing concentric circles */}
            <div
              className="absolute rounded-full bg-cyan-300 dark:bg-cyan-600 opacity-20 animate-ping"
              style={{
                width: '16rem',
                height: '16rem',
                animationDuration: '3.5s',
              }}
            />
            <div
              className="absolute rounded-full bg-indigo-300 dark:bg-indigo-600 opacity-20 animate-ping"
              style={{
                width: '12rem',
                height: '12rem',
                animationDelay: '400ms',
                animationDuration: '3s',
              }}
            />
            <div
              className="absolute rounded-full bg-purple-300 dark:bg-purple-600 opacity-20 animate-ping"
              style={{
                width: '8rem',
                height: '8rem',
                animationDelay: '800ms',
                animationDuration: '2.5s',
              }}
            />

            {/* Content */}
            <div className="relative text-center z-10">
              {getStageIcon(lifecycleStage ?? null)}
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                {getStageTitle(lifecycleStage ?? null)}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                {lifecycleMessage || `Testing ${serverName}`}
              </p>
              <StageIndicator stage={lifecycleStage ?? null} />
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="flex flex-col items-center justify-center h-full px-6">
            <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400 mb-4" />
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Tools discovered for {serverName}
            </h4>

            {tools.length > 0 ? (
              <div className="w-full max-w-md mt-4 space-y-2">
                {tools.slice(0, 3).map((tool) => (
                  <div
                    key={tool.id}
                    className="px-4 py-2 bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm"
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{tool.name}</div>
                  </div>
                ))}
                {tools.length > 3 && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    +{tools.length - 3} more tool{tools.length - 3 !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Server started successfully, but no tools were found.
              </p>
            )}
          </div>
        );

      case 'timeout':
        return (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <Clock className="h-16 w-16 text-yellow-600 dark:text-yellow-400 mb-4" />
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">No tools discovered yet</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md">
              The server didn't expose any tools within 20 seconds. This might mean the configuration is incorrect or
              the server needs more time.
            </p>
            {onRetry && (
              <Button onClick={onRetry} variant="outline">
                Change configuration and retry
              </Button>
            )}
          </div>
        );

      case 'error':
        return (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-600 dark:text-red-400 mb-4" />
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Test failed</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md">
              {error || 'An unexpected error occurred while testing the server.'}
            </p>
            {onRetry && (
              <Button onClick={onRetry} variant="outline">
                Try again
              </Button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative h-full rounded-xl border border-cyan-100 dark:border-cyan-900/30 bg-gradient-to-br from-cyan-50 to-indigo-50 dark:from-cyan-950/20 dark:to-indigo-950/20 overflow-hidden flex flex-col">
      {/* Decorative blur circles */}
      <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-gradient-to-tr from-yellow-200 to-pink-200 dark:from-yellow-600/30 dark:to-pink-600/30 rounded-full blur-2xl opacity-60 pointer-events-none" />
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-tr from-cyan-200 to-violet-200 dark:from-cyan-600/30 dark:to-violet-600/30 rounded-full blur-2xl opacity-60 pointer-events-none" />

      {/* Content */}
      <div className="relative flex-1 min-h-0">{renderContent()}</div>

      {/* Success Actions - Inside Card */}
      {status === 'success' && (onConfigureAnother || onFinish) && (
        <div className="relative z-10 p-4 border-t border-cyan-200 dark:border-cyan-800/50 bg-white/50 dark:bg-gray-900/30 backdrop-blur-sm">
          <div className={`flex gap-2 ${onFinish ? 'justify-between' : 'justify-end'}`}>
            {onConfigureAnother && (
              <Button variant="outline" onClick={onConfigureAnother}>
                Configure another server
              </Button>
            )}
            {onFinish && <Button onClick={onFinish}>Finish</Button>}
          </div>
        </div>
      )}
    </div>
  );
}
