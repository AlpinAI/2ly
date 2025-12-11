import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SessionRepository, CreateSessionData } from '../session/session.repository';
import { DGraphService } from '../../services/dgraph.service';
import { LoggerService, dgraphResolversTypes } from '@skilder-ai/common';

// Mock dependencies
vi.mock('../services/dgraph.service');
vi.mock('@skilder-ai/common', async () => {
  const actual = await vi.importActual('@skilder-ai/common');
  return {
    ...actual,
    LoggerService: vi.fn(),
  };
});

describe('SessionRepository', () => {
  let repository: SessionRepository;
  let mockDgraphService: DGraphService;
  let mockLoggerService: LoggerService;
  let mockLogger: ReturnType<LoggerService['getLogger']>;

  // Mock user for sessions
  const mockUser: dgraphResolversTypes.User = {
    id: 'user-456',
    email: 'user1@skilder.ai',
    password: 'hashed-password',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    // Silence console errors in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    } as unknown as ReturnType<LoggerService['getLogger']>;

    mockLoggerService = {
      getLogger: vi.fn().mockReturnValue(mockLogger),
    } as unknown as LoggerService;

    mockDgraphService = {
      query: vi.fn(),
      mutation: vi.fn(),
    } as unknown as DGraphService;

    repository = new SessionRepository(mockLoggerService, mockDgraphService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('create', () => {
    it('should create a new session with all provided data', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const sessionData: CreateSessionData = {
        refreshToken: 'refresh-token-123',
        userId: 'user-456',
        deviceInfo: 'Chrome 120 | Windows | IP: 192.168.1.1',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        expiresAt,
      };

      const mockSession: dgraphResolversTypes.Session = {
        id: 'session-789',
        refreshToken: sessionData.refreshToken,
        deviceInfo: sessionData.deviceInfo,
        ipAddress: sessionData.ipAddress,
        userAgent: sessionData.userAgent,
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        isActive: true,
        user: mockUser,
        userId: mockUser.id,
      };

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        addSession: { session: [mockSession] },
      });

      const result = await repository.create(sessionData);

      expect(result).toEqual(mockSession);
      expect(mockDgraphService.mutation).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          refreshToken: sessionData.refreshToken,
          userId: sessionData.userId,
          deviceInfo: sessionData.deviceInfo,
          ipAddress: sessionData.ipAddress,
          userAgent: sessionData.userAgent,
          expiresAt: expiresAt.toISOString(),
        })
      );
    });

    it('should create a session without optional fields', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const sessionData: CreateSessionData = {
        refreshToken: 'refresh-token-123',
        userId: 'user-456',
        expiresAt,
      };

      const mockSession: dgraphResolversTypes.Session = {
        id: 'session-789',
        refreshToken: sessionData.refreshToken,
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        isActive: true,
        user: mockUser,
        userId: mockUser.id,
      };

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        addSession: { session: [mockSession] },
      });

      const result = await repository.create(sessionData);

      expect(result).toEqual(mockSession);
    });
  });

  describe('findByRefreshToken', () => {
    it('should return session when token is valid and not expired', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const mockSession: dgraphResolversTypes.Session = {
        id: 'session-789',
        refreshToken: 'refresh-token-123',
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
        expiresAt: futureDate.toISOString(),
        isActive: true,
        user: mockUser,
        userId: mockUser.id,
      };

      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        querySession: [mockSession],
      });

      const result = await repository.findByRefreshToken('refresh-token-123');

      expect(result).toEqual(mockSession);
      expect(mockDgraphService.query).toHaveBeenCalledWith(
        expect.any(Object),
        { refreshToken: 'refresh-token-123' }
      );
    });

    it('should return null when token is not found', async () => {
      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        querySession: [],
      });

      const result = await repository.findByRefreshToken('nonexistent-token');

      expect(result).toBeNull();
    });

    it('should deactivate and return null when session is expired', async () => {
      const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const mockSession: dgraphResolversTypes.Session = {
        id: 'session-789',
        refreshToken: 'refresh-token-123',
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
        expiresAt: pastDate.toISOString(),
        isActive: true,
        user: mockUser,
        userId: mockUser.id,
      };

      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        querySession: [mockSession],
      });

      const deactivatedSession = { ...mockSession, isActive: false };
      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        updateSession: { session: [deactivatedSession] },
      });

      const result = await repository.findByRefreshToken('refresh-token-123');

      expect(result).toBeNull();
      expect(mockDgraphService.mutation).toHaveBeenCalled(); // deactivate was called
    });
  });

  describe('updateLastUsed', () => {
    it('should update session last used timestamp', async () => {
      const mockSession: dgraphResolversTypes.Session = {
        id: 'session-789',
        refreshToken: 'refresh-token-123',
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        user: mockUser,
        userId: mockUser.id,
      };

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        updateSession: { session: [mockSession] },
      });

      const result = await repository.updateLastUsed('session-789');

      expect(result).toEqual(mockSession);
      expect(mockDgraphService.mutation).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          id: 'session-789',
          now: expect.any(String),
        })
      );
    });
  });

  describe('deactivate', () => {
    it('should deactivate a specific session', async () => {
      const mockSession: dgraphResolversTypes.Session = {
        id: 'session-789',
        refreshToken: 'refresh-token-123',
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: false,
        user: mockUser,
        userId: mockUser.id,
      };

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        updateSession: { session: [mockSession] },
      });

      const result = await repository.deactivate('session-789');

      expect(result).toEqual(mockSession);
      expect(result.isActive).toBe(false);
    });
  });

  describe('deactivateAllUserSessions', () => {
    it('should deactivate all sessions for a user', async () => {
      const mockSessions: dgraphResolversTypes.Session[] = [
        {
          id: 'session-1',
          refreshToken: 'token-1',
          createdAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: false,
          user: mockUser,
          userId: mockUser.id,
        },
        {
          id: 'session-2',
          refreshToken: 'token-2',
          createdAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: false,
          user: mockUser,
          userId: mockUser.id,
        },
      ];

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        updateSession: { session: mockSessions },
      });

      const result = await repository.deactivateAllUserSessions('user-456');

      expect(result).toEqual(mockSessions);
      expect(result).toHaveLength(2);
      expect(mockDgraphService.mutation).toHaveBeenCalledWith(
        expect.any(Object),
        { userId: 'user-456' }
      );
    });
  });

  describe('getUserActiveSessions', () => {
    it('should return all active sessions for a user', async () => {
      const mockSessions: dgraphResolversTypes.Session[] = [
        {
          id: 'session-1',
          refreshToken: 'token-1',
          createdAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
          user: mockUser,
          userId: mockUser.id,
        },
        {
          id: 'session-2',
          refreshToken: 'token-2',
          createdAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
          user: mockUser,
          userId: mockUser.id,
        },
      ];

      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        querySession: mockSessions,
      });

      const result = await repository.getUserActiveSessions('user-456');

      expect(result).toEqual(mockSessions);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when user has no active sessions', async () => {
      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        querySession: [],
      });

      const result = await repository.getUserActiveSessions('user-456');

      expect(result).toEqual([]);
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should cleanup expired sessions and return count', async () => {
      const expiredSessions: dgraphResolversTypes.Session[] = [
        {
          id: 'session-1',
          refreshToken: 'token-1',
          createdAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: false,
          user: mockUser,
          userId: mockUser.id,
        },
        {
          id: 'session-2',
          refreshToken: 'token-2',
          createdAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: false,
          user: mockUser,
          userId: mockUser.id,
        },
      ];

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        updateSession: { session: expiredSessions },
      });

      const result = await repository.cleanupExpiredSessions();

      expect(result).toBe(2);
      expect(mockDgraphService.mutation).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          now: expect.any(String),
        })
      );
    });

    it('should return 0 when no expired sessions exist', async () => {
      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        updateSession: { session: [] },
      });

      const result = await repository.cleanupExpiredSessions();

      expect(result).toBe(0);
    });
  });

  describe('isSessionExpired', () => {
    it('should return true for expired session', () => {
      const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const session: dgraphResolversTypes.Session = {
        id: 'session-789',
        refreshToken: 'refresh-token-123',
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
        expiresAt: pastDate.toISOString(),
        isActive: true,
        user: mockUser,
        userId: mockUser.id,
      };

      const result = repository.isSessionExpired(session);

      expect(result).toBe(true);
    });

    it('should return false for valid session', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const session: dgraphResolversTypes.Session = {
        id: 'session-789',
        refreshToken: 'refresh-token-123',
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
        expiresAt: futureDate.toISOString(),
        isActive: true,
        user: mockUser,
        userId: mockUser.id,
      };

      const result = repository.isSessionExpired(session);

      expect(result).toBe(false);
    });

    it('should return false for session at exact expiration time', () => {
      const now = new Date();
      const session: dgraphResolversTypes.Session = {
        id: 'session-789',
        refreshToken: 'refresh-token-123',
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
        expiresAt: now.toISOString(),
        isActive: true,
        user: mockUser,
        userId: mockUser.id,
      };

      const result = repository.isSessionExpired(session);

      // At exact expiration time (using <, not <=), should NOT be considered expired
      expect(result).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should throw error and log when create fails', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const sessionData: CreateSessionData = {
        refreshToken: 'refresh-token-123',
        userId: 'user-456',
        expiresAt,
      };

      vi.spyOn(mockDgraphService, 'mutation').mockRejectedValue(new Error('Database error'));

      await expect(repository.create(sessionData)).rejects.toThrow('Failed to create session');
      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to create session'));
    });

    it('should throw error and log when findByRefreshToken fails', async () => {
      vi.spyOn(mockDgraphService, 'query').mockRejectedValue(new Error('Query failed'));

      await expect(repository.findByRefreshToken('token')).rejects.toThrow('Failed to find session by refresh token');
      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to find session by refresh token'));
    });

    it('should throw error and log when updateLastUsed fails', async () => {
      vi.spyOn(mockDgraphService, 'mutation').mockRejectedValue(new Error('Update failed'));

      await expect(repository.updateLastUsed('session-123')).rejects.toThrow('Failed to update session last used');
      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to update session last used'));
    });

    it('should throw error and log when deactivate fails', async () => {
      vi.spyOn(mockDgraphService, 'mutation').mockRejectedValue(new Error('Deactivate failed'));

      await expect(repository.deactivate('session-123')).rejects.toThrow('Failed to deactivate session');
      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to deactivate session'));
    });

    it('should throw error and log when cleanupExpiredSessions fails', async () => {
      vi.spyOn(mockDgraphService, 'mutation').mockRejectedValue(new Error('Cleanup failed'));

      await expect(repository.cleanupExpiredSessions()).rejects.toThrow('Failed to cleanup expired sessions');
      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to cleanup expired sessions'));
    });
  });

  describe('generateDeviceInfo', () => {
    it('should parse Chrome on Windows user agent', () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      const ipAddress = '192.168.1.1';

      const result = repository.generateDeviceInfo(userAgent, ipAddress);

      expect(result).toContain('Chrome');
      expect(result).toContain('120.0');
      expect(result).toContain('Windows');
      expect(result).toContain('IP: 192.168.1.1');
    });

    it('should parse Firefox on Mac OS user agent', () => {
      const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0';
      const ipAddress = '192.168.1.2';

      const result = repository.generateDeviceInfo(userAgent, ipAddress);

      expect(result).toContain('Firefox');
      expect(result).toContain('115.0');
      expect(result).toContain('Mac OS');
      expect(result).toContain('IP: 192.168.1.2');
    });

    it('should parse Safari on Mac OS user agent', () => {
      const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
      const ipAddress = '10.0.0.5';

      const result = repository.generateDeviceInfo(userAgent, ipAddress);

      expect(result).toContain('Safari');
      expect(result).toContain('Mac OS');
      expect(result).toContain('IP: 10.0.0.5');
    });

    it('should handle user agent without IP address', () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0';

      const result = repository.generateDeviceInfo(userAgent);

      expect(result).toContain('Chrome');
      expect(result).toContain('Windows');
      expect(result).not.toContain('IP:');
    });

    it('should handle IP address without user agent', () => {
      const ipAddress = '192.168.1.1';

      const result = repository.generateDeviceInfo(undefined, ipAddress);

      expect(result).toBe('IP: 192.168.1.1');
    });

    it('should return "Unknown Device" when no info provided', () => {
      const result = repository.generateDeviceInfo();

      expect(result).toBe('Unknown Device');
    });

    it('should parse Chrome on Linux user agent', () => {
      const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

      const result = repository.generateDeviceInfo(userAgent);

      expect(result).toContain('Chrome');
      expect(result).toContain('Linux');
    });
  });
});
