/**
 * Registry Sync State Store (Zustand)
 *
 * WHY: Manages registry sync status centrally to prevent duplicate syncs and provide
 * real-time sync status across the application. Essential for auto-sync functionality.
 *
 * WHY ZUSTAND (not Apollo):
 * - Sync status is UI state (loading indicators, preventing duplicate operations)
 * - Needs to be accessible from any component without prop drilling
 * - Simple boolean state that doesn't need server persistence
 *
 * INTEGRATION WITH APOLLO:
 * - Sync operations use Apollo mutations
 * - Store tracks the loading state of these mutations
 * - Components can show sync indicators without managing local state
 *
 * USAGE:
 * ```tsx
 * import { useRegistrySyncStore } from '@/stores/registrySyncStore';
 *
 * function RegistryCard({ registry }) {
 *   const isSyncing = useRegistrySyncStore(state => state.isSyncing(registry.id));
 *   return <div>{isSyncing ? 'Syncing...' : 'Ready'}</div>;
 * }
 * ```
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Registry Sync State Interface
 */
interface RegistrySyncState {
  // Registry IDs currently syncing
  syncingRegistries: Set<string>;
  
  // Registry ID -> last sync timestamp
  lastSyncTimes: Map<string, Date>;
  
  // Actions
  startSync: (registryId: string) => void;
  endSync: (registryId: string) => void;
  updateLastSyncTime: (registryId: string, timestamp: Date) => void;
  isSyncing: (registryId: string) => boolean;
  reset: () => void;
}

/**
 * Create Registry Sync Store
 *
 * WHY devtools: Debug sync state changes in Redux DevTools
 * WHY no persist: Sync state is temporary and should reset on app reload
 */
export const useRegistrySyncStore = create<RegistrySyncState>()(
  devtools(
    (set, get) => ({
      // Initial State
      syncingRegistries: new Set(),
      lastSyncTimes: new Map(),
      
      // Actions
      startSync: (registryId) =>
        set((state) => ({
          syncingRegistries: new Set(state.syncingRegistries).add(registryId),
        })),
      
      endSync: (registryId) =>
        set((state) => {
          const newSet = new Set(state.syncingRegistries);
          newSet.delete(registryId);
          return { syncingRegistries: newSet };
        }),
      
      updateLastSyncTime: (registryId, timestamp) =>
        set((state) => ({
          lastSyncTimes: new Map(state.lastSyncTimes).set(registryId, timestamp),
        })),
      
      isSyncing: (registryId) => get().syncingRegistries.has(registryId),
      
      reset: () => set({ syncingRegistries: new Set(), lastSyncTimes: new Map() }),
    }),
    { name: '2LY Registry Sync Store' }
  )
);
