import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GraphQLError } from 'graphql';
import { AuthResolver } from './auth.resolver';
import { AuthenticationService, LoginResult } from '../services/auth/auth.service';
import { JwtService, TokenPair } from '../services/auth/jwt.service';
import { UserRepository } from '../repositories/user.repository';
import { PasswordPolicyService } from '../services/auth/password-policy.service';
import { apolloResolversTypes, dgraphResolversTypes } from '@skilder-ai/common';

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let mockAuthService: AuthenticationService;
  let mockJwtService: JwtService;
  let mockUserRepository: UserRepository;
  let mockPasswordPolicyService: PasswordPolicyService;

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

  beforeEach(() => {
    // Silence console errors and warnings in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Create mock instances
    mockAuthService = {
      login: vi.fn(),
      refreshToken: vi.fn(),
      logout: vi.fn(),
      verifyAccessToken: vi.fn(),
      verifyRefreshToken: vi.fn(),
    } as unknown as AuthenticationService;

    mockJwtService = {
      generateTokenPair: vi.fn(),
      generateAccessToken: vi.fn(),
      verifyToken: vi.fn(),
      extractTokenFromHeader: vi.fn(),
      getAccessTokenTtl: vi.fn(),
      getRefreshTokenTtl: vi.fn(),
    } as unknown as JwtService;

    mockUserRepository = {
      findByEmail: vi.fn(),
      create: vi.fn(),
      updateLastLogin: vi.fn(),
      updatePassword: vi.fn(),
      updateEmail: vi.fn(),
      addAdminToWorkspace: vi.fn(),
      addMemberToWorkspace: vi.fn(),
      incrementFailedLoginAttempts: vi.fn(),
      unlockAccount: vi.fn(),
      isAccountLocked: vi.fn(),
    } as unknown as UserRepository;

    mockPasswordPolicyService = {
      validatePassword: vi.fn(),
      getPolicyConfig: vi.fn(),
      generateSecurePassword: vi.fn(),
    } as unknown as PasswordPolicyService;

    resolver = new AuthResolver(
      mockAuthService,
      mockJwtService,
      mockUserRepository,
      mockPasswordPolicyService
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('login', () => {
    const loginInput: apolloResolversTypes.LoginInput = {
      email: 'test@example.com',
      password: 'password123',
      deviceInfo: 'Chrome 120 | Windows',
    };

    const context = {
      req: {
        ip: '192.168.1.1',
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        },
      },
    };

    it('should call AuthenticationService with correct parameters', async () => {
      // Arrange
      const loginResult: LoginResult = {
        success: true,
        user: mockUser,
        tokens: mockTokenPair,
      };

      vi.spyOn(mockAuthService, 'login').mockResolvedValue(loginResult);

      // Act
      await resolver.login(loginInput, context);

      // Assert
      expect(mockAuthService.login).toHaveBeenCalledWith({
        credentials: {
          email: loginInput.email,
          password: loginInput.password,
        },
        deviceInfo: loginInput.deviceInfo,
        ipAddress: context.req.ip,
        userAgent: context.req.headers['user-agent'],
      });
    });

    it('should return account locked response format', async () => {
      // Arrange
      const loginResult: LoginResult = {
        success: false,
        accountLocked: true,
        error: 'Account temporarily locked',
        lockExpiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      };

      vi.spyOn(mockAuthService, 'login').mockResolvedValue(loginResult);

      // Act
      const result = await resolver.login(loginInput, context);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toEqual(['Account temporarily locked']);
      expect(result.tokens).toBeNull();
      expect(result.accessToken).toBe('');
      expect(result.refreshToken).toBe('');
      expect(result.expiresIn).toBe(0);
    });

    it('should return authentication failed response format', async () => {
      // Arrange
      const loginResult: LoginResult = {
        success: false,
        error: 'Invalid email or password',
      };

      vi.spyOn(mockAuthService, 'login').mockResolvedValue(loginResult);

      // Act
      const result = await resolver.login(loginInput, context);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toEqual(['Invalid email or password']);
      expect(result.tokens).toBeNull();
      expect(result.accessToken).toBe('');
      expect(result.refreshToken).toBe('');
    });

    it('should return successful login response structure', async () => {
      // Arrange
      const loginResult: LoginResult = {
        success: true,
        user: mockUser,
        tokens: mockTokenPair,
      };

      vi.spyOn(mockAuthService, 'login').mockResolvedValue(loginResult);

      // Act
      const result = await resolver.login(loginInput, context);

      // Assert
      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(result.tokens).toEqual({
        accessToken: mockTokenPair.accessToken,
        refreshToken: mockTokenPair.refreshToken,
      });
      expect(result.accessToken).toBe(mockTokenPair.accessToken);
      expect(result.refreshToken).toBe(mockTokenPair.refreshToken);
      expect(result.expiresIn).toBe(3600);
      expect(result.errors).toEqual([]);
    });

    it('should handle error and return generic error message', async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(mockAuthService, 'login').mockRejectedValue(new Error('Service error'));

      // Act
      const result = await resolver.login(loginInput, context);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toEqual(['Authentication service temporarily unavailable']);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Login resolver error:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('registerUser', () => {
    const registerInput: apolloResolversTypes.RegisterUserInput = {
      email: 'newuser@example.com',
      password: 'securePassword123',
    };

    it('should validate password against policy', async () => {
      // Arrange
      vi.spyOn(mockPasswordPolicyService, 'validatePassword').mockReturnValue({
        isValid: true,
        errors: [],
      });
      vi.spyOn(mockUserRepository, 'findByEmail').mockResolvedValue(null);
      vi.spyOn(mockUserRepository, 'create').mockResolvedValue(mockUser);
      vi.spyOn(mockJwtService, 'generateTokenPair').mockResolvedValue(mockTokenPair);

      // Act
      await resolver.registerUser(registerInput);

      // Assert
      expect(mockPasswordPolicyService.validatePassword).toHaveBeenCalledWith(registerInput.password);
    });

    it('should return errors when password validation fails', async () => {
      // Arrange
      vi.spyOn(mockPasswordPolicyService, 'validatePassword').mockReturnValue({
        isValid: false,
        errors: ['Password must be at least 8 characters long'],
      });

      // Act
      const result = await resolver.registerUser(registerInput);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toEqual(['Password must be at least 8 characters long']);
      expect(result.user).toBeUndefined();
      expect(result.tokens).toBeUndefined();
    });

    it('should handle duplicate email', async () => {
      // Arrange
      vi.spyOn(mockPasswordPolicyService, 'validatePassword').mockReturnValue({
        isValid: true,
        errors: [],
      });
      vi.spyOn(mockUserRepository, 'findByEmail').mockResolvedValue(mockUser);

      // Act
      const result = await resolver.registerUser(registerInput);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toEqual(['User with this email already exists']);
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should create user and return tokens on success', async () => {
      // Arrange
      vi.spyOn(mockPasswordPolicyService, 'validatePassword').mockReturnValue({
        isValid: true,
        errors: [],
      });
      vi.spyOn(mockUserRepository, 'findByEmail').mockResolvedValue(null);
      vi.spyOn(mockUserRepository, 'create').mockResolvedValue(mockUser);
      vi.spyOn(mockJwtService, 'generateTokenPair').mockResolvedValue(mockTokenPair);

      // Act
      const result = await resolver.registerUser(registerInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(result.tokens).toEqual(mockTokenPair);
      expect(result.errors).toEqual([]);
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        registerInput.email,
        registerInput.password
      );
    });

    it('should handle registration errors gracefully', async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(mockPasswordPolicyService, 'validatePassword').mockReturnValue({
        isValid: true,
        errors: [],
      });
      vi.spyOn(mockUserRepository, 'findByEmail').mockResolvedValue(null);
      vi.spyOn(mockUserRepository, 'create').mockRejectedValue(new Error('Database error'));

      // Act
      const result = await resolver.registerUser(registerInput);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toEqual(['Registration failed']);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Registration error:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('refreshToken', () => {
    const refreshInput: apolloResolversTypes.RefreshTokenInput = {
      refreshToken: mockTokenPair.refreshToken,
    };

    it('should return new access token on success', async () => {
      // Arrange
      vi.spyOn(mockAuthService, 'refreshToken').mockResolvedValue({
        success: true,
        accessToken: 'new-access-token',
      });

      // Act
      const result = await resolver.refreshToken(refreshInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('new-access-token');
      expect(result.expiresIn).toBe(3600);
      expect(result.errors).toEqual([]);
    });

    it('should return error when refresh fails', async () => {
      // Arrange
      vi.spyOn(mockAuthService, 'refreshToken').mockResolvedValue({
        success: false,
        error: 'Invalid refresh token',
      });

      // Act
      const result = await resolver.refreshToken(refreshInput);

      // Assert
      expect(result.success).toBe(false);
      expect(result.accessToken).toBe('');
      expect(result.errors).toEqual(['Invalid refresh token']);
      expect(result.expiresIn).toBe(0);
    });

    it('should handle refresh token errors gracefully', async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(mockAuthService, 'refreshToken').mockRejectedValue(new Error('Service error'));

      // Act
      const result = await resolver.refreshToken(refreshInput);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toEqual(['Token refresh service temporarily unavailable']);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Refresh token resolver error:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('logout', () => {
    const logoutInput: apolloResolversTypes.LogoutInput = {
      refreshToken: mockTokenPair.refreshToken,
    };

    it('should return true on successful logout', async () => {
      // Arrange
      vi.spyOn(mockAuthService, 'logout').mockResolvedValue({
        success: true,
      });

      // Act
      const result = await resolver.logout(logoutInput);

      // Assert
      expect(result).toBe(true);
      expect(mockAuthService.logout).toHaveBeenCalledWith({
        refreshToken: logoutInput.refreshToken,
      });
    });

    it('should return true on error (logout should appear to succeed)', async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(mockAuthService, 'logout').mockRejectedValue(new Error('Service error'));

      // Act
      const result = await resolver.logout(logoutInput);

      // Assert
      expect(result).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Logout resolver error:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('logoutUser', () => {
    const logoutInput: apolloResolversTypes.LogoutUserInput = {
      refreshToken: mockTokenPair.refreshToken,
    };

    it('should return success payload on successful logout', async () => {
      // Arrange
      vi.spyOn(mockAuthService, 'logout').mockResolvedValue({
        success: true,
      });

      // Act
      const result = await resolver.logoutUser(logoutInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return error payload when logout fails', async () => {
      // Arrange
      vi.spyOn(mockAuthService, 'logout').mockResolvedValue({
        success: false,
        error: 'Logout failed',
      });

      // Act
      const result = await resolver.logoutUser(logoutInput);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toEqual(['Logout failed']);
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(mockAuthService, 'logout').mockRejectedValue(new Error('Service error'));

      // Act
      const result = await resolver.logoutUser(logoutInput);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toEqual(['Logout service temporarily unavailable']);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('me', () => {
    it('should return user from context', async () => {
      // Arrange
      const context = {
        user: {
          userId: '0x123',
          email: 'test@example.com',
        },
      };

      // Act
      const result = await resolver.me(context);

      // Assert
      expect(result.id).toBe('0x123');
      expect(result.email).toBe('test@example.com');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw UNAUTHENTICATED error when user is not in context', async () => {
      // Arrange
      const context = {};

      // Act & Assert
      await expect(resolver.me(context)).rejects.toThrow(GraphQLError);
      await expect(resolver.me(context)).rejects.toThrow('User not authenticated');
    });
  });
});
