/**
 * Authentication Service Layer
 *
 * Provides high-level authentication operations integrating with GraphQL backend.
 * Handles token management, user authentication, and system initialization.
 */

import { ApolloClient } from '@apollo/client/core';
import { tokenService, TokenService } from './token.service';
import {
  LOGIN_MUTATION,
  REGISTER_USER_MUTATION,
  REFRESH_TOKEN_MUTATION,
  LOGOUT_MUTATION,
  INIT_SYSTEM_MUTATION,
  ME_QUERY,
  SYSTEM_STATUS_QUERY,
  type LoginVariables,
  type RegisterUserVariables,
  type RefreshTokenVariables,
  type LogoutVariables,
  type InitSystemVariables,
  type LoginResponse,
  type RegisterUserResponse,
  type RefreshTokenResponse,
  type LogoutResponse,
  type InitSystemResponse,
  type MeResponse,
  type SystemStatusResponse,
  type User,
  type System,
} from '../graphql/auth.operations';

export interface AuthResult {
  success: boolean;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  errors?: string[];
}

export interface SystemStatus {
  initialized: boolean;
  system?: System;
}

export class AuthenticationError extends Error {
  public readonly code: string;
  public readonly details?: string[];

  constructor(message: string, code: string = 'AUTH_ERROR', details?: string[]) {
    super(message);
    this.name = 'AuthenticationError';
    this.code = code;
    this.details = details;
  }
}

export class AuthService {
  private apolloClient: ApolloClient<unknown>;
  private tokenService: TokenService;

  constructor(apolloClient: ApolloClient<unknown>, tokenServiceInstance: TokenService = tokenService) {
    this.apolloClient = apolloClient;
    this.tokenService = tokenServiceInstance;
  }

  /**
   * Execute user login with email and password
   * @param email - User email address
   * @param password - User password
   * @returns Authentication result with user data and tokens
   */
  async login(email: string, password: string): Promise<AuthResult> {
    try {
      const response = await this.apolloClient.mutate<LoginResponse, LoginVariables>({
        mutation: LOGIN_MUTATION,
        variables: {
          input: {
            email,
            password,
            deviceInfo: this.getDeviceInfo(),
          },
        },
        errorPolicy: 'all',
      });

      if (response.errors) {
        throw new AuthenticationError(
          'Login failed',
          'LOGIN_ERROR',
          response.errors.map(error => error.message)
        );
      }

      if (!response.data?.login) {
        throw new AuthenticationError('Invalid login response', 'INVALID_RESPONSE');
      }

      const { user, accessToken, refreshToken, expiresIn } = response.data.login;

      // Store tokens securely
      this.tokenService.setTokens(accessToken, refreshToken);

      // Clear Apollo cache to ensure fresh data with new authentication
      await this.apolloClient.clearStore();

      return {
        success: true,
        user,
        accessToken,
        refreshToken,
        expiresIn,
      };
    } catch (error) {
      console.error('Login failed:', error);

      if (error instanceof AuthenticationError) {
        throw error;
      }

      throw new AuthenticationError(
        'Login failed due to network or server error',
        'NETWORK_ERROR'
      );
    }
  }

