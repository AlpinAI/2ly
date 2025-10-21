/**
 * Authentication Context
 *
 * Provides authentication state management for the entire application.
 * Manages user authentication, system initialization, and token refresh.
 */

import { createContext } from 'react';
import { User } from '../graphql/auth.operations';

export type AuthState =
  | 'LOADING'
  | 'AUTHENTICATED'
  | 'UNAUTHENTICATED'
  | 'SYSTEM_INITIALIZING'
  | 'TOKEN_REFRESHING';

export interface AuthContextType {
  // Authentication state
  user: User | null;
  isAuthenticated: boolean;
  isSystemInitialized: boolean;
  authState: AuthState;
  loading: boolean;
  error: string | null;

  // Authentication actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initializeSystem: (name: string, email: string, password: string) => Promise<void>;
  refreshToken: () => Promise<void>;

  // Utility methods
  clearError: () => void;
  checkAuthentication: () => Promise<void>;
}

export const AuthenticationContext = createContext<AuthContextType | undefined>(undefined);