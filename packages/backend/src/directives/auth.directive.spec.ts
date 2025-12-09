import { describe, it, expect, beforeEach } from 'vitest';
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLResolveInfo,
} from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import {
  requireAuthDirective,
  requireRoleDirective,
  requireWorkspaceDirective,
  applyAuthDirectives,
  createAuthContext,
  AuthDirectiveContext,
} from './auth.directive';

describe('AuthDirective', () => {
  let schema: GraphQLSchema;
  let authContext: AuthDirectiveContext;

  beforeEach(() => {
    // Create a test schema
    const typeDefsWithDirectives = `
      directive @requireAuth on FIELD_DEFINITION | OBJECT
      directive @requireRole(roles: [String!]!) on FIELD_DEFINITION | OBJECT
      directive @requireWorkspace(allowAdmin: Boolean = true) on FIELD_DEFINITION | OBJECT

      type User {
        id: ID!
        email: String!
        publicField: String
        privateField: String @requireAuth
        adminField: String @requireRole(roles: ["admin"])
        workspaceField: String @requireWorkspace
      }

      type SecureType @requireAuth {
        id: ID!
        data: String
      }

      type AdminType @requireRole(roles: ["admin"]) {
        id: ID!
        adminData: String
      }

      type Query {
        me: User
        publicData: String
        privateData: String @requireAuth
        adminData: String @requireRole(roles: ["admin"])
        workspaceData(workspaceId: ID!): String @requireWorkspace
        user(id: ID!): User
        secureData: SecureType
        adminOnlyData: AdminType
      }
    `;

    schema = makeExecutableSchema({
      typeDefs: typeDefsWithDirectives,
      resolvers: {
        Query: {
          me: () => ({ id: '1', email: 'user1@skilder.ai' }),
          publicData: () => 'public',
          privateData: () => 'private',
          adminData: () => 'admin',
          workspaceData: () => 'workspace',
          user: () => ({ id: '1', email: 'user1@skilder.ai' }),
          secureData: () => ({ id: '1', data: 'secure' }),
          adminOnlyData: () => ({ id: '1', adminData: 'admin-only' }),
        },
        User: {
          publicField: () => 'public',
          privateField: () => 'private',
          adminField: () => 'admin',
          workspaceField: () => 'workspace',
        },
        SecureType: {
          data: () => 'secure-data',
        },
        AdminType: {
          adminData: () => 'admin-data',
        },
      },
    });
    schema = applyAuthDirectives(schema);

    // Default unauthenticated context
    authContext = createAuthContext(null, false);
  });

  describe('Directive Creation', () => {
    it('should create requireAuth directive', () => {
      expect(requireAuthDirective.name).toBe('requireAuth');
      expect(requireAuthDirective.description).toContain('authenticated');
    });

    it('should create requireRole directive', () => {
      expect(requireRoleDirective.name).toBe('requireRole');
      expect(requireRoleDirective.description).toContain('roles');
      expect(requireRoleDirective.args.find(arg => arg.name === 'roles')).toBeDefined();
    });

    it('should create requireWorkspace directive', () => {
      expect(requireWorkspaceDirective.name).toBe('requireWorkspace');
      expect(requireWorkspaceDirective.description).toContain('workspace');
      expect(requireWorkspaceDirective.args.find(arg => arg.name === 'allowAdmin')).toBeDefined();
    });
  });

  describe('Authentication Context Creation', () => {
    it('should create unauthenticated context', () => {
      const context = createAuthContext(null, false);
      expect(context.isAuthenticated).toBe(false);
      expect(context.user).toBeUndefined();
    });

    it('should create authenticated context', () => {
      const user = {
        userId: '123',
        email: 'user1@skilder.ai',
        workspaceId: 'ws1',
        role: 'member',
      };

      const context = createAuthContext(user, true);
      expect(context.isAuthenticated).toBe(true);
      expect(context.user).toEqual(user);
    });
  });

  describe('Field-Level Authentication', () => {
    it('should allow access to public fields without authentication', async () => {
      const UserType = schema.getType('User') as GraphQLObjectType;
      const publicField = UserType.getFields().publicField;

      // Should not throw for unauthenticated access to public field
      expect(async () => {
        await publicField.resolve?.({}, {}, authContext, {} as GraphQLResolveInfo);
      }).not.toThrow();
    });

    it('should deny access to private fields without authentication', async () => {
      const UserType = schema.getType('User') as GraphQLObjectType;
      const privateField = UserType.getFields().privateField;

      try {
        await privateField.resolve?.({}, {}, authContext, {} as GraphQLResolveInfo);
        expect.fail('Should have thrown authentication error');
      } catch (error: unknown) {
        expect((error as Error).message).toContain('Authentication required');
        expect((error as { extensions?: { code?: string } }).extensions?.code).toBe('UNAUTHENTICATED');
      }
    });

    it('should allow access to private fields with authentication', async () => {
      const authenticatedContext = createAuthContext({
        userId: '123',
        email: 'user1@skilder.ai',
        workspaceId: 'ws1',
        role: 'member',
      }, true);

      const UserType = schema.getType('User') as GraphQLObjectType;
      const privateField = UserType.getFields().privateField;

      // Should not throw for authenticated access
      expect(async () => {
        await privateField.resolve?.({}, {}, authenticatedContext, {} as GraphQLResolveInfo);
      }).not.toThrow();
    });
  });

  describe('Role-Based Access Control', () => {
    it('should deny access to admin fields for non-admin users', async () => {
      const memberContext = createAuthContext({
        userId: '123',
        email: 'user1@skilder.ai',
        workspaceId: 'ws1',
        role: 'member',
      }, true);

      const UserType = schema.getType('User') as GraphQLObjectType;
      const adminField = UserType.getFields().adminField;

      try {
        await adminField.resolve?.({}, {}, memberContext, {} as GraphQLResolveInfo);
        expect.fail('Should have thrown authorization error');
      } catch (error: unknown) {
        expect((error as Error).message).toContain('Access denied');
        expect((error as Error).message).toContain('admin');
        expect((error as { extensions?: { code?: string } }).extensions?.code).toBe('FORBIDDEN');
      }
    });

    it('should allow access to admin fields for admin users', async () => {
      const adminContext = createAuthContext({
        userId: '456',
        email: 'user1@skilder.ai',
        workspaceId: 'ws1',
        role: 'admin',
      }, true);

      const UserType = schema.getType('User') as GraphQLObjectType;
      const adminField = UserType.getFields().adminField;

      // Should not throw for admin access
      expect(async () => {
        await adminField.resolve?.({}, {}, adminContext, {} as GraphQLResolveInfo);
      }).not.toThrow();
    });

    it('should deny access to unauthenticated users for role-protected fields', async () => {
      const UserType = schema.getType('User') as GraphQLObjectType;
      const adminField = UserType.getFields().adminField;

      try {
        await adminField.resolve?.({}, {}, authContext, {} as GraphQLResolveInfo);
        expect.fail('Should have thrown authentication error');
      } catch (error: unknown) {
        expect((error as Error).message).toContain('Authentication required');
        expect((error as { extensions?: { code?: string } }).extensions?.code).toBe('UNAUTHENTICATED');
      }
    });
  });

  describe('Workspace-Based Access Control', () => {
    it('should allow admin access to any workspace by default', async () => {
      const adminContext = createAuthContext({
        userId: '456',
        email: 'user1@skilder.ai',
        workspaceId: 'ws1',
        role: 'admin',
      }, true);

      const UserType = schema.getType('User') as GraphQLObjectType;
      const workspaceField = UserType.getFields().workspaceField;

      const source = { workspaceId: 'different-ws' };

      // Admin should have access to different workspace
      expect(async () => {
        await workspaceField.resolve?.(source, {}, adminContext, {} as GraphQLResolveInfo);
      }).not.toThrow();
    });

    it('should deny access to different workspace for non-admin users', async () => {
      const memberContext = createAuthContext({
        userId: '123',
        email: 'user1@skilder.ai',
        workspaceId: 'ws1',
        role: 'member',
      }, true);

      const UserType = schema.getType('User') as GraphQLObjectType;
      const workspaceField = UserType.getFields().workspaceField;

      const source = { workspaceId: 'different-ws' };

      try {
        await workspaceField.resolve?.(source, {}, memberContext, {} as GraphQLResolveInfo);
        expect.fail('Should have thrown workspace access error');
      } catch (error: unknown) {
        expect((error as Error).message).toContain('Access denied to this workspace');
        expect((error as { extensions?: { code?: string } }).extensions?.code).toBe('FORBIDDEN');
      }
    });

    it('should allow access to same workspace for members', async () => {
      const memberContext = createAuthContext({
        userId: '123',
        email: 'user1@skilder.ai',
        workspaceId: 'ws1',
        role: 'member',
      }, true);

      const UserType = schema.getType('User') as GraphQLObjectType;
      const workspaceField = UserType.getFields().workspaceField;

      const source = { workspaceId: 'ws1' };

      // Should not throw for same workspace access
      expect(async () => {
        await workspaceField.resolve?.(source, {}, memberContext, {} as GraphQLResolveInfo);
      }).not.toThrow();
    });

    it('should require workspace context when not provided', async () => {
      const memberContext = createAuthContext({
        userId: '123',
        email: 'user1@skilder.ai',
        workspaceId: 'ws1',
        role: 'member',
      }, true);

      const UserType = schema.getType('User') as GraphQLObjectType;
      const workspaceField = UserType.getFields().workspaceField;

      const source = {}; // No workspaceId provided

      try {
        await workspaceField.resolve?.(source, {}, memberContext, {} as GraphQLResolveInfo);
        expect.fail('Should have thrown workspace context error');
      } catch (error: unknown) {
        expect((error as Error).message).toContain('Workspace context required');
        expect((error as { extensions?: { reason?: string } }).extensions?.reason).toBe('MISSING_WORKSPACE_CONTEXT');
      }
    });

    it('should get workspace ID from arguments', async () => {
      const memberContext = createAuthContext({
        userId: '123',
        email: 'user1@skilder.ai',
        workspaceId: 'ws1',
        role: 'member',
      }, true);

      const UserType = schema.getType('User') as GraphQLObjectType;
      const workspaceField = UserType.getFields().workspaceField;

      const args = { workspaceId: 'ws1' };

      // Should not throw when workspace ID is in arguments
      expect(async () => {
        await workspaceField.resolve?.({}, args, memberContext, {} as GraphQLResolveInfo);
      }).not.toThrow();
    });
  });

  describe('Type-Level Security', () => {
    it('should apply authentication to entire type', async () => {
      const SecureType = schema.getType('SecureType') as GraphQLObjectType;
      const idField = SecureType.getFields().id;

      try {
        await idField.resolve?.({}, {}, authContext, {} as GraphQLResolveInfo);
        expect.fail('Should have thrown authentication error');
      } catch (error: unknown) {
        expect((error as Error).message).toContain('Authentication required');
      }
    });

    it('should apply role-based access to entire type', async () => {
      const memberContext = createAuthContext({
        userId: '123',
        email: 'user1@skilder.ai',
        workspaceId: 'ws1',
        role: 'member',
      }, true);

      const AdminType = schema.getType('AdminType') as GraphQLObjectType;
      const idField = AdminType.getFields().id;

      try {
        await idField.resolve?.({}, {}, memberContext, {} as GraphQLResolveInfo);
        expect.fail('Should have thrown authorization error');
      } catch (error: unknown) {
        expect((error as Error).message).toContain('Access denied');
        expect((error as Error).message).toContain('admin');
      }
    });
  });

  describe('Error Formatting', () => {
    it('should include error codes in GraphQL errors', async () => {
      const UserType = schema.getType('User') as GraphQLObjectType;
      const privateField = UserType.getFields().privateField;

      try {
        await privateField.resolve?.({}, {}, authContext, {} as GraphQLResolveInfo);
      } catch (error: unknown) {
        expect((error as { extensions?: { code?: string } }).extensions?.code).toBe('UNAUTHENTICATED');
      }
    });

    it('should include required roles in authorization errors', async () => {
      const memberContext = createAuthContext({
        userId: '123',
        email: 'user1@skilder.ai',
        workspaceId: 'ws1',
        role: 'member',
      }, true);

      const UserType = schema.getType('User') as GraphQLObjectType;
      const adminField = UserType.getFields().adminField;

      try {
        await adminField.resolve?.({}, {}, memberContext, {} as GraphQLResolveInfo);
      } catch (error: unknown) {
        expect((error as { extensions?: { code?: string } }).extensions?.code).toBe('FORBIDDEN');
        expect((error as { extensions?: { requiredRoles?: string[] } }).extensions?.requiredRoles).toEqual(['admin']);
      }
    });
  });
});