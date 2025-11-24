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

import { ReactNode, useEffect, useRef } from 'react';
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
  const prevIsAuthenticatedRef = useRef(isAuthenticated);

  // Save intended destination (including workspace) before redirecting to login
  // Uses previous auth state tracking to distinguish logout from bookmark scenarios
  useEffect(() => {
    const wasAuthenticated = prevIsAuthenticatedRef.current;
    const isNowAuthenticated = isAuthenticated;

    // Save intent: only if we're unauthenticated AND were already unauthenticated
    // This prevents saving during logout (authenticated -> unauthenticated transition)
    if (!isNowAuthenticated && !isLoading && location.pathname !== '/login') {
      if (!wasAuthenticated) {
        // We were already logged out, so this is a genuine intent to save (bookmark/shared link)
        const intendedPath = location.pathname + location.search;
        sessionStorage.setItem(INTENT_STORAGE_KEY, intendedPath);
      }
    } else if (isNowAuthenticated && !wasAuthenticated) {
      // Just logged in (unauthenticated -> authenticated transition)
      // Clear any stale intent from previous session
      clearRedirectIntent();
    }

    // Update ref for next render
    prevIsAuthenticatedRef.current = isAuthenticated;
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
