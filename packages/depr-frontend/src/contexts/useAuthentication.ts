/**
 * useAuthentication Hook
 *
 * Custom hook for consuming the authentication context.
 * Provides type-safe access to authentication state and methods.
 */

import { useContext } from 'react';
import { AuthenticationContext, AuthContextType } from './AuthenticationContext';

/**
 * Hook to access authentication context
 * @throws Error if used outside of AuthenticationProvider
 * @returns Authentication context with state and methods
 */
export function useAuthentication(): AuthContextType {
  const context = useContext(AuthenticationContext);

  if (context === undefined) {
    throw new Error(
      'useAuthentication must be used within an AuthenticationProvider. ' +
      'Make sure you have wrapped your component tree with <AuthenticationProvider>.'
    );
  }

  return context;
}

/**
 * Hook to check if user is authenticated
 * @returns True if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuthentication();
  return isAuthenticated;
}

/**
 * Hook to get current user data
 * @returns Current user or null if not authenticated
 */
export function useCurrentUser() {
  const { user } = useAuthentication();
  return user;
}

/**
 * Hook to check if system is initialized
 * @returns True if system is initialized
 */
export function useIsSystemInitialized(): boolean {
  const { isSystemInitialized } = useAuthentication();
  return isSystemInitialized;
}

/**
 * Hook to get authentication loading state
 * @returns True if authentication operations are loading
 */
export function useAuthLoading(): boolean {
  const { loading } = useAuthentication();
  return loading;
}

/**
 * Hook to get authentication error
 * @returns Current authentication error or null
 */
export function useAuthError(): string | null {
  const { error } = useAuthentication();
  return error;
}