import { FastifyRequest } from 'fastify';
import { injectable, inject } from 'inversify';
import { AuthenticationService } from '../services/auth/auth.service';
import { GraphQLResolveInfo } from 'graphql';
import { JwtPayload } from '../services/auth/jwt.service';

export interface AuthContext {
  user?: {
    userId: string;
    email: string;
    workspaceId?: string;
    role: string;
  };
  isAuthenticated: boolean;
  request: FastifyRequest;
}

export interface AuthenticatedContext extends AuthContext {
  user: {
    userId: string;
    email: string;
    workspaceId?: string;
    role: string;
  };
  isAuthenticated: true;
}

/**
 * GraphQL authentication middleware that validates JWT tokens and creates user context.
 */
@injectable()
export class GraphQLAuthMiddleware {
  constructor(
    @inject(AuthenticationService) private readonly authService: AuthenticationService
  ) { }

  /**
   * Create GraphQL context with authentication information from request.
   */
  async createContext(request: FastifyRequest): Promise<AuthContext> {
    try {
      const authHeader = request.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return this.createUnauthenticatedContext(request);
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      const payload = await this.authService.verifyAccessToken(token);

      if (!payload) {
        request.log.warn({
          event: 'invalid_jwt_token',
          ip: request.ip,
          userAgent: request.headers['user-agent'],
        }, 'Invalid JWT token provided');

        return this.createUnauthenticatedContext(request);
      }

      return this.createAuthenticatedContext(request, payload);
    } catch (error) {
      request.log.error({
        event: 'auth_context_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      }, 'Error creating authentication context');

      return this.createUnauthenticatedContext(request);
    }
  }

  /**
   * Create authenticated context from JWT payload.
   */
  private createAuthenticatedContext(
    request: FastifyRequest,
    payload: JwtPayload
  ): AuthenticatedContext {
    const user = {
      userId: payload.userId,
      email: payload.email,
      workspaceId: payload.workspaceId,
      role: payload.role || 'member',
    };

    request.log.info({
      event: 'authenticated_request',
      userId: payload.userId,
      email: payload.email,
      workspaceId: payload.workspaceId,
      role: payload.role,
      ip: request.ip,
    }, 'Authenticated GraphQL request');

    return {
      user,
      isAuthenticated: true,
      request,
    };
  }

  /**
   * Create unauthenticated context.
   */
  private createUnauthenticatedContext(request: FastifyRequest): AuthContext {
    return {
      isAuthenticated: false,
      request,
    };
  }

  /**
   * Middleware hook to extract and validate user from context.
   * Use this in resolvers that require authentication.
   */
  requireAuth(context: AuthContext): AuthenticatedContext {
    if (!context.isAuthenticated || !context.user) {
      throw new Error('Authentication required');
    }

    return context as AuthenticatedContext;
  }

  /**
   * Middleware hook to check if user has required role.
   */
  requireRole(context: AuthContext, requiredRoles: string[]): AuthenticatedContext {
    const authContext = this.requireAuth(context);

    if (!requiredRoles.includes(authContext.user.role)) {
      throw new Error(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
    }

    return authContext;
  }

  /**
   * Middleware hook to check if user has access to workspace.
   */
  requireWorkspaceAccess(
    context: AuthContext,
    workspaceId: string,
    allowAdmin: boolean = true
  ): AuthenticatedContext {
    const authContext = this.requireAuth(context);

    // Admin can access any workspace if allowed
    if (allowAdmin && authContext.user.role === 'admin') {
      return authContext;
    }

    // Check if user has access to the specific workspace
    if (authContext.user.workspaceId !== workspaceId) {
      throw new Error('Access denied to this workspace');
    }

    return authContext;
  }

  /**
   * Extract workspace ID from arguments or source object.
   */
  extractWorkspaceId(args: Record<string, unknown>, source: Record<string, unknown> | null): string | null {
    return (args.workspaceId as string) || (source?.workspaceId as string) || null;
  }

  /**
   * Log authentication event for audit purposes.
   */
  logAuthEvent(
    context: AuthContext,
    event: string,
    details?: Record<string, unknown>
  ): void {
    const logData: Record<string, unknown> = {
      event,
      isAuthenticated: context.isAuthenticated,
      ip: context.request.ip,
      userAgent: context.request.headers['user-agent'],
      timestamp: new Date().toISOString(),
      ...details,
    };

    if (context.isAuthenticated && context.user) {
      logData.userId = context.user.userId;
      logData.email = context.user.email;
      logData.role = context.user.role;
      logData.workspaceId = context.user.workspaceId;
    }

    context.request.log.info(logData, `Authentication event: ${event}`);
  }

  /**
   * Create a resolver wrapper that requires authentication.
   */
  withAuth<TSource, TArgs, TContext extends AuthContext, TReturn>(
    resolver: (
      source: TSource,
      args: TArgs,
      context: AuthenticatedContext,
      info: GraphQLResolveInfo
    ) => TReturn
  ) {
    return (source: TSource, args: TArgs, context: TContext, info: GraphQLResolveInfo): TReturn => {
      const authContext = this.requireAuth(context);
      this.logAuthEvent(authContext, 'resolver_access', {
        resolver: info.fieldName,
        parentType: info.parentType.name,
      });
      return resolver(source, args, authContext, info);
    };
  }

  /**
   * Create a resolver wrapper that requires specific roles.
   */
  withRole<TSource, TArgs, TContext extends AuthContext, TReturn>(
    requiredRoles: string[],
    resolver: (
      source: TSource,
      args: TArgs,
      context: AuthenticatedContext,
      info: GraphQLResolveInfo
    ) => TReturn
  ) {
    return (source: TSource, args: TArgs, context: TContext, info: GraphQLResolveInfo): TReturn => {
      const authContext = this.requireRole(context, requiredRoles);
      this.logAuthEvent(authContext, 'role_based_access', {
        resolver: info.fieldName,
        parentType: info.parentType.name,
        requiredRoles,
        userRole: authContext.user.role,
      });
      return resolver(source, args, authContext, info);
    };
  }

  /**
   * Create a resolver wrapper that requires workspace access.
   */
  withWorkspaceAccess<TSource, TArgs, TContext extends AuthContext, TReturn>(
    resolver: (
      source: TSource,
      args: TArgs,
      context: AuthenticatedContext,
      info: GraphQLResolveInfo
    ) => TReturn,
    allowAdmin: boolean = true
  ) {
    return (source: TSource, args: TArgs, context: TContext, info: GraphQLResolveInfo): TReturn => {
      const workspaceId = this.extractWorkspaceId(args as Record<string, unknown>, source as Record<string, unknown> | null);

      if (!workspaceId) {
        throw new Error('Workspace context required');
      }

      const authContext = this.requireWorkspaceAccess(context, workspaceId, allowAdmin);
      this.logAuthEvent(authContext, 'workspace_access', {
        resolver: info.fieldName,
        parentType: info.parentType.name,
        workspaceId,
        allowAdmin,
      });

      return resolver(source, args, authContext, info);
    };
  }
}