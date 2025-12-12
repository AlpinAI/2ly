import { injectable, inject } from 'inversify';
import { DGraphService } from '../../services/dgraph.service';
import { dgraphResolversTypes, LoggerService } from '@skilder-ai/common';
import {
  CreateSessionDocument,
  FindSessionByRefreshTokenDocument,
  UpdateSessionLastUsedDocument,
  DeactivateSessionDocument,
  DeactivateUserSessionsDocument,
  CleanupExpiredSessionsDocument,
  GetUserActiveSessionsDocument,
} from '../../generated/dgraph';
import pino from 'pino';

export interface CreateSessionData {
  refreshToken: string;
  userId: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
}

/**
 * Repository for managing user sessions and refresh tokens.
 */
@injectable()
export class SessionRepository {
  private logger: pino.Logger;
  constructor(@inject(LoggerService) private readonly loggerService: LoggerService, @inject(DGraphService) private readonly dgraphService: DGraphService) {
    this.logger = this.loggerService.getLogger('SessionRepository');
  }

  /**
   * Create a new user session with refresh token.
   */
  async create(sessionData: CreateSessionData): Promise<dgraphResolversTypes.Session> {
    try {
      const now = new Date().toISOString();
      const expiresAt = sessionData.expiresAt.toISOString();

      const res = await this.dgraphService.mutation(CreateSessionDocument, {
        refreshToken: sessionData.refreshToken,
        userId: sessionData.userId,
        userIdRef: sessionData.userId,
        deviceInfo: sessionData.deviceInfo,
        ipAddress: sessionData.ipAddress,
        userAgent: sessionData.userAgent,
        now,
        expiresAt,
      });

      return res.addSession!.session![0]! as dgraphResolversTypes.Session;
    } catch (error) {
      this.logger.error(`Failed to create session: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error('Failed to create session');
    }
  }

  /**
   * Find active session by refresh token.
   */
  async findByRefreshToken(refreshToken: string): Promise<dgraphResolversTypes.Session | null> {
    try {
      const res = await this.dgraphService.query(FindSessionByRefreshTokenDocument, { refreshToken });

      if (!res.querySession || res.querySession.length === 0) {
        return null;
      }

      const session = res.querySession[0]!;

      // Check if session is expired
      if (new Date(session!.expiresAt) < new Date()) {
        // Deactivate expired session
        await this.deactivate(session.id);
        return null;
      }

      return session as dgraphResolversTypes.Session;
    } catch (error) {
      this.logger.error(`Failed to find session by refresh token: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error('Failed to find session by refresh token');
    }
  }

  /**
   * Update session's last used timestamp.
   */
  async updateLastUsed(sessionId: string): Promise<dgraphResolversTypes.Session> {
    try {
      const now = new Date().toISOString();
      const res = await this.dgraphService.mutation(UpdateSessionLastUsedDocument, { id: sessionId, now });

      return res.updateSession!.session![0]! as dgraphResolversTypes.Session;
    } catch (error) {
      this.logger.error(`Failed to update session last used: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error('Failed to update session last used');
    }
  }

  /**
   * Deactivate a specific session (logout).
   */
  async deactivate(sessionId: string): Promise<dgraphResolversTypes.Session> {
    try {
      const res = await this.dgraphService.mutation(DeactivateSessionDocument, { id: sessionId });

      return res.updateSession!.session![0]! as dgraphResolversTypes.Session;
    } catch (error) {
      this.logger.error(`Failed to deactivate session: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error('Failed to deactivate session');
    }
  }

  /**
   * Deactivate all sessions for a user (logout from all devices).
   */
  async deactivateAllUserSessions(userId: string): Promise<dgraphResolversTypes.Session[]> {
    try {
      const res = await this.dgraphService.mutation(DeactivateUserSessionsDocument, { userId });

      return (res.updateSession?.session?.filter((s): s is dgraphResolversTypes.Session => s !== null) || []);
    } catch (error) {
      this.logger.error(`Failed to deactivate user sessions: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error('Failed to deactivate user sessions');
    }
  }

  /**
   * Get all active sessions for a user.
   */
  async getUserActiveSessions(userId: string): Promise<dgraphResolversTypes.Session[]> {
    try {
      const res = await this.dgraphService.query(GetUserActiveSessionsDocument, { userId });

      return (res.querySession?.filter((s): s is dgraphResolversTypes.Session => s !== null) || []);
    } catch (error) {
      this.logger.error(`Failed to get user active sessions: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error('Failed to get user active sessions');
    }
  }

  /**
   * Cleanup expired sessions (should be run periodically).
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const now = new Date().toISOString();
      const res = await this.dgraphService.mutation(CleanupExpiredSessionsDocument, { now });

      return res.updateSession?.session?.length || 0;
    } catch (error) {
      this.logger.error(`Failed to cleanup expired sessions: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error('Failed to cleanup expired sessions');
    }
  }

  /**
   * Check if a session is expired.
   */
  isSessionExpired(session: dgraphResolversTypes.Session): boolean {
    return new Date(session.expiresAt) < new Date();
  }

  /**
   * Generate device info string from request headers.
   */
  generateDeviceInfo(userAgent?: string, ipAddress?: string): string {
    const parts: string[] = [];

    if (userAgent) {
      // Extract browser and OS info from user agent
      const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/([0-9.]+)/);
      if (browserMatch) {
        parts.push(`${browserMatch[1]} ${browserMatch[2]}`);
      }

      const osMatch = userAgent.match(/(Windows|Mac OS|Linux|iOS|Android)/);
      if (osMatch) {
        parts.push(osMatch[1]);
      }
    }

    if (ipAddress) {
      parts.push(`IP: ${ipAddress}`);
    }

    return parts.length > 0 ? parts.join(' | ') : 'Unknown Device';
  }
}