import { injectable, inject } from 'inversify';
import { UserRepository } from '../../repositories/user.repository';
import { SessionRepository } from '../../repositories/session.repository';
import { JwtService, JwtPayload, TokenPair } from './jwt.service';
import { verifyPassword } from '@skilder-ai/common';
import { dgraphResolversTypes } from '@skilder-ai/common';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginRequest {
  credentials: LoginCredentials;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LoginResult {
  success: boolean;
  user?: dgraphResolversTypes.User;
  tokens?: TokenPair;
  error?: string;
  accountLocked?: boolean;
  lockExpiresAt?: Date;
}

export interface RefreshTokenRequest {
  refreshToken: string;
  deviceInfo?: string;
  ipAddress?: string;
}

export interface RefreshTokenResult {
  success: boolean;
  accessToken?: string;
  error?: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface LogoutResult {
  success: boolean;
  error?: string;
}

/**
 * Simplified authentication service for POC.
 * Basic login/logout with JWT tokens, no account lockouts or complex security.
 *
 * TODO: Future improvements could include:
 * - Account lockout after failed login attempts
 * - Device fingerprinting and tracking
 * - Session management and concurrent session limits
 * - Refresh token rotation
 * - Multi-factor authentication
 * - Social login integration
 * - Password reset functionality
 * - Remember me functionality
 * - Session analytics and monitoring
 */
@injectable()
export class AuthenticationService {
  constructor(
    @inject(UserRepository) private readonly userRepository: UserRepository,
    @inject(SessionRepository) private readonly sessionRepository: SessionRepository,
    @inject(JwtService) private readonly jwtService: JwtService
  ) { }

  /**
   * Simple user authentication with email and password.
   */
  async login(request: LoginRequest): Promise<LoginResult> {
    try {
      const { credentials } = request;

      // Find user by email
      const user = await this.userRepository.findByEmail(credentials.email);
      if (!user) {
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }

      // Verify password
      const isPasswordValid = await verifyPassword(credentials.password, user.password);
      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }

      // Generate JWT tokens
      const tokenPair = await this.jwtService.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: 'member', // TODO: add role in user Type
        workspaceId: undefined, // TODO: do we need to specify the workspaceId in the payload? or rather the workspaces that the user has access to and then the role included in this dictionary?
      });

      // Update user's last login
      await this.userRepository.updateLastLogin(user.id);

      // Create session record
      await this.sessionRepository.create({
        userId: user.id,
        refreshToken: tokenPair.refreshToken,
        deviceInfo: request.deviceInfo,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        expiresAt: new Date(Date.now() + this.jwtService.getRefreshTokenTtl() * 1000),
      });

      return {
        success: true,
        user,
        tokens: tokenPair,
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Authentication failed',
      };
    }
  }

  /**
   * Refresh access token using refresh token.
   */
  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResult> {
    try {
      // Verify refresh token
      const result = await this.jwtService.verifyToken(request.refreshToken, 'refresh');
      if (!result.valid || !result.payload) {
        return {
          success: false,
          error: 'Invalid refresh token',
        };
      }

      // Check if session exists
      const session = await this.sessionRepository.findByRefreshToken(request.refreshToken);
      if (!session) {
        return {
          success: false,
          error: 'Session not found',
        };
      }

      const payload = result.payload;
      // Generate new access token
      const newAccessToken = await this.jwtService.generateAccessToken({
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        workspaceId: payload.workspaceId,
      });

      return {
        success: true,
        accessToken: newAccessToken,
      };

    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: 'Failed to refresh token',
      };
    }
  }

  /**
   * Logout user and invalidate session.
   */
  async logout(request: LogoutRequest): Promise<LogoutResult> {
    try {
      // Invalidate session
      const session = await this.sessionRepository.findByRefreshToken(request.refreshToken);
      if (session) {
        await this.sessionRepository.deactivate(session.id);
      } else {
        // nothing to deactivate
      }

      return {
        success: true,
      };

    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: 'Logout failed',
      };
    }
  }

  /**
   * Verify access token and return payload.
   */
  async verifyAccessToken(token: string): Promise<JwtPayload | null> {
    const result = await this.jwtService.verifyToken(token, 'access');
    if (!result.valid || !result.payload) {
      return null;
    }
    return result.payload;
  }

  /**
   * Verify refresh token and return payload.
   */
  async verifyRefreshToken(token: string): Promise<JwtPayload | null> {
    const result = await this.jwtService.verifyToken(token, 'refresh');
    if (!result.valid || !result.payload) {
      return null;
    }
    return result.payload;
  }
}