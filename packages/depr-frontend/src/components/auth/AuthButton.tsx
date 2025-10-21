/**
 * AuthButton Component
 *
 * Specialized button component for authentication forms with enhanced
 * loading states, accessibility features, and consistent styling.
 */

import React, { forwardRef } from 'react';
import { cn } from '../../utils/helpers';

export interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loadingText?: string;
  children: React.ReactNode;
}

const AuthButton = forwardRef<HTMLButtonElement, AuthButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    loadingText = 'Loading...',
    children,
    className,
    type = 'button',
    ...props
  }, ref) => {
    const isDisabled = disabled || loading;

    const variants = {
      primary: [
        'btn-primary',
        'shadow-sm',
        loading && 'bg-primary-400 hover:bg-primary-400',
      ],
      secondary: [
        'btn-secondary',
        'shadow-sm',
        loading && 'bg-secondary-400 hover:bg-secondary-400',
      ],
      outline: [
        'btn-outline',
        'shadow-sm hover:shadow',
        loading && 'bg-gray-50 border-gray-200 text-gray-400',
      ],
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    };

    const LoadingSpinner = () => (
      <svg
        className={cn(
          "animate-spin",
          size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
        )}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        className={cn(
          'btn',
          'relative',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          isDisabled && [
            'cursor-not-allowed',
            loading ? 'pointer-events-none' : 'opacity-50'
          ],
          variant === 'primary' && 'focus:ring-primary-500',
          variant === 'secondary' && 'focus:ring-secondary-500',
          variant === 'outline' && 'focus:ring-primary-500',
          className
        )}
        {...props}
      >
        <span
          className={cn(
            'flex items-center justify-center gap-2',
            loading && 'opacity-0'
          )}
          aria-hidden={loading}
        >
          {!loading && leftIcon && (
            <span className={cn(
              'flex-shrink-0',
              size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
            )}>
              {leftIcon}
            </span>
          )}
          <span>{children}</span>
          {!loading && rightIcon && (
            <span className={cn(
              'flex-shrink-0',
              size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
            )}>
              {rightIcon}
            </span>
          )}
        </span>

        {loading && (
          <span
            className="absolute inset-0 flex items-center justify-center gap-2"
            aria-label={loadingText}
          >
            <LoadingSpinner />
            {loadingText && (
              <span className={cn(
                size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
              )}>
                {loadingText}
              </span>
            )}
          </span>
        )}
      </button>
    );
  }
);

AuthButton.displayName = 'AuthButton';

export default AuthButton;