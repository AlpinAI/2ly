/**
 * AuthLoadingOverlay Component
 *
 * Full-screen overlay for critical authentication operations that require
 * blocking user interaction. Features backdrop blur, escape key handling,
 * and optional cancellation for non-critical operations.
 */

import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/helpers';
import AuthLoadingSpinner from './AuthLoadingSpinner';

export interface AuthLoadingOverlayProps {
  isVisible: boolean;
  title?: string;
  description?: string;
  canCancel?: boolean;
  onCancel?: () => void;
  variant?: 'primary' | 'secondary' | 'gray';
  className?: string;
}

const AuthLoadingOverlay: React.FC<AuthLoadingOverlayProps> = ({
  isVisible,
  title = 'Loading',
  description,
  canCancel = false,
  onCancel,
  variant = 'primary',
  className,
}) => {
  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && canCancel && onCancel) {
      onCancel();
    }
  }, [canCancel, onCancel]);

  const handleBackdropClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking the backdrop itself, not child elements
    if (event.target === event.currentTarget && canCancel && onCancel) {
      onCancel();
    }
  }, [canCancel, onCancel]);

  useEffect(() => {
    if (isVisible) {
      // Prevent body scroll when overlay is visible
      document.body.style.overflow = 'hidden';

      // Add escape key listener
      document.addEventListener('keydown', handleEscapeKey);

      // Focus management - trap focus within overlay
      const overlay = document.getElementById('auth-loading-overlay');
      if (overlay) {
        overlay.focus();
      }

      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isVisible, handleEscapeKey]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      id="auth-loading-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="overlay-title"
      aria-describedby={description ? "overlay-description" : undefined}
      tabIndex={-1}
      className={cn(
        'fixed inset-0 z-50',
        'flex items-center justify-center',
        'bg-black bg-opacity-50 backdrop-blur-sm',
        'transition-all duration-300 ease-out',
        'fade-in',
        className
      )}
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          'relative',
          'bg-white rounded-lg shadow-2xl',
          'p-8 mx-4',
          'max-w-sm w-full',
          'slide-up'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cancel Button */}
        {canCancel && onCancel && (
          <button
            onClick={onCancel}
            className={cn(
              'absolute top-4 right-4',
              'p-1 rounded-full',
              'text-gray-400 hover:text-gray-600',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
              'transition-colors duration-200'
            )}
            aria-label="Cancel loading"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Content */}
        <div className="text-center space-y-4">
          {/* Loading Spinner */}
          <div className="flex justify-center">
            <AuthLoadingSpinner
              size="lg"
              variant={variant}
            />
          </div>

          {/* Title */}
          <h2
            id="overlay-title"
            className="text-lg font-semibold text-gray-900"
          >
            {title}
          </h2>

          {/* Description */}
          {description && (
            <p
              id="overlay-description"
              className="text-sm text-gray-600 leading-relaxed"
            >
              {description}
            </p>
          )}

          {/* Cancel Button (if enabled) */}
          {canCancel && onCancel && (
            <div className="pt-2">
              <button
                onClick={onCancel}
                className={cn(
                  'inline-flex items-center',
                  'px-3 py-1.5',
                  'text-xs font-medium text-gray-500',
                  'hover:text-gray-700',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                  'transition-colors duration-200'
                )}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Screen reader instructions */}
      <div className="sr-only" aria-live="polite">
        {canCancel
          ? `${title}. Press Escape to cancel or click outside to dismiss.`
          : `${title}. Please wait for the operation to complete.`
        }
      </div>
    </div>
  );
};

export default AuthLoadingOverlay;