/**
 * LoginPage Component
 *
 * Login page that integrates with the authentication system and route protection.
 * Handles login flow with route preservation and error handling.
 */

import { useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthentication } from '../../contexts/useAuthentication';
import { useRoutePreservation } from '../../hooks/useRoutePreservation';
import { AuthLayout } from '../../components/layout/auth/AuthLayout';
import { LoginForm, AuthLoadingSpinner, AuthErrorMessage } from '../../components/auth';

/**
 * Login page with route protection integration
 */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, clearError, isAuthenticated } = useAuthentication();
  const { redirectToPreservedRoute, hasPreservedRoute } = useRoutePreservation();


  // Get the intended destination from location state
  const from = location.state?.from?.pathname || null;

  /**
   * Handle successful login
   */
  const handleLoginSuccess = useCallback(() => {
    // Clear any authentication errors
    clearError();

    // Redirect to preserved route or default destination
    if (hasPreservedRoute()) {
      redirectToPreservedRoute('/');
    } else if (from) {
      navigate(from, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [clearError, hasPreservedRoute, redirectToPreservedRoute, from, navigate]);

  // Login is now handled internally by LoginForm

  /**
   * Redirect if already authenticated
   */
  useEffect(() => {
    if (isAuthenticated && !loading) {
      handleLoginSuccess();
    }
  }, [isAuthenticated, loading, handleLoginSuccess]);

  // Show loading state during authentication check
  if (loading) {
    return (
      <AuthLayout title="Signing In" subtitle="Please wait...">
        <div className="flex justify-center py-8">
          <AuthLoadingSpinner text="Checking authentication..." />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your 2LY account"
    >
      <div className="space-y-6">
        {/* Show intended destination if available */}
        {from && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              Please sign in to continue to your requested page.
            </p>
          </div>
        )}

        {/* Show preserved route indicator */}
        {hasPreservedRoute() && !from && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-700">
              You'll be redirected to your previous page after signing in.
            </p>
          </div>
        )}

        {/* Authentication error */}
        {error && (
          <AuthErrorMessage
            error={error}
            dismissible
            onDismiss={clearError}
          />
        )}

        {/* Login form */}
        <LoginForm
          onLoginSuccess={handleLoginSuccess}
        />

        {/* Register link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              state={{ from }}
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Sign up now
            </Link>
          </p>
        </div>

        {/* Additional help */}
        <div className="text-center border-t border-gray-200 pt-6">
          <div className="space-y-2">
            <p className="text-xs text-gray-500">
              Having trouble signing in?
            </p>
            <div className="space-x-2">
              <Link
                to="/forgot-password"
                className="text-xs text-blue-600 hover:text-blue-500"
              >
                Reset Password
              </Link>
              <span className="text-xs text-gray-300">|</span>
              <Link
                to="/support"
                className="text-xs text-blue-600 hover:text-blue-500"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}

export default LoginPage;