import { injectable, inject } from 'inversify';
import { DGraphService } from '../../services/dgraph.service';
import { dgraphResolversTypes, LoggerService } from '@skilder-ai/common';
import {
  CREATE_SESSION,
  FIND_SESSION_BY_REFRESH_TOKEN,
  UPDATE_SESSION_LAST_USED,
  DEACTIVATE_SESSION,
  DEACTIVATE_USER_SESSIONS,
  CLEANUP_EXPIRED_SESSIONS,
  GET_USER_ACTIVE_SESSIONS,
} from './session.operations';
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

      const res = await this.dgraphService.mutation<{
        addSession: { session: dgraphResolversTypes.Session[] };
      }>(CREATE_SESSION, {
        refreshToken: sessionData.refreshToken,
        userId: sessionData.userId,
        deviceInfo: sessionData.deviceInfo,
        ipAddress: sessionData.ipAddress,
        userAgent: sessionData.userAgent,
        now,
        expiresAt,
      });

      return res.addSession.session[0];
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
      const res = await this.dgraphService.query<{
        querySession: dgraphResolversTypes.Session[];
      }>(FIND_SESSION_BY_REFRESH_TOKEN, { refreshToken });

      if (!res.querySession || res.querySession.length === 0) {
        return null;
      }

      const session = res.querySession[0];

      // Check if session is expired
      if (new Date(session.expiresAt) < new Date()) {
        // Deactivate expired session
        await this.deactivate(session.id);
        return null;
      }

      return session;
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
      const res = await this.dgraphService.mutation<{
        updateSession: { session: dgraphResolversTypes.Session[] };
      }>(UPDATE_SESSION_LAST_USED, { id: sessionId, now });

      return res.updateSession.session[0];
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
      const res = await this.dgraphService.mutation<{
        updateSession: { session: dgraphResolversTypes.Session[] };
      }>(DEACTIVATE_SESSION, { id: sessionId });

      return res.updateSession.session[0];
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
      const res = await this.dgraphService.mutation<{
        updateSession: { session: dgraphResolversTypes.Session[] };
      }>(DEACTIVATE_USER_SESSIONS, { userId });

      return res.updateSession.session;
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
      const res = await this.dgraphService.query<{
        querySession: dgraphResolversTypes.Session[];
      }>(GET_USER_ACTIVE_SESSIONS, { userId });

      return res.querySession || [];
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
      const res = await this.dgraphService.mutation<{
        updateSession: { session: dgraphResolversTypes.Session[] };
      }>(CLEANUP_EXPIRED_SESSIONS, { now });

      return res.updateSession.session.length;
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