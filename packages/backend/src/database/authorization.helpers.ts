import { GraphQLError } from 'graphql';
import { WorkspaceRepository } from '../repositories';
import pino from 'pino';

export type AuthContext = { user?: { userId: string; email: string } };

/**
 * Configuration for periodic subscription validation.
 * These values control how often workspace access is re-validated during active subscriptions.
 */
export const SUBSCRIPTION_VALIDATION_CONFIG = {
  /**
   * SECURITY: Re-validation interval for active subscriptions (in milliseconds).
   *
   * Why 5 minutes?
   * - Balance between security and performance: validates often enough to catch
   *   permission revocations within a reasonable timeframe
   * - Reduces database load: avoids validating on every subscription event
   * - Acceptable delay: 5 minutes is a reasonable window for permission changes
   *   to take effect in most enterprise scenarios
   *
   * Trade-offs:
   * - Shorter interval = faster revocation, higher DB load
   * - Longer interval = lower DB load, slower revocation
   *
   * For high-security environments, consider reducing to 60 seconds (60000ms).
   * For high-traffic environments, consider increasing to 10 minutes (600000ms).
   */
  REVALIDATION_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
};

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

/**
 * SECURITY: Wraps an async generator with periodic workspace access validation.
 *
 * Why periodic validation?
 * - Subscriptions validate access only at subscribe time by default
 * - If a user's access is revoked while a subscription is active, they would
 *   continue receiving events until they disconnect
 * - This wrapper periodically re-validates access and completes gracefully
 *   if access has been revoked
 *
 * Behavior:
 * - Re-validates workspace access every 5 minutes (configurable via SUBSCRIPTION_VALIDATION_CONFIG)
 * - If validation fails, the subscription completes gracefully (no error thrown)
 * - Uses a completion signal rather than an error to provide clean UX
 *
 * @param generator - The original async generator to wrap
 * @param userId - The user ID to validate
 * @param workspaceId - The workspace ID to validate access for
 * @param workspaceRepository - Repository for checking workspace access
 * @param logger - Logger for recording validation events
 */
export const withPeriodicValidation = <T>(
  generator: AsyncGenerator<T>,
  userId: string,
  workspaceId: string,
  workspaceRepository: WorkspaceRepository,
  logger: pino.Logger,
): AsyncGenerator<T> => {
  let lastValidatedAt = Date.now();

  return (async function* () {
    try {
      for await (const value of generator) {
        const now = Date.now();
        const timeSinceLastValidation = now - lastValidatedAt;

        // SECURITY: Re-validate workspace access periodically
        // This ensures revoked access takes effect within the configured interval
        if (timeSinceLastValidation >= SUBSCRIPTION_VALIDATION_CONFIG.REVALIDATION_INTERVAL_MS) {
          const hasAccess = await workspaceRepository.hasUserAccess(userId, workspaceId);

          if (!hasAccess) {
            // Log the access revocation for audit purposes
            logger.info(
              { userId, workspaceId, timeSinceLastValidation },
              'Subscription completed: user workspace access revoked during active subscription'
            );
            // Complete gracefully instead of throwing an error
            // This provides a clean end to the subscription without alarming error messages
            return;
          }

          lastValidatedAt = now;
        }

        yield value;
      }
    } finally {
      // Cleanup: ensure generator is properly closed
      if (generator.return) {
        await generator.return(undefined);
      }
    }
  })();
};
