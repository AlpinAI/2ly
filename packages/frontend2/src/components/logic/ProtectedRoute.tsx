/**
 * ProtectedRoute Component
 *
 * WHY: Handles authentication checks for protected routes.
 * System initialization is checked at the app level by SystemInitChecker.
 *
 * FLOW:
 * 1. Check if user is authenticated -> redirect to /login if not
 * 2. Preserve intended destination for post-login redirect
 */

import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

const INTENT_STORAGE_KEY = '2ly_redirect_intent';

export function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Save intended destination (including workspace) before redirecting to login
  useEffect(() => {
    if (!isAuthenticated && !isLoading && location.pathname !== '/login') {
      // Store full path including workspace ID for post-login redirect
      const intendedPath = location.pathname + location.search;
      sessionStorage.setItem(INTENT_STORAGE_KEY, intendedPath);
    }
  }, [isAuthenticated, isLoading, location]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated, render children
  return <>{children}</>;
}

/**
 * Get and clear the stored redirect intent
 */
export function getRedirectIntent(): string | null {
  const intent = sessionStorage.getItem(INTENT_STORAGE_KEY);
  if (intent) {
    sessionStorage.removeItem(INTENT_STORAGE_KEY);
  }
  return intent;
}

/**
 * Clear the stored redirect intent
 */
export function clearRedirectIntent(): void {
  sessionStorage.removeItem(INTENT_STORAGE_KEY);
}
