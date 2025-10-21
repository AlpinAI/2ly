/**
 * AuthErrorBoundary Component
 *
 * React error boundary specifically designed for authentication components.
 * Catches and handles authentication-related errors gracefully while providing
 * fallback UI and recovery options.
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/helpers';
import AuthButton from './AuthButton';

export interface AuthErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  className?: string;
}

export interface AuthErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string;
}

class AuthErrorBoundary extends Component<AuthErrorBoundaryProps, AuthErrorBoundaryState> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `auth-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging
    console.error('Authentication Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);

    // Call the optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error reporting service
      // reportError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: '',
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div
          className={cn(
            'min-h-screen flex items-center justify-center',
            'bg-gray-50 py-12 px-4 sm:px-6 lg:px-8',
            this.props.className
          )}
        >
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              {/* Error Icon */}
              <div className="flex justify-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>

              {/* Error Title */}
              <h2 className="mt-6 text-3xl font-bold text-gray-900">
                Something went wrong
              </h2>

              {/* Error Message */}
              <p className="mt-2 text-sm text-gray-600 max-w-sm mx-auto">
                We encountered an error while loading the authentication interface.
                This is usually temporary and can be resolved by trying again.
              </p>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-100 rounded-md text-xs text-red-600 overflow-auto max-h-32">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <AuthButton
                variant="primary"
                fullWidth
                onClick={this.handleReset}
              >
                Try Again
              </AuthButton>

              <AuthButton
                variant="outline"
                fullWidth
                onClick={this.handleReload}
              >
                Reload Page
              </AuthButton>
            </div>

            {/* Error ID for Support */}
            <div className="text-center">
              <p className="text-xs text-gray-400">
                Error ID: {this.state.errorId}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;