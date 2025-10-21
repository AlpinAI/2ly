/**
 * usePostInitNavigation Hook
 *
 * Custom hook for managing navigation after system initialization.
 * Handles automatic authentication with newly created admin account,
 * proper route coordination, and deep-link preservation.
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthentication } from '../contexts/useAuthentication';
import { InitializationResult } from '../services/system.service';

export interface PostInitNavigationOptions {
  /**
   * Default route to navigate to after initialization
   * @default '/dashboard'
   */
  defaultRoute?: string;

  /**
   * Whether to preserve the intended route from before initialization
   * @default true
   */
  preserveIntendedRoute?: boolean;

  /**
   * Routes that should be avoided after initialization (e.g., auth pages)
   * @default ['/login', '/register', '/welcome']
   */
  avoidRoutes?: string[];

  /**
   * Delay in milliseconds before navigation (for UX purposes)
   * @default 2000
   */
  navigationDelay?: number;
}

export interface PostInitNavigationHook {
  /**
   * Navigate after successful initialization
   * @param result Initialization result containing user data
   */
  navigateAfterInit: (result: InitializationResult) => Promise<void>;

  /**
   * Navigate to a specific route after initialization
   * @param route Target route
   */
  navigateToRoute: (route: string) => void;

  /**
   * Get the intended navigation target
   */
  getNavigationTarget: () => string;

  /**
   * Check if navigation is in progress
   */
  isNavigating: boolean;

  /**
   * Any navigation error that occurred
   */
  navigationError: string | null;
}

/**
 * Hook for managing navigation after system initialization
 */
export const usePostInitNavigation = (
  options: PostInitNavigationOptions = {}
): PostInitNavigationHook => {
  const {
    defaultRoute = '/dashboard',
    preserveIntendedRoute = true,
    avoidRoutes = ['/login', '/register', '/welcome', '/init'],
    navigationDelay = 2000,
  } = options;

  // Hooks
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, checkAuthentication } = useAuthentication();

  // State
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [navigationError, setNavigationError] = useState<string | null>(null);

  /**
   * Get the intended navigation target based on current context
   */
  const getNavigationTarget = useCallback((): string => {
    // Check for intended route in location state
    const intendedRoute = location.state?.from?.pathname;

    if (preserveIntendedRoute && intendedRoute) {
      // Don't navigate to avoided routes
      if (!avoidRoutes.includes(intendedRoute)) {
        return intendedRoute;
      }
    }

    // Check URL parameters for redirect
    const urlParams = new URLSearchParams(location.search);
    const redirectParam = urlParams.get('redirect');

    if (redirectParam && !avoidRoutes.includes(redirectParam)) {
      return redirectParam;
    }

    // Use default route
    return defaultRoute;
  }, [location, preserveIntendedRoute, avoidRoutes, defaultRoute]);

  /**
   * Navigate to a specific route with error handling
   */
  const navigateToRoute = useCallback((route: string) => {
    try {
      setNavigationError(null);
      setIsNavigating(true);

      // Use replace to avoid back button issues
      navigate(route, { replace: true });

      // Clear navigation state after a delay
      setTimeout(() => {
        setIsNavigating(false);
      }, 500);
    } catch (error) {
      console.error('Navigation failed:', error);
      setNavigationError(error instanceof Error ? error.message : 'Navigation failed');
      setIsNavigating(false);
    }
  }, [navigate]);

  /**
   * Navigate after successful initialization with automatic authentication
   */
  const navigateAfterInit = useCallback(
    async (result: InitializationResult): Promise<void> => {
      try {
        setIsNavigating(true);
        setNavigationError(null);

        // The initialization result should already have authenticated the user
        // through the auth service, but we'll verify the authentication state
        if (!result.success) {
          throw new Error('Initialization was not successful');
        }

        if (!result.user) {
          throw new Error('No user data available after initialization');
        }

        // Wait for authentication context to update
        // The AuthenticationProvider should have already handled the token storage
        // and user state update, but we'll give it a moment to settle
        await new Promise(resolve => setTimeout(resolve, 500));

        // Verify authentication state
        try {
          await checkAuthentication();
        } catch (authError) {
          console.warn('Authentication check failed after initialization:', authError);
          // Don't fail the navigation for this - the user should still be authenticated
        }

        // Determine target route
        const targetRoute = getNavigationTarget();

        // Add a delay for better UX (shows success state)
        setTimeout(() => {
          navigateToRoute(targetRoute);
        }, navigationDelay);

      } catch (error) {
        console.error('Post-initialization navigation failed:', error);
        const errorMessage = error instanceof Error
          ? error.message
          : 'Failed to navigate after initialization';

        setNavigationError(errorMessage);
        setIsNavigating(false);

        // Fallback navigation after a delay
        setTimeout(() => {
          try {
            navigateToRoute(defaultRoute);
          } catch (fallbackError) {
            console.error('Fallback navigation also failed:', fallbackError);
          }
        }, 3000);
      }
    },
    [checkAuthentication, getNavigationTarget, navigateToRoute, navigationDelay, defaultRoute]
  );

  /**
   * Handle authentication state changes
   */
  useEffect(() => {
    // If user becomes authenticated during initialization flow,
    // we might need to handle this scenario
    if (isAuthenticated && user && isNavigating) {
      // Authentication completed successfully during navigation
      console.log('Authentication confirmed during post-init navigation');
    }
  }, [isAuthenticated, user, isNavigating]);

  /**
   * Cleanup navigation state on unmount
   */
  useEffect(() => {
    return () => {
      setIsNavigating(false);
      setNavigationError(null);
    };
  }, []);

  return {
    navigateAfterInit,
    navigateToRoute,
    getNavigationTarget,
    isNavigating,
    navigationError,
  };
};

