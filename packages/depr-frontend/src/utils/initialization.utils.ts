/**
 * Initialization Utilities
 *
 * Utility functions for system initialization error handling, recovery options,
 * and initialization process management.
 */

import {
  SystemInitializationError,
  SystemInitConfig,
} from '../services/system.service';
import type { ErrorCategory, ErrorReport } from '../components/auth/InitializationErrorRecovery';

export interface BrowserInfo {
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  viewportSize: string;
  timezone: string;
  cookieEnabled: boolean;
  onlineStatus: boolean;
}

export interface InitContext {
  step: string;
  progress: number;
  systemConfig: SystemInitConfig;
  browserInfo: BrowserInfo;
  timestamp: Date;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Categorize initialization errors for appropriate handling
 * @param error The error to categorize
 * @returns Error category for recovery handling
 */
export const categorizeInitializationError = (error: Error): ErrorCategory => {
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
      case 'INIT_ERROR':
      case 'INIT_FAILED':
        return 'SERVER_ERROR';
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  // Network-related errors
  if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('connection')) {
    return 'NETWORK_ERROR';
  }

  // Timeout-related errors
  if (error.message.includes('timeout') || error.message.includes('aborted')) {
    return 'TIMEOUT_ERROR';
  }

  return 'UNKNOWN_ERROR';
};

/**
 * Get recovery options based on error category
 * @param errorCategory The categorized error type
 * @param context Additional context for recovery options
 * @returns Array of available recovery options
 */
export const getRecoveryOptions = (
  errorCategory: ErrorCategory,
  context?: {
    hasSkipOption?: boolean;
    canRetry?: boolean;
    canModifyConfig?: boolean;
  }
): string[] => {
  const options: string[] = [];
  const { hasSkipOption = false, canRetry = true, canModifyConfig = true } = context || {};

  switch (errorCategory) {
    case 'NETWORK_ERROR':
      if (canRetry) options.push('retry');
      options.push('reset');
      if (hasSkipOption) options.push('skip');
      options.push('support');
      break;

    case 'VALIDATION_ERROR':
      if (canModifyConfig) options.push('modify');
      if (canRetry) options.push('retry');
      options.push('reset');
      if (hasSkipOption) options.push('skip');
      options.push('support');
      break;

    case 'SERVER_ERROR':
      if (canRetry) options.push('retry');
      options.push('reset');
      if (hasSkipOption) options.push('skip');
      options.push('support');
      break;

    case 'ALREADY_INITIALIZED':
      // Special case - system is already set up
      options.push('continue'); // This would need special handling
      if (hasSkipOption) options.push('skip');
      options.push('support');
      break;

    case 'TIMEOUT_ERROR':
      if (canRetry) options.push('retry');
      options.push('reset');
      if (hasSkipOption) options.push('skip');
      options.push('support');
      break;

    case 'UNKNOWN_ERROR':
    default:
      if (canRetry) options.push('retry');
      if (canModifyConfig) options.push('modify');
      options.push('reset');
      if (hasSkipOption) options.push('skip');
      options.push('support');
      break;
  }

  return options;
};

export interface ExtendedErrorReport extends ErrorReport {
  additionalInfo: {
    step: string;
    progress: number;
    errorCategory: ErrorCategory;
    stackTrace?: string;
  };
}

/**
 * Generate a comprehensive error report for debugging and support
 * @param error The initialization error
 * @param context The initialization context when the error occurred
 * @returns Detailed error report
 */
export const generateErrorReport = (
  error: Error,
  context: InitContext
): ExtendedErrorReport => {
  const errorCategory = categorizeInitializationError(error);

  return {
    error: {
      message: error.message,
      code: error instanceof SystemInitializationError ? error.code : undefined,
      details: error instanceof SystemInitializationError ? error.details : undefined,
    },
    config: {
      ...context.systemConfig,
      adminPassword: '[REDACTED]', // Never include passwords in reports
    },
    browserInfo: context.browserInfo,
    timestamp: context.timestamp,
    // Additional context for debugging
    additionalInfo: {
      step: context.step,
      progress: context.progress,
      errorCategory,
      stackTrace: error.stack?.split('\n').slice(0, 10).join('\n'), // Limit stack trace
    },
  };
};

/**
 * Validate recovery action before execution
 * @param action The recovery action to validate
 * @param context Current initialization context
 * @returns Whether the action is valid and safe to execute
 */
export const validateRecoveryAction = (
  action: string,
  context?: {
    errorCategory?: ErrorCategory;
    hasNetworkAccess?: boolean;
    isSystemInitialized?: boolean;
  }
): boolean => {
  const {
    errorCategory = 'UNKNOWN_ERROR',
    hasNetworkAccess = true,
    isSystemInitialized = false,
  } = context || {};

  switch (action) {
    case 'retry':
      // Can't retry if system is already initialized
      if (isSystemInitialized && errorCategory === 'ALREADY_INITIALIZED') {
        return false;
      }
      // Need network access to retry
      return hasNetworkAccess;

    case 'modify':
      // Can always modify configuration
      return true;

    case 'reset':
      // Can always reset
      return true;

    case 'skip':
      // Skip is only valid in development
      return process.env.NODE_ENV === 'development';

    case 'support':
      // Can always contact support
      return true;

    case 'continue':
      // Continue is only valid if system is already initialized
      return isSystemInitialized;

    default:
      return false;
  }
};

/**
 * Validate system configuration for common issues
 * @param config System configuration to validate
 * @returns Array of validation errors and warnings
 */
