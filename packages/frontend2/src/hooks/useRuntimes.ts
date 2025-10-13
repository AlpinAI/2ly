/**
 * useRuntimes Hook
 *
 * WHY: Wrapper around Apollo Client useSubscription with typed document node
 * - Real-time runtime updates via GraphQL subscription
 * - Automatic error handling
 * - Loading states
 * - Data transformation
 * - Integration with Zustand filters (if needed)
 *
 * APOLLO v4 PATTERN: Use typed document nodes with Apollo's useSubscription hook
 * Apply this pattern to other entities (agents, tools, etc.)
 *
 * USAGE:
 * ```tsx
 * function RuntimesList() {
 *   const { runtimes, loading, error } = useRuntimes();
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *
 *   return <div>{runtimes.map(r => <RuntimeCard key={r.id} runtime={r} />)}</div>;
 * }
 * ```
 */

import { useSubscription } from '@apollo/client/react';
import { SubscribeRuntimesDocument } from '@/graphql/generated/graphql';
import { useWorkspaceId } from '@/stores/workspaceStore';

export function useRuntimes() {
  const workspaceId = useWorkspaceId();

  // WHY: Use Apollo Client's useSubscription for real-time updates
  // No more polling! Backend pushes changes immediately.
  const { data, loading, error } = useSubscription(SubscribeRuntimesDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId,
  });

  // WHY: Extract runtimes from subscription data
  const runtimes = data?.runtimes ?? [];

  // WHY: Calculate aggregate stats
  const stats = {
    total: runtimes.length,
    active: runtimes.filter((r) => r.status === 'ACTIVE').length,
    inactive: runtimes.filter((r) => r.status === 'INACTIVE').length,
  };

  return {
    runtimes,
    stats,
    loading,
    error,
  };
}
