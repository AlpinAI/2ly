/**
 * WorkspaceLoader Component
 *
 * WHY: Validates and syncs workspace from URL to Zustand store.
 * Ensures user has access to the workspace before rendering children.
 *
 * FLOW:
 * 1. Read workspaceId from URL params
 * 2. Sync to Zustand store (via useWorkspaceFromUrl)
 * 3. Validate workspace access via GraphQL
 * 4. Show loading state or error
 * 5. Render children when valid
 *
 * USAGE:
 * ```tsx
 * <Route path="/w/:workspaceId/*" element={<WorkspaceLoader><AppLayout /></WorkspaceLoader>} />
 * ```
 */

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { useWorkspaceFromUrl } from '@/hooks/useWorkspaceFromUrl';
import { ValidateWorkspaceDocument } from '@/graphql/generated/graphql';

interface WorkspaceLoaderProps {
  children: ReactNode;
}

export function WorkspaceLoader({ children }: WorkspaceLoaderProps) {
  const workspaceId = useWorkspaceFromUrl();

  // Query to validate workspace access
  const { data, loading, error } = useQuery(ValidateWorkspaceDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId,
  });

  // No workspace ID in URL - redirect to root
  if (!workspaceId) {
    return <Navigate to="/" replace />;
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // Error or no workspace found - redirect to root
  if (error || !data?.workspaceMCPTools) {
    console.error('[WorkspaceLoader] Invalid workspace:', workspaceId, error);
    return <Navigate to="/" replace />;
  }

  // Valid workspace - render children
  return <>{children}</>;
}
