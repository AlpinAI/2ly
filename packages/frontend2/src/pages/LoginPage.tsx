import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, AlertCircle } from 'lucide-react';
import { useMutation } from '@apollo/client/react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { LOGIN_MUTATION } from '@/graphql/mutations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { login } = useAuth();

  const [loginMutation, { loading }] = useMutation<{
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
        setErrorMessage(null);
        login(data.login.tokens, data.login.user);
      } else if (!data.login.success) {
        // Login failed - show error from response
        const errorMsg = data.login.errors?.[0] || 'Invalid email or password';
        setErrorMessage(errorMsg);
      }
    },
    onError: (err) => {
      console.error('Login error:', err);
      setErrorMessage(err.message || 'Login failed. Please try again.');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null); // Clear any previous errors

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
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              {/* Email Field */}
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  className="mt-2"
                />
              </div>

              {/* Password Field */}
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="mt-2"
                />
              </div>

              {/* Submit Button */}
              <Button type="submit" disabled={loading} className="w-full">
                <Lock className="h-4 w-4" />
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>

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
