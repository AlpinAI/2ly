import { GraphQLError } from 'graphql';
import {
  GraphQLDirective,
  GraphQLSchema,
  DirectiveLocation,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLBoolean,
  defaultFieldResolver,
  GraphQLFieldConfig,
  GraphQLObjectType,
  GraphQLFieldResolver,
} from 'graphql';
import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils';
import { GraphQLContext } from '../types';

/**
 * Context type expected by auth directives.
 * Requires isAuthenticated to be present (populated by middleware).
 */
export interface AuthDirectiveContext extends GraphQLContext {
  isAuthenticated: boolean;
}

/**
 * @requireAuth directive definition for GraphQL schema.
 * Usage: @requireAuth on fields or types that require authentication.
 */
export const requireAuthDirective = new GraphQLDirective({
  name: 'requireAuth',
  locations: [DirectiveLocation.FIELD_DEFINITION, DirectiveLocation.OBJECT],
  description: 'Requires user to be authenticated to access this field or type',
});

/**
 * @requireRole directive definition for GraphQL schema.
 * Usage: @requireRole(roles: ["admin", "member"]) on fields that require specific roles.
 */
export const requireRoleDirective = new GraphQLDirective({
  name: 'requireRole',
  locations: [DirectiveLocation.FIELD_DEFINITION, DirectiveLocation.OBJECT],
  args: {
    roles: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))),
      description: 'Required roles to access this field',
    },
  },
  description: 'Requires user to have one of the specified roles',
});

/**
 * @requireWorkspace directive definition for GraphQL schema.
 * Usage: @requireWorkspace on fields that require workspace-scoped access.
 */
export const requireWorkspaceDirective = new GraphQLDirective({
  name: 'requireWorkspace',
  locations: [DirectiveLocation.FIELD_DEFINITION, DirectiveLocation.OBJECT],
  args: {
    allowAdmin: {
      type: GraphQLBoolean,
      defaultValue: true,
      description: 'Whether admins can access any workspace data',
    },
  },
  description: 'Requires user to have access to the workspace context',
});

/**
 * Transform schema to apply authentication directives.
 */
export function applyAuthDirectives(schema: GraphQLSchema): GraphQLSchema {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig, _fieldName, typeName) => {
      return applyDirectiveToField(fieldConfig, typeName, schema);
    },
    [MapperKind.OBJECT_TYPE]: (type) => {
      return applyDirectiveToType(type, schema);
    },
  });
}

/**
 * Apply authentication directives to a field.
 */
function applyDirectiveToField(
  fieldConfig: GraphQLFieldConfig<unknown, AuthDirectiveContext>,
  typeName: string,
  schema?: GraphQLSchema
): GraphQLFieldConfig<unknown, AuthDirectiveContext> {
  if (!schema) return fieldConfig;

  const requireAuthDirective = getDirective(schema, fieldConfig, 'requireAuth')?.[0];
  const requireRoleDirective = getDirective(schema, fieldConfig, 'requireRole')?.[0];
  const requireWorkspaceDirective = getDirective(schema, fieldConfig, 'requireWorkspace')?.[0];

  if (!requireAuthDirective && !requireRoleDirective && !requireWorkspaceDirective) {
    return fieldConfig;
  }

  const originalResolver = fieldConfig.resolve || defaultFieldResolver;

  fieldConfig.resolve = async (source, args, context, info) => {
    const authContext = context as AuthDirectiveContext;

    // Check authentication requirement
    if (requireAuthDirective && !authContext.isAuthenticated) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // Check role requirement
    if (requireRoleDirective) {
      if (!authContext.isAuthenticated) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const requiredRoles = requireRoleDirective.roles as string[];
      const userRole = authContext.user?.role;

      if (!userRole || !requiredRoles.includes(userRole)) {
        throw new GraphQLError(
          `Access denied. Required roles: ${requiredRoles.join(', ')}`,
          {
            extensions: { code: 'FORBIDDEN', requiredRoles },
          }
        );
      }
    }

    // Check workspace access requirement
    if (requireWorkspaceDirective) {
      if (!authContext.isAuthenticated) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const allowAdmin = requireWorkspaceDirective.allowAdmin !== false;
      const userRole = authContext.user?.role;
      const userWorkspaceId = authContext.user?.workspaceId;

      // Admin can access any workspace if allowAdmin is true
      if (allowAdmin && userRole === 'admin') {
        return originalResolver(source, args, context, info);
      }

      // For non-admin users or when admin access is restricted,
      // check if they have workspace access
      const workspaceId = args.workspaceId || (source as Record<string, unknown>)?.workspaceId;
      if (!workspaceId) {
        throw new GraphQLError('Workspace context required', {
          extensions: { code: 'FORBIDDEN', reason: 'MISSING_WORKSPACE_CONTEXT' },
        });
      }

      // Validate workspace ID format (should be a valid ID format)
      if (!isValidWorkspaceId(workspaceId)) {
        throw new GraphQLError('Invalid workspace ID format', {
          extensions: { code: 'BAD_USER_INPUT', reason: 'INVALID_WORKSPACE_ID' },
        });
      }

      if (userWorkspaceId !== workspaceId) {
        throw new GraphQLError('Access denied to this workspace', {
          extensions: { code: 'FORBIDDEN', reason: 'WORKSPACE_ACCESS_DENIED' },
        });
      }
    }

    return originalResolver(source, args, context, info);
  };

  return fieldConfig;
}

