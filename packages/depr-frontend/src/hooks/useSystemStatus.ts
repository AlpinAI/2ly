/**
 * useSystemStatus Hook
 *
 * Custom hook for monitoring system status, health checks, and initialization state.
 * Provides real-time updates and periodic refresh functionality.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getSystemInitializationService,
  SystemStatus,
  SystemInitializationError,
} from '../services/system.service';

export interface SystemStatusHook {
  systemStatus: SystemStatus | null;
  isInitialized: boolean;
  isHealthy: boolean;
  lastHealthCheck: Date | null;
  refreshSystemStatus: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export interface UseSystemStatusOptions {
  /**
   * Interval for automatic status refresh in milliseconds
   * Set to 0 or null to disable automatic refresh
   * @default 30000 (30 seconds)
   */
  refreshInterval?: number | null;

  /**
   * Whether to check status immediately on mount
   * @default true
   */
  immediate?: boolean;

  /**
   * Maximum number of consecutive error attempts before stopping auto-refresh
   * @default 5
   */
  maxErrorAttempts?: number;
}

/**
 * Hook for managing system status and health monitoring
 */
export const useSystemStatus = (options: UseSystemStatusOptions = {}): SystemStatusHook => {
  const {
    refreshInterval = 30000,
    immediate = true,
    maxErrorAttempts = 5,
  } = options;

  // State
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastHealthCheck, setLastHealthCheck] = useState<Date | null>(null);

  // Refs for cleanup and state management
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const errorCountRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  // Derived state
  const isInitialized = systemStatus?.initialized ?? false;
  const isHealthy = systemStatus?.health === 'healthy';

  /**
   * Fetch system status from service
   */
  const fetchSystemStatus = useCallback(async (): Promise<void> => {
    if (!isMountedRef.current) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const service = getSystemInitializationService();
      const status = await service.checkSystemStatus();

      if (isMountedRef.current) {
        setSystemStatus(status);
        setLastHealthCheck(new Date());
        errorCountRef.current = 0; // Reset error count on success
      }
    } catch (err) {
      console.error('Failed to fetch system status:', err);

      if (isMountedRef.current) {
        const errorMessage = err instanceof SystemInitializationError
          ? err.message
          : 'Failed to check system status';

        setError(errorMessage);
        errorCountRef.current += 1;

        // If we've hit max error attempts, stop auto-refresh temporarily
        if (errorCountRef.current >= maxErrorAttempts) {
          console.warn(`Max error attempts (${maxErrorAttempts}) reached, stopping auto-refresh temporarily`);
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
            refreshTimeoutRef.current = null;
          }
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [maxErrorAttempts]);

  /**
   * Schedule next status refresh
   */
  const scheduleNextRefresh = useCallback((): void => {
    if (!refreshInterval || refreshInterval <= 0 || !isMountedRef.current) {
      return;
    }

    // Don't schedule if we've hit max errors
    if (errorCountRef.current >= maxErrorAttempts) {
      return;
    }

    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = setTimeout(() => {
      fetchSystemStatus().then(() => {
        scheduleNextRefresh();
      });
    }, refreshInterval);
  }, [refreshInterval, maxErrorAttempts, fetchSystemStatus]);

  /**
   * Manually refresh system status
   */
  const refreshSystemStatus = useCallback(async (): Promise<void> => {
    // Reset error count when manually refreshing
    errorCountRef.current = 0;

    await fetchSystemStatus();

    // Restart auto-refresh if it was stopped due to errors
    if (refreshInterval && refreshInterval > 0) {
      scheduleNextRefresh();
    }
  }, [fetchSystemStatus, refreshInterval, scheduleNextRefresh]);

  /**
   * Initialize and set up auto-refresh
   */
  useEffect(() => {
    if (immediate) {
      fetchSystemStatus().then(() => {
        scheduleNextRefresh();
      });
    } else if (refreshInterval && refreshInterval > 0) {
      scheduleNextRefresh();
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [immediate, fetchSystemStatus, scheduleNextRefresh, refreshInterval]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return {
    systemStatus,
    isInitialized,
    isHealthy,
    lastHealthCheck,
    refreshSystemStatus,
    loading,
    error,
  };
};

/**
 * Hook for checking if system needs initialization
 * Simplified version of useSystemStatus for initialization checks
 */
export const useSystemInitializationCheck = (): {
  needsInitialization: boolean | null;
  loading: boolean;
  error: string | null;
  checkInitialization: () => Promise<void>;
} => {
  const [needsInitialization, setNeedsInitialization] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const checkInitialization = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const service = getSystemInitializationService();
      const status = await service.checkSystemStatus();

      setNeedsInitialization(!status.initialized);
    } catch (err) {
      console.error('Failed to check initialization status:', err);

      const errorMessage = err instanceof SystemInitializationError
        ? err.message
        : 'Failed to check system initialization status';

      setError(errorMessage);
      // On error, assume system needs initialization for safety
      setNeedsInitialization(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check on mount
  useEffect(() => {
    checkInitialization();
  }, [checkInitialization]);

  return {
    needsInitialization,
    loading,
    error,
    checkInitialization,
  };
};