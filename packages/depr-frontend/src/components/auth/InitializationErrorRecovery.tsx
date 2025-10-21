/**
 * InitializationErrorRecovery Component
 *
 * Comprehensive error handling and recovery component for system initialization failures.
 * Provides contextual error messages, recovery options, and debugging information.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  AlertCircle,
  RefreshCw,
  Settings,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCircle,
  Wifi,
  Database,
} from 'lucide-react';
import { AuthFormCard, AuthFormCardHeader, AuthFormCardContent, AuthFormCardFooter } from './index';
import Button from '../ui/Button';
import { cn } from '../../utils/helpers';
import {
  SystemInitializationError,
  SystemInitConfig,
  SystemStatus
} from '../../services/system.service';
import { getBrowserInfo } from '../../utils/system.utils';

export interface InitializationErrorRecoveryProps {
  error: SystemInitializationError | Error;
  systemConfig: SystemInitConfig;
  systemStatus?: SystemStatus;
  onRetry: () => Promise<void>;
  onModifyConfig: () => void;
  onReset: () => void;
  onContactSupport: (report: ErrorReport) => void;
  className?: string;
}

export interface ErrorReport {
  error: {
    message: string;
    code?: string;
    details?: string[];
  };
  config: SystemInitConfig;
  browserInfo: ReturnType<typeof getBrowserInfo>;
  systemStatus?: SystemStatus;
  timestamp: Date;
}

export type ErrorCategory =
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'
  | 'ALREADY_INITIALIZED'
  | 'TIMEOUT_ERROR'
  | 'UNKNOWN_ERROR';

export interface RecoveryOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  severity: 'high' | 'medium' | 'low';
  disabled?: boolean;
}

const InitializationErrorRecovery: React.FC<InitializationErrorRecoveryProps> = ({
  error,
  systemConfig,
  systemStatus,
  onRetry,
  onModifyConfig,
  onReset,
  onContactSupport,
  className,
}) => {
  // State
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [reportCopied, setReportCopied] = useState<boolean>(false);

  // Error categorization
  const errorCategory: ErrorCategory = useMemo(() => {
    if (error instanceof SystemInitializationError) {
      switch (error.code) {
        case 'NETWORK_ERROR':
          return 'NETWORK_ERROR';
        case 'VALIDATION_ERROR':
          return 'VALIDATION_ERROR';
        case 'ALREADY_INITIALIZED':
          return 'ALREADY_INITIALIZED';
        case 'TIMEOUT_ERROR':
          return 'TIMEOUT_ERROR';
        default:
          return 'SERVER_ERROR';
      }
    }
    return 'UNKNOWN_ERROR';
  }, [error]);

  // Generate error report
  const errorReport: ErrorReport = useMemo(() => {
    return {
      error: {
        message: error.message,
        code: error instanceof SystemInitializationError ? error.code : undefined,
        details: error instanceof SystemInitializationError ? error.details : undefined,
      },
      config: {
        ...systemConfig,
        adminPassword: '[REDACTED]', // Don't include password in report
      },
      browserInfo: getBrowserInfo(),
      systemStatus,
      timestamp: new Date(),
    };
  }, [error, systemConfig, systemStatus]);

  // Handlers
  const handleRetry = useCallback(async () => {
    try {
      setIsRetrying(true);
      await onRetry();
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry]);

  const handleContactSupport = useCallback(() => {
    onContactSupport(errorReport);
  }, [onContactSupport, errorReport]);

  // Recovery options
  const recoveryOptions: RecoveryOption[] = useMemo(() => {
    const options: RecoveryOption[] = [];

    // Always include retry option unless already initialized
    if (errorCategory !== 'ALREADY_INITIALIZED') {
      options.push({
        id: 'retry',
        title: 'Try Again',
        description: 'Retry the initialization with the same configuration',
        icon: RefreshCw,
        action: handleRetry,
        severity: 'high',
      });
    }

    // Configuration modification for validation errors
    if (errorCategory === 'VALIDATION_ERROR') {
      options.push({
        id: 'modify',
        title: 'Modify Configuration',
        description: 'Go back and adjust your system settings',
        icon: Settings,
        action: onModifyConfig,
        severity: 'high',
      });
    }

    // Reset option for complex errors
    if (errorCategory !== 'ALREADY_INITIALIZED' && errorCategory !== 'VALIDATION_ERROR') {
      options.push({
        id: 'reset',
        title: 'Start Over',
        description: 'Reset the setup process and start from the beginning',
        icon: RefreshCw,
        action: onReset,
        severity: 'medium',
      });
    }

    // Contact support
    options.push({
      id: 'support',
      title: 'Contact Support',
      description: 'Get help from our support team with this error',
      icon: MessageCircle,
      action: handleContactSupport,
      severity: 'low',
    });

    return options;
  }, [errorCategory, handleContactSupport, handleRetry, onModifyConfig, onReset]);

  // Error display configuration
  const errorConfig = useMemo(() => {
    switch (errorCategory) {
      case 'NETWORK_ERROR':
        return {
          icon: Wifi,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: 'Network Connection Error',
          description: 'Unable to connect to the server. Please check your internet connection.',
        };
      case 'VALIDATION_ERROR':
        return {
          icon: AlertCircle,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          title: 'Configuration Error',
          description: 'There was an issue with your system configuration.',
        };
      case 'SERVER_ERROR':
        return {
          icon: Database,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: 'Server Error',
          description: 'The server encountered an error while initializing your system.',
        };
      case 'ALREADY_INITIALIZED':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          title: 'System Already Initialized',
          description: 'Your system has already been set up and is ready to use.',
        };
      case 'TIMEOUT_ERROR':
        return {
          icon: RefreshCw,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          title: 'Setup Timeout',
          description: 'The initialization process took too long to complete.',
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: 'Initialization Failed',
          description: 'An unexpected error occurred during system setup.',
        };
    }
  }, [errorCategory]);





  const handleCopyReport = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
      setReportCopied(true);
      setTimeout(() => setReportCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy report:', err);
    }
  }, [errorReport]);

  const toggleDetails = useCallback(() => {
    setShowDetails(prev => !prev);
  }, []);

  return (
    <div className={cn('min-h-screen bg-gray-50 flex items-center justify-center p-4', className)}>
      <AuthFormCard maxWidth="md" className="w-full max-w-2xl">
        {/* Error Header */}
        <AuthFormCardHeader
          title={errorConfig.title}
          subtitle={errorConfig.description}
          icon={<errorConfig.icon className={cn('w-8 h-8', errorConfig.color)} />}
          className="mb-6"
        />

        <AuthFormCardContent>
          {/* Error Message */}
          <div className={cn('rounded-lg p-4 mb-6', errorConfig.bgColor, errorConfig.borderColor, 'border')}>
            <div className="flex items-start space-x-3">
              <errorConfig.icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', errorConfig.color)} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{error.message}</p>
                {error instanceof SystemInitializationError && error.details && error.details.length > 0 && (
                  <ul className="mt-2 text-sm text-gray-700 list-disc list-inside space-y-1">
                    {error.details.map((detail, index) => (
                      <li key={index}>{detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Recovery Options */}
          <div className="space-y-3 mb-6">
            <h3 className="text-lg font-semibold text-gray-900">What would you like to do?</h3>

            <div className="space-y-3">
              {recoveryOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={option.action}
                  disabled={option.disabled || (option.id === 'retry' && isRetrying)}
                  className={cn(
                    'w-full p-4 rounded-lg border text-left transition-all duration-200',
                    'hover:shadow-md hover:border-blue-300',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    option.severity === 'high' && 'border-blue-200 bg-blue-50',
                    option.severity === 'medium' && 'border-gray-200 bg-gray-50',
                    option.severity === 'low' && 'border-gray-200 bg-white'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                      option.severity === 'high' && 'bg-blue-100 text-blue-600',
                      option.severity === 'medium' && 'bg-gray-100 text-gray-600',
                      option.severity === 'low' && 'bg-gray-100 text-gray-600'
                    )}>
                      <option.icon className={cn(
                        'w-5 h-5',
                        option.id === 'retry' && isRetrying && 'animate-spin'
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900">
                        {option.id === 'retry' && isRetrying ? 'Retrying...' : option.title}
                      </h4>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Error Details (Collapsible) */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={toggleDetails}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 rounded-lg transition-colors"
            >
              <span className="text-sm font-medium text-gray-900">
                Technical Details
              </span>
              {showDetails ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {showDetails && (
              <div className="border-t border-gray-200 p-4">
                <div className="space-y-4">
                  {/* Error Information */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Error Information</h5>
                    <div className="bg-gray-50 rounded p-3 text-sm text-gray-700 font-mono">
                      <p><strong>Message:</strong> {error.message}</p>
                      {error instanceof SystemInitializationError && error.code && (
                        <p><strong>Code:</strong> {error.code}</p>
                      )}
                      <p><strong>Category:</strong> {errorCategory}</p>
                    </div>
                  </div>

                  {/* System Status */}
                  {systemStatus && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">System Status</h5>
                      <div className="bg-gray-50 rounded p-3 text-sm text-gray-700">
                        <p><strong>Initialized:</strong> {systemStatus.initialized ? 'Yes' : 'No'}</p>
                        <p><strong>Health:</strong> {systemStatus.health}</p>
                        {systemStatus.services.length > 0 && (
                          <div className="mt-2">
                            <p><strong>Services:</strong></p>
                            <ul className="list-disc list-inside ml-2 space-y-1">
                              {systemStatus.services.map((service, index) => (
                                <li key={index}>
                                  {service.name}: {service.status}
                                  {service.responseTime && ` (${service.responseTime}ms)`}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Copy Report Button */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className="text-sm text-gray-600">
                      Copy error report for support
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyReport}
                      leftIcon={reportCopied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      className={cn(
                        'transition-colors',
                        reportCopied && 'text-green-600 border-green-300 bg-green-50'
                      )}
                    >
                      {reportCopied ? 'Copied!' : 'Copy Report'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </AuthFormCardContent>

        <AuthFormCardFooter>
          <p className="text-xs text-gray-500 text-center">
            If you continue to experience issues, please contact our support team with the error report above.
          </p>
        </AuthFormCardFooter>
      </AuthFormCard>
    </div>
  );
};

export default InitializationErrorRecovery;