import { GraphQLError } from 'graphql';
import { WorkspaceRepository } from '../repositories';

export type AuthContext = { user?: { userId: string; email: string } };

/**
 * Ensures user is authenticated.
 * @returns userId for subsequent operations
 * @throws GraphQLError with code UNAUTHENTICATED if not authenticated
 */
export function requireAuth(context: AuthContext): string {
  if (!context.user?.userId) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.user.userId;
}

/**
 * Ensures user has access to the specified workspace.
 * @throws GraphQLError with code FORBIDDEN if access denied
 */
export async function requireWorkspaceAccess(
  workspaceRepository: WorkspaceRepository,
  userId: string,
  workspaceId: string
): Promise<void> {
  const hasAccess = await workspaceRepository.hasUserAccess(userId, workspaceId);
  if (!hasAccess) {
    throw new GraphQLError('Access denied to this workspace', {
      extensions: { code: 'FORBIDDEN', reason: 'WORKSPACE_ACCESS_DENIED' },
    });
  }
}

/**
 * Combined auth + workspace access check.
 * @returns userId for subsequent operations
 * @throws GraphQLError with code UNAUTHENTICATED or FORBIDDEN
 */
export async function requireAuthAndWorkspaceAccess(
  workspaceRepository: WorkspaceRepository,
  context: AuthContext,
  workspaceId: string
): Promise<string> {
  const userId = requireAuth(context);
  await requireWorkspaceAccess(workspaceRepository, userId, workspaceId);
  return userId;
}