export const validateSystemConfiguration = (config: SystemInitConfig): ValidationError[] => {
  const errors: ValidationError[] = [];

  // System name validation
  if (!config.systemName || config.systemName.trim().length === 0) {
    errors.push({
      field: 'systemName',
      message: 'System name is required',
      severity: 'error',
    });
  } else if (config.systemName.trim().length < 3) {
    errors.push({
      field: 'systemName',
      message: 'System name must be at least 3 characters',
      severity: 'error',
    });
  } else if (config.systemName.trim().length > 50) {
    errors.push({
      field: 'systemName',
      message: 'System name must be no more than 50 characters',
      severity: 'error',
    });
  }

  // System name format validation
  if (config.systemName && !/^[a-zA-Z0-9\s\-_]+$/.test(config.systemName)) {
    errors.push({
      field: 'systemName',
      message: 'System name can only contain letters, numbers, spaces, hyphens, and underscores',
      severity: 'error',
    });
  }

  // Admin email validation
  if (!config.adminEmail || config.adminEmail.trim().length === 0) {
    errors.push({
      field: 'adminEmail',
      message: 'Admin email is required',
      severity: 'error',
    });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.adminEmail)) {
    errors.push({
      field: 'adminEmail',
      message: 'Admin email must be a valid email address',
      severity: 'error',
    });
  }

  // Password validation
  if (!config.adminPassword || config.adminPassword.length === 0) {
    errors.push({
      field: 'adminPassword',
      message: 'Admin password is required',
      severity: 'error',
    });
  } else if (config.adminPassword.length < 8) {
    errors.push({
      field: 'adminPassword',
      message: 'Admin password must be at least 8 characters long',
      severity: 'error',
    });
  } else {
    // Password strength warnings
    const hasUppercase = /[A-Z]/.test(config.adminPassword);
    const hasLowercase = /[a-z]/.test(config.adminPassword);
    const hasNumbers = /\d/.test(config.adminPassword);
    const hasSpecialChars = /[!@#$%^&*()_+\-=[\]{};"':\\|,.<>/?]/.test(config.adminPassword);

    if (!hasUppercase || !hasLowercase || !hasNumbers || !hasSpecialChars) {
      errors.push({
        field: 'adminPassword',
        message: 'For better security, use a mix of uppercase, lowercase, numbers, and special characters',
        severity: 'warning',
      });
    }
  }

  // Terms acceptance validation
  if (!config.acceptTerms) {
    errors.push({
      field: 'acceptTerms',
      message: 'You must accept the terms to continue',
      severity: 'error',
    });
  }

  // Optional field validation
  if (config.systemDescription && config.systemDescription.length > 200) {
    errors.push({
      field: 'systemDescription',
      message: 'System description must be no more than 200 characters',
      severity: 'error',
    });
  }

  return errors;
};

/**
 * Get user-friendly error messages for different error types
 * @param errorCategory The categorized error type
 * @returns User-friendly error message and suggestions
 */
export const getErrorMessageForCategory = (errorCategory: ErrorCategory): {
  title: string;
  message: string;
  suggestions: string[];
} => {
  switch (errorCategory) {
    case 'NETWORK_ERROR':
      return {
        title: 'Connection Problem',
        message: 'Unable to connect to the server. Please check your internet connection.',
        suggestions: [
          'Check your internet connection',
          'Verify that the server is accessible',
          'Try again in a few moments',
          'Contact your network administrator if the problem persists',
        ],
      };

    case 'VALIDATION_ERROR':
      return {
        title: 'Configuration Issue',
        message: 'There\'s a problem with your system configuration.',
        suggestions: [
          'Review and correct your system settings',
          'Ensure all required fields are completed',
          'Check that email addresses are valid',
          'Verify password meets security requirements',
        ],
      };

    case 'SERVER_ERROR':
      return {
        title: 'Server Problem',
        message: 'The server encountered an error while setting up your system.',
        suggestions: [
          'Try the setup process again',
          'Check server status and availability',
          'Contact support if the problem continues',
          'Verify system requirements are met',
        ],
      };

    case 'ALREADY_INITIALIZED':
      return {
        title: 'System Already Set Up',
        message: 'Your system has already been initialized and is ready to use.',
        suggestions: [
          'Continue to the main application',
          'Log in with your existing credentials',
          'Contact support if you need to reinitialize',
        ],
      };

    case 'TIMEOUT_ERROR':
      return {
        title: 'Setup Timeout',
        message: 'The initialization process took too long to complete.',
        suggestions: [
          'Try the setup process again',
          'Check your internet connection speed',
          'Ensure the server is responsive',
          'Contact support if timeouts persist',
        ],
      };

    case 'UNKNOWN_ERROR':
    default:
      return {
        title: 'Unexpected Error',
        message: 'An unexpected error occurred during system setup.',
        suggestions: [
          'Try the setup process again',
          'Check browser console for additional details',
          'Ensure your browser is up to date',
          'Contact support with error details',
        ],
      };
  }
};

/**
 * Create initialization context for error reporting
 * @param step Current initialization step
 * @param progress Current progress percentage
 * @param config System configuration
 * @returns Initialization context object
 */
export const createInitializationContext = (
  step: string,
  progress: number,
  config: SystemInitConfig
): InitContext => {
  return {
    step,
    progress,
    systemConfig: config,
    browserInfo: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cookieEnabled: navigator.cookieEnabled,
      onlineStatus: navigator.onLine,
    },
    timestamp: new Date(),
  };
};