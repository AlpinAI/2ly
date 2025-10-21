/**
 * Authentication Middleware
 *
 * Navigation middleware functions for React Router integration.
 * Provides centralized authentication and authorization logic.
 */

import { NavigateFunction, Location } from 'react-router-dom';
import {
  isProtectedRoute,
  isPublicRoute,
  isSystemInitRoute,
  sanitizeRedirectPath,
  getDefaultAuthenticatedPath,
  getDefaultUnauthenticatedPath
} from '../utils/route.utils';

export interface AuthMiddlewareContext {
  isAuthenticated: boolean;
  isSystemInitialized: boolean;
  hasWorkspace: boolean;
  loading: boolean;
  navigate: NavigateFunction;
  location: Location;
}

export interface NavigationResult {
  allowed: boolean;
  redirectTo?: string;
  reason?: string;
}

/**
 * Main authentication middleware that checks route access
 */
export function authNavigationMiddleware(
  targetPath: string,
  context: AuthMiddlewareContext
): NavigationResult {
  const { isAuthenticated, isSystemInitialized, hasWorkspace, loading } = context;
  const sanitizedPath = sanitizeRedirectPath(targetPath);

  // Allow all navigation during loading states to prevent flickering
  if (loading) {
    return { allowed: true };
  }

  // PRIORITY 1: Check if system needs initialization (highest priority)
  if (!isSystemInitialized) {
    // Allow access to system init routes when system is not initialized
    if (isSystemInitRoute(sanitizedPath)) {
      return { allowed: true };
    }

    // Redirect all other routes to welcome page when system is not initialized
    return {
      allowed: false,
      redirectTo: '/welcome',
      reason: 'System initialization required'
    };
  }

  // PRIORITY 2: Handle protected routes (after system is initialized)
  if (isProtectedRoute(sanitizedPath)) {
    if (!isAuthenticated) {
      return {
        allowed: false,
        redirectTo: getDefaultUnauthenticatedPath(),
        reason: 'Authentication required'
      };
    }

    // Additional workspace requirement check for certain protected routes
    if (requiresWorkspace(sanitizedPath) && !hasWorkspace) {
      return {
        allowed: false,
        redirectTo: '/welcome',
        reason: 'Workspace setup required'
      };
    }

    return { allowed: true };
  }

  // Handle public-only routes (login, register)
  if (isPublicRoute(sanitizedPath)) {
    if (isAuthenticated) {
      return {
        allowed: false,
        redirectTo: getDefaultAuthenticatedPath(),
        reason: 'Already authenticated'
      };
    }

    return { allowed: true };
  }

  // Handle system initialization routes
  if (isSystemInitRoute(sanitizedPath)) {
    if (isSystemInitialized && hasWorkspace) {
      return {
        allowed: false,
        redirectTo: getDefaultAuthenticatedPath(),
        reason: 'System already initialized'
      };
    }

    return { allowed: true };
  }

  // Allow access to other routes (landing, etc.)
  return { allowed: true };
}

/**
 * Middleware for handling route changes
 */
export function routeChangeMiddleware(
  targetPath: string,
  context: AuthMiddlewareContext
): void {
  const result = authNavigationMiddleware(targetPath, context);

  if (!result.allowed && result.redirectTo) {
    context.navigate(result.redirectTo, { replace: true });
  }

  // Log navigation events in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Auth Middleware:', {
      targetPath,
      result,
      context: {
        isAuthenticated: context.isAuthenticated,
        isSystemInitialized: context.isSystemInitialized,
        hasWorkspace: context.hasWorkspace,
        loading: context.loading
      }
    });
  }
}

/**
 * Check if a route requires workspace setup
 */
function requiresWorkspace(path: string): boolean {
  // Most protected routes require a workspace
  const workspaceExemptRoutes = [
    '/settings', // Settings might be accessible without workspace
  ];

  return !workspaceExemptRoutes.some(route => path.startsWith(route));
}

/**
 * Create navigation guard function for React Router
 */
export function createNavigationGuard(context: AuthMiddlewareContext) {
  return (targetPath: string): boolean => {
    const result = authNavigationMiddleware(targetPath, context);

    if (!result.allowed && result.redirectTo) {
      // Perform redirect
      context.navigate(result.redirectTo, { replace: true });
      return false;
    }

    return result.allowed;
  };
}

/**
 * Higher-order function to create route-specific middleware
 */
export function createRouteMiddleware(
  routePattern: string,
  requireAuth = true,
  requireWorkspace = false
) {
  return (targetPath: string, context: AuthMiddlewareContext): NavigationResult => {
    const { isAuthenticated, hasWorkspace } = context;

    // Check if this middleware applies to the target path
    if (!targetPath.startsWith(routePattern)) {
      return { allowed: true };
    }

    // Apply authentication requirement
    if (requireAuth && !isAuthenticated) {
      return {
        allowed: false,
        redirectTo: getDefaultUnauthenticatedPath(),
        reason: 'Authentication required for this route'
      };
    }

    // Apply workspace requirement
    if (requireWorkspace && !hasWorkspace) {
      return {
        allowed: false,
        redirectTo: '/welcome',
        reason: 'Workspace required for this route'
      };
    }

    return { allowed: true };
  };
}

/**
 * Compose multiple middleware functions
 */
export function composeMiddleware(
  middlewares: Array<(path: string, context: AuthMiddlewareContext) => NavigationResult>
) {
  return (targetPath: string, context: AuthMiddlewareContext): NavigationResult => {
    for (const middleware of middlewares) {
      const result = middleware(targetPath, context);
      if (!result.allowed) {
        return result;
      }
    }

    return { allowed: true };
  };
}

// Pre-configured middleware instances
export const adminRouteMiddleware = createRouteMiddleware('/admin', true, true);
export const settingsRouteMiddleware = createRouteMiddleware('/settings', true, false);
export const dashboardRouteMiddleware = createRouteMiddleware('/dashboard', true, true);