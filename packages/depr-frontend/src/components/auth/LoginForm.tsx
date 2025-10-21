/**
 * LoginForm Component
 *
 * Comprehensive login form with real-time validation, proper accessibility,
 * and integration with the authentication context. Includes remember me
 * functionality and navigation to registration form.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { cn } from '../../utils/helpers';
import {
  validateEmailInput,
  formatAuthError,
  createDebouncedValidator,
  type FieldValidationResult
} from '../../utils/auth.utils';
import { useAuthentication } from '../../hooks/useAuthentication';
import AuthInput from './AuthInput';
import AuthButton from './AuthButton';
import AuthErrorMessage from './AuthErrorMessage';

export interface LoginFormProps {
  onLoginSuccess?: () => void;
  redirectPath?: string;
  showCreateAccount?: boolean;
  className?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onLoginSuccess,
  redirectPath: _redirectPath, // eslint-disable-line @typescript-eslint/no-unused-vars
  showCreateAccount = true,
  className,
}) => {
  const { login, loading, error, clearError } = useAuthentication();

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  // Validation state
  const [validation, setValidation] = useState({
    email: { isValid: true } as FieldValidationResult,
    password: { isValid: true } as FieldValidationResult,
  });

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Create debounced validators
  const debouncedEmailValidator = createDebouncedValidator(validateEmailInput, 300);

  // Handle input changes
  const handleEmailChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, email: value }));
    clearError();

    // Only validate after first submission attempt or if field has content
    if (hasSubmitted || value.length > 0) {
      debouncedEmailValidator(value, (result) => {
        setValidation(prev => ({
          ...prev,
          email: result,
        }));
      });
    }
  }, [hasSubmitted, debouncedEmailValidator, clearError]);

  const handlePasswordChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, password: value }));
    clearError();

    // Simple password validation - just check if it's not empty
    if (hasSubmitted || value.length > 0) {
      const isValid = value.trim().length > 0;
      setValidation(prev => ({
        ...prev,
        password: {
          isValid,
          error: isValid ? undefined : 'Password is required',
        },
      }));
    }
  }, [hasSubmitted, clearError]);

  const handleRememberMeChange = useCallback((checked: boolean) => {
    setFormData(prev => ({ ...prev, rememberMe: checked }));
  }, []);

  // Form validation
  const validateForm = useCallback(() => {
    const emailValidation = validateEmailInput(formData.email);
    const passwordValidation: FieldValidationResult = {
      isValid: formData.password.trim().length > 0,
      error: formData.password.trim().length === 0 ? 'Password is required' : undefined,
    };

    setValidation({
      email: emailValidation,
      password: passwordValidation,
    });

    return emailValidation.isValid && passwordValidation.isValid;
  }, [formData.email, formData.password]);

  // Handle form submission
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    setHasSubmitted(true);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      await login(formData.email.trim(), formData.password);

      // Store remember me preference (if implemented in backend)
      if (formData.rememberMe) {
        localStorage.setItem('2ly_remember_me', 'true');
      } else {
        localStorage.removeItem('2ly_remember_me');
      }

      // Call success callback
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error) {
      // Error is handled by the authentication context
      console.error('Login failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, clearError, login, formData, onLoginSuccess]);

  // Reset form when email changes to allow retry
  useEffect(() => {
    if (error && formData.email.length === 0) {
      setHasSubmitted(false);
    }
  }, [error, formData.email]);

  const isFormDisabled = loading || isSubmitting;
  const showEmailError = hasSubmitted && !validation.email.isValid;
  const showPasswordError = hasSubmitted && !validation.password.isValid;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cn('space-y-6', className)}
    >
      {/* Error Message */}
      {error && (
        <AuthErrorMessage
          error={formatAuthError(error)}
          dismissible
          onDismiss={clearError}
        />
      )}

      {/* Email Field */}
      <AuthInput
        label="Email address"
        type="email"
        value={formData.email}
        onChange={handleEmailChange}
        error={showEmailError ? validation.email.error : undefined}
        placeholder="Enter your email address"
        required
        disabled={isFormDisabled}
        autoComplete="email"
        autoFocus
      />

      {/* Password Field */}
      <AuthInput
        label="Password"
        type="password"
        value={formData.password}
        onChange={handlePasswordChange}
        error={showPasswordError ? validation.password.error : undefined}
        placeholder="Enter your password"
        required
        disabled={isFormDisabled}
        showPasswordToggle
        autoComplete="current-password"
      />

      {/* Remember Me Checkbox */}
      <div className="flex items-center justify-between">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.rememberMe}
            onChange={(e) => handleRememberMeChange(e.target.checked)}
            disabled={isFormDisabled}
            className={cn(
              'h-4 w-4 rounded border-gray-300',
              'text-primary-600 focus:ring-primary-500',
              'transition-colors duration-200',
              isFormDisabled && 'opacity-50 cursor-not-allowed'
            )}
          />
          <span className={cn(
            'ml-2 text-sm text-gray-700',
            isFormDisabled && 'opacity-50'
          )}>
            Remember me
          </span>
        </label>

        {/* TODO: Add forgot password link when implemented */}
        {/*
        <Link
          to="/forgot-password"
          className="text-sm text-primary-600 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
        >
          Forgot your password?
        </Link>
        */}
      </div>

      {/* Submit Button */}
      <AuthButton
        type="submit"
        variant="primary"
        fullWidth
        loading={isSubmitting}
        disabled={isFormDisabled}
        loadingText="Signing in..."
        leftIcon={!isSubmitting ? <Lock className="h-4 w-4" /> : undefined}
      >
        Sign In
      </AuthButton>

      {/* Create Account Link */}
      {showCreateAccount && (
        <div className="text-center">
          <span className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className={cn(
                'font-medium text-primary-600 hover:text-primary-500',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded',
                'transition-colors duration-200'
              )}
            >
              Create one now
            </Link>
          </span>
        </div>
      )}
    </form>
  );
};

export default LoginForm;