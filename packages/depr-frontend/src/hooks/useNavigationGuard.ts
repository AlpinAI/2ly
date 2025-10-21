/**
 * useNavigationGuard Hook
 *
 * Custom hook for programmatic navigation with authentication checking.
 * Prevents unauthorized navigation and provides navigation event handling.
 */

import { useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthentication } from '../contexts/useAuthentication';
import { useWorkspace } from '../contexts/useWorkspace';
import {
  isProtectedRoute,
  isPublicRoute,
  isSystemInitRoute,
  sanitizeRedirectPath
} from '../utils/route.utils';
import { useRoutePreservation } from './useRoutePreservation';

export type NavigationListener = (
  from: string,
  to: string,
  allowed: boolean
) => void;

export interface NavigationGuardHook {
  canNavigateTo: (path: string) => boolean;
  navigateWithGuard: (path: string, options?: { replace?: boolean }) => Promise<boolean>;
  addNavigationListener: (callback: NavigationListener) => () => void;
  getNavigationRules: () => NavigationRules;
}

interface NavigationRules {
  isAuthenticated: boolean;
  isSystemInitialized: boolean;
  hasWorkspace: boolean;
  loading: boolean;
}

/**
 * Hook for secure programmatic navigation with authentication guards
 */
export function useNavigationGuard(): NavigationGuardHook {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isSystemInitialized, loading: authLoading } = useAuthentication();
  const { workspaces, loading: workspaceLoading } = useWorkspace();
  const { preserveRoute } = useRoutePreservation();

  const listenersRef = useRef<NavigationListener[]>([]);

  /**
   * Get current navigation rules for decision making
   */
  const getNavigationRules = useCallback((): NavigationRules => {
    return {
      isAuthenticated,
      isSystemInitialized,
      hasWorkspace: Boolean(workspaces && workspaces.length > 0),
      loading: authLoading || workspaceLoading
    };
  }, [isAuthenticated, isSystemInitialized, workspaces, authLoading, workspaceLoading]);

  /**
   * Check if navigation to a specific path is allowed
   */
  const canNavigateTo = useCallback((path: string): boolean => {
    const sanitizedPath = sanitizeRedirectPath(path);

    // Get current navigation rules
    const rules = getNavigationRules();

    // Allow navigation during loading states
    if (rules.loading) {
      return true;
    }

    // Check protected routes
    if (isProtectedRoute(sanitizedPath)) {
      if (!rules.isAuthenticated) {
        return false;
      }
      // Additional checks could be added here for role-based access
      return true;
    }

    // Check public-only routes (like login/register)
    if (isPublicRoute(sanitizedPath)) {
      // Authenticated users shouldn't access login/register pages
      return !rules.isAuthenticated;
    }

    // Check system initialization routes
    if (isSystemInitRoute(sanitizedPath)) {
      // Allow access if system needs initialization
      return !rules.isSystemInitialized || !rules.hasWorkspace;
    }

    // Allow access to other public routes
    return true;
  }, [getNavigationRules]);

  /**
   * Navigate with authentication guard checks
   */
  const navigateWithGuard = useCallback(async (
    path: string,
    options: { replace?: boolean } = {}
  ): Promise<boolean> => {
    const sanitizedPath = sanitizeRedirectPath(path);
    const currentPath = location.pathname;

    // Check if navigation is allowed
    const allowed = canNavigateTo(sanitizedPath);

    // Notify listeners
    listenersRef.current.forEach(listener => {
      try {
        listener(currentPath, sanitizedPath, allowed);
      } catch (error) {
        console.warn('Navigation listener error:', error);
      }
    });

    if (!allowed) {
      // Handle different types of blocked navigation
      if (isProtectedRoute(sanitizedPath) && !isAuthenticated) {
        // Preserve the intended destination and redirect to login
        preserveRoute(sanitizedPath);
        navigate('/login', { replace: true });
        return false;
      }

      if (isPublicRoute(sanitizedPath) && isAuthenticated) {
        // Redirect authenticated users away from login/register
        navigate('/', { replace: true });
        return false;
      }

      // Other blocked navigation scenarios
      console.warn(`Navigation to ${sanitizedPath} blocked by navigation guard`);
      return false;
    }

    // Navigation is allowed, proceed
    navigate(sanitizedPath, options);
    return true;
  }, [
    location.pathname,
    canNavigateTo,
    isAuthenticated,
    navigate,
    preserveRoute
  ]);

  /**
   * Add a navigation event listener
   */
  const addNavigationListener = useCallback((callback: NavigationListener): (() => void) => {
    listenersRef.current.push(callback);

    // Return cleanup function
    return () => {
      const index = listenersRef.current.indexOf(callback);
      if (index > -1) {
        listenersRef.current.splice(index, 1);
      }
    };
  }, []);

  // Log navigation events in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const cleanup = addNavigationListener((from, to, allowed) => {
        console.log('Navigation Guard:', {
          from,
          to,
          allowed,
          rules: getNavigationRules()
        });
      });

      return cleanup;
    }
  }, [addNavigationListener, getNavigationRules]);

  return {
    canNavigateTo,
    navigateWithGuard,
    addNavigationListener,
    getNavigationRules
  };
}

export default useNavigationGuard;