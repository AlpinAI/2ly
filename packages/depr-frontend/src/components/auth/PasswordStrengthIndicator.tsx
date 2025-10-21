/**
 * PasswordStrengthIndicator Component
 *
 * Visual password strength indicator with progress bar, strength text,
 * and requirement checklist. Provides real-time feedback as user types.
 */

import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '../../utils/helpers';
import {
  getPasswordStrengthProps,
  type PasswordStrengthResult
} from '../../utils/auth.utils';

export interface PasswordStrengthIndicatorProps {
  password: string;
  validationResult?: PasswordStrengthResult;
  showRequirements?: boolean;
  className?: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  validationResult,
  showRequirements = true,
  className,
}) => {
  if (!password || password.length === 0) {
    return null;
  }

  if (!validationResult) {
    return null;
  }

  const strengthProps = getPasswordStrengthProps(validationResult.score);

  // Password requirements checklist (required only)
  const requirements = [
    {
      test: password.length >= 8,
      text: 'At least 8 characters',
    },
    {
      test: /[a-z]/.test(password),
      text: 'Contains lowercase letter',
    },
    {
      test: /\d/.test(password),
      text: 'Contains number',
    },
  ];

  return (
    <div className={cn('space-y-3', className)}>
      {/* Strength Bar and Text */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">
            Password Strength
          </span>
          <span
            className="text-xs font-medium"
            style={{ color: strengthProps.color }}
          >
            {strengthProps.text}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300 ease-out rounded-full"
            style={{
              width: strengthProps.width,
              backgroundColor: strengthProps.color,
            }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="space-y-1">
          <span className="text-xs font-medium text-gray-600">
            Requirements:
          </span>
          <ul className="space-y-1" role="list">
            {requirements.map((req, index) => (
              <li
                key={index}
                className="flex items-center text-xs"
              >
                <span className="flex-shrink-0 mr-2">
                  {req.test ? (
                    <Check
                      className="h-3 w-3 text-green-500"
                      aria-label="Requirement met"
                    />
                  ) : (
                    <X
                      className="h-3 w-3 text-gray-400"
                      aria-label="Requirement not met"
                    />
                  )}
                </span>
                <span
                  className={cn(
                    req.test ? 'text-green-700' : 'text-gray-600',
                    'transition-colors duration-200'
                  )}
                >
                  {req.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {validationResult.suggestions && validationResult.suggestions.length > 0 && validationResult.score < 3 && (
        <div className="space-y-1">
          <span className="text-xs font-medium text-amber-700">
            Suggestions:
          </span>
          <ul className="space-y-1" role="list">
            {validationResult.suggestions.slice(0, 2).map((suggestion, index) => (
              <li
                key={index}
                className="text-xs text-amber-600 pl-4 relative"
              >
                <span className="absolute left-0 top-1 w-1 h-1 bg-amber-400 rounded-full" />
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;