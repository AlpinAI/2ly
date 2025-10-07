/**
 * WelcomeScreen Component
 *
 * Multi-step wizard interface for system initialization and first-time setup.
 * Guides administrators through the complete system setup process with
 * clear progress indicators, validation, and error handling.
 */

import React, { useState, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import {
  AuthFormCard,
  AuthErrorMessage,
  AuthLoadingSpinner
} from './index';
import Button from '../ui/Button';
import { cn } from '../../utils/helpers';
import {
  InitializationProgress,
  InitializationResult,
  getSystemInitializationService,
} from '../../services/system.service';
import { validatePassword } from '../../utils/auth.utils';

export interface WelcomeScreenProps {
  onInitializationComplete: (result: InitializationResult) => void;
  className?: string;
}

export interface SystemInitConfig {
  adminEmail: string;
  adminPassword: string;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onInitializationComplete,
  className,
}) => {
  // State management
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [initProgress, setInitProgress] = useState<InitializationProgress | null>(null);

  // Form data state
  const [systemConfig, setSystemConfig] = useState<SystemInitConfig>({
    adminEmail: '',
    adminPassword: '',
  });

  // Error handling
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Form update handlers
  const updateSystemConfig = useCallback((updates: Partial<SystemInitConfig>) => {
    setSystemConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // Form validation - use same validation as registration
  const passwordValidation = validatePassword(systemConfig.adminPassword);
  const canSubmit = systemConfig.adminEmail.trim() !== '' &&
    passwordValidation.isValid;

  // Initialize system
  const handleInitializeSystem = useCallback(async () => {
    try {
      setIsInitializing(true);
      clearError();

      // Get the system initialization service
      const systemService = getSystemInitializationService();

      // Set up progress listener
      const unsubscribe = systemService.onInitializationProgress((progress) => {
        setInitProgress(progress);
      });

      try {
        // Call the real initialization service
        const result = await systemService.initializeSystem({
          adminEmail: systemConfig.adminEmail,
          adminPassword: systemConfig.adminPassword,
        });

        // Success - notify the parent component
        onInitializationComplete(result);
      } finally {
        // Clean up progress listener
        unsubscribe();
      }

    } catch (error) {
      console.error('System initialization failed:', error);
      setError(error instanceof Error ? error.message : 'System initialization failed');
      setInitProgress(null);
    } finally {
      setIsInitializing(false);
    }
  }, [systemConfig, onInitializationComplete, clearError]);

  return (
    <div className={cn('min-h-screen bg-gray-50 flex items-center justify-center p-4', className)}>

      <AuthFormCard
        maxWidth="md"
        className="w-full max-w-2xl"
      >
        {/* Error Display */}
        {error && (
          <AuthErrorMessage
            error={error}
            onDismiss={clearError}
            className="mb-6"
          />
        )}

        {/* Loading Overlay */}
        {isInitializing && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg">
            <div className="text-center max-w-sm">
              <AuthLoadingSpinner className="mb-4" />

              {initProgress ? (
                <>
                  <p className="text-gray-600 font-medium mb-2">{initProgress.message}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${initProgress.progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500">{initProgress.progress}% complete</p>
                </>
              ) : (
                <>
                  <p className="text-gray-600">Initializing your system...</p>
                  <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Main Form */}
        <div className="relative">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to 2LY Platform</h2>
              <p className="text-gray-600 leading-relaxed">
                Get started with your AI tool platform.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  id="adminEmail"
                  type="email"
                  value={systemConfig.adminEmail}
                  onChange={(e) => updateSystemConfig({ adminEmail: e.target.value })}
                  placeholder="admin@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  id="adminPassword"
                  type="password"
                  value={systemConfig.adminPassword}
                  onChange={(e) => updateSystemConfig({ adminPassword: e.target.value })}
                  placeholder="Create a password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  minLength={8}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  At least 8 characters with lowercase letters and numbers
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="text-left">
                  <h3 className="text-sm font-medium text-blue-900">Getting Started</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    This will initialize your first workspace and create your administrator account.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleInitializeSystem}
              disabled={!canSubmit || isInitializing}
              isLoading={isInitializing}
              className="w-full"
            >
              {isInitializing ? 'Creating...' : 'Create Workspace'}
            </Button>
          </div>
        </div>
      </AuthFormCard>
    </div>
  );
};

export default WelcomeScreen;