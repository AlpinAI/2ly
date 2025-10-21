/**
 * useWorkspaceFromUrl Hook
 *
 * WHY: Synchronizes URL workspace parameter with Zustand store.
 * URL is the source of truth for workspace context.
 *
 * USAGE:
 * ```tsx
 * function WorkspaceLoader() {
 *   const workspaceId = useWorkspaceFromUrl();
 *   // workspaceId is synced to Zustand automatically
 * }
 * ```
 */

import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspaceStore } from '@/stores/workspaceStore';

/**
 * Hook to sync workspace ID from URL to Zustand store
 *
 * @returns Current workspace ID from URL
 */
export function useWorkspaceFromUrl(): string | undefined {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const syncFromUrl = useWorkspaceStore((state) => state.syncFromUrl);

  useEffect(() => {
    if (workspaceId) {
      syncFromUrl(workspaceId);
    }
  }, [workspaceId, syncFromUrl]);

  return workspaceId;
}
