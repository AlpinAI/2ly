/**
 * AuthErrorMessage Component
 *
 * Displays authentication errors with proper styling, accessibility,
 * and optional dismiss functionality. Supports different error types
 * with appropriate visual indicators.
 */

import React from 'react';
import { X, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../utils/helpers';

export interface AuthErrorMessageProps {
  error: string | null;
  type?: 'error' | 'warning' | 'info';
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
  showIcon?: boolean;
}

const AuthErrorMessage: React.FC<AuthErrorMessageProps> = ({
  error,
  type = 'error',
  dismissible = false,
  onDismiss,
  className,
  showIcon = true,
}) => {
  if (!error) {
    return null;
  }

  const typeConfig = {
    error: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-500',
      icon: AlertTriangle,
    },
    warning: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-500',
      icon: AlertTriangle,
    },
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-500',
      icon: Info,
    },
  };

  const config = typeConfig[type];
  const IconComponent = config.icon;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'rounded-md border p-4',
        config.bgColor,
        config.borderColor,
        'fade-in',
        className
      )}
    >
      <div className="flex items-start">
        {/* Icon */}
        {showIcon && (
          <div className="flex-shrink-0">
            <IconComponent
              className={cn('h-5 w-5', config.iconColor)}
              aria-hidden="true"
            />
          </div>
        )}

        {/* Content */}
        <div className={cn('flex-1', showIcon && 'ml-3')}>
          <p className={cn('text-sm font-medium leading-5', config.textColor)}>
            {error}
          </p>
        </div>

        {/* Dismiss button */}
        {dismissible && onDismiss && (
          <div className="flex-shrink-0 ml-4">
            <button
              type="button"
              onClick={onDismiss}
              className={cn(
                'inline-flex rounded-md p-1.5',
                config.bgColor,
                'hover:bg-opacity-75',
                config.textColor,
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                type === 'error' && 'focus:ring-red-500',
                type === 'warning' && 'focus:ring-yellow-500',
                type === 'info' && 'focus:ring-blue-500',
                'transition-colors duration-200'
              )}
              aria-label="Dismiss error message"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthErrorMessage;