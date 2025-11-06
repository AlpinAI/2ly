import * as jwt from 'jsonwebtoken';
import { injectable } from 'inversify';
import { readFileSync } from 'fs';

export interface JwtPayload {
  userId: string;
  email: string;
  workspaceId?: string;
  role?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface JwtVerifyResult {
  valid: boolean;
  payload?: JwtPayload;
  error?: string;
}

/**
 * JWT Service for generating and validating tokens using RS256 algorithm.
 * Supports both access tokens (short-lived) and refresh tokens (long-lived).
 */
@injectable()
export class JwtService {
  private readonly privateKey: string;
  private readonly publicKey: string;
  private readonly algorithm = 'RS256';
  private readonly issuer: string;
  private readonly accessTokenTtl: number; // in seconds
  private readonly refreshTokenTtl: number; // in seconds

  constructor() {
    // Load environment configuration
    this.issuer = process.env.JWT_ISSUER || '2ly-platform';
    this.accessTokenTtl = parseInt(process.env.JWT_ACCESS_TOKEN_TTL || '900', 10); // 15 minutes
    this.refreshTokenTtl = parseInt(process.env.JWT_REFRESH_TOKEN_TTL || '604800', 10); // 7 days

    // Get key paths from environment (auto-loaded from .docker-keys/.env.generated)
    const privateKeyPath = process.env.JWT_PRIVATE_KEY_PATH;
    const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH;

    if (!privateKeyPath || !publicKeyPath) {
      throw new Error(
        'JWT service initialization failed: JWT_PRIVATE_KEY_PATH and JWT_PUBLIC_KEY_PATH must be set in environment. ' +
          'These should be auto-loaded from .docker-keys/.env.generated'
      );
    }

    // Load RSA keys
    try {
      this.privateKey = readFileSync(privateKeyPath, 'utf8');
      this.publicKey = readFileSync(publicKeyPath, 'utf8');
    } catch (error) {
      console.error('Failed to load JWT keys:', error);
      throw new Error(
        `JWT service initialization failed: unable to load RSA keys from ${privateKeyPath} and ${publicKeyPath}. ` +
          'Ensure .docker-keys/.env.generated exists and paths are correct.'
      );
    }
  }

  /**
   * Generate access and refresh token pair for a user.
   */
  async generateTokenPair(payload: JwtPayload): Promise<TokenPair> {
    try {
      const now = Math.floor(Date.now() / 1000);

      const accessTokenPayload = {
        ...payload,
        iat: now,
        exp: now + this.accessTokenTtl,
        iss: this.issuer,
        type: 'access',
      };

      const refreshTokenPayload = {
        userId: payload.userId,
        email: payload.email,
        iat: now,
        exp: now + this.refreshTokenTtl,
        iss: this.issuer,
        type: 'refresh',
      };

      const accessToken = jwt.sign(accessTokenPayload, this.privateKey, {
        algorithm: this.algorithm,
      });

      const refreshToken = jwt.sign(refreshTokenPayload, this.privateKey, {
        algorithm: this.algorithm,
      });

      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error('Failed to generate token pair:', error);
      throw new Error('Token generation failed');
    }
  }

  /**
   * Generate only access token (used for token refresh).
   */
  async generateAccessToken(payload: JwtPayload): Promise<string> {
    try {
      const now = Math.floor(Date.now() / 1000);

      const accessTokenPayload = {
        ...payload,
        iat: now,
        exp: now + this.accessTokenTtl,
        iss: this.issuer,
        type: 'access',
      };

      return jwt.sign(accessTokenPayload, this.privateKey, {
        algorithm: this.algorithm,
      });
    } catch (error) {
      console.error('Failed to generate access token:', error);
      throw new Error('Access token generation failed');
    }
  }

  /**
   * Verify and decode a JWT token.
   */
  async verifyToken(token: string, expectedType: 'access' | 'refresh' = 'access'): Promise<JwtVerifyResult> {
    try {
      const decoded = jwt.verify(token, this.publicKey, {
        algorithms: [this.algorithm],
        issuer: this.issuer,
      }) as jwt.JwtPayload & {
        type: string;
        userId: string;
        email: string;
        workspaceId?: string;
        role?: string;
      };

      // Validate token type
      if (decoded.type !== expectedType) {
        return {
          valid: false,
          error: `Invalid token type. Expected ${expectedType}, got ${decoded.type}`,
        };
      }

      // Validate required fields
      if (!decoded.userId || !decoded.email) {
        return {
          valid: false,
          error: 'Token missing required fields',
        };
      }

      const payload: JwtPayload = {
        userId: decoded.userId,
        email: decoded.email,
        workspaceId: decoded.workspaceId,
        role: decoded.role,
      };

      return {
        valid: true,
        payload,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return {
          valid: false,
          error: 'Token expired',
        };
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return {
          valid: false,
          error: 'Invalid token signature',
        };
      }
      if (error instanceof jwt.NotBeforeError) {
        return {
          valid: false,
          error: 'Token not active',
        };
      }

      console.error('Token verification error:', error);
      return {
        valid: false,
        error: 'Token verification failed',
      };
    }
  }

  /**
   * Extract token from Authorization header (Bearer format).
   */
  extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Get token expiration time in seconds.
   */
  getAccessTokenTtl(): number {
    return this.accessTokenTtl;
  }

  /**
   * Get refresh token expiration time in seconds.
   */
  getRefreshTokenTtl(): number {
    return this.refreshTokenTtl;
  }
}