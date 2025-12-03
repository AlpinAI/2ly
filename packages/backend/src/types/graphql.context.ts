import { BaseContext } from '@apollo/server';
import { FastifyRequest } from 'fastify';

/**
 * User information attached to the GraphQL context.
 * Populated from JWT token during authentication.
 */
export interface ContextUser {
  userId: string;
  email: string;
  workspaceId?: string;
  role?: string;
}

/**
 * GraphQL context type used across all resolvers and middleware.
 * This is the single source of truth for context typing.
 */
export interface GraphQLContext extends BaseContext {
  /** Authenticated user information, undefined if not authenticated */
  user?: ContextUser;
  /** Request metadata (ip, headers) */
  req?: {
    ip?: string;
    headers?: { [key: string]: string | string[] | undefined };
  };
  /** Whether the user is authenticated (from middleware) */
  isAuthenticated?: boolean;
  /** Original Fastify request (from middleware) */
  request?: FastifyRequest;
}

/**
 * GraphQL context with guaranteed authenticated user.
 * Use this type when authentication is required.
 */
export interface AuthenticatedGraphQLContext extends GraphQLContext {
  user: ContextUser;
  isAuthenticated: true;
}
