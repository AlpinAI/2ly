import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, AlertCircle } from 'lucide-react';
import { useMutation } from '@apollo/client/react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PasswordValidationFeedback, isPasswordValid } from '@/components/PasswordValidationFeedback';
import { useAuth } from '@/contexts/AuthContext';
import { REGISTER_MUTATION } from '@/graphql/mutations/auth';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { login } = useAuth();

  const [registerMutation, { loading }] = useMutation<{
    registerUser: {
      success: boolean;
      user?: { id: string; email: string };
      tokens?: { accessToken: string; refreshToken: string };
      errors?: string[];
    };
  }>(REGISTER_MUTATION, {
    onCompleted: (data) => {
      if (data.registerUser.success && data.registerUser.tokens && data.registerUser.user) {
        // Successfully registered
        setErrorMessage(null);
        login(data.registerUser.tokens, data.registerUser.user);
      } else if (!data.registerUser.success) {
        // Registration failed - show error from response
        const errorMsg = data.registerUser.errors?.[0] || 'Registration failed';
        setErrorMessage(errorMsg);
      }
    },
    onError: (err) => {
      console.error('Registration error:', err);
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    },
  });

  // Form validation state
  const passwordIsValid = password.length > 0 && isPasswordValid(password);
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const formIsValid = passwordIsValid && passwordsMatch && acceptTerms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null); // Clear any previous errors

    // Double-check validation (button should already be disabled if invalid)
    if (!formIsValid) {
      return;
    }

    try {
      await registerMutation({
        variables: {
          input: {
            email,
            password,
          },
        },
      });
    } catch (err) {
      // Error is handled by onError callback
      console.error('Registration failed:', err);
    }
  };

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
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              2LY
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              AI Tool Management Platform
            </p>
          </div>

          {/* Register Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Create Account
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={cn(
                    'w-full px-4 py-2 rounded-lg',
                    'bg-gray-100 dark:bg-gray-900',
                    'border border-gray-300 dark:border-gray-700',
                    'text-gray-900 dark:text-white',
                    'placeholder-gray-500 dark:placeholder-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent',
                    'transition-colors'
                  )}
                  placeholder="Enter your email"
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
                  className={cn(
                    'w-full px-4 py-2 rounded-lg',
                    'bg-gray-100 dark:bg-gray-900',
                    'border border-gray-300 dark:border-gray-700',
                    'text-gray-900 dark:text-white',
                    'placeholder-gray-500 dark:placeholder-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent',
                    'transition-colors'
                  )}
                  placeholder="Create a strong password"
                />
                <PasswordValidationFeedback password={password} className="mt-3" />
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
                  className={cn(
                    'w-full px-4 py-2 rounded-lg',
                    'bg-gray-100 dark:bg-gray-900',
                    'border border-gray-300 dark:border-gray-700',
                    'text-gray-900 dark:text-white',
                    'placeholder-gray-500 dark:placeholder-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent',
                    'transition-colors'
                  )}
                  placeholder="Confirm your password"
                />
                {/* Password Match Indicator */}
                {confirmPassword && (
                  <p
                    className={cn(
                      'mt-2 text-xs',
                      passwordsMatch
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    )}
                    data-testid="password-match-indicator"
                  >
                    {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div>
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    required
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    I agree to the{' '}
                    <Link
                      to="/terms"
                      className="text-cyan-600 hover:text-cyan-500 underline"
                    >
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link
                      to="/privacy"
                      className="text-cyan-600 hover:text-cyan-500 underline"
                    >
                      Privacy Policy
                    </Link>
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!formIsValid || loading}
                className={cn(
                  'w-full flex items-center justify-center gap-2',
                  'px-4 py-2 rounded-lg',
                  'bg-cyan-600 hover:bg-cyan-700',
                  'text-white font-medium',
                  'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2',
                  'transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <UserPlus className="h-4 w-4" />
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>

              {/* Login Link */}
              <div className="text-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-medium text-cyan-600 hover:text-cyan-500 transition-colors"
                  >
                    Sign in here
                  </Link>
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
