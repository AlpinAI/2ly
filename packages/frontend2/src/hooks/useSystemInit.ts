/**
 * useSystemInit Hook
 *
 * WHY: Check if the system has been initialized (created during first setup).
 * System must be initialized before users can log in.
 */

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

// GraphQL query to check system initialization
const SYSTEM_QUERY = gql`
  query System {
    system {
      id
      initialized
    }
  }
`;

interface SystemQueryResult {
  system: {
    id: string;
    initialized: boolean;
  } | null;
}

interface UseSystemInitResult {
  isInitialized: boolean | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to check if system is initialized
 * Returns null while loading, true if initialized, false if not
 */
export function useSystemInit(): UseSystemInitResult {
  const { data, loading, error } = useQuery<SystemQueryResult>(SYSTEM_QUERY, {
    fetchPolicy: 'network-only', // Always fetch fresh data
    errorPolicy: 'all', // Don't throw on errors
  });

  // Determine initialization status
  let isInitialized: boolean | null = null;

  if (!loading) {
    if (error) {
      // On error, assume system needs initialization for safety
      isInitialized = false;
    } else if (data) {
      // If system exists and has initialized field, use that
      // If system is null, it means not initialized yet
      isInitialized = data.system?.initialized ?? false;
    }
  }

  return {
    isInitialized,
    isLoading: loading,
    error: error || null,
  };
}
