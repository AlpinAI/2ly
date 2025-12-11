/**
 * Workspace State Store (Zustand)
 *
 * WHY: Manages the currently selected workspace across the application.
 * Workspace context is needed for almost all backend queries.
 *
 * WHY ZUSTAND (not Apollo):
 * - Workspace selection is UI state (user preference)
 * - Backend has workspace data, but the "current selection" is client-side
 * - Needs to be accessible from any component without prop drilling
 *
 * WHY SEPARATE FROM UI STORE:
 * - Workspace is conceptually different from UI state
 * - May have different persistence/lifecycle requirements
 * - Easier to reason about when separated
 *
 * INTEGRATION WITH APOLLO:
 * - Workspace ID is used as a variable in GraphQL queries
 * - When workspace changes, Apollo queries automatically refetch
 *
 * USAGE:
 * ```tsx
 * import { useWorkspaceStore } from '@/stores/workspaceStore';
 *
 * function WorkspaceSelector() {
 *   const { selectedWorkspace, setWorkspace } = useWorkspaceStore();
 *   return <Select value={selectedWorkspace} onChange={setWorkspace} />;
 * }
 *
 * // In a query
 * const { data } = useGetAgentsQuery({
 *   variables: { workspaceId: useWorkspaceStore(s => s.selectedWorkspace) }
 * });
 * ```
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { OnboardingStep } from '@/graphql/generated/graphql';

/**
 * Workspace State Interface
 */
interface WorkspaceState {
  // Currently selected workspace ID
  selectedWorkspace: string | null;
  
  // Onboarding steps for current workspace
  onboardingSteps: OnboardingStep[];

  // Set workspace (also triggers refetch of workspace-scoped queries)
  setWorkspace: (workspaceId: string) => void;
  
  // Set onboarding steps (updated via subscription)
  setOnboardingSteps: (steps: OnboardingStep[]) => void;

  // Clear workspace selection
  clearWorkspace: () => void;

  // Sync workspace from URL (used by WorkspaceLoader)
  syncFromUrl: (workspaceId: string) => void;
}

/**
 * Create Workspace Store
 *
 * WHY persist: Remember user's workspace selection across sessions
 * WHY devtools: Debug workspace state changes
 */
export const useWorkspaceStore = create<WorkspaceState>()(
  devtools(
    persist(
      (set) => ({
        // Initial State
        // WHY null: No workspace selected by default
        // User must select from available workspaces
        selectedWorkspace: null,
        
        // WHY empty array: No onboarding steps until workspace is loaded
        onboardingSteps: [],

        // Actions
        setWorkspace: (workspaceId) => {
          set({ selectedWorkspace: workspaceId });

          // WHY: Log for debugging workspace switches
          if (import.meta.env.DEV) {
            console.log('[Workspace] Changed to:', workspaceId);
          }

          // TODO: Trigger Apollo to refetch workspace-scoped queries
          // This could be done via Apollo Client's refetchQueries
        },

        // WHY separate from setWorkspace: URL is source of truth
        // This method doesn't trigger navigation, just syncs state
        syncFromUrl: (workspaceId) => {
          set({ selectedWorkspace: workspaceId });

          if (import.meta.env.DEV) {
            console.log('[Workspace] Synced from URL:', workspaceId);
          }
        },

        setOnboardingSteps: (steps) => set({ onboardingSteps: steps }),
        
        clearWorkspace: () => set({ selectedWorkspace: null, onboardingSteps: [] }),
      }),
      {
        name: 'skilder-workspace', // localStorage key
      }
    ),
    {
      name: 'Skilder Workspace Store', // Name in Redux DevTools
    }
  )
);

/**
 * Workspace ID Selector Hook
 *
 * WHY: Most components only need the workspace ID for queries.
 * This focused selector improves performance.
 *
 * USAGE:
 * ```tsx
 * const workspaceId = useWorkspaceId();
 * const { data } = useGetAgentsQuery({ variables: { workspaceId } });
 * ```
 */
export const useWorkspaceId = () =>
  useWorkspaceStore((state) => state.selectedWorkspace);

/**
 * Workspace Actions Hook
 *
 * WHY: Components that change workspace don't need to re-render when ID changes.
 *
 * USAGE:
 * ```tsx
 * const { setWorkspace } = useWorkspaceActions();
 * ```
 */
export const useWorkspaceActions = () =>
  useWorkspaceStore((state) => ({
    setWorkspace: state.setWorkspace,
    clearWorkspace: state.clearWorkspace,
  }));
