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
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { resetApolloCache } from '@/lib/apollo/client';

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

  // Load auth state from localStorage on mount
  useEffect(() => {
    try {
      const storedTokens = localStorage.getItem(STORAGE_KEY_TOKENS);
      const storedUser = localStorage.getItem(STORAGE_KEY_USER);

      if (storedTokens && storedUser) {
        setTokens(JSON.parse(storedTokens));
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to load auth state:', error);
      // Clear invalid data
      localStorage.removeItem(STORAGE_KEY_TOKENS);
      localStorage.removeItem(STORAGE_KEY_USER);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Login function - saves tokens and user data
   */
  const login = (newTokens: AuthTokens, newUser: User) => {
    setTokens(newTokens);
    setUser(newUser);

    // Persist to localStorage
    localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(newTokens));
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));

    // Navigate to dashboard
    navigate('/dashboard');
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
