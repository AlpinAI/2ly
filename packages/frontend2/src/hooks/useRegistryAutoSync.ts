/**
 * Registry Auto-Sync Hook
 *
 * WHY: Provides a reusable hook for automatically syncing registries after creation.
 * Handles the complete flow: start sync state, call mutation, update timestamps, end sync state.
 *
 * INTEGRATION:
 * - Uses Apollo mutation for sync operation
 * - Integrates with registrySyncStore for state management
 * - Provides error handling and cleanup
 *
 * USAGE:
 * ```tsx
 * import { useRegistryAutoSync } from '@/hooks/useRegistryAutoSync';
 *
 * function MyComponent() {
 *   const { autoSyncRegistry } = useRegistryAutoSync();
 *   
 *   const handleCreateRegistry = async (name, url) => {
 *     const result = await createRegistry({ variables: { name, url } });
 *     if (result.data?.createMCPRegistry?.id) {
 *       await autoSyncRegistry(result.data.createMCPRegistry.id);
 *     }
 *   };
 * }
 * ```
 */

import { useMutation } from '@apollo/client/react';
import { SyncUpstreamRegistryDocument } from '@/graphql/generated/graphql';
import { useRegistrySyncStore } from '@/stores/registrySyncStore';

export function useRegistryAutoSync() {
  const { startSync, endSync, updateLastSyncTime } = useRegistrySyncStore();
  const [syncRegistry] = useMutation(SyncUpstreamRegistryDocument);

  const autoSyncRegistry = async (registryId: string) => {
    startSync(registryId);
    try {
      await syncRegistry({ variables: { registryId } });
      updateLastSyncTime(registryId, new Date());
    } catch (error) {
      console.error(`Auto-sync failed for registry ${registryId}:`, error);
    } finally {
      endSync(registryId);
    }
  };

  return { autoSyncRegistry };
}
