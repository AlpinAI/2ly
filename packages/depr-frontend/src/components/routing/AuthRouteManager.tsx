/**
 * AuthRouteManager Component
 *
 * High-level component coordinating all authentication-based routing logic.
 * Manages state transitions, route preservation, and coordinates with workspace context.
 */

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthentication } from '../../contexts/useAuthentication';
import { useWorkspace } from '../../contexts/useWorkspace';
import { useRoutePreservation } from '../../hooks/useRoutePreservation';
import { authNavigationMiddleware, AuthMiddlewareContext } from '../../middleware/auth.middleware';
import {
  isSystemInitRoute,
  sanitizeRedirectPath
} from '../../utils/route.utils';
import { AuthLoadingSpinner } from '../auth';

export interface AuthRouteManagerProps {
  children: React.ReactNode;
  debug?: boolean;
}

interface RouteTransition {
  from: string;
  to: string;
  timestamp: number;
  reason: string;
}

/**
 * Central routing coordinator that manages authentication-based navigation
 */
export function AuthRouteManager({
  children,
  debug = process.env.NODE_ENV === 'development'
}: AuthRouteManagerProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Authentication and workspace contexts
  const {
    isAuthenticated,
    isSystemInitialized,
    loading: authLoading,
    authState,
    error: authError
  } = useAuthentication();

  const {
    workspaces,
    system,
    runtimes,
    loading: workspaceLoading,
    error: workspaceError
  } = useWorkspace();

  // Route preservation
  const { getPreservedRoute, clearPreservedRoute } = useRoutePreservation();

  // State management
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [lastTransition, setLastTransition] = useState<RouteTransition | null>(null);
  const previousLocationRef = useRef<string>('');

  // Derived state
  const hasWorkspace = Boolean(workspaces && workspaces.length > 0);
  const hasAgentRuntime = Boolean(runtimes && runtimes.some(r => r.capabilities?.includes('agent')));
  // System initialization only requires the system to be marked as initialized
  // Agent runtime creation is a separate post-initialization step
  const needsSystemInit = !system?.initialized;

  const loading = authLoading || workspaceLoading || authState === 'TOKEN_REFRESHING';

  // Create middleware context
  const middlewareContext: AuthMiddlewareContext = useMemo(() => ({
    isAuthenticated,
    isSystemInitialized: isSystemInitialized && !needsSystemInit,
    hasWorkspace,
    loading,
    navigate,
    location
  }), [isAuthenticated, isSystemInitialized, needsSystemInit, hasWorkspace, loading, navigate, location]);

  /**
   * Handle route validation and redirection
   */
  useEffect(() => {
    const currentPath = location.pathname;
    const sanitizedPath = sanitizeRedirectPath(currentPath);

    // Skip validation during loading states to prevent flickering
    if (loading) {
      return;
    }

    // Track route transitions for debugging
    if (previousLocationRef.current && previousLocationRef.current !== currentPath) {
      const transition: RouteTransition = {
        from: previousLocationRef.current,
        to: currentPath,
        timestamp: Date.now(),
        reason: 'Route change detected'
      };
      setLastTransition(transition);

      if (debug) {
        console.log('AuthRouteManager: Route transition', transition);
      }
    }
    previousLocationRef.current = currentPath;

    // Apply authentication middleware
    const middlewareResult = authNavigationMiddleware(sanitizedPath, middlewareContext);

    if (!middlewareResult.allowed && middlewareResult.redirectTo) {
      const transition: RouteTransition = {
        from: currentPath,
        to: middlewareResult.redirectTo,
        timestamp: Date.now(),
        reason: middlewareResult.reason || 'Authentication middleware redirect'
      };

      setLastTransition(transition);

      if (debug) {
        console.log('AuthRouteManager: Redirecting', {
          from: currentPath,
          to: middlewareResult.redirectTo,
          reason: middlewareResult.reason,
          context: middlewareContext
        });
      }

      navigate(middlewareResult.redirectTo, { replace: true });
      return;
    }

    // Handle initial load and preserved routes
    if (isInitialLoad && isAuthenticated) {
      setIsInitialLoad(false);

      const preservedRoute = getPreservedRoute();
      if (preservedRoute && preservedRoute !== currentPath) {
        clearPreservedRoute();

        if (debug) {
          console.log('AuthRouteManager: Restoring preserved route', {
            from: currentPath,
            to: preservedRoute
          });
        }

        navigate(preservedRoute, { replace: true });
        return;
      }
    }

    // Handle system initialization flow
    if (isAuthenticated && needsSystemInit && !isSystemInitRoute(currentPath)) {
      if (debug) {
        console.log('AuthRouteManager: System initialization required', {
          system: system?.initialized,
          hasAgentRuntime,
          currentPath
        });
      }

      navigate('/welcome', { replace: true });
      return;
    }

    if (isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [
    location.pathname,
    loading,
    isAuthenticated,
    isSystemInitialized,
    hasWorkspace,
    hasAgentRuntime,
    middlewareContext,
    needsSystemInit,
    system,
    runtimes,
    isInitialLoad,
    navigate,
    getPreservedRoute,
    clearPreservedRoute,
    debug
  ]);

  /**
   * Handle authentication errors
   */
  useEffect(() => {
    if (authError && isAuthenticated) {
      // If there's an auth error but user appears authenticated,
      // this might indicate a token issue - redirect to login
      if (debug) {
        console.log('AuthRouteManager: Auth error detected', authError);
      }

      navigate('/login', { replace: true });
    }
  }, [authError, isAuthenticated, navigate, debug]);

  /**
   * Handle workspace errors
   */
  useEffect(() => {
    if (workspaceError && isAuthenticated) {
      if (debug) {
        console.log('AuthRouteManager: Workspace error detected', workspaceError);
      }

      // Workspace errors might indicate system needs reinitialization
      if (!isSystemInitRoute(location.pathname)) {
        navigate('/welcome', { replace: true });
      }
    }
  }, [workspaceError, isAuthenticated, location.pathname, navigate, debug]);

  // Show loading state during initial authentication check
  if (isInitialLoad && loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <AuthLoadingSpinner text="Loading application..." />
      </div>
    );
  }

  // Show error state if there are critical errors
  if (authError && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">Authentication Error</div>
          <div className="text-gray-600 mb-4">{authError}</div>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show workspace error state
  if (workspaceError && isAuthenticated && !workspaceLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">System Error</div>
          <div className="text-gray-600 mb-4">{workspaceError}</div>
          <button
            onClick={() => navigate('/welcome', { replace: true })}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reinitialize System
          </button>
        </div>
      </div>
    );
  }

  // Render debug information in development
  if (debug && process.env.NODE_ENV === 'development') {
    const debugInfo = {
      location: location.pathname,
      isAuthenticated,
      isSystemInitialized,
      hasWorkspace,
      loading,
      needsSystemInit,
      lastTransition,
      middlewareContext
    };

    // Add debug overlay (non-intrusive)
    setTimeout(() => {
      if (window.authRouteManagerDebug) {
        window.authRouteManagerDebug = debugInfo;
      } else {
        window.authRouteManagerDebug = debugInfo;
        console.log('AuthRouteManager debug info available at window.authRouteManagerDebug');
      }
    }, 0);
  }

  return <>{children}</>;
}

// Debug information interface
interface AuthRouteManagerDebugInfo {
  location: string;
  isAuthenticated: boolean;
  isSystemInitialized: boolean;
  hasWorkspace: boolean;
  loading: boolean;
  needsSystemInit: boolean;
  lastTransition: RouteTransition | null;
  middlewareContext: AuthMiddlewareContext;
}

// Extend window for debugging
declare global {
  interface Window {
    authRouteManagerDebug?: AuthRouteManagerDebugInfo;
  }
}

export default AuthRouteManager;