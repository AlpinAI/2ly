import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { useMutation } from '@apollo/client/react';
import { ThemeToggle } from '@/components/theme-toggle';
import { PasswordValidationFeedback, isPasswordValid } from '@/components/password-validation-feedback';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RegisterDocument } from '@/graphql/generated/graphql';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { login } = useAuth();
  const { theme } = useTheme();

  const [registerMutation, { loading }] = useMutation<{
    registerUser: {
      success: boolean;
      user?: { id: string; email: string };
      tokens?: { accessToken: string; refreshToken: string };
      errors?: string[];
    };
  }>(RegisterDocument, {
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
            <div className="flex justify-center mb-4">
              <img
                src={theme === 'dark' ? '/logo-skilder-dark2.png' : '/logo-skilder2.png'}
                alt="Skilder"
                className="h-16 w-auto"
              />
            </div>
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
                  placeholder="Create a strong password"
                  className="mt-2"
                />
                <PasswordValidationFeedback password={password} className="mt-3" />
              </div>

              {/* Confirm Password Field */}
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your password"
                  className="mt-2"
                />
                {/* Password Match Indicator */}
                {confirmPassword && (
                  <p
                    className={cn(
                      'mt-2 text-xs flex items-center gap-1',
                      passwordsMatch
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    )}
                    data-testid="password-match-indicator"
                  >
                    {passwordsMatch ? (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        Passwords match
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3" />
                        Passwords do not match
                      </>
                    )}
                  </p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <Checkbox
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                    required
                    className="mt-1"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    I agree to the{' '}
                    <a
                      href="https://www.skilder.ai/terms-of-service"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-600 hover:text-cyan-500 underline"
                    >
                      Terms of Service
                    </a>
                    {' '}and{' '}
                    <a
                      href="https://www.skilder.ai/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-600 hover:text-cyan-500 underline"
                    >
                      Privacy Policy
                    </a>
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <Button type="submit" disabled={!formIsValid || loading} className="w-full">
                <UserPlus className="h-4 w-4" />
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>

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
