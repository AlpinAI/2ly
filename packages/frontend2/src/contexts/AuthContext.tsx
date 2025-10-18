/**
 * Authentication Context
 *
 * WHY: Centralized authentication state management.
 * Provides user info, login status, and auth functions throughout the app.
 *
 * WHAT IT PROVIDES:
 * - Current user data
 * - Login/logout functions
 * - Authentication tokens (stored in localStorage)
 * - Loading states
 * - Automatic token validation and refresh on mount
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client/react';
import { resetApolloCache } from '@/lib/apollo/client';
import { getRedirectIntent, clearRedirectIntent } from '@/components/logic/protected-route';
import { isTokenExpired } from '@/lib/jwt';
import { RefreshTokenDocument } from '@/graphql/generated/graphql';

// ============================================================================
// Types
// ============================================================================

interface User {
  id: string;
  email: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (tokens: AuthTokens, user: User) => void;
  logout: () => Promise<void>;
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

const STORAGE_KEY_TOKENS = '2ly_auth_tokens';
const STORAGE_KEY_USER = '2ly_auth_user';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Refresh token mutation
  const [refreshTokenMutation] = useMutation<{
    refreshToken: {
      success: boolean;
      accessToken?: string;
      errors?: string[];
    };
  }>(RefreshTokenDocument);

  // Load auth state from localStorage on mount and validate tokens
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedTokens = localStorage.getItem(STORAGE_KEY_TOKENS);
        const storedUser = localStorage.getItem(STORAGE_KEY_USER);

        if (!storedTokens || !storedUser) {
          setIsLoading(false);
          return;
        }

        const parsedTokens = JSON.parse(storedTokens) as AuthTokens;
        const parsedUser = JSON.parse(storedUser) as User;

        // Check if access token is expired
        if (isTokenExpired(parsedTokens.accessToken)) {
          console.log('Access token expired, attempting refresh...');

          // Try to refresh the token
          try {
            const result = await refreshTokenMutation({
              variables: {
                input: {
                  refreshToken: parsedTokens.refreshToken,
                },
              },
            });

            if (result.data?.refreshToken.success && result.data.refreshToken.accessToken) {
              // Update tokens with new access token
              const newTokens: AuthTokens = {
                accessToken: result.data.refreshToken.accessToken,
                refreshToken: parsedTokens.refreshToken,
              };

              setTokens(newTokens);
              setUser(parsedUser);

              // Persist updated tokens
              localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(newTokens));
              console.log('Token refresh successful');
            } else {
              // Refresh failed, clear auth state
              console.warn('Token refresh failed:', result.data?.refreshToken.errors);
              localStorage.removeItem(STORAGE_KEY_TOKENS);
              localStorage.removeItem(STORAGE_KEY_USER);
            }
          } catch (refreshError) {
            console.error('Token refresh error:', refreshError);
            // Clear invalid tokens
            localStorage.removeItem(STORAGE_KEY_TOKENS);
            localStorage.removeItem(STORAGE_KEY_USER);
          }
        } else {
          // Token is still valid, use it
          setTokens(parsedTokens);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Failed to load auth state:', error);
        // Clear invalid data
        localStorage.removeItem(STORAGE_KEY_TOKENS);
        localStorage.removeItem(STORAGE_KEY_USER);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [refreshTokenMutation]);

  /**
   * Login function - saves tokens and user data
   */
  const login = (newTokens: AuthTokens, newUser: User) => {
    setTokens(newTokens);
    setUser(newUser);

    // Persist to localStorage
    localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(newTokens));
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));

    // Check for redirect intent and navigate there, otherwise go to root (which redirects to default workspace)
    const redirectTo = getRedirectIntent() || '/';
    navigate(redirectTo);
  };

  /**
   * Logout function - clears all auth state
   */
  const logout = async () => {
    // Clear state
    setTokens(null);
    setUser(null);

    // Clear localStorage
    localStorage.removeItem(STORAGE_KEY_TOKENS);
    localStorage.removeItem(STORAGE_KEY_USER);

    // Clear any redirect intent
    clearRedirectIntent();

    // Clear Apollo cache to prevent data leaks
    await resetApolloCache();

    // Navigate to login
    navigate('/login');
  };

  const value: AuthContextType = {
    user,
    tokens,
    isAuthenticated: !!user && !!tokens,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * useAuth Hook
 *
 * WHY: Convenient access to auth context.
 * Throws error if used outside AuthProvider.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
