export { SecurityMiddleware } from './security.middleware';
export { RateLimitMiddleware } from './rate-limit.middleware';
export { GraphQLAuthMiddleware } from './graphql-auth.middleware';
export type { AuthContext, AuthenticatedContext } from './graphql-auth.middleware';

// Re-export directives
export {
  requireAuthDirective,
  requireRoleDirective,
  requireWorkspaceDirective,
  applyAuthDirectives,
  createAuthContext,
} from '../directives/auth.directive';
export type { AuthDirectiveContext } from '../directives/auth.directive';

// Re-export shared context types
export type { GraphQLContext, AuthenticatedGraphQLContext, ContextUser } from '../types';