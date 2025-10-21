/**
 * AuthFormCard Component
 *
 * Reusable card container specifically designed for authentication forms.
 * Provides consistent spacing, responsive design, and semantic structure
 * for login, registration, and system initialization forms.
 */

import React, { forwardRef } from 'react';
import { cn } from '../../utils/helpers';

export interface AuthFormCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

const AuthFormCard = forwardRef<HTMLDivElement, AuthFormCardProps>(
  ({
    title,
    subtitle,
    footer,
    maxWidth = 'sm',
    className,
    children,
    ...props
  }, ref) => {
    const maxWidths = {
      sm: 'max-w-sm', // 384px
      md: 'max-w-md', // 448px
      lg: 'max-w-lg', // 512px
    };

    return (
      <div
        className={cn(
          'w-full',
          maxWidths[maxWidth],
          'mx-auto',
          'fade-in'
        )}
      >
        <div
          ref={ref}
          className={cn(
            'card',
            'p-6 sm:p-8',
            'space-y-6',
            'shadow-lg hover:shadow-xl',
            'border-0 bg-white',
            className
          )}
          {...props}
        >
          {/* Header Section */}
          {(title || subtitle) && (
            <header className="text-center space-y-2">
              {title && (
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </header>
          )}

          {/* Main Content Section */}
          <main className="space-y-4">
            {children}
          </main>

          {/* Footer Section */}
          {footer && (
            <footer className={cn(
              'pt-4 border-t border-gray-100',
              'text-center text-sm'
            )}>
              {footer}
            </footer>
          )}
        </div>
      </div>
    );
  }
);

AuthFormCard.displayName = 'AuthFormCard';

export interface AuthFormCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const AuthFormCardHeader = forwardRef<HTMLDivElement, AuthFormCardHeaderProps>(
  ({
    title,
    subtitle,
    icon,
    className,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'text-center space-y-3',
          className
        )}
        {...props}
      >
        {icon && (
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-100">
              <div className="text-primary-600">
                {icon}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            {title}
          </h1>

          {subtitle && (
            <p className="text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    );
  }
);

AuthFormCardHeader.displayName = 'AuthFormCardHeader';

export interface AuthFormCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

export const AuthFormCardContent = forwardRef<HTMLDivElement, AuthFormCardContentProps>(
  ({
    className,
    children,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('space-y-4', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

AuthFormCardContent.displayName = 'AuthFormCardContent';

export interface AuthFormCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

export const AuthFormCardFooter = forwardRef<HTMLDivElement, AuthFormCardFooterProps>(
  ({
    className,
    children,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'pt-6 border-t border-gray-100',
          'text-center text-sm text-gray-600',
          'space-y-2',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

AuthFormCardFooter.displayName = 'AuthFormCardFooter';

export default AuthFormCard;