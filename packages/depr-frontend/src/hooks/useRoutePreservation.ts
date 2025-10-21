/**
 * useRoutePreservation Hook
 *
 * Custom hook for managing deep-link preservation during authentication flows.
 * Stores and retrieves intended routes across login/logout cycles.
 */

import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  sanitizeRedirectPath,
  createUrlWithParams,
  getDefaultAuthenticatedPath,
  isProtectedRoute,
  isPublicRoute,
  isSystemInitRoute
} from '../utils/route.utils';

const PRESERVED_ROUTE_KEY = '2ly_preserved_route';
const STORAGE_TYPE = 'sessionStorage'; // Use sessionStorage for better security

export interface RoutePreservationHook {
  preserveCurrentRoute: () => void;
  preserveRoute: (path: string) => void;
  getPreservedRoute: () => string | null;
  clearPreservedRoute: () => void;
  redirectToPreservedRoute: (fallback?: string) => void;
  hasPreservedRoute: () => boolean;
}

/**
 * Hook for managing route preservation during authentication flows
 */
export function useRoutePreservation(): RoutePreservationHook {
  const location = useLocation();
  const navigate = useNavigate();

  /**
   * Clear the preserved route from storage
   */
  const clearPreservedRoute = useCallback(() => {
    try {
      if (STORAGE_TYPE === 'sessionStorage' && window.sessionStorage) {
        window.sessionStorage.removeItem(PRESERVED_ROUTE_KEY);
      } else if (window.localStorage) {
        window.localStorage.removeItem(PRESERVED_ROUTE_KEY);
      }
    } catch (error) {
      console.warn('Failed to clear preserved route:', error);
    }
  }, []);

  /**
   * Store a specific route for later restoration
   */
  const preserveRoute = useCallback((path: string) => {
    // Only preserve routes that should be preserved
    if (!shouldPreserveRoute(path)) {
      return;
    }

    const sanitizedPath = sanitizeRedirectPath(path);

    try {
      if (STORAGE_TYPE === 'sessionStorage' && window.sessionStorage) {
        window.sessionStorage.setItem(PRESERVED_ROUTE_KEY, sanitizedPath);
      } else if (window.localStorage) {
        window.localStorage.setItem(PRESERVED_ROUTE_KEY, sanitizedPath);
      }
    } catch (error) {
      // Storage might be disabled or full, silently fail
      console.warn('Failed to preserve route:', error);
    }
  }, []);

  /**
   * Retrieve the preserved route
   */
  const getPreservedRoute = useCallback((): string | null => {
    try {
      let preservedRoute: string | null = null;

      if (STORAGE_TYPE === 'sessionStorage' && window.sessionStorage) {
        preservedRoute = window.sessionStorage.getItem(PRESERVED_ROUTE_KEY);
      } else if (window.localStorage) {
        preservedRoute = window.localStorage.getItem(PRESERVED_ROUTE_KEY);
      }

      if (!preservedRoute) {
        return null;
      }

      // Validate and sanitize the preserved route
      const sanitized = sanitizeRedirectPath(preservedRoute);

      // Make sure it's still a valid route to preserve
      if (!shouldPreserveRoute(sanitized)) {
        clearPreservedRoute();
        return null;
      }

      return sanitized;
    } catch (error) {
      console.warn('Failed to get preserved route:', error);
      return null;
    }
  }, [clearPreservedRoute]);

  /**
   * Store the current route for later restoration
   */
  const preserveCurrentRoute = useCallback(() => {
    const currentPath = createUrlWithParams(
      location.pathname,
      location.search,
      location.hash
    );

    preserveRoute(currentPath);
  }, [location, preserveRoute]);

  /**
   * Navigate to the preserved route or fallback
   */
  const redirectToPreservedRoute = useCallback((fallback?: string) => {
    const preservedRoute = getPreservedRoute();

    if (preservedRoute) {
      clearPreservedRoute();
      navigate(preservedRoute, { replace: true });
      return;
    }

    // Use fallback or default path
    const defaultPath = fallback || getDefaultAuthenticatedPath();
    navigate(defaultPath, { replace: true });
  }, [navigate, getPreservedRoute, clearPreservedRoute]);

  /**
   * Check if there's a preserved route available
   */
  const hasPreservedRoute = useCallback((): boolean => {
    return getPreservedRoute() !== null;
  }, [getPreservedRoute]);

  return {
    preserveCurrentRoute,
    preserveRoute,
    getPreservedRoute,
    clearPreservedRoute,
    redirectToPreservedRoute,
    hasPreservedRoute
  };
}

/**
 * Determine if a route should be preserved during authentication
 */
function shouldPreserveRoute(path: string): boolean {
  // Don't preserve routes that don't make sense to return to
  if (isPublicRoute(path)) {
    return false;
  }

  if (isSystemInitRoute(path)) {
    return false;
  }

  // Only preserve protected routes that users would want to return to
  return isProtectedRoute(path);
}

export default useRoutePreservation;