/**
 * Hook for handling navigation from initialization states
 * Simplified version for specific initialization flows
 */
export const useInitializationNavigation = (): {
  navigateToApp: () => void;
  navigateToLogin: () => void;
  navigateToWelcome: () => void;
  isNavigating: boolean;
} => {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

  const createNavigationHandler = useCallback(
    (route: string) => () => {
      setIsNavigating(true);
      navigate(route, { replace: true });
      setTimeout(() => setIsNavigating(false), 500);
    },
    [navigate]
  );

  return {
    navigateToApp: createNavigationHandler('/dashboard'),
    navigateToLogin: createNavigationHandler('/login'),
    navigateToWelcome: createNavigationHandler('/welcome'),
    isNavigating,
  };
};

/**
 * Hook for deep link preservation during initialization
 */
export const useDeepLinkPreservation = (): {
  preserveCurrentLocation: () => void;
  getPreservedLocation: () => string | null;
  clearPreservedLocation: () => void;
} => {
  const location = useLocation();
  const [preservedLocation, setPreservedLocation] = useState<string | null>(null);

  const preserveCurrentLocation = useCallback(() => {
    const currentPath = location.pathname + location.search + location.hash;
    setPreservedLocation(currentPath);

    // Also store in session storage for persistence across page reloads
    try {
      sessionStorage.setItem('preserved_location', currentPath);
    } catch (error) {
      console.warn('Failed to store preserved location:', error);
    }
  }, [location]);

  const getPreservedLocation = useCallback(() => {
    // First check state
    if (preservedLocation) {
      return preservedLocation;
    }

    // Then check session storage
    try {
      return sessionStorage.getItem('preserved_location');
    } catch (error) {
      console.warn('Failed to retrieve preserved location:', error);
      return null;
    }
  }, [preservedLocation]);

  const clearPreservedLocation = useCallback(() => {
    setPreservedLocation(null);
    try {
      sessionStorage.removeItem('preserved_location');
    } catch (error) {
      console.warn('Failed to clear preserved location:', error);
    }
  }, []);

  // Load preserved location on mount
  useEffect(() => {
    const preserved = getPreservedLocation();
    if (preserved && !preservedLocation) {
      setPreservedLocation(preserved);
    }
  }, [getPreservedLocation, preservedLocation]);

  return {
    preserveCurrentLocation,
    getPreservedLocation,
    clearPreservedLocation,
  };
};