/**
 * useRuntimes Hook
 *
 * WHY: Wrapper around Apollo Client useQuery with typed document node
 * - Automatic error handling
 * - Loading states
 * - Data transformation
 * - Integration with Zustand filters (if needed)
 *
 * APOLLO v4 PATTERN: Use typed document nodes with Apollo's useQuery hook
 * Apply this pattern to other entities (agents, tools, etc.)
 *
 * USAGE:
 * ```tsx
 * function RuntimesList() {
 *   const { runtimes, loading, error, refetch } = useRuntimes();
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *
 *   return <div>{runtimes.map(r => <RuntimeCard key={r.id} runtime={r} />)}</div>;
 * }
 * ```
 */

import { useQuery } from '@apollo/client/react';
import { GetRuntimesDocument } from '@/graphql/generated/graphql';

export function useRuntimes() {
  // WHY: Use Apollo Client's useQuery with typed document node
  const { data, loading, error, refetch } = useQuery(GetRuntimesDocument, {
    // WHY: Poll every 30 seconds for real-time-ish updates
    // TODO: Replace with subscription when backend implements it
    pollInterval: 30_000,

    // WHY: Show cached data immediately while fetching fresh data
    fetchPolicy: 'cache-and-network',
  });

  // WHY: Transform/flatten the data structure for easier consumption
  const runtimes = data?.workspace?.flatMap((ws: any) => ws.runtimes ?? []) ?? [];

  // WHY: Calculate aggregate stats
  const stats = {
    total: runtimes.length,
    active: runtimes.filter((r: any) => r.status === 'ACTIVE').length,
    inactive: runtimes.filter((r: any) => r.status === 'INACTIVE').length,
  };

  return {
    runtimes,
    stats,
    loading,
    error,
    refetch,
  };
}
