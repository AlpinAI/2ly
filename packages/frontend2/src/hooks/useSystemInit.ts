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
  isBackendError: boolean;
}

/**
 * Hook to check if system is initialized
 * Returns null while loading, true if initialized, false if not
 * Also detects backend connectivity issues
 */
export function useSystemInit(): UseSystemInitResult {
  const { data, loading, error } = useQuery<SystemQueryResult>(SYSTEM_QUERY, {
    fetchPolicy: 'network-only', // Always fetch fresh data
    errorPolicy: 'all', // Don't throw on errors
  });

  // Determine initialization status and error type
  let isInitialized: boolean | null = null;
  let isBackendError = false;

  if (!loading) {
    if (error) {
      // Check if this is a network/connectivity error vs a GraphQL error
      const isNetworkError = 
        error.message.includes('NetworkError') ||
        error.message.includes('fetch') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('ERR_NETWORK') ||
        error.message.includes('ERR_CONNECTION_REFUSED') ||
        error.message.includes('ERR_CONNECTION_TIMED_OUT');

      if (isNetworkError) {
        // Backend is unreachable - don't assume initialization status
        isBackendError = true;
        isInitialized = null; // Unknown status due to backend error
      } else {
        // GraphQL error - assume system needs initialization for safety
        isInitialized = false;
        isBackendError = false;
      }
    } else if (data) {
      // If system exists and has initialized field, use that
      // If system is null, it means not initialized yet
      isInitialized = data.system?.initialized ?? false;
      isBackendError = false;
    }
  }

  return {
    isInitialized,
    isLoading: loading,
    error: error || null,
    isBackendError,
  };
}
