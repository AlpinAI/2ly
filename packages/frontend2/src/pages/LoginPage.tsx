import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, AlertCircle } from 'lucide-react';
import { useMutation } from '@apollo/client/react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { LOGIN_MUTATION } from '@/graphql/mutations/auth';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();

  const [loginMutation, { loading, error }] = useMutation<{
    login: {
      success: boolean;
      user?: { id: string; email: string };
      tokens?: { accessToken: string; refreshToken: string };
      errors?: string[];
    };
  }>(LOGIN_MUTATION, {
    onCompleted: (data) => {
      if (data.login.success && data.login.tokens && data.login.user) {
        // Successfully logged in
        login(data.login.tokens, data.login.user);
      }
    },
    onError: (err) => {
      console.error('Login error:', err);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      // Error is handled by onError callback
      console.error('Login failed:', err);
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

          {/* Login Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Sign In
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error.message || 'Login failed. Please check your credentials.'}
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
                  placeholder="Enter your password"
                />
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Remember me
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
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
                <Lock className="h-4 w-4" />
                {loading ? 'Signing In...' : 'Sign In'}
              </button>

              {/* Register Link */}
              <div className="text-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="font-medium text-cyan-600 hover:text-cyan-500 transition-colors"
                  >
                    Create one now
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
