/**
 * AuthInput Component
 *
 * Reusable input component specifically designed for authentication forms.
 * Features password visibility toggle, real-time validation feedback,
 * and full accessibility compliance.
 */

import React, { useState, useCallback, forwardRef, useId } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils/helpers';

export interface AuthInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  type: 'email' | 'password' | 'text';
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  showPasswordToggle?: boolean;
  loading?: boolean;
}

const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({
    label,
    type,
    value,
    onChange,
    error,
    placeholder,
    required = false,
    disabled = false,
    showPasswordToggle = false,
    loading = false,
    className,
    id: providedId,
    ...props
  }, ref) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;

    const handleTogglePasswordVisibility = useCallback(() => {
      setIsPasswordVisible(!isPasswordVisible);
    }, [isPasswordVisible]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    }, [onChange]);

    const inputType = type === 'password' && isPasswordVisible ? 'text' : type;

    const hasError = Boolean(error);
    const shouldShowPasswordToggle = showPasswordToggle && type === 'password';

    return (
      <div className="w-full">
        <label
          htmlFor={id}
          className={cn(
            "block text-sm font-medium mb-2 transition-colors",
            hasError ? "text-red-600" : "text-gray-700",
            disabled && "text-gray-400"
          )}
        >
          {label}
          {required && (
            <span className="ml-1 text-red-500" aria-label="required">
              *
            </span>
          )}
        </label>

        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={inputType}
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled || loading}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : undefined}
            className={cn(
              "input",
              "w-full transition-all duration-200",
              shouldShowPasswordToggle && "pr-12",
              hasError && [
                "border-red-300",
                "focus:border-red-500",
                "focus:ring-red-500"
              ],
              (disabled || loading) && [
                "bg-gray-50",
                "cursor-not-allowed",
                "opacity-60"
              ],
              className
            )}
            {...props}
          />

          {shouldShowPasswordToggle && !loading && (
            <button
              type="button"
              onClick={handleTogglePasswordVisibility}
              disabled={disabled}
              aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2",
                "p-1 rounded-md",
                "text-gray-400 hover:text-gray-600",
                "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                "transition-colors duration-200",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              {isPasswordVisible ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          )}

          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full" />
            </div>
          )}
        </div>

        {hasError && (
          <p
            id={errorId}
            role="alert"
            className={cn(
              "mt-2 text-sm text-red-600",
              "flex items-start gap-1"
            )}
          >
            <span className="flex-shrink-0 mt-0.5">
              <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

AuthInput.displayName = 'AuthInput';

export default AuthInput;