  /**
   * Register a new user account
   * @param email - User email address
   * @param password - User password
   * @returns Authentication result with user data and tokens
   */
  async register(email: string, password: string): Promise<AuthResult> {
    try {
      const response = await this.apolloClient.mutate<RegisterUserResponse, RegisterUserVariables>({
        mutation: REGISTER_USER_MUTATION,
        variables: {
          input: {
            email,
            password,
            deviceInfo: this.getDeviceInfo(),
          },
        },
        errorPolicy: 'all',
      });

      if (response.errors) {
        throw new AuthenticationError(
          'Registration failed',
          'REGISTRATION_ERROR',
          response.errors.map(error => error.message)
        );
      }

      const registerData = response.data?.registerUser;
      if (!registerData?.success || !registerData.user || !registerData.tokens) {
        throw new AuthenticationError(
          'Registration failed',
          'REGISTRATION_ERROR',
          registerData?.errors
        );
      }

      const { user, tokens } = registerData;

      // Store tokens securely
      this.tokenService.setTokens(tokens.accessToken, tokens.refreshToken);

      // Clear Apollo cache to ensure fresh data with new authentication
      await this.apolloClient.clearStore();

      return {
        success: true,
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      console.error('Registration failed:', error);

      if (error instanceof AuthenticationError) {
        throw error;
      }

      throw new AuthenticationError(
        'Registration failed due to network or server error',
        'NETWORK_ERROR'
      );
    }
  }

  /**
   * Refresh access token using refresh token
   * @returns New access token
   */
  async refreshToken(): Promise<string> {
    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) {
      throw new AuthenticationError('No refresh token available', 'NO_REFRESH_TOKEN');
    }

    try {
      const response = await this.apolloClient.mutate<RefreshTokenResponse, RefreshTokenVariables>({
        mutation: REFRESH_TOKEN_MUTATION,
        variables: {
          input: { refreshToken },
        },
        errorPolicy: 'all',
      });

      if (response.errors) {
        throw new AuthenticationError(
          'Token refresh failed',
          'REFRESH_ERROR',
          response.errors.map(error => error.message)
        );
      }

      const refreshData = response.data?.refreshToken;
      if (!refreshData?.success || !refreshData.accessToken) {
        // Clear invalid tokens
        this.tokenService.clearTokens();
        throw new AuthenticationError(
          'Token refresh failed',
          'REFRESH_ERROR',
          refreshData?.errors
        );
      }

      // Store new access token (keep existing refresh token)
      this.tokenService.setTokens(refreshData.accessToken, refreshToken);

      return refreshData.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);

      if (error instanceof AuthenticationError) {
        throw error;
      }

      // Clear tokens on network error to prevent infinite retry loops
      this.tokenService.clearTokens();
      throw new AuthenticationError(
        'Token refresh failed due to network or server error',
        'NETWORK_ERROR'
      );
    }
  }

  /**
   * Log out user and invalidate tokens
   */
  async logout(): Promise<void> {
    const refreshToken = this.tokenService.getRefreshToken();

    try {
      if (refreshToken) {
        await this.apolloClient.mutate<LogoutResponse, LogoutVariables>({
          mutation: LOGOUT_MUTATION,
          variables: {
            input: { refreshToken },
          },
          errorPolicy: 'all',
        });
      }
    } catch (error) {
      // Log error but don't throw - we want to clear local tokens regardless
      console.error('Server logout failed:', error);
    } finally {
      // Always clear local tokens
      this.tokenService.clearTokens();

      // Clear Apollo cache to remove any cached user data
      await this.apolloClient.clearStore();
    }
  }

  /**
   * Initialize system with admin user
   * @param email - Admin email
   * @param password - Admin password
   * @returns Authentication result with system info
   */
  async initializeSystem(email: string, password: string): Promise<AuthResult> {
    try {
      const response = await this.apolloClient.mutate<InitSystemResponse, InitSystemVariables>({
        mutation: INIT_SYSTEM_MUTATION,
        variables: { adminPassword: password, email },
        errorPolicy: 'all',
      });

      if (response.errors) {
        throw new AuthenticationError(
          'System initialization failed',
          'INIT_ERROR',
          response.errors.map(error => error.message)
        );
      }

      if (!response.data?.initSystem) {
        throw new AuthenticationError('Invalid system initialization response', 'INVALID_RESPONSE');
      }

      // After system initialization, attempt to login the admin user
      return await this.login(email, password);
    } catch (error) {
      console.error('System initialization failed:', error);

      if (error instanceof AuthenticationError) {
        throw error;
      }

      throw new AuthenticationError(
        'System initialization failed due to network or server error',
        'NETWORK_ERROR'
      );
    }
  }

  /**
   * Get current authenticated user
   * @returns User data
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await this.apolloClient.query<MeResponse>({
        query: ME_QUERY,
        errorPolicy: 'all',
        fetchPolicy: 'cache-first', // Use cache if available to reduce network requests
      });

      if (response.errors) {
        throw new AuthenticationError(
          'Failed to fetch current user',
          'USER_FETCH_ERROR',
          response.errors.map(error => error.message)
        );
      }

      if (!response.data?.me) {
        throw new AuthenticationError('No user data available', 'NO_USER_DATA');
      }

      return response.data.me;
    } catch (error) {
      console.error('Failed to fetch current user:', error);

      if (error instanceof AuthenticationError) {
        throw error;
      }

      throw new AuthenticationError(
        'Failed to fetch user due to network or server error',
        'NETWORK_ERROR'
      );
    }
  }

  /**
   * Check if system is initialized
   * @returns System status information
   */
  async checkSystemStatus(): Promise<SystemStatus> {
    try {
      const response = await this.apolloClient.query<SystemStatusResponse>({
        query: SYSTEM_STATUS_QUERY,
        errorPolicy: 'all',
        fetchPolicy: 'network-only', // Always check server for system status
      });

      if (response.errors) {
        console.warn('System status check had errors:', response.errors);
      }

      const system = response.data?.system;
      return {
        initialized: system?.initialized ?? false,
        system: system || undefined,
      };
    } catch (error) {
      console.error('System status check failed:', error);

      // Return uninitialized status on error - safer default
      return { initialized: false };
    }
  }

  /**
   * Check if user is currently authenticated
   * @returns True if valid access token exists
   */
  isAuthenticated(): boolean {
    return this.tokenService.hasValidAccessToken();
  }

  /**
   * Check if refresh token is available and valid
   * @returns True if valid refresh token exists
   */
  canRefreshToken(): boolean {
    return this.tokenService.hasValidRefreshToken();
  }

  /**
   * Get basic device information for audit logging
   * @returns Device info string
   */
  private getDeviceInfo(): string {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    return `${platform} - ${userAgent.substring(0, 100)}`;
  }
}

// Singleton instance for use throughout the application
let _authServiceInstance: AuthService | null = null;

/**
 * Factory function to create or get the AuthService singleton
 */
export const getAuthService = (apolloClient?: ApolloClient<unknown>): AuthService => {
  if (!_authServiceInstance) {
    if (!apolloClient) {
      throw new Error('AuthService requires Apollo Client for initialization');
    }
    _authServiceInstance = new AuthService(apolloClient);
  }
  return _authServiceInstance;
};

/**
 * Reset the singleton instance (useful for testing)
 */
export const resetAuthService = (): void => {
  _authServiceInstance = null;
};