/**
 * JWT Utility Functions
 *
 * WHY: Decode and validate JWT tokens on the client side without a backend call.
 * This allows us to check token expiry locally for better performance.
 */

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  workspaceId?: string;
  iat: number; // Issued at (seconds)
  exp: number; // Expiry (seconds)
}

/**
 * Decode a JWT token without verification
 * NOTE: This only decodes, does not verify signature (backend does that)
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (middle part)
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as JWTPayload;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Check if a JWT token is expired
 * @param token - The JWT token string
 * @param bufferSeconds - Consider token expired N seconds before actual expiry (default: 60s)
 */
export function isTokenExpired(token: string, bufferSeconds: number = 60): boolean {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return true;
  }

  // Get current time in seconds
  const nowInSeconds = Math.floor(Date.now() / 1000);

  // Check if token is expired (with buffer)
  return payload.exp - bufferSeconds <= nowInSeconds;
}

/**
 * Get the expiry timestamp from a JWT token
 */
export function getTokenExpiry(token: string): Date | null {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return null;
  }

  return new Date(payload.exp * 1000);
}

/**
 * Get time until token expires in seconds
 */
export function getTimeUntilExpiry(token: string): number | null {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return null;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  const secondsRemaining = payload.exp - nowInSeconds;

  return secondsRemaining > 0 ? secondsRemaining : 0;
}