/**
 * Apply authentication directives to a GraphQL type.
 */
function applyDirectiveToType(type: GraphQLObjectType, schema?: GraphQLSchema): GraphQLObjectType {
  if (!schema) return type;

  const requireAuthDirective = getDirective(schema, type, 'requireAuth')?.[0];
  const requireRoleDirective = getDirective(schema, type, 'requireRole')?.[0];

  if (!requireAuthDirective && !requireRoleDirective) {
    return type;
  }

  // Apply directives to all fields of the type
  const fields = type.getFields();

  Object.keys(fields).forEach((fieldName) => {
    const field = fields[fieldName];

    if (requireAuthDirective) {
      field.resolve = wrapWithAuthCheck(
        field.resolve || defaultFieldResolver
      );
    }

    if (requireRoleDirective) {
      field.resolve = wrapWithRoleCheck(
        field.resolve || defaultFieldResolver,
        requireRoleDirective.roles as string[]
      );
    }
  });

  return type;
}

/**
 * Wrap resolver with authentication check.
 */
function wrapWithAuthCheck(
  originalResolver: GraphQLFieldResolver<unknown, AuthDirectiveContext>
): GraphQLFieldResolver<unknown, AuthDirectiveContext> {
  return async (source, args, context, info) => {
    const authContext = context as AuthDirectiveContext;

    if (!authContext.isAuthenticated) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    return originalResolver(source, args, context, info);
  };
}

/**
 * Wrap resolver with role-based access check.
 */
function wrapWithRoleCheck(
  originalResolver: GraphQLFieldResolver<unknown, AuthDirectiveContext>,
  requiredRoles: string[]
): GraphQLFieldResolver<unknown, AuthDirectiveContext> {
  return async (source, args, context, info) => {
    const authContext = context as AuthDirectiveContext;

    if (!authContext.isAuthenticated) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const userRole = authContext.user?.role;
    if (!userRole || !requiredRoles.includes(userRole)) {
      throw new GraphQLError(
        `Access denied. Required roles: ${requiredRoles.join(', ')}`,
        {
          extensions: { code: 'FORBIDDEN', requiredRoles },
        }
      );
    }

    return originalResolver(source, args, context, info);
  };
}

/**
 * Create authentication context from request.
 */
export function createAuthContext(
  user: AuthDirectiveContext['user'] | null,
  isAuthenticated: boolean
): AuthDirectiveContext {
  return {
    user: user || undefined,
    isAuthenticated,
  };
}

/**
 * Validate workspace ID format to prevent injection attacks.
 * Ensures workspace ID is a valid UUID or alphanumeric string.
 */
function isValidWorkspaceId(workspaceId: unknown): workspaceId is string {
  if (typeof workspaceId !== 'string') return false;
  if (workspaceId.length === 0 || workspaceId.length > 100) return false;

  // Allow UUID format (with or without hyphens) and alphanumeric strings
  const validIdPattern = /^[a-zA-Z0-9\-_]{1,100}$/;

  // Additional check to prevent obvious injection attempts
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /on\w+=/i, // Event handlers like onclick=, onload=
    /['"`;]/,  // SQL injection attempts
    /\.\./,    // Directory traversal
  ];

  if (dangerousPatterns.some(pattern => pattern.test(workspaceId))) {
    return false;
  }

  return validIdPattern.test(workspaceId);
}