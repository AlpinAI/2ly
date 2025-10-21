/**
 * RegisterForm Component
 *
 * Comprehensive registration form with real-time validation, password strength
 * indicators, and integration with authentication context. Includes terms of service
 * acknowledgment and automatic login after successful registration.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { cn } from '../../utils/helpers';
import {
  validateEmailInput,
  validatePasswordInput,
  validateConfirmPassword,
  formatAuthError,
  createDebouncedValidator,
  type FieldValidationResult,
  type PasswordStrengthResult
} from '../../utils/auth.utils';
import { useAuthentication } from '../../hooks/useAuthentication';
import AuthInput from './AuthInput';
import AuthButton from './AuthButton';
import AuthErrorMessage from './AuthErrorMessage';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';

export interface RegisterFormProps {
  onRegistrationSuccess?: () => void;
  redirectPath?: string;
  showLogin?: boolean;
  requireTermsAcceptance?: boolean;
  className?: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onRegistrationSuccess,
  redirectPath: _redirectPath, // eslint-disable-line @typescript-eslint/no-unused-vars
  showLogin = true,
  requireTermsAcceptance = true,
  className,
}) => {
  const { register, loading, error, clearError } = useAuthentication();

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  // Validation state
  const [validation, setValidation] = useState({
    email: { isValid: true } as FieldValidationResult,
    password: { isValid: true, score: 0, errors: [], suggestions: [] } as PasswordStrengthResult,
    confirmPassword: { isValid: true } as FieldValidationResult,
  });

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Create debounced validators
  const debouncedEmailValidator = createDebouncedValidator(validateEmailInput, 300);
  const debouncedPasswordValidator = createDebouncedValidator(validatePasswordInput, 300);
  const debouncedConfirmPasswordValidator = createDebouncedValidator(
    (value: string) => validateConfirmPassword(formData.password, value),
    300
  );

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

    // Always validate password for strength indication
    if (value.length > 0) {
      debouncedPasswordValidator(value, (result) => {
        setValidation(prev => ({
          ...prev,
          password: result,
        }));
      });

      // Re-validate confirm password if it has content
      if (formData.confirmPassword.length > 0) {
        const confirmResult = validateConfirmPassword(value, formData.confirmPassword);
        setValidation(prev => ({
          ...prev,
          confirmPassword: confirmResult,
        }));
      }
    } else {
      setValidation(prev => ({
        ...prev,
        password: { isValid: true, score: 0, errors: [], suggestions: [] },
        confirmPassword: { isValid: true },
      }));
    }
  }, [debouncedPasswordValidator, formData.confirmPassword, clearError]);

  const handleConfirmPasswordChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, confirmPassword: value }));
    clearError();

    // Only validate after first submission attempt or if field has content
    if (hasSubmitted || value.length > 0) {
      debouncedConfirmPasswordValidator(value, (result) => {
        setValidation(prev => ({
          ...prev,
          confirmPassword: result,
        }));
      });
    }
  }, [hasSubmitted, debouncedConfirmPasswordValidator, clearError]);

  const handleTermsChange = useCallback((checked: boolean) => {
    setFormData(prev => ({ ...prev, acceptTerms: checked }));
    clearError();
  }, [clearError]);

  // Form validation
  const validateForm = useCallback(() => {
    const emailValidation = validateEmailInput(formData.email);
    const passwordValidation = validatePasswordInput(formData.password);
    const confirmPasswordValidation = validateConfirmPassword(formData.password, formData.confirmPassword);

    setValidation({
      email: emailValidation,
      password: passwordValidation,
      confirmPassword: confirmPasswordValidation,
    });

    const isValid =
      emailValidation.isValid &&
      passwordValidation.isValid &&
      confirmPasswordValidation.isValid &&
      (!requireTermsAcceptance || formData.acceptTerms);

    return isValid;
  }, [formData, requireTermsAcceptance]);

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
      await register(formData.email.trim(), formData.password);

      // Call success callback
      if (onRegistrationSuccess) {
        onRegistrationSuccess();
      }
    } catch (error) {
      // Error is handled by the authentication context
      console.error('Registration failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, clearError, register, formData, onRegistrationSuccess]);

  // Reset form when email changes to allow retry
  useEffect(() => {
    if (error && formData.email.length === 0) {
      setHasSubmitted(false);
    }
  }, [error, formData.email]);

  const isFormDisabled = loading || isSubmitting;
  const showEmailError = hasSubmitted && !validation.email.isValid;
  const showPasswordError = hasSubmitted && !validation.password.isValid;
  const showConfirmPasswordError = hasSubmitted && !validation.confirmPassword.isValid;
  const showPasswordStrength = formData.password.length > 0;

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
      <div className="space-y-2">
        <AuthInput
          label="Password"
          type="password"
          value={formData.password}
          onChange={handlePasswordChange}
          error={showPasswordError ? validation.password.errors[0] : undefined}
          placeholder="Create a strong password"
          required
          disabled={isFormDisabled}
          showPasswordToggle
          autoComplete="new-password"
        />

        {/* Password Strength Indicator */}
        {showPasswordStrength && (
          <PasswordStrengthIndicator
            password={formData.password}
            validationResult={validation.password}
            showRequirements
          />
        )}
      </div>

      {/* Confirm Password Field */}
      <AuthInput
        label="Confirm Password"
        type="password"
        value={formData.confirmPassword}
        onChange={handleConfirmPasswordChange}
        error={showConfirmPasswordError ? validation.confirmPassword.error : undefined}
        placeholder="Confirm your password"
        required
        disabled={isFormDisabled}
        showPasswordToggle
        autoComplete="new-password"
      />

      {/* Terms of Service Checkbox */}
      {requireTermsAcceptance && (
        <div className="space-y-2">
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={formData.acceptTerms}
              onChange={(e) => handleTermsChange(e.target.checked)}
              disabled={isFormDisabled}
              className={cn(
                'mt-1 h-4 w-4 rounded border-gray-300',
                'text-primary-600 focus:ring-primary-500',
                'transition-colors duration-200',
                isFormDisabled && 'opacity-50 cursor-not-allowed'
              )}
              required
            />
            <span className={cn(
              'ml-2 text-sm text-gray-700 leading-relaxed',
              isFormDisabled && 'opacity-50'
            )}>
              I agree to the{' '}
              <Link
                to="/terms"
                className="text-primary-600 hover:text-primary-500 underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link
                to="/privacy"
                className="text-primary-600 hover:text-primary-500 underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </Link>
            </span>
          </label>

          {hasSubmitted && !formData.acceptTerms && (
            <p className="text-sm text-red-600">
              You must accept the terms and conditions to create an account
            </p>
          )}
        </div>
      )}

      {/* Submit Button */}
      <AuthButton
        type="submit"
        variant="primary"
        fullWidth
        loading={isSubmitting}
        disabled={isFormDisabled || (requireTermsAcceptance && !formData.acceptTerms)}
        loadingText="Creating account..."
        leftIcon={!isSubmitting ? <UserPlus className="h-4 w-4" /> : undefined}
      >
        Create Account
      </AuthButton>

      {/* Login Link */}
      {showLogin && (
        <div className="text-center">
          <span className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className={cn(
                'font-medium text-primary-600 hover:text-primary-500',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded',
                'transition-colors duration-200'
              )}
            >
              Sign in here
            </Link>
          </span>
        </div>
      )}
    </form>
  );
};

export default RegisterForm;