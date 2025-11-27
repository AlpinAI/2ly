/**
 * WorkspaceRedirect Component
 *
 * WHY: Redirects user to their workspace when they visit root URL.
 * Uses user's available workspaces (filtered by admin permissions).
 *
 * FLOW:
 * 1. Query user's workspaces from backend (filtered by admin relationship)
 * 2. Check if user has a last-used workspace in store
 * 3. Validate stored workspace is in user's available workspaces
 * 4. Redirect to stored workspace or first available workspace
 * 5. If no workspaces, show error message
 *
 * USAGE:
 * ```tsx
 * <Route path="/" element={<WorkspaceRedirect />} />
 * ```
 */

import { Navigate } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { GetWorkspacesDocument } from '@/graphql/generated/graphql';
import { useWorkspaceId, useWorkspaceStore } from '@/stores/workspaceStore';

export function WorkspaceRedirect() {
  // Force network-only fetch to prevent stale cache data after logout/login
  const { data, loading, error } = useQuery(GetWorkspacesDocument, {
    fetchPolicy: 'network-only',
  });
  const storedWorkspaceId = useWorkspaceId();

  console.log('[WorkspaceRedirect] Rendering - loading:', loading, 'error:', error, 'workspaces:', data?.workspaces?.length);

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    console.error('[WorkspaceRedirect] Error loading workspaces:', error);
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-600">Error Loading Workspaces</h1>
          <p className="text-gray-600 dark:text-gray-400">{error.message}</p>
        </div>
      </div>
    );
  }

  // No workspaces available
  if (!data?.workspaces || data.workspaces.length === 0) {
    console.warn('[WorkspaceRedirect] No workspaces available for user');
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">No Workspaces Available</h1>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have access to any workspaces. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  // Determine which workspace to redirect to
  let targetWorkspaceId: string;

  // Try to use stored workspace if it's valid (exists in user's workspaces)
  if (storedWorkspaceId) {
    const workspaceExists = data.workspaces.some(ws => ws.id === storedWorkspaceId);
    if (workspaceExists) {
      targetWorkspaceId = storedWorkspaceId;
    } else {
      // Stored workspace is no longer accessible
      // Clear invalid workspace from store and use first available
      console.warn(
        `[WorkspaceRedirect] Stored workspace ${storedWorkspaceId} not in user's workspaces. Clearing and using first available.`
      );
      useWorkspaceStore.getState().clearWorkspace();
      targetWorkspaceId = data.workspaces[0].id;
    }
  } else {
    // No stored workspace, use first available
    targetWorkspaceId = data.workspaces[0].id;
  }

  console.log('[WorkspaceRedirect] Redirecting to workspace:', targetWorkspaceId);
  // Redirect to workspace
  return <Navigate to={`/w/${targetWorkspaceId}/overview`} replace />;
}
