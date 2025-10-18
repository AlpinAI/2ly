/**
 * Runtime State Store (Zustand)
 *
 * WHY: Manages runtime data centrally to eliminate duplicate subscriptions.
 * Runtimes are low-volume, frequently accessed across multiple components.
 *
 * WHY ZUSTAND (not Apollo subscription hooks):
 * - Single subscription eliminates race conditions
 * - Instant access without loading states in components
 * - Centralized management of runtime data
 * - Better performance (no re-subscriptions)
 *
 * INTEGRATION WITH APOLLO:
 * - Subscription is initialized in WorkspaceLoader
 * - Data flows: Apollo Subscription → Zustand Store → Components
 * - ErrorBoundary catches subscription errors
 *
 * USAGE:
 * ```tsx
 * import { useRuntimeStore } from '@/stores/runtimeStore';
 *
 * function DashboardPage() {
 *   const { runtimes, loading, error } = useRuntimeStore();
 *   return <div>{runtimes.map(r => <RuntimeCard key={r.id} runtime={r} />)}</div>;
 * }
 * ```
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Runtime } from '@/graphql/generated/graphql';

/**
 * Runtime State Interface
 */
interface RuntimeState {
  // Runtime data
  runtimes: Runtime[];
  
  // Loading and error states
  loading: boolean;
  error: Error | null;
  
  // Computed stats
  stats: {
    total: number;
    active: number;
    inactive: number;
  };
  
  // Actions
  setRuntimes: (runtimes: Runtime[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  
  // Reset state (useful for workspace changes)
  reset: () => void;
}

/**
 * Create Runtime Store
 *
 * WHY devtools: Debug runtime state changes in Redux DevTools
 * WHY no persist: Runtime data is workspace-specific and should be fresh
 */
export const useRuntimeStore = create<RuntimeState>()(
  devtools(
    (set) => ({
      // Initial State
      runtimes: [],
      loading: true,
      error: null,
      stats: {
        total: 0,
        active: 0,
        inactive: 0,
      },

      // Actions
      setRuntimes: (runtimes) => {
        // Calculate stats
        const stats = {
          total: runtimes.length,
          active: runtimes.filter((r) => r.status === 'ACTIVE').length,
          inactive: runtimes.filter((r) => r.status === 'INACTIVE').length,
        };

        set({ 
          runtimes, 
          stats,
          loading: false,
          error: null // Clear any previous errors
        });

        if (import.meta.env.DEV) {
          console.log('[RuntimeStore] Updated runtimes:', runtimes.length, 'total');
        }
      },

      setLoading: (loading) => {
        set({ loading });
        
        if (import.meta.env.DEV) {
          console.log('[RuntimeStore] Loading state:', loading);
        }
      },

      setError: (error) => {
        set({ 
          error, 
          loading: false 
        });

        if (import.meta.env.DEV) {
          console.error('[RuntimeStore] Error:', error?.message);
        }
      },

      reset: () => {
        set({
          runtimes: [],
          loading: true,
          error: null,
          stats: {
            total: 0,
            active: 0,
            inactive: 0,
          },
        });

        if (import.meta.env.DEV) {
          console.log('[RuntimeStore] Reset state');
        }
      },
    }),
    {
      name: '2LY Runtime Store', // Name in Redux DevTools
    }
  )
);

/**
 * Runtime Data Selector Hook
 *
 * WHY: Most components only need the runtime data.
 * This focused selector improves performance.
 * Uses individual selectors to prevent infinite loops.
 *
 * USAGE:
 * ```tsx
 * const { runtimes, loading, error } = useRuntimeData();
 * ```
 */
export const useRuntimeData = () => {
  const runtimes = useRuntimeStore((state) => state.runtimes);
  const loading = useRuntimeStore((state) => state.loading);
  const error = useRuntimeStore((state) => state.error);
  const stats = useRuntimeStore((state) => state.stats);
  
  return { runtimes, loading, error, stats };
};

/**
 * Runtime Actions Hook
 *
 * WHY: Components that manage runtime state don't need to re-render when data changes.
 * Uses individual selectors to prevent infinite re-renders.
 *
 * USAGE:
 * ```tsx
 * const { setRuntimes, setLoading, setError } = useRuntimeActions();
 * ```
 */
export const useRuntimeActions = () => {
  const setRuntimes = useRuntimeStore((state) => state.setRuntimes);
  const setLoading = useRuntimeStore((state) => state.setLoading);
  const setError = useRuntimeStore((state) => state.setError);
  const reset = useRuntimeStore((state) => state.reset);
  
  return { setRuntimes, setLoading, setError, reset };
};
