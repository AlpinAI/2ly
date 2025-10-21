/**
 * SystemInitRoute Component
 *
 * Wrapper for system initialization routes (welcome screen).
 * Checks system initialization status and redirects if already initialized.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthentication } from '../../contexts/useAuthentication';
import { useWorkspace } from '../../contexts/useWorkspace';
import { AuthLoadingSpinner } from '../auth';

export interface SystemInitRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Route wrapper for system initialization flow.
 * Ensures system setup is completed before accessing other parts of the app.
 */
export function SystemInitRoute({
  children,
  redirectTo = '/'
}: SystemInitRouteProps) {
  const { isSystemInitialized, loading: authLoading, authState } = useAuthentication();
  const { system, runtimes, loading: workspaceLoading, error } = useWorkspace();

  // Show loading state while checking system status
  if (authLoading || workspaceLoading || authState === 'TOKEN_REFRESHING') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <AuthLoadingSpinner text="Checking system status..." />
      </div>
    );
  }

  // Handle workspace loading error
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">System Error</div>
          <div className="text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  // Check if system initialization is needed
  const needsSystemInit = !system ||
                          !system.initialized ||
                          !runtimes ||
                          !runtimes.some(r => r.capabilities?.includes('agent'));

  // Redirect if system is already initialized and running
  if (isSystemInitialized && !needsSystemInit) {
    return <Navigate to={redirectTo} replace />;
  }

  // Render system initialization content
  return <>{children}</>;
}

export default SystemInitRoute;