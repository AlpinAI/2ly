import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AuthenticationService, LoginRequest, RefreshTokenRequest, LogoutRequest } from './auth.service';
import { UserRepository } from '../../repositories/user.repository';
import { SessionRepository } from '../../repositories/session.repository';
import { JwtService, JwtPayload, TokenPair } from './jwt.service';
import { dgraphResolversTypes } from '@2ly/common';

// Mock dependencies
vi.mock('../../repositories/user.repository');
vi.mock('../../repositories/session.repository');
vi.mock('./jwt.service');
vi.mock('@2ly/common', async () => {
  const actual = await vi.importActual('@2ly/common');
  return {
    ...actual,
    verifyPassword: vi.fn(),
  };
});

describe('AuthenticationService', () => {
  let authService: AuthenticationService;
  let mockUserRepository: UserRepository;
  let mockSessionRepository: SessionRepository;
  let mockJwtService: JwtService;
  let verifyPasswordMock: ReturnType<typeof vi.fn>;

  // Mock user data
  const mockUser: dgraphResolversTypes.User = {
    id: '0x123',
    email: 'test@example.com',
    password: '$argon2id$v=19$m=65536,t=3,p=4$somehashedpassword',
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
  };

  // Mock token pair
  const mockTokenPair: TokenPair = {
    accessToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.access',
    refreshToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.refresh',
  };

  // Mock session
  const mockSession: dgraphResolversTypes.Session = {
    id: 'session-123',
    refreshToken: mockTokenPair.refreshToken,
    userId: mockUser.id,
    deviceInfo: 'Chrome 120 | Windows | IP: 192.168.1.1',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    user: mockUser,
  };

  beforeEach(async () => {
    // Silence console errors in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Import and setup verifyPassword mock
    const common = await import('@2ly/common');
    verifyPasswordMock = common.verifyPassword as ReturnType<typeof vi.fn>;

    // Create mock instances
    mockUserRepository = {
      findByEmail: vi.fn(),
      updateLastLogin: vi.fn(),
      create: vi.fn(),
      updatePassword: vi.fn(),
      updateEmail: vi.fn(),
      addAdminToWorkspace: vi.fn(),
      addMemberToWorkspace: vi.fn(),
      incrementFailedLoginAttempts: vi.fn(),
      unlockAccount: vi.fn(),
      isAccountLocked: vi.fn(),
    } as unknown as UserRepository;

    mockSessionRepository = {
      create: vi.fn(),
      findByRefreshToken: vi.fn(),
      updateLastUsed: vi.fn(),
      deactivate: vi.fn(),
      deactivateAllUserSessions: vi.fn(),
      getUserActiveSessions: vi.fn(),
      cleanupExpiredSessions: vi.fn(),
      isSessionExpired: vi.fn(),
      generateDeviceInfo: vi.fn(),
    } as unknown as SessionRepository;

    mockJwtService = {
      generateTokenPair: vi.fn(),
      generateAccessToken: vi.fn(),
      verifyToken: vi.fn(),
      extractTokenFromHeader: vi.fn(),
      getAccessTokenTtl: vi.fn().mockReturnValue(900),
      getRefreshTokenTtl: vi.fn().mockReturnValue(604800),
    } as unknown as JwtService;

    authService = new AuthenticationService(
      mockUserRepository,
      mockSessionRepository,
      mockJwtService
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('login', () => {
    const loginRequest: LoginRequest = {
      credentials: {
        email: 'test@example.com',
        password: 'password123',
      },
      deviceInfo: 'Chrome 120 | Windows',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    };

    it('should successfully login with valid credentials', async () => {
      // Arrange
      vi.spyOn(mockUserRepository, 'findByEmail').mockResolvedValue(mockUser);
      verifyPasswordMock.mockResolvedValue(true);
      vi.spyOn(mockJwtService, 'generateTokenPair').mockResolvedValue(mockTokenPair);
      vi.spyOn(mockUserRepository, 'updateLastLogin').mockResolvedValue(mockUser);
      vi.spyOn(mockSessionRepository, 'create').mockResolvedValue(mockSession);

      // Act
      const result = await authService.login(loginRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(result.tokens).toEqual(mockTokenPair);
      expect(result.error).toBeUndefined();

      // Verify calls
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(verifyPasswordMock).toHaveBeenCalledWith('password123', mockUser.password);
      expect(mockJwtService.generateTokenPair).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
        role: 'member',
        workspaceId: undefined,
      });
      expect(mockUserRepository.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
      expect(mockSessionRepository.create).toHaveBeenCalledWith({
        userId: mockUser.id,
        refreshToken: mockTokenPair.refreshToken,
        deviceInfo: loginRequest.deviceInfo,
        ipAddress: loginRequest.ipAddress,
        userAgent: loginRequest.userAgent,
        expiresAt: expect.any(Date),
      });
    });

    it('should return generic error for invalid email (no user enumeration)', async () => {
      // Arrange
      vi.spyOn(mockUserRepository, 'findByEmail').mockResolvedValue(null);

      // Act
      const result = await authService.login(loginRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
      expect(result.user).toBeUndefined();
      expect(result.tokens).toBeUndefined();

      // Verify password verification was never called
      expect(verifyPasswordMock).not.toHaveBeenCalled();
    });

    it('should return generic error for invalid password (no user enumeration)', async () => {
      // Arrange
      vi.spyOn(mockUserRepository, 'findByEmail').mockResolvedValue(mockUser);
      verifyPasswordMock.mockResolvedValue(false);

      // Act
      const result = await authService.login(loginRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
      expect(result.user).toBeUndefined();
      expect(result.tokens).toBeUndefined();

      // Verify no session was created for failed login
      expect(mockSessionRepository.create).not.toHaveBeenCalled();
    });

    it('should handle database error during user lookup', async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(mockUserRepository, 'findByEmail').mockRejectedValue(new Error('Database connection failed'));

      // Act
      const result = await authService.login(loginRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Login error:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });

    it('should handle database error during session creation', async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(mockUserRepository, 'findByEmail').mockResolvedValue(mockUser);
      verifyPasswordMock.mockResolvedValue(true);
      vi.spyOn(mockJwtService, 'generateTokenPair').mockResolvedValue(mockTokenPair);
      vi.spyOn(mockUserRepository, 'updateLastLogin').mockResolvedValue(mockUser);
      vi.spyOn(mockSessionRepository, 'create').mockRejectedValue(new Error('Session creation failed'));

      // Act
      const result = await authService.login(loginRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Login error:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });

  });

  describe('refreshToken', () => {
    const refreshRequest: RefreshTokenRequest = {
      refreshToken: mockTokenPair.refreshToken,
      deviceInfo: 'Chrome 120 | Windows',
      ipAddress: '192.168.1.1',
    };

    const mockPayload: JwtPayload = {
      userId: mockUser.id,
      email: mockUser.email,
      role: 'member',
      workspaceId: 'workspace-123',
    };

    it('should generate new access token with valid refresh token', async () => {
      // Arrange
      vi.spyOn(mockJwtService, 'verifyToken').mockResolvedValue({
        valid: true,
        payload: mockPayload,
      });
      vi.spyOn(mockSessionRepository, 'findByRefreshToken').mockResolvedValue(mockSession);
      vi.spyOn(mockJwtService, 'generateAccessToken').mockResolvedValue(mockTokenPair.accessToken);

      // Act
      const result = await authService.refreshToken(refreshRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.accessToken).toBe(mockTokenPair.accessToken);
      expect(result.error).toBeUndefined();

      expect(mockJwtService.verifyToken).toHaveBeenCalledWith(refreshRequest.refreshToken, 'refresh');
      expect(mockSessionRepository.findByRefreshToken).toHaveBeenCalledWith(refreshRequest.refreshToken);
      expect(mockJwtService.generateAccessToken).toHaveBeenCalledWith(mockPayload);
    });

    it('should return error for invalid refresh token', async () => {
      // Arrange
      vi.spyOn(mockJwtService, 'verifyToken').mockResolvedValue({
        valid: false,
        error: 'Invalid token signature',
      });

      // Act
      const result = await authService.refreshToken(refreshRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid refresh token');
      expect(result.accessToken).toBeUndefined();

      // Verify session lookup was not called
      expect(mockSessionRepository.findByRefreshToken).not.toHaveBeenCalled();
    });

    it('should return error for expired refresh token', async () => {
      // Arrange
      vi.spyOn(mockJwtService, 'verifyToken').mockResolvedValue({
        valid: false,
        error: 'Token expired',
      });

      // Act
      const result = await authService.refreshToken(refreshRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid refresh token');
      expect(result.accessToken).toBeUndefined();
    });

    it('should return error when session not found for valid token', async () => {
      // Arrange
      vi.spyOn(mockJwtService, 'verifyToken').mockResolvedValue({
        valid: true,
        payload: mockPayload,
      });
      vi.spyOn(mockSessionRepository, 'findByRefreshToken').mockResolvedValue(null);

      // Act
      const result = await authService.refreshToken(refreshRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Session not found');
      expect(result.accessToken).toBeUndefined();
    });

    it('should preserve JWT payload fields (userId, email, role, workspaceId)', async () => {
      // Arrange
      const fullPayload: JwtPayload = {
        userId: '0x456',
        email: 'admin@example.com',
        role: 'admin',
        workspaceId: 'workspace-789',
      };

      vi.spyOn(mockJwtService, 'verifyToken').mockResolvedValue({
        valid: true,
        payload: fullPayload,
      });
      vi.spyOn(mockSessionRepository, 'findByRefreshToken').mockResolvedValue(mockSession);
      vi.spyOn(mockJwtService, 'generateAccessToken').mockResolvedValue(mockTokenPair.accessToken);

      // Act
      await authService.refreshToken(refreshRequest);

      // Assert
      expect(mockJwtService.generateAccessToken).toHaveBeenCalledWith({
        userId: fullPayload.userId,
        email: fullPayload.email,
        role: fullPayload.role,
        workspaceId: fullPayload.workspaceId,
      });
    });

    it('should handle database error during session lookup', async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(mockJwtService, 'verifyToken').mockResolvedValue({
        valid: true,
        payload: mockPayload,
      });
      vi.spyOn(mockSessionRepository, 'findByRefreshToken').mockRejectedValue(
        new Error('Database error')
      );

      // Act
      const result = await authService.refreshToken(refreshRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to refresh token');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Token refresh error:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });

    it('should handle error when payload is missing from verification result', async () => {
      // Arrange
      vi.spyOn(mockJwtService, 'verifyToken').mockResolvedValue({
        valid: true,
        payload: undefined,
      });

      // Act
      const result = await authService.refreshToken(refreshRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid refresh token');
    });
  });

  describe('logout', () => {
    const logoutRequest: LogoutRequest = {
      refreshToken: mockTokenPair.refreshToken,
    };

    it('should successfully deactivate session with valid refresh token', async () => {
      // Arrange
      vi.spyOn(mockSessionRepository, 'findByRefreshToken').mockResolvedValue(mockSession);
      vi.spyOn(mockSessionRepository, 'deactivate').mockResolvedValue({
        ...mockSession,
        isActive: false,
      });

      // Act
      const result = await authService.logout(logoutRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockSessionRepository.findByRefreshToken).toHaveBeenCalledWith(logoutRequest.refreshToken);
      expect(mockSessionRepository.deactivate).toHaveBeenCalledWith(mockSession.id);
    });

    it('should return success for invalid refresh token (idempotent logout)', async () => {
      // Arrange
      vi.spyOn(mockSessionRepository, 'findByRefreshToken').mockResolvedValue(null);

      // Act
      const result = await authService.logout(logoutRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockSessionRepository.deactivate).not.toHaveBeenCalled();
    });

    it('should not expose session state in error handling', async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(mockSessionRepository, 'findByRefreshToken').mockRejectedValue(
        new Error('Database error')
      );

      // Act
      const result = await authService.logout(logoutRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Logout failed');
      // Error message should be generic, not expose database state
      expect(result.error).not.toContain('Database');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Logout error:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });

    it('should handle deactivation failure gracefully', async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(mockSessionRepository, 'findByRefreshToken').mockResolvedValue(mockSession);
      vi.spyOn(mockSessionRepository, 'deactivate').mockRejectedValue(
        new Error('Deactivation failed')
      );

      // Act
      const result = await authService.logout(logoutRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Logout failed');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('verifyAccessToken', () => {
    it('should return payload for valid access token', async () => {
      // Arrange
      const mockPayload: JwtPayload = {
        userId: mockUser.id,
        email: mockUser.email,
        role: 'member',
        workspaceId: 'workspace-123',
      };

      vi.spyOn(mockJwtService, 'verifyToken').mockResolvedValue({
        valid: true,
        payload: mockPayload,
      });

      // Act
      const result = await authService.verifyAccessToken(mockTokenPair.accessToken);

      // Assert
      expect(result).toEqual(mockPayload);
      expect(mockJwtService.verifyToken).toHaveBeenCalledWith(mockTokenPair.accessToken, 'access');
    });

    it('should return null for invalid access token', async () => {
      // Arrange
      vi.spyOn(mockJwtService, 'verifyToken').mockResolvedValue({
        valid: false,
        error: 'Invalid token',
      });

      // Act
      const result = await authService.verifyAccessToken('invalid-token');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when payload is missing', async () => {
      // Arrange
      vi.spyOn(mockJwtService, 'verifyToken').mockResolvedValue({
        valid: true,
        payload: undefined,
      });

      // Act
      const result = await authService.verifyAccessToken(mockTokenPair.accessToken);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should return payload for valid refresh token', async () => {
      // Arrange
      const mockPayload: JwtPayload = {
        userId: mockUser.id,
        email: mockUser.email,
      };

      vi.spyOn(mockJwtService, 'verifyToken').mockResolvedValue({
        valid: true,
        payload: mockPayload,
      });

      // Act
      const result = await authService.verifyRefreshToken(mockTokenPair.refreshToken);

      // Assert
      expect(result).toEqual(mockPayload);
      expect(mockJwtService.verifyToken).toHaveBeenCalledWith(mockTokenPair.refreshToken, 'refresh');
    });

    it('should return null for invalid refresh token', async () => {
      // Arrange
      vi.spyOn(mockJwtService, 'verifyToken').mockResolvedValue({
        valid: false,
        error: 'Token expired',
      });

      // Act
      const result = await authService.verifyRefreshToken('invalid-token');

      // Assert
      expect(result).toBeNull();
    });
  });
});
