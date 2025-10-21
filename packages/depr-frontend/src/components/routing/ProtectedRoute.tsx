/**
 * ProtectedRoute Component
 *
 * Wrapper component for routes requiring authentication.
 * Redirects unauthenticated users to login with deep-link preservation.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthentication } from '../../contexts/useAuthentication';
import { useWorkspace } from '../../contexts/useWorkspace';
import { useRoutePreservation } from '../../hooks/useRoutePreservation';
import { AuthLoadingSpinner } from '../auth';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ComponentType;
  requireWorkspace?: boolean;
  redirectTo?: string;
}

/**
 * Route wrapper that ensures user is authenticated before rendering children.
 * Handles loading states and preserves deep-links during authentication redirects.
 */
export function ProtectedRoute({
  children,
  fallback: FallbackComponent,
  requireWorkspace = false,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { isAuthenticated, loading: authLoading, authState } = useAuthentication();
  const { workspaces, loading: workspaceLoading, error: workspaceError } = useWorkspace();
  const { preserveCurrentRoute } = useRoutePreservation();
  const location = useLocation();

  // Show loading state while authentication status is being determined
  if (authLoading || authState === 'TOKEN_REFRESHING') {
    if (FallbackComponent) {
      return <FallbackComponent />;
    }
    return (
      <div className="flex items-center justify-center min-h-screen">
        <AuthLoadingSpinner text="Checking authentication..." />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Preserve the current route for post-login redirect
    preserveCurrentRoute();

    return (
      <Navigate
        to={redirectTo}
        state={{ from: location }}
        replace
      />
    );
  }

  // Handle workspace requirement if specified
  if (requireWorkspace) {
    // Show loading while workspace data is being fetched
    if (workspaceLoading) {
      if (FallbackComponent) {
        return <FallbackComponent />;
      }
      return (
        <div className="flex items-center justify-center min-h-screen">
          <AuthLoadingSpinner text="Loading workspace..." />
        </div>
      );
    }

    // Handle workspace error
    if (workspaceError) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-500 mb-4">Workspace Error</div>
            <div className="text-gray-600">{workspaceError}</div>
          </div>
        </div>
      );
    }

    // Redirect to welcome if no workspaces available
    if (!workspaces || workspaces.length === 0) {
      return <Navigate to="/welcome" replace />;
    }
  }

  // Render protected content
  return <>{children}</>;
}

export default ProtectedRoute;