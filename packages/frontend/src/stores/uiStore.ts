/**
 * UI State Store (Zustand)
 *
 * WHY: Manages client-side UI state that doesn't belong in the backend.
 * This includes modal visibility, filters, search, navigation state, etc.
 *
 * WHY ZUSTAND (not React Context):
 * - No provider wrapping needed
 * - Better performance (no re-render of entire tree)
 * - Simpler API than Redux
 * - TypeScript-first design
 * - Small bundle size (1KB)
 *
 * WHY SEPARATE FROM APOLLO:
 * - Apollo manages server state (data from backend)
 * - Zustand manages client state (UI-only state)
 * - Clear separation of concerns
 *
 * STATE BOUNDARIES:
 * ✅ Store here: Modal open/closed, filters, search queries, UI preferences
 * ❌ Don't store here: Backend data (agents, tools, etc.) - use Apollo
 *
 * USAGE:
 * ```tsx
 * import { useUIStore } from '@/stores/uiStore';
 *
 * function MyComponent() {
 *   const { deployModalOpen, setDeployModalOpen } = useUIStore();
 *   return <Dialog open={deployModalOpen} onOpenChange={setDeployModalOpen} />;
 * }
 * ```
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * UI State Interface
 *
 * WHY: Type-safe state definition.
 * All UI state is defined here for easy overview.
 */
interface UIState {
  // Modal States
  deployModalOpen: boolean;
  setDeployModalOpen: (open: boolean) => void;
  addSourceWorkflowOpen: boolean;
  setAddSourceWorkflowOpen: (open: boolean) => void;
  addSourceWorkflowInitialStep: 'selection' | 'mcp-browser' | 'mcp-config' | null;
  setAddSourceWorkflowInitialStep: (step: 'selection' | 'mcp-browser' | 'mcp-config' | null) => void;
  addSourceWorkflowServerId: string | null;
  setAddSourceWorkflowServerId: (serverId: string | null) => void;
  addServerWorkflowOpen: boolean;
  setAddServerWorkflowOpen: (open: boolean) => void;
  addServerWorkflowInitialStep: 'selection' | 'upstream' | 'easy-manual' | 'advanced-manual' | null;
  setAddServerWorkflowInitialStep: (step: 'selection' | 'upstream' | 'easy-manual' | 'advanced-manual' | null) => void;
  manageToolsDialogOpen: boolean;
  setManageToolsDialogOpen: (open: boolean) => void;
  selectedToolsetForManagement: string | null;
  setSelectedToolsetForManagement: (id: string | null) => void;
  createToolsetDialogOpen: boolean;
  createToolsetDialogCallback: ((toolSetId: string) => void) | null;
  openCreateToolsetDialog: (onSuccess?: (toolSetId: string) => void) => void;
  closeCreateToolsetDialog: () => void;
  connectToolsetDialogOpen: boolean;
  setConnectToolsetDialogOpen: (open: boolean) => void;
  selectedToolsetNameForConnection: string | null;
  setSelectedToolsetNameForConnection: (toolsetName: string | null) => void;
  selectedToolsetIdForConnection: string | null;
  setSelectedToolsetIdForConnection: (toolsetId: string | null) => void;

  // Tool Catalog Filters
  toolCategoryFilter: string;
  setToolCategoryFilter: (category: string) => void;
  toolSearchQuery: string;
  setToolSearchQuery: (query: string) => void;
  toolSortBy: 'popular' | 'rating' | 'recent' | 'name';
  setToolSortBy: (sortBy: 'popular' | 'rating' | 'recent' | 'name') => void;

  // Navigation State
  activeSection: string;
  setActiveSection: (section: string) => void;
  activeSubSection: string;
  setActiveSubSection: (subSection: string) => void;

  // Playground State
  selectedPlaygroundTool: string | null;
  setSelectedPlaygroundTool: (toolId: string | null) => void;
  playgroundConsoleExpanded: boolean;
  setPlaygroundConsoleExpanded: (expanded: boolean) => void;

