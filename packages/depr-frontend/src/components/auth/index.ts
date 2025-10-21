/**
 * Authentication Components Index
 *
 * Barrel export for all authentication-related components, providing
 * convenient imports for consumers of the auth components library.
 */

// Base Components
export { default as AuthInput } from './AuthInput';
export type { AuthInputProps } from './AuthInput';

export { default as AuthButton } from './AuthButton';
export type { AuthButtonProps } from './AuthButton';

export {
  default as AuthFormCard,
  AuthFormCardHeader,
  AuthFormCardContent,
  AuthFormCardFooter,
} from './AuthFormCard';
export type {
  AuthFormCardProps,
  AuthFormCardHeaderProps,
  AuthFormCardContentProps,
  AuthFormCardFooterProps,
} from './AuthFormCard';

// Loading Components
export { default as AuthLoadingSpinner } from './AuthLoadingSpinner';
export type { AuthLoadingSpinnerProps } from './AuthLoadingSpinner';

export { default as AuthLoadingOverlay } from './AuthLoadingOverlay';
export type { AuthLoadingOverlayProps } from './AuthLoadingOverlay';

// Error Components
export { default as AuthErrorMessage } from './AuthErrorMessage';
export type { AuthErrorMessageProps } from './AuthErrorMessage';

export { default as AuthErrorBoundary } from './AuthErrorBoundary';
export type { AuthErrorBoundaryProps } from './AuthErrorBoundary';

// Form Components
export { default as LoginForm } from './LoginForm';
export type { LoginFormProps } from './LoginForm';

export { default as RegisterForm } from './RegisterForm';
export type { RegisterFormProps } from './RegisterForm';

export { default as PasswordStrengthIndicator } from './PasswordStrengthIndicator';
export type { PasswordStrengthIndicatorProps } from './PasswordStrengthIndicator';

// Re-export authentication utilities for convenience
export {
  validateEmailInput,
  validatePasswordInput,
  validateConfirmPassword,
  validateSystemName,
  getPasswordStrengthProps,
  formatAuthError,
  createDebouncedValidator,
} from '../../utils/auth.utils';

export type {
  FieldValidationResult,
  PasswordStrengthResult,
  SystemNameValidationResult,
} from '../../utils/auth.utils';

// System Initialization Components
export { default as WelcomeScreen } from './WelcomeScreen';
export type { WelcomeScreenProps, SystemInitConfig } from './WelcomeScreen';

export { default as InitializationSuccess } from './InitializationSuccess';
export type { InitializationSuccessProps } from './InitializationSuccess';

export { default as InitializationErrorRecovery } from './InitializationErrorRecovery';
export type { InitializationErrorRecoveryProps, ErrorReport, RecoveryOption, ErrorCategory } from './InitializationErrorRecovery';

// Re-export authentication hook
export { default as useAuthentication } from '../../hooks/useAuthentication';