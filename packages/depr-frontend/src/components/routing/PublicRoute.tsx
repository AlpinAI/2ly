/**
 * PublicRoute Component
 *
 * Wrapper for routes that should only be accessible to unauthenticated users.
 * Redirects authenticated users to the main application.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthentication } from '../../contexts/useAuthentication';
import { useRoutePreservation } from '../../hooks/useRoutePreservation';
import { AuthLoadingSpinner } from '../auth';

export interface PublicRouteProps {
  children: React.ReactNode;
  redirectAuthenticated?: boolean;
  redirectTo?: string;
}

/**
 * Route wrapper for public-only routes (login, register, landing).
 * Optionally redirects authenticated users away from these routes.
 */
export function PublicRoute({
  children,
  redirectAuthenticated = false,
  redirectTo
}: PublicRouteProps) {
  const { isAuthenticated, loading, authState } = useAuthentication();
  const { getPreservedRoute, clearPreservedRoute } = useRoutePreservation();

  // Show loading state while authentication status is being determined
  if (loading || authState === 'TOKEN_REFRESHING') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <AuthLoadingSpinner text="Loading..." />
      </div>
    );
  }

  // Redirect authenticated users if specified
  if (isAuthenticated && redirectAuthenticated) {
    // Check for preserved route first
    const preservedRoute = getPreservedRoute();
    if (preservedRoute) {
      // Clear the preserved route and redirect to it
      clearPreservedRoute();
      return <Navigate to={preservedRoute} replace />;
    }

    // Use custom redirect destination or default to main app
    const destination = redirectTo || '/';
    return <Navigate to={destination} replace />;
  }

  // Render public content
  return <>{children}</>;
}

export default PublicRoute;