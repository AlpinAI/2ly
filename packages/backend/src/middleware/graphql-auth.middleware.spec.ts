import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FastifyRequest } from 'fastify';
import { GraphQLAuthMiddleware, AuthContext, AuthenticatedContext } from './graphql-auth.middleware';
import { AuthenticationService } from '../services/auth/auth.service';
import { JwtPayload } from '../services/auth/jwt.service';
import { GraphQLResolveInfo } from 'graphql';
import { WorkspaceRepository } from '../repositories';

// Mock authentication service
const mockVerifyAccessToken = vi.fn();
const mockAuthService = {
  verifyAccessToken: mockVerifyAccessToken,
} as unknown as AuthenticationService;

// Mock workspace repository
const mockHasUserAccess = vi.fn();
const mockWorkspaceRepository = {
  hasUserAccess: mockHasUserAccess,
} as unknown as WorkspaceRepository;

describe('GraphQLAuthMiddleware', () => {
  let middleware: GraphQLAuthMiddleware;
  let mockRequest: Partial<FastifyRequest>;

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    middleware = new GraphQLAuthMiddleware(mockAuthService, mockWorkspaceRepository);
    mockRequest = {
      headers: {},
      ip: '127.0.0.1',
      log: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        fatal: vi.fn(),
        trace: vi.fn(),
        child: vi.fn(),
        silent: vi.fn(),
        level: 'info',
      },
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Context Creation', () => {
    it('should create unauthenticated context when no auth header', async () => {
      const context = await middleware.createContext(mockRequest as FastifyRequest);

      expect(context.isAuthenticated).toBe(false);
      expect(context.user).toBeUndefined();
      expect(context.request).toBe(mockRequest);
    });

    it('should create unauthenticated context when auth header is malformed', async () => {
      mockRequest.headers = { authorization: 'InvalidFormat token123' };

      const context = await middleware.createContext(mockRequest as FastifyRequest);

      expect(context.isAuthenticated).toBe(false);
      expect(context.user).toBeUndefined();
    });

    it('should create unauthenticated context when token is invalid', async () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };
      mockVerifyAccessToken.mockResolvedValue(null);

      const context = await middleware.createContext(mockRequest as FastifyRequest);

      expect(context.isAuthenticated).toBe(false);
      expect(context.user).toBeUndefined();
      expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith('invalid-token');
      expect(mockRequest.log!.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'invalid_jwt_token',
        }),
        'Invalid JWT token provided'
      );
    });

    it('should create authenticated context when token is valid', async () => {
      const jwtPayload: JwtPayload = {
        userId: '123',
        email: 'user1@skilder.ai',
        workspaceId: 'ws1',
        role: 'member',
      };

      mockRequest.headers = { authorization: 'Bearer valid-token' };
      mockVerifyAccessToken.mockResolvedValue(jwtPayload);

      const context = await middleware.createContext(mockRequest as FastifyRequest);

      expect(context.isAuthenticated).toBe(true);
      expect(context.user).toEqual({
        userId: '123',
        email: 'user1@skilder.ai',
        workspaceId: 'ws1',
        role: 'member',
      });
      expect(mockRequest.log!.info).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'authenticated_request',
          userId: '123',
        }),
        'Authenticated GraphQL request'
      );
    });

    it('should handle errors gracefully and return unauthenticated context', async () => {
      mockRequest.headers = { authorization: 'Bearer token' };
      mockVerifyAccessToken.mockRejectedValue(new Error('Service error'));

      const context = await middleware.createContext(mockRequest as FastifyRequest);

      expect(context.isAuthenticated).toBe(false);
      expect(context.user).toBeUndefined();
      expect(mockRequest.log!.error).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'auth_context_error',
        }),
        'Error creating authentication context'
      );
    });
  });

  describe('Authentication Requirements', () => {
    it('should throw error when requiring auth on unauthenticated context', () => {
      const context: AuthContext = {
        isAuthenticated: false,
        request: mockRequest as FastifyRequest,
      };

      expect(() => middleware.requireAuth(context)).toThrow('Authentication required');
    });

    it('should return authenticated context when requiring auth on authenticated context', () => {
      const context: AuthContext = {
        isAuthenticated: true,
        user: {
          userId: '123',
          email: 'user1@skilder.ai',
          workspaceId: 'ws1',
          role: 'member',
        },
        request: mockRequest as FastifyRequest,
      };

      const authContext = middleware.requireAuth(context);
      expect(authContext.isAuthenticated).toBe(true);
      expect(authContext.user).toBeDefined();
    });
  });

  describe('Role-Based Access Control', () => {
    it('should throw error when user does not have required role', () => {
      const context: AuthContext = {
        isAuthenticated: true,
        user: {
          userId: '123',
          email: 'user1@skilder.ai',
          workspaceId: 'ws1',
          role: 'member',
        },
        request: mockRequest as FastifyRequest,
      };

      expect(() => middleware.requireRole(context, ['admin'])).toThrow(
        'Access denied. Required roles: admin'
      );
    });

    it('should allow access when user has required role', () => {
      const context: AuthContext = {
        isAuthenticated: true,
        user: {
          userId: '456',
          email: 'user1@skilder.ai',
          workspaceId: 'ws1',
          role: 'admin',
        },
        request: mockRequest as FastifyRequest,
      };

      const authContext = middleware.requireRole(context, ['admin']);
      expect(authContext.user.role).toBe('admin');
    });

    it('should allow access when user has one of multiple required roles', () => {
      const context: AuthContext = {
        isAuthenticated: true,
        user: {
          userId: '123',
          email: 'user1@skilder.ai',
          workspaceId: 'ws1',
          role: 'member',
        },
        request: mockRequest as FastifyRequest,
      };

      const authContext = middleware.requireRole(context, ['member', 'admin']);
      expect(authContext.user.role).toBe('member');
    });
  });

  describe('Workspace Access Control', () => {
    it('should allow admin access to any workspace by default', async () => {
      const context: AuthContext = {
        isAuthenticated: true,
        user: {
          userId: '456',
          email: 'user1@skilder.ai',
          workspaceId: 'ws1',
          role: 'admin',
        },
        request: mockRequest as FastifyRequest,
      };

      const authContext = await middleware.requireWorkspaceAccess(context, 'different-ws');
      expect(authContext.user.workspaceId).toBe('ws1');
    });

    it('should deny admin access when allowAdmin is false and no DB access', async () => {
      mockHasUserAccess.mockResolvedValue(false);
      const context: AuthContext = {
        isAuthenticated: true,
        user: {
          userId: '456',
          email: 'user1@skilder.ai',
          workspaceId: 'ws1',
          role: 'admin',
        },
        request: mockRequest as FastifyRequest,
      };

      await expect(middleware.requireWorkspaceAccess(context, 'different-ws', false)).rejects.toThrow(
        'Access denied to this workspace'
      );
      expect(mockHasUserAccess).toHaveBeenCalledWith('456', 'different-ws');
    });

    it('should allow member access when they have database access', async () => {
      mockHasUserAccess.mockResolvedValue(true);
      const context: AuthContext = {
        isAuthenticated: true,
        user: {
          userId: '123',
          email: 'user1@skilder.ai',
          workspaceId: 'ws1',
          role: 'member',
        },
        request: mockRequest as FastifyRequest,
      };

      const authContext = await middleware.requireWorkspaceAccess(context, 'ws1');
      expect(authContext.user.workspaceId).toBe('ws1');
      expect(mockHasUserAccess).toHaveBeenCalledWith('123', 'ws1');
    });

    it('should deny member access when they have no database access', async () => {
      mockHasUserAccess.mockResolvedValue(false);
      const context: AuthContext = {
        isAuthenticated: true,
        user: {
          userId: '123',
          email: 'user1@skilder.ai',
          workspaceId: 'ws1',
          role: 'member',
        },
        request: mockRequest as FastifyRequest,
      };

      await expect(middleware.requireWorkspaceAccess(context, 'different-ws')).rejects.toThrow(
        'Access denied to this workspace'
      );
      expect(mockHasUserAccess).toHaveBeenCalledWith('123', 'different-ws');
    });

    it('should validate against database, not JWT claims', async () => {
      // Even though JWT has workspaceId: 'ws1', if user has DB access to 'ws2', allow it
      mockHasUserAccess.mockResolvedValue(true);
      const context: AuthContext = {
        isAuthenticated: true,
        user: {
          userId: '123',
          email: 'user1@skilder.ai',
          workspaceId: 'ws1', // JWT says ws1
          role: 'member',
        },
        request: mockRequest as FastifyRequest,
      };

      // Requesting ws2 - should check DB, not just compare JWT claims
      const authContext = await middleware.requireWorkspaceAccess(context, 'ws2');
      expect(authContext.user.userId).toBe('123');
      expect(mockHasUserAccess).toHaveBeenCalledWith('123', 'ws2');
    });
  });

  describe('Workspace ID Extraction', () => {
    it('should extract workspace ID from arguments', () => {
      const args = { workspaceId: 'from-args' };
      const source = { workspaceId: 'from-source' };

      const workspaceId = middleware.extractWorkspaceId(args, source);
      expect(workspaceId).toBe('from-args');
    });

    it('should extract workspace ID from source when not in arguments', () => {
      const args = {};
      const source = { workspaceId: 'from-source' };

      const workspaceId = middleware.extractWorkspaceId(args, source);
      expect(workspaceId).toBe('from-source');
    });

    it('should return null when workspace ID is not available', () => {
      const args = {};
      const source = {};

      const workspaceId = middleware.extractWorkspaceId(args, source);
      expect(workspaceId).toBeNull();
    });
  });

  describe('Event Logging', () => {
    it('should log authentication events for authenticated users', () => {
      const context: AuthenticatedContext = {
        isAuthenticated: true,
        user: {
          userId: '123',
          email: 'user1@skilder.ai',
          workspaceId: 'ws1',
          role: 'member',
        },
        request: mockRequest as FastifyRequest,
      };

      middleware.logAuthEvent(context, 'test_event', { additional: 'data' });

      expect(mockRequest.log!.info).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'test_event',
          isAuthenticated: true,
          userId: '123',
          email: 'user1@skilder.ai',
          role: 'member',
          workspaceId: 'ws1',
          additional: 'data',
        }),
        'Authentication event: test_event'
      );
    });

    it('should log authentication events for unauthenticated users', () => {
      const context: AuthContext = {
        isAuthenticated: false,
        request: mockRequest as FastifyRequest,
      };

      middleware.logAuthEvent(context, 'test_event');

      expect(mockRequest.log!.info).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'test_event',
          isAuthenticated: false,
        }),
        'Authentication event: test_event'
      );
    });
  });

  describe('Resolver Wrappers', () => {
    it('should create auth-protected resolver wrapper', () => {
      const mockResolver = vi.fn().mockReturnValue('result');
      const wrappedResolver = middleware.withAuth(mockResolver);

      const context: AuthenticatedContext = {
        isAuthenticated: true,
        user: {
          userId: '123',
          email: 'user1@skilder.ai',
          workspaceId: 'ws1',
          role: 'member',
        },
        request: mockRequest as FastifyRequest,
      };

      const info = {
        fieldName: 'testField',
        parentType: { name: 'TestType' },
      } as GraphQLResolveInfo;

      const result = wrappedResolver({}, {}, context, info);

      expect(result).toBe('result');
      expect(mockResolver).toHaveBeenCalledWith({}, {}, context, info);
      expect(mockRequest.log!.info).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'resolver_access',
          resolver: 'testField',
          parentType: 'TestType',
        }),
        'Authentication event: resolver_access'
      );
    });

    it('should create role-protected resolver wrapper', () => {
      const mockResolver = vi.fn().mockReturnValue('admin-result');
      const wrappedResolver = middleware.withRole(['admin'], mockResolver);

      const context: AuthenticatedContext = {
        isAuthenticated: true,
        user: {
          userId: '456',
          email: 'user1@skilder.ai',
          workspaceId: 'ws1',
          role: 'admin',
        },
        request: mockRequest as FastifyRequest,
      };

      const info = {
        fieldName: 'adminField',
        parentType: { name: 'TestType' },
      } as GraphQLResolveInfo;

      const result = wrappedResolver({}, {}, context, info);

      expect(result).toBe('admin-result');
      expect(mockResolver).toHaveBeenCalledWith({}, {}, context, info);
      expect(mockRequest.log!.info).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'role_based_access',
          resolver: 'adminField',
          parentType: 'TestType',
          requiredRoles: ['admin'],
          userRole: 'admin',
        }),
        'Authentication event: role_based_access'
      );
    });

    it('should create workspace-protected resolver wrapper', async () => {
      mockHasUserAccess.mockResolvedValue(true);
      const mockResolver = vi.fn().mockReturnValue('workspace-result');
      const wrappedResolver = middleware.withWorkspaceAccess(mockResolver);

      const context: AuthenticatedContext = {
        isAuthenticated: true,
        user: {
          userId: '123',
          email: 'user1@skilder.ai',
          workspaceId: 'ws1',
          role: 'member',
        },
        request: mockRequest as FastifyRequest,
      };

      const args = { workspaceId: 'ws1' };
      const info = {
        fieldName: 'workspaceField',
        parentType: { name: 'TestType' },
      } as GraphQLResolveInfo;

      const result = await wrappedResolver({}, args, context, info);

      expect(result).toBe('workspace-result');
      expect(mockResolver).toHaveBeenCalledWith({}, args, context, info);
      expect(mockHasUserAccess).toHaveBeenCalledWith('123', 'ws1');
      expect(mockRequest.log!.info).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'workspace_access',
          resolver: 'workspaceField',
          parentType: 'TestType',
          workspaceId: 'ws1',
          allowAdmin: true,
        }),
        'Authentication event: workspace_access'
      );
    });

    it('should throw error in workspace wrapper when workspace context is missing', async () => {
      const mockResolver = vi.fn();
      const wrappedResolver = middleware.withWorkspaceAccess(mockResolver);

      const context: AuthenticatedContext = {
        isAuthenticated: true,
        user: {
          userId: '123',
          email: 'user1@skilder.ai',
          workspaceId: 'ws1',
          role: 'member',
        },
        request: mockRequest as FastifyRequest,
      };

      const args = {}; // No workspaceId
      const source = {}; // No workspaceId
      const info = { fieldName: 'workspaceField', parentType: { name: 'TestType' } } as GraphQLResolveInfo;

      await expect(wrappedResolver(source, args, context, info)).rejects.toThrow(
        'Workspace context required'
      );
      expect(mockResolver).not.toHaveBeenCalled();
    });

    it('should deny access in workspace wrapper when database check fails', async () => {
      mockHasUserAccess.mockResolvedValue(false);
      const mockResolver = vi.fn();
      const wrappedResolver = middleware.withWorkspaceAccess(mockResolver);

      const context: AuthenticatedContext = {
        isAuthenticated: true,
        user: {
          userId: '123',
          email: 'user1@skilder.ai',
          workspaceId: 'ws1',
          role: 'member',
        },
        request: mockRequest as FastifyRequest,
      };

      const args = { workspaceId: 'ws2' };
      const info = { fieldName: 'workspaceField', parentType: { name: 'TestType' } } as GraphQLResolveInfo;

      await expect(wrappedResolver({}, args, context, info)).rejects.toThrow(
        'Access denied to this workspace'
      );
      expect(mockResolver).not.toHaveBeenCalled();
      expect(mockHasUserAccess).toHaveBeenCalledWith('123', 'ws2');
    });
  });
});