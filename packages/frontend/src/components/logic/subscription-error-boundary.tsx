/**
 * SubscriptionErrorBoundary Component
 *
 * WHY: Catches subscription errors and provides a clean error state.
 * Since backend connection is critical, any subscription failure should
 * stop the app and force user to retry connection.
 *
 * ARCHITECTURE:
 * - Wraps workspace content in WorkspaceLoader
 * - Catches errors from runtime, MCP server, and registry subscriptions
 * - Provides clear error message and retry action
 * - Prevents user from working with stale/broken data
 *
 * USAGE:
 * ```tsx
 * <WorkspaceLoader>
 *   <SubscriptionErrorBoundary>
 *     <AppLayout />
 *   </SubscriptionErrorBoundary>
 * </WorkspaceLoader>
 * ```
 */

import { ReactNode, Component, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SubscriptionErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Fallback Component
 *
 * WHY: Clean error UI that explains the problem and provides recovery options.
 * Shows different messages based on the type of error.
 */
function ErrorFallback({ error }: { error: Error; onRetry: () => void }) {
  const handleRetry = () => {
    // Reload the page to ensure clean state
    window.location.reload();
  };

  const handleGoHome = () => {
    // Navigate to root to select a different workspace
    window.location.href = '/';
  };

  // Determine error type and appropriate message
  const isConnectionError = error.message.includes('NetworkError') || 
                           error.message.includes('fetch') ||
                           error.message.includes('Failed to fetch') ||
                           error.message.includes('ERR_NETWORK') ||
                           error.message.includes('ERR_CONNECTION_REFUSED') ||
                           error.message.includes('ERR_CONNECTION_TIMED_OUT');

  const isInfiniteLoopError = error.message.includes('Maximum update depth exceeded');

  const getErrorTitle = () => {
    if (isInfiniteLoopError) {
      return 'Application Error';
    }
    if (isConnectionError) {
      return 'Connection Lost';
    }
    return 'Something Went Wrong';
  };

  const getErrorDescription = () => {
    if (isInfiniteLoopError) {
      return 'The application encountered an internal error. This is likely a bug in the code.';
    }
    if (isConnectionError) {
      return 'Unable to connect to the server. This could be due to:';
    }
    return 'An unexpected error occurred. Please try refreshing the page.';
  };

  const getErrorList = () => {
    if (isInfiniteLoopError) {
      return [
        '• Internal application error',
        '• Code bug or infinite loop',
        '• State management issue'
      ];
    }
    if (isConnectionError) {
      return [
        '• Network connectivity issues',
        '• Server maintenance or restart',
        '• Authentication problems'
      ];
    }
    return [
      '• Unexpected application error',
      '• Try refreshing the page',
      '• Contact support if the issue persists'
    ];
  };

  const getButtonText = () => {
    if (isInfiniteLoopError) {
      return 'Reload Application';
    }
    if (isConnectionError) {
      return 'Retry Connection';
    }
    return 'Reload Page';
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 shadow-lg">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>

          {/* Error Message */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {getErrorTitle()}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {getErrorDescription()}
            </p>
            <ul className="text-sm text-gray-500 dark:text-gray-500 text-left space-y-1 mb-4">
              {getErrorList().map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            
            {/* Technical Details (Development Only) */}
            {import.meta.env.DEV && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                  Technical Details
                </summary>
                <pre className="mt-2 text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
                  {error.message}
                </pre>
              </details>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleRetry} 
              className="w-full gap-2"
              size="lg"
            >
              <RefreshCw className="w-4 h-4" />
              {getButtonText()}
            </Button>
            
            <Button 
              onClick={handleGoHome}
              variant="outline" 
              className="w-full"
              size="lg"
            >
              Go to Dashboard
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-6">
            {isInfiniteLoopError 
              ? 'This appears to be a development issue. Check the console for more details.'
              : 'If this problem persists, please check your network connection or contact support.'
            }
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * SubscriptionErrorBoundary Component
 *
 * WHY: Wraps workspace content to catch any subscription errors.
 * Uses React's built-in error boundary functionality.
 */
export class SubscriptionErrorBoundary extends Component<
  SubscriptionErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: SubscriptionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for debugging
    console.error('[SubscriptionErrorBoundary] Caught error:', error);
    console.error('[SubscriptionErrorBoundary] Error info:', errorInfo);
    
    // In production, you might want to send this to an error reporting service
    // like Sentry, LogRocket, etc.
    if (import.meta.env.PROD) {
      // TODO: Send to error reporting service
      // errorReportingService.captureException(error, { extra: errorInfo });
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return <ErrorFallback error={this.state.error} onRetry={() => this.setState({ hasError: false, error: null })} />;
    }

    return this.props.children;
  }
}
