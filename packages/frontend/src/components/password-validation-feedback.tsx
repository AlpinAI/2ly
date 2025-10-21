import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PasswordValidation {
  minLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
}

export interface PasswordValidationFeedbackProps {
  password: string;
  className?: string;
}

/**
 * PasswordValidationFeedback Component
 *
 * WHY: Provides real-time visual feedback on password requirements
 * to help users create valid passwords.
 *
 * Requirements:
 * - Minimum 8 characters
 * - At least one letter (a-z, A-Z)
 * - At least one number (0-9)
 */
export function PasswordValidationFeedback({
  password,
  className,
}: PasswordValidationFeedbackProps) {
  const validation: PasswordValidation = {
    minLength: password.length >= 8,
    hasLetter: /[a-zA-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };

  // Don't show if password is empty
  if (!password) {
    return null;
  }

  return (
    <div
      className={cn('space-y-2', className)}
      data-testid="password-validation-feedback"
    >
      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
        Password requirements:
      </p>
      <ul className="space-y-1">
        <ValidationItem
          isValid={validation.minLength}
          text="At least 8 characters"
          testId="validation-min-length"
        />
        <ValidationItem
          isValid={validation.hasLetter}
          text="At least one letter"
          testId="validation-has-letter"
        />
        <ValidationItem
          isValid={validation.hasNumber}
          text="At least one number"
          testId="validation-has-number"
        />
      </ul>
    </div>
  );
}

interface ValidationItemProps {
  isValid: boolean;
  text: string;
  testId: string;
}

function ValidationItem({ isValid, text, testId }: ValidationItemProps) {
  return (
    <li
      className="flex items-center gap-2 text-xs"
      data-testid={testId}
      data-valid={isValid}
    >
      {isValid ? (
        <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
      ) : (
        <X className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
      )}
      <span
        className={cn(
          isValid
            ? 'text-green-600 dark:text-green-400'
            : 'text-gray-600 dark:text-gray-400'
        )}
      >
        {text}
      </span>
    </li>
  );
}

/**
 * Validates password according to the requirements.
 * Used for form validation before submission.
 */
export function validatePassword(password: string): PasswordValidation {
  return {
    minLength: password.length >= 8,
    hasLetter: /[a-zA-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };
}

/**
 * Checks if password meets all requirements.
 */
export function isPasswordValid(password: string): boolean {
  const validation = validatePassword(password);
  return validation.minLength && validation.hasLetter && validation.hasNumber;
}