  // Actions - Reset/Clear
  resetFilters: () => void;
}

/**
 * Create UI Store
 *
 * WHY devtools middleware: Enables Redux DevTools for debugging
 * WHY persist middleware: Saves certain state to localStorage
 *
 * PERSISTENCE STRATEGY:
 * - Persist: Filters, navigation, preferences (improve UX on reload)
 * - Don't persist: Modals (should be closed on reload)
 */
export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        // Initial State - Modals
        deployModalOpen: false,
        setDeployModalOpen: (open) => set({ deployModalOpen: open }),
        addSourceWorkflowOpen: false,
        setAddSourceWorkflowOpen: (open) => set({ addSourceWorkflowOpen: open }),
        addSourceWorkflowInitialStep: null,
        setAddSourceWorkflowInitialStep: (step) => set({ addSourceWorkflowInitialStep: step }),
        addSourceWorkflowServerId: null,
        setAddSourceWorkflowServerId: (serverId) => set({ addSourceWorkflowServerId: serverId }),
        addServerWorkflowOpen: false,
        setAddServerWorkflowOpen: (open) => set({ addServerWorkflowOpen: open }),
        addServerWorkflowInitialStep: null,
        setAddServerWorkflowInitialStep: (step) => set({ addServerWorkflowInitialStep: step }),
        manageToolsDialogOpen: false,
        setManageToolsDialogOpen: (open) => set({ manageToolsDialogOpen: open }),
        selectedToolsetForManagement: null,
        setSelectedToolsetForManagement: (id) => set({ selectedToolsetForManagement: id }),

        // Initial State - Tool Catalog Filters
        toolCategoryFilter: 'all',
        setToolCategoryFilter: (category) => set({ toolCategoryFilter: category }),
        toolSearchQuery: '',
        setToolSearchQuery: (query) => set({ toolSearchQuery: query }),
        toolSortBy: 'popular',
        setToolSortBy: (sortBy) => set({ toolSortBy: sortBy }),

        // Initial State - Navigation
        activeSection: 'overview',
        setActiveSection: (section) => set({ activeSection: section }),
        activeSubSection: 'dashboard',
        setActiveSubSection: (subSection) => set({ activeSubSection: subSection }),

        // Initial State - Playground
        selectedPlaygroundTool: null,
        setSelectedPlaygroundTool: (toolId) => set({ selectedPlaygroundTool: toolId }),
        playgroundConsoleExpanded: false,
        setPlaygroundConsoleExpanded: (expanded) => set({ playgroundConsoleExpanded: expanded }),

        // Initial State - Create Toolset Dialog
        createToolsetDialogOpen: false,
        createToolsetDialogCallback: null,
        openCreateToolsetDialog: (onSuccess) =>
          set({
            createToolsetDialogOpen: true,
            createToolsetDialogCallback: onSuccess || null,
          }),
        closeCreateToolsetDialog: () =>
          set({
            createToolsetDialogOpen: false,
            createToolsetDialogCallback: null,
          }),

        // Initial State - Connect Toolset Dialog
        connectToolsetDialogOpen: false,
        setConnectToolsetDialogOpen: (open) => set({ connectToolsetDialogOpen: open }),
        selectedToolsetNameForConnection: null,
        setSelectedToolsetNameForConnection: (toolsetName) => set({ selectedToolsetNameForConnection: toolsetName }),
        selectedToolsetIdForConnection: null,
        setSelectedToolsetIdForConnection: (toolsetId) => set({ selectedToolsetIdForConnection: toolsetId }),

        // Actions
        resetFilters: () =>
          set({
            toolCategoryFilter: 'all',
            toolSearchQuery: '',
            toolSortBy: 'popular',
          }),
      }),
      {
        name: '2ly-ui-state', // localStorage key
        // WHY: Only persist these keys (not modals)
        partialize: (state) => ({
          toolCategoryFilter: state.toolCategoryFilter,
          toolSortBy: state.toolSortBy,
          activeSection: state.activeSection,
          activeSubSection: state.activeSubSection,
        }),
      },
    ),
    {
      name: '2LY UI Store', // Name in Redux DevTools
    },
  ),
);

