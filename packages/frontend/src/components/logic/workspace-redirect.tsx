/**
 * WorkspaceRedirect Component
 *
 * WHY: Redirects user to their default workspace when they visit root URL.
 * Handles fallback cases (no default workspace, error states).
 *
 * FLOW:
 * 1. Query System.defaultWorkspace from backend
 * 2. Redirect to /w/:defaultWorkspaceId/overview
 * 3. If no default, show workspace selector (TODO) or error
 *
 * USAGE:
 * ```tsx
 * <Route path="/" element={<WorkspaceRedirect />} />
 * ```
 */

import { Navigate } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { GetDefaultWorkspaceDocument } from '@/graphql/generated/graphql';

export function WorkspaceRedirect() {
  const { data, loading, error } = useQuery(GetDefaultWorkspaceDocument);

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-600">Error Loading Workspace</h1>
          <p className="text-gray-600 dark:text-gray-400">{error.message}</p>
        </div>
      </div>
    );
  }

  // No default workspace configured
  if (!data?.system?.defaultWorkspace) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">No Default Workspace</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please contact your administrator to configure a default workspace.
          </p>
          {/* TODO: Add workspace selector component here */}
        </div>
      </div>
    );
  }

  // Redirect to default workspace
  const defaultWorkspaceId = data.system.defaultWorkspace.id;
  return <Navigate to={`/w/${defaultWorkspaceId}/overview`} replace />;
}
