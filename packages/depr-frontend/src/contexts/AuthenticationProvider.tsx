/**
 * Authentication Provider
 *
 * Provides authentication state management throughout the application.
 * Handles automatic token refresh, system initialization checks, and coordinates
 * with the workspace context for user workspace access.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AuthenticationContext, AuthContextType, AuthState } from './AuthenticationContext';
import { AuthService, AuthenticationError } from '../services/auth.service';
import { tokenService } from '../services/token.service';
import { User } from '../graphql/auth.operations';
import { formatAuthError } from '../utils/auth.utils';

interface AuthenticationProviderProps {
  children: React.ReactNode;
  authService: AuthService;
}

export const AuthenticationProvider: React.FC<AuthenticationProviderProps> = ({
  children,
  authService,
}) => {
  // State management
  const [user, setUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>('LOADING');
  const [isSystemInitialized, setIsSystemInitialized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for managing automatic token refresh
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef<boolean>(false);
  const refreshAttemptCountRef = useRef<number>(0);
  const maxRefreshAttemptsRef = useRef<number>(3);

  // Derived state
  const isAuthenticated = authState === 'AUTHENTICATED' && user !== null;
  const loading = authState === 'LOADING' || authState === 'TOKEN_REFRESHING' || authState === 'SYSTEM_INITIALIZING';

  /**
   * Clear any existing error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Handle token refresh with error handling
   */
  const handleTokenRefresh = useCallback(async (): Promise<void> => {
    if (isRefreshingRef.current) {
      return; // Prevent concurrent refresh attempts
    }

    isRefreshingRef.current = true;
    setAuthState('TOKEN_REFRESHING');

    try {
      const newAccessToken = await authService.refreshToken();

      // Fetch updated user data with new token
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setAuthState('AUTHENTICATED');

      // Reset retry counter on success
      refreshAttemptCountRef.current = 0;

      // Schedule next refresh
      const timeUntilExpiry = tokenService.getTimeUntilExpiration(newAccessToken);
      const refreshTime = Math.max(0, timeUntilExpiry - 300000);

      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = setTimeout(async () => {
        if (!isRefreshingRef.current) {
          await handleTokenRefresh();
        }
      }, refreshTime);
    } catch (error) {
      console.error('Token refresh failed:', error);

      if (error instanceof AuthenticationError && error.code === 'NO_REFRESH_TOKEN') {
        // No refresh token available - user needs to login again
        setAuthState('UNAUTHENTICATED');
        setUser(null);
      } else {
        // Network or server error - implement exponential backoff
        refreshAttemptCountRef.current += 1;

        if (refreshAttemptCountRef.current >= maxRefreshAttemptsRef.current) {
          // Max attempts reached - force logout
          console.error('Max token refresh attempts reached, forcing logout');
          setAuthState('UNAUTHENTICATED');
          setUser(null);
          setError('Session expired. Please log in again.');
        } else {
          // Retry with exponential backoff
          const backoffDelay = Math.min(30000, 1000 * Math.pow(2, refreshAttemptCountRef.current)); // Max 30 seconds
          console.warn(`Token refresh failed, retrying in ${backoffDelay}ms (attempt ${refreshAttemptCountRef.current}/${maxRefreshAttemptsRef.current})`);

          setError('Session refresh failed. Retrying...');
          setAuthState('AUTHENTICATED'); // Keep user authenticated for now

          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
          }

          refreshTimeoutRef.current = setTimeout(async () => {
            if (!isRefreshingRef.current) {
              await handleTokenRefresh();
            }
          }, backoffDelay);
        }
      }
    } finally {
      isRefreshingRef.current = false;
    }
  }, [authService]);

  /**
   * Set up automatic token refresh
   */
  const scheduleTokenRefresh = useCallback(
    (accessToken: string) => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      const timeUntilExpiry = tokenService.getTimeUntilExpiration(accessToken);

      // Refresh token 5 minutes before expiry (300000ms)
      const refreshTime = Math.max(0, timeUntilExpiry - 300000);

      refreshTimeoutRef.current = setTimeout(async () => {
        if (!isRefreshingRef.current) {
          await handleTokenRefresh();
        }
      }, refreshTime);
    },
    [handleTokenRefresh]
  );

  /**
   * Publicly exposed token refresh method
   */
  const refreshToken = useCallback(async (): Promise<void> => {
    await handleTokenRefresh();
  }, [handleTokenRefresh]);

  /**
   * User login
   */
  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      try {
        clearError();
        setAuthState('LOADING');

        const result = await authService.login(email, password);

        if (result.success && result.user && result.accessToken) {
          setUser(result.user);
          setAuthState('AUTHENTICATED');

          // Set up automatic token refresh
          scheduleTokenRefresh(result.accessToken);
        } else {
          throw new AuthenticationError('Login failed');
        }
      } catch (error) {
        console.error('Login error:', error);
        setError(formatAuthError(error));
        setAuthState('UNAUTHENTICATED');
        setUser(null);
        throw error;
      }
    },
    [authService, clearError, scheduleTokenRefresh]
  );

  /**
   * User registration
   */
  const register = useCallback(
    async (email: string, password: string): Promise<void> => {
      try {
        clearError();
        setAuthState('LOADING');

        const result = await authService.register(email, password);

        if (result.success && result.user && result.accessToken) {
          setUser(result.user);
          setAuthState('AUTHENTICATED');

          // Set up automatic token refresh
          scheduleTokenRefresh(result.accessToken);
        } else {
          throw new AuthenticationError('Registration failed');
        }
      } catch (error) {
        console.error('Registration error:', error);
        setError(formatAuthError(error));
        setAuthState('UNAUTHENTICATED');
        setUser(null);
        throw error;
      }
    },
    [authService, clearError, scheduleTokenRefresh]
  );

  /**
   * User logout
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      // Clear refresh timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }

      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state regardless of server response
      setUser(null);
      setAuthState('UNAUTHENTICATED');
      clearError();
      isRefreshingRef.current = false;
    }
  }, [authService, clearError]);

  /**
   * System initialization
   */
  const initializeSystem = useCallback(
    async (email: string, password: string): Promise<void> => {
      try {
        clearError();
        setAuthState('SYSTEM_INITIALIZING');

        const result = await authService.initializeSystem(email, password);

        if (result.success && result.user && result.accessToken) {
          setUser(result.user);
          setIsSystemInitialized(true);
          setAuthState('AUTHENTICATED');

          // Set up automatic token refresh
          scheduleTokenRefresh(result.accessToken);
        } else {
          throw new AuthenticationError('System initialization failed');
        }
      } catch (error) {
        console.error('System initialization error:', error);
        setError(formatAuthError(error));
        setAuthState('UNAUTHENTICATED');
        throw error;
      }
    },
    [authService, clearError, scheduleTokenRefresh]
  );

  /**
   * Check authentication status and load user data
   */
  const checkAuthentication = useCallback(async (): Promise<void> => {
    try {
      setAuthState('LOADING');

      // Check if we have valid tokens
      if (!authService.isAuthenticated()) {
        // Try refresh token if available
        if (authService.canRefreshToken()) {
          try {
            const newAccessToken = await authService.refreshToken();
            scheduleTokenRefresh(newAccessToken);
          } catch (error) {
            console.log('Token refresh failed during authentication check:', error);
            setAuthState('UNAUTHENTICATED');
            return;
          }
        } else {
          setAuthState('UNAUTHENTICATED');
          return;
        }
      }

      // Fetch current user data
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setAuthState('AUTHENTICATED');

      // Set up token refresh for existing token
      const accessToken = tokenService.getAccessToken();
      if (accessToken) {
        scheduleTokenRefresh(accessToken);
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      setAuthState('UNAUTHENTICATED');
      setUser(null);
    }
  }, [authService, scheduleTokenRefresh]);

  /**
   * Check system initialization status
   */
  const checkSystemStatus = useCallback(async (): Promise<void> => {
    try {
      const status = await authService.checkSystemStatus();
      setIsSystemInitialized(status.initialized);
    } catch (error) {
      console.error('System status check failed:', error);
      // Default to uninitialized on error
      setIsSystemInitialized(false);
    }
  }, [authService]);

  /**
   * Initialize authentication state on mount
   */
  useEffect(() => {
    const initializeAuth = async () => {
      // First check system status
      await checkSystemStatus();

      // Then check authentication
      await checkAuthentication();
    };

    initializeAuth();
  }, [checkSystemStatus, checkAuthentication]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Context value
  const contextValue: AuthContextType = {
    // State
    user,
    isAuthenticated,
    isSystemInitialized,
    authState,
    loading,
    error,

    // Actions
    login,
    register,
    logout,
    initializeSystem,
    refreshToken,

    // Utilities
    clearError,
    checkAuthentication,
  };

  return (
    <AuthenticationContext.Provider value={contextValue}>
      {children}
    </AuthenticationContext.Provider>
  );
};