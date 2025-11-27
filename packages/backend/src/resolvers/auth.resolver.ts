import { GraphQLError } from 'graphql';
import { AuthenticationService } from '../services/auth/auth.service';
import { JwtService } from '../services/auth/jwt.service';
import { apolloResolversTypes } from '@2ly/common';
import { UserRepository } from '../repositories/user.repository';
import { PasswordPolicyService } from '../services/auth/password-policy.service';


export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterUserPayload {
  success: boolean;
  user?: apolloResolversTypes.User;
  tokens?: Tokens;
  errors: string[];
}

export interface LogoutUserPayload {
  success: boolean;
  errors: string[];
}

/**
 * Authentication resolvers for GraphQL mutations.
 */
export class AuthResolver {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
    private readonly passwordPolicyService: PasswordPolicyService
  ) { }

  /**
   * Register user mutation - create new user account and return tokens.
   */
  async registerUser(
    input: apolloResolversTypes.RegisterUserInput
  ): Promise<RegisterUserPayload> {
    try {
      // Validate password against policy
      const passwordValidation = this.passwordPolicyService.validatePassword(input.password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          errors: passwordValidation.errors,
        };
      }

      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(input.email);
      if (existingUser) {
        return {
          success: false,
          errors: ['User with this email already exists'],
        };
      }

      // Create new user
      const user = await this.userRepository.create(input.email, input.password);

      // Generate JWT tokens
      const tokenPair = await this.jwtService.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: 'member',
        workspaceId: undefined,
      });

      return {
        success: true,
        user,
        tokens: tokenPair,
        errors: [],
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        errors: ['Registration failed'],
      };
    }
  }

  /**
   * Login mutation - authenticate user and return tokens.
   */
  async login(
    input: apolloResolversTypes.LoginInput,
    context: { req?: { ip?: string; headers?: { [key: string]: string } } }
  ): Promise<apolloResolversTypes.AuthPayload> {
    try {
      // Extract request metadata
      const ipAddress = context.req?.ip;
      const userAgent = context.req?.headers?.['user-agent'];

      const result = await this.authService.login({
        credentials: {
          email: input.email,
          password: input.password,
        },
        deviceInfo: input.deviceInfo || undefined,
        ipAddress,
        userAgent,
      });

      if (!result.success) {
        if (result.accountLocked) {
          throw new GraphQLError(result.error || 'Account temporarily locked', {
            extensions: {
              code: 'ACCOUNT_LOCKED',
            },
          });
        }

        throw new GraphQLError(result.error || 'Authentication failed', {
          extensions: {
            code: 'UNAUTHENTICATED',
          },
        });
      }

      if (!result.user || !result.tokens) {
        throw new GraphQLError('Authentication failed', {
          extensions: {
            code: 'UNAUTHENTICATED',
          },
        });
      }

      return {
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        expiresIn: 3600,
      };
    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }

      console.error('Login resolver error:', error);
      throw new GraphQLError('Authentication service temporarily unavailable', {
        extensions: {
          code: 'INTERNAL_ERROR',
        },
      });
    }
  }

  /**
   * Refresh token mutation - generate new access token.
   */
  async refreshToken(input: apolloResolversTypes.RefreshTokenInput): Promise<apolloResolversTypes.RefreshTokenPayload> {
    try {
      const result = await this.authService.refreshToken({
        refreshToken: input.refreshToken,
      });

      if (!result.success || !result.accessToken) {
        return {
          success: false,
          accessToken: '',
          errors: [result.error || 'Token refresh failed'],
          expiresIn: 0,
        };
      }

      return {
        success: true,
        accessToken: result.accessToken,
        errors: [],
        expiresIn: 3600, // 1 hour in seconds
      };
    } catch (error) {
      console.error('Refresh token resolver error:', error);
      return {
        success: false,
        accessToken: '',
        errors: ['Token refresh service temporarily unavailable'],
        expiresIn: 0,
      };
    }
  }

  /**
   * Logout mutation - invalidate refresh token and session.
   */
  async logout(input: apolloResolversTypes.LogoutInput): Promise<boolean> {
    try {
      const result = await this.authService.logout({
        refreshToken: input.refreshToken,
      });

      if (!result.success) {
        console.warn('Logout failed:', result.error);
        // Return true anyway for security (don't reveal session state)
      }

      return true;
    } catch (error) {
      console.error('Logout resolver error:', error);
      // Return true for security (logout should appear to succeed)
      return true;
    }
  }

  /**
   * LogoutUser mutation - invalidate refresh token and session (with error reporting).
   */
  async logoutUser(input: apolloResolversTypes.LogoutUserInput): Promise<LogoutUserPayload> {
    try {
      const result = await this.authService.logout({
        refreshToken: input.refreshToken,
      });

      return {
        success: result.success,
        errors: result.success ? [] : [result.error || 'Logout failed'],
      };
    } catch (error) {
      console.error('LogoutUser resolver error:', error);
      return {
        success: false,
        errors: ['Logout service temporarily unavailable'],
      };
    }
  }

  /**
   * Get current authenticated user (me query).
   */
  async me(context: { user?: { userId: string; email: string } }): Promise<{ id: string; email: string; createdAt: Date; updatedAt: Date }> {
    try {
      // The user should be available in context after authentication middleware
      const user = context.user;
      if (!user) {
        throw new GraphQLError('User not authenticated', {
          extensions: {
            code: 'UNAUTHENTICATED',
          },
        });
      }

      // Return user in the format expected by GraphQL schema (User type)
      return {
        id: user.userId,
        email: user.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }

      console.error('Me query resolver error:', error);
      throw new GraphQLError('Authentication service temporarily unavailable', {
        extensions: {
          code: 'INTERNAL_ERROR',
        },
      });
    }
  }
}

/**
 * Factory function to create resolver functions for GraphQL schema.
 */
export function createAuthResolvers(
  authService: AuthenticationService,
  jwtService: JwtService,
  userRepository: UserRepository,
  passwordPolicyService: PasswordPolicyService
) {
  const resolver = new AuthResolver(authService, jwtService, userRepository, passwordPolicyService);

  return {
    Query: {
      me: (
        _: unknown,
        __: unknown,
        context: { user?: { userId: string; email: string } }
      ) => resolver.me(context),
    },
    Mutation: {
      registerUser: (
        _: unknown,
        { input }: { input: apolloResolversTypes.RegisterUserInput }
      ) => resolver.registerUser(input),

      login: (
        _: unknown,
        { input }: { input: apolloResolversTypes.LoginInput },
        context: unknown
      ) => resolver.login(input, context as { req?: { ip?: string; headers?: { [key: string]: string } } }),

      refreshToken: (
        _: unknown,
        { input }: { input: apolloResolversTypes.RefreshTokenInput }
      ) => resolver.refreshToken(input),

      logout: (
        _: unknown,
        { input }: { input: apolloResolversTypes.LogoutInput }
      ) => resolver.logout(input),

      logoutUser: (
        _: unknown,
        { input }: { input: apolloResolversTypes.LogoutUserInput }
      ) => resolver.logoutUser(input),
    },
  };
}