/**
 * Selector Hooks (Optional Pattern)
 *
 * WHY: Create focused selectors for better performance.
 * Component only re-renders when selected state changes.
 *
 * EXAMPLE:
 * ```tsx
 * // ❌ Bad: Component re-renders on ANY UI state change
 * const uiState = useUIStore();
 *
 * // ✅ Good: Component only re-renders when deployModalOpen changes
 * const deployModalOpen = useUIStore(state => state.deployModalOpen);
 * ```
 */
export const useDeployModal = () =>
  useUIStore((state) => ({
    open: state.deployModalOpen,
    setOpen: state.setDeployModalOpen,
  }));

export const useToolFilters = () =>
  useUIStore((state) => ({
    category: state.toolCategoryFilter,
    setCategory: state.setToolCategoryFilter,
    search: state.toolSearchQuery,
    setSearch: state.setToolSearchQuery,
    sortBy: state.toolSortBy,
    setSortBy: state.setToolSortBy,
    reset: state.resetFilters,
  }));

export const useNavigation = () =>
  useUIStore((state) => ({
    activeSection: state.activeSection,
    setActiveSection: state.setActiveSection,
    activeSubSection: state.activeSubSection,
    setActiveSubSection: state.setActiveSubSection,
  }));

export const useAddSourceWorkflow = () =>
  useUIStore((state) => ({
    open: state.addSourceWorkflowOpen,
    setOpen: state.setAddSourceWorkflowOpen,
    serverId: state.addSourceWorkflowServerId,
    setServerId: state.setAddSourceWorkflowServerId,
    initialStep: state.addSourceWorkflowInitialStep,
    setInitialStep: state.setAddSourceWorkflowInitialStep,
  }));

export const useManageToolsDialog = () => {
  const open = useUIStore((state) => state.manageToolsDialogOpen);
  const setOpen = useUIStore((state) => state.setManageToolsDialogOpen);
  const selectedToolsetId = useUIStore((state) => state.selectedToolsetForManagement);
  const setSelectedToolsetId = useUIStore((state) => state.setSelectedToolsetForManagement);

  return {
    open,
    setOpen,
    selectedToolsetId,
    setSelectedToolsetId,
  };
};

export const useCreateToolsetDialog = () => {
  const open = useUIStore((state) => state.createToolsetDialogOpen);
  const callback = useUIStore((state) => state.createToolsetDialogCallback);
  const openDialog = useUIStore((state) => state.openCreateToolsetDialog);
  const close = useUIStore((state) => state.closeCreateToolsetDialog);

  return {
    open,
    callback,
    openDialog,
    close,
  };
};

export const useConnectToolsetDialog = () => {
  const open = useUIStore((state) => state.connectToolsetDialogOpen);
  const setOpen = useUIStore((state) => state.setConnectToolsetDialogOpen);
  const selectedToolsetName = useUIStore((state) => state.selectedToolsetNameForConnection);
  const setSelectedToolsetName = useUIStore((state) => state.setSelectedToolsetNameForConnection);
  const selectedToolsetId = useUIStore((state) => state.selectedToolsetIdForConnection);
  const setSelectedToolsetId = useUIStore((state) => state.setSelectedToolsetIdForConnection);

  return {
    open,
    setOpen,
    selectedToolsetName,
    setSelectedToolsetName,
    selectedToolsetId,
    setSelectedToolsetId,
  };
};

export const useAddServerWorkflow = () => {
  const open = useUIStore((state) => state.addServerWorkflowOpen);
  const setOpen = useUIStore((state) => state.setAddServerWorkflowOpen);
  const initialStep = useUIStore((state) => state.addServerWorkflowInitialStep);
  const setInitialStep = useUIStore((state) => state.setAddServerWorkflowInitialStep);

  return {
    open,
    setOpen,
    initialStep,
    setInitialStep,
  };
};
