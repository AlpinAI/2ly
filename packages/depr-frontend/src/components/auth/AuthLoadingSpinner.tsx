/**
 * AuthLoadingSpinner Component
 *
 * Reusable loading spinner component specifically designed for authentication operations.
 * Features multiple sizes, customizable text, and proper accessibility attributes.
 */

import React from 'react';
import { cn } from '../../utils/helpers';

export interface AuthLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  variant?: 'primary' | 'secondary' | 'gray';
  className?: string;
}

const AuthLoadingSpinner: React.FC<AuthLoadingSpinnerProps> = ({
  size = 'md',
  text,
  variant = 'primary',
  className,
}) => {
  const sizes = {
    sm: {
      spinner: 'h-4 w-4',
      text: 'text-xs',
      gap: 'gap-2',
    },
    md: {
      spinner: 'h-5 w-5',
      text: 'text-sm',
      gap: 'gap-2',
    },
    lg: {
      spinner: 'h-6 w-6',
      text: 'text-base',
      gap: 'gap-3',
    },
    xl: {
      spinner: 'h-8 w-8',
      text: 'text-lg',
      gap: 'gap-3',
    },
  };

  const variants = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600',
    gray: 'text-gray-600',
  };

  const sizeConfig = sizes[size];
  const colorClass = variants[variant];

  return (
    <div
      className={cn(
        'flex items-center justify-center',
        sizeConfig.gap,
        colorClass,
        className
      )}
      role="status"
      aria-label={text || 'Loading'}
    >
      <svg
        className={cn(
          'animate-spin',
          sizeConfig.spinner
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

      {text && (
        <span
          className={cn(
            'font-medium',
            sizeConfig.text
          )}
        >
          {text}
        </span>
      )}

      {/* Screen reader only text */}
      <span className="sr-only">
        {text || 'Loading, please wait...'}
      </span>
    </div>
  );
};

export default AuthLoadingSpinner;