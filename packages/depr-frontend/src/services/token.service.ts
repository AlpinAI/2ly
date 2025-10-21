/**
 * Token Management Service
 *
 * Handles JWT token storage, retrieval, and validation for the authentication system.
 * Provides secure localStorage-based persistence with proper error handling.
 */

export interface JwtPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
  aud?: string;
  iss?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class TokenService {
  private static readonly ACCESS_TOKEN_KEY = '2ly_access_token';
  private static readonly REFRESH_TOKEN_KEY = '2ly_refresh_token';

  /**
   * Retrieve access token from localStorage
   * @returns Access token or null if not found/invalid
   */
  getAccessToken(): string | null {
    try {
      return localStorage.getItem(TokenService.ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to retrieve access token:', error);
      return null;
    }
  }

  /**
   * Retrieve refresh token from localStorage
   * @returns Refresh token or null if not found/invalid
   */
  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(TokenService.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to retrieve refresh token:', error);
      return null;
    }
  }

  /**
   * Store both access and refresh tokens securely
   * @param accessToken - JWT access token
   * @param refreshToken - JWT refresh token
   */
  setTokens(accessToken: string, refreshToken: string): void {
    try {
      localStorage.setItem(TokenService.ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(TokenService.REFRESH_TOKEN_KEY, refreshToken);
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw new Error('Failed to persist authentication tokens');
    }
  }

  /**
   * Remove all tokens and clear storage
   */
  clearTokens(): void {
    try {
      localStorage.removeItem(TokenService.ACCESS_TOKEN_KEY);
      localStorage.removeItem(TokenService.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  /**
   * Check if a JWT token has expired
   * @param token - JWT token to validate
   * @returns True if token is expired or invalid
   */
  isTokenExpired(token: string): boolean {
    try {
      const payload = this.parseJwtPayload(token);
      if (!payload || !payload.exp) {
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  /**
   * Extract expiration date from JWT token
   * @param token - JWT token to parse
   * @returns Expiration date or null if invalid
   */
  getTokenExpiration(token: string): Date | null {
    try {
      const payload = this.parseJwtPayload(token);
      if (!payload || !payload.exp) {
        return null;
      }

      return new Date(payload.exp * 1000);
    } catch {
      return null;
    }
  }

  /**
   * Safely parse JWT payload from token
   * @param token - JWT token to parse
   * @returns Parsed JWT payload or null if invalid
   */
  parseJwtPayload(token: string): JwtPayload | null {
    try {
      if (!token || typeof token !== 'string') {
        return null;
      }

      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      // Decode base64url payload
      const payload = parts[1];
      const decodedPayload = this.base64UrlDecode(payload);

      return JSON.parse(decodedPayload) as JwtPayload;
    } catch (error) {
      console.error('Failed to parse JWT payload:', error);
      return null;
    }
  }

  /**
   * Check if current access token is valid and not expired
   * @returns True if valid access token exists
   */
  hasValidAccessToken(): boolean {
    const token = this.getAccessToken();
    return token !== null && !this.isTokenExpired(token);
  }

  /**
   * Check if refresh token exists and is not expired
   * @returns True if valid refresh token exists
   */
  hasValidRefreshToken(): boolean {
    const token = this.getRefreshToken();
    return token !== null && !this.isTokenExpired(token);
  }

  /**
   * Get time until token expires in milliseconds
   * @param token - JWT token to check
   * @returns Milliseconds until expiration, or 0 if expired/invalid
   */
  getTimeUntilExpiration(token: string): number {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) {
      return 0;
    }

    const timeUntilExpiry = expiration.getTime() - Date.now();
    return Math.max(0, timeUntilExpiry);
  }

  /**
   * Decode base64url string (JWT uses base64url, not standard base64)
   * @param str - Base64url encoded string
   * @returns Decoded string
   */
  private base64UrlDecode(str: string): string {
    // Replace base64url characters with base64 characters
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }

    return atob(base64);
  }
}

// Singleton instance for use throughout the application
export const tokenService = new TokenService();