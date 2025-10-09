/**
 * InitPage Component
 *
 * WHY: System initialization page - creates the first administrator account.
 * This page is shown when the system has not been initialized yet.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, AlertCircle, CheckCircle } from 'lucide-react';
import { useMutation } from '@apollo/client/react';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  PasswordValidationFeedback,
  isPasswordValid,
} from '@/components/PasswordValidationFeedback';
import { INIT_SYSTEM_MUTATION } from '@/graphql/mutations/system';
import { LOGIN_MUTATION } from '@/graphql/mutations/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useSystemInit } from '@/hooks/useSystemInit';
import { cn } from '@/lib/utils';

export default function InitPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isInitialized, isLoading: isCheckingInit } = useSystemInit();

  // Redirect to dashboard if system is already initialized
  useEffect(() => {
    if (!isCheckingInit && isInitialized === true) {
      navigate('/dashboard', { replace: true });
    }
  }, [isInitialized, isCheckingInit, navigate]);

  // Login mutation to auto-login after initialization
  const [loginMutation] = useMutation<{
    login: {
      success: boolean;
      user?: { id: string; email: string };
      tokens?: { accessToken: string; refreshToken: string };
      errors?: string[];
    };
  }>(LOGIN_MUTATION, {
    onCompleted: (data) => {
      if (data.login.success && data.login.tokens && data.login.user) {
        // Auto-login successful, redirect to dashboard
        login(data.login.tokens, data.login.user);
      }
    },
    onError: (err) => {
      console.error('Auto-login error:', err);
      // Still show success but redirect to login instead
      setSuccessMessage(
        'System initialized successfully! Please log in.'
      );
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    },
  });

  const [initSystemMutation, { loading }] = useMutation<{
    initSystem: {
      id: string;
      initialized: boolean;
    };
  }>(INIT_SYSTEM_MUTATION, {
    onCompleted: async () => {
      // System initialized successfully
      setErrorMessage(null);
      setSuccessMessage(
        'System initialized successfully! Logging you in...'
      );

      // Auto-login the user with the credentials they just created
      try {
        await loginMutation({
          variables: {
            input: {
              email,
              password,
            },
          },
        });
      } catch (err) {
        // Error handled by loginMutation onError
        console.error('Auto-login failed:', err);
      }
    },
    onError: (err) => {
      console.error('System initialization error:', err);
      setErrorMessage(
        err.message || 'System initialization failed. Please try again.'
      );
    },
  });

  // Form validation state
  const passwordIsValid = password.length > 0 && isPasswordValid(password);
  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;
  const formIsValid = email.length > 0 && passwordIsValid && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Double-check validation
    if (!formIsValid) {
      return;
    }

    try {
      await initSystemMutation({
        variables: {
          email,
          adminPassword: password,
        },
      });
    } catch (err) {
      // Error is handled by onError callback
      console.error('Initialization failed:', err);
    }
  };

  // Show loading state while checking if system is initialized
  if (isCheckingInit) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Checking system status...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors font-mono">
      {/* Theme Toggle in top right */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-blue-100 dark:bg-blue-900">
              <Settings className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              2LY
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              AI Tool Management Platform
            </p>
          </div>

          {/* Initialization Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              System Initialization
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Create your administrator account to initialize the system
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Success Message */}
              {successMessage && (
                <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {successMessage}
                  </p>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errorMessage}
                  </p>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Administrator Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading || !!successMessage}
                  className={cn(
                    'w-full px-4 py-2 rounded-lg',
                    'bg-gray-100 dark:bg-gray-900',
                    'border border-gray-300 dark:border-gray-700',
                    'text-gray-900 dark:text-white',
                    'placeholder-gray-500 dark:placeholder-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                    'transition-colors',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                  placeholder="admin@example.com"
                />
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading || !!successMessage}
                  className={cn(
                    'w-full px-4 py-2 rounded-lg',
                    'bg-gray-100 dark:bg-gray-900',
                    'border border-gray-300 dark:border-gray-700',
                    'text-gray-900 dark:text-white',
                    'placeholder-gray-500 dark:placeholder-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                    'transition-colors',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                  placeholder="Enter a secure password"
                />

                {/* Password Validation Feedback */}
                {password && (
                  <div className="mt-2">
                    <PasswordValidationFeedback password={password} />
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading || !!successMessage}
                  className={cn(
                    'w-full px-4 py-2 rounded-lg',
                    'bg-gray-100 dark:bg-gray-900',
                    'border border-gray-300 dark:border-gray-700',
                    'text-gray-900 dark:text-white',
                    'placeholder-gray-500 dark:placeholder-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                    'transition-colors',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                  placeholder="Confirm your password"
                />

                {/* Password Match Indicator */}
                {confirmPassword && (
                  <div
                    className="mt-2 text-sm"
                    data-testid="password-match-indicator"
                  >
                    {passwordsMatch ? (
                      <p className="text-green-600 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Passwords match
                      </p>
                    ) : (
                      <p className="text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        Passwords do not match
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!formIsValid || loading || !!successMessage}
                className={cn(
                  'w-full flex items-center justify-center gap-2',
                  'px-4 py-2 rounded-lg',
                  'bg-blue-600 hover:bg-blue-700',
                  'text-white font-medium',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  'transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <Settings className="h-4 w-4" />
                {loading ? 'Initializing System...' : 'Initialize System'}
              </button>

              {/* Info Text */}
              <div className="text-center">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  This will create your administrator account and initialize the
                  system. You'll be able to log in after initialization is
                  complete.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
