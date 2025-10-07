/**
 * RegisterPage Component
 *
 * Registration page that integrates with the authentication system.
 * Handles user registration and automatic authentication flow.
 */

import { useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthentication } from '../../contexts/useAuthentication';
import { useRoutePreservation } from '../../hooks/useRoutePreservation';
import { AuthLayout } from '../../components/layout/auth/AuthLayout';
import { RegisterForm, AuthLoadingSpinner, AuthErrorMessage } from '../../components/auth';

/**
 * Registration page with automatic authentication after signup
 */
export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, clearError, isAuthenticated } = useAuthentication();
  const { redirectToPreservedRoute, hasPreservedRoute } = useRoutePreservation();


  // Get the intended destination from location state
  const from = location.state?.from?.pathname || null;

  /**
   * Handle successful registration
   */
  const handleRegistrationSuccess = useCallback(() => {
    // Clear any authentication errors
    clearError();

    // Redirect to preserved route or default destination
    if (hasPreservedRoute()) {
      redirectToPreservedRoute('/welcome');
    } else if (from) {
      navigate(from, { replace: true });
    } else {
      // For new users, redirect to welcome/onboarding
      navigate('/welcome', { replace: true });
    }
  }, [clearError, hasPreservedRoute, redirectToPreservedRoute, from, navigate]);


  /**
   * Redirect if already authenticated
   */
  useEffect(() => {
    if (isAuthenticated && !loading) {
      handleRegistrationSuccess();
    }
  }, [isAuthenticated, loading, handleRegistrationSuccess]);

  // Show loading state during authentication check
  if (loading) {
    return (
      <AuthLayout title="Setting Up Account" subtitle="Please wait...">
        <div className="flex justify-center py-8">
          <AuthLoadingSpinner text="Checking authentication..." />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Join 2ly"
      subtitle="Create your account to get started"
    >
      <div className="space-y-6">
        {/* Welcome message */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">!</span>
              </div>
            </div>
            <div className="text-sm">
              <p className="text-blue-700 font-medium">Welcome to 2LY!</p>
              <p className="text-blue-600 mt-1">
                Create your account to start managing AI tools and workflows.
              </p>
            </div>
          </div>
        </div>

        {/* Show intended destination if available */}
        {from && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-700">
              After creating your account, you'll be redirected to your requested page.
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

        {/* Registration form */}
        <RegisterForm
          onRegistrationSuccess={handleRegistrationSuccess}
        />

        {/* Login link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              state={{ from }}
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Sign in instead
            </Link>
          </p>
        </div>

        {/* Terms and privacy */}
        <div className="text-center border-t border-gray-200 pt-6">
          <p className="text-xs text-gray-500">
            By creating an account, you agree to our{' '}
            <Link
              to="/terms"
              className="text-blue-600 hover:text-blue-500"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              to="/privacy"
              className="text-blue-600 hover:text-blue-500"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}

export default RegisterPage;