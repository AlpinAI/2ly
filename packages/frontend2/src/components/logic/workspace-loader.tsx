/**
 * WorkspaceLoader Component
 *
 * WHY: Validates and syncs workspace from URL to Zustand store.
 * Ensures user has access to the workspace before rendering children.
 * Also initializes runtime subscription for centralized runtime management.
 *
 * FLOW:
 * 1. Read workspaceId from URL params
 * 2. Sync to Zustand store (via useWorkspaceFromUrl)
 * 3. Validate workspace access via GraphQL
 * 4. Initialize runtime subscription and update store
 * 5. Show loading state or error
 * 6. Render children when valid
 *
 * USAGE:
 * ```tsx
 * <Route path="/w/:workspaceId/*" element={<WorkspaceLoader><AppLayout /></WorkspaceLoader>} />
 * ```
 */

import { ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useSubscription } from '@apollo/client/react';
import { useWorkspaceFromUrl } from '@/hooks/useWorkspaceFromUrl';
import { ValidateWorkspaceDocument, SubscribeRuntimesDocument, Runtime } from '@/graphql/generated/graphql';
import { useRuntimeStore } from '@/stores/runtimeStore';
import { SubscriptionErrorBoundary } from './subscription-error-boundary';

interface WorkspaceLoaderProps {
  children: ReactNode;
}

export function WorkspaceLoader({ children }: WorkspaceLoaderProps) {
  const workspaceId = useWorkspaceFromUrl();
  const setRuntimes = useRuntimeStore((state) => state.setRuntimes);
  const setLoading = useRuntimeStore((state) => state.setLoading);
  const setError = useRuntimeStore((state) => state.setError);
  const reset = useRuntimeStore((state) => state.reset);

  // Query to validate workspace access
  const { data, loading, error } = useQuery(ValidateWorkspaceDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId,
  });

  // Runtime subscription - only start after workspace is validated
  const { loading: runtimeLoading, error: runtimeError } = useSubscription(
    SubscribeRuntimesDocument,
    {
      variables: { workspaceId: workspaceId || '' },
      skip: !workspaceId || loading || !!error || !data?.workspaceMCPTools,
      onData: ({ data: subscriptionData }) => {
        if (subscriptionData?.data?.runtimes) {
          setRuntimes(subscriptionData.data.runtimes as Runtime[]);
        }
      },
      onError: (subscriptionError) => {
        console.error('[WorkspaceLoader] Runtime subscription error:', subscriptionError);
        setError(subscriptionError);
      },
    }
  );

  // Reset runtime store when workspace changes
  useEffect(() => {
    if (workspaceId) {
      reset();
    }
  }, [workspaceId, reset]);

  // Set loading state based on both queries
  useEffect(() => {
    setLoading(loading || runtimeLoading);
  }, [loading, runtimeLoading, setLoading]);

  // No workspace ID in URL - redirect to root
  if (!workspaceId) {
    return <Navigate to="/" replace />;
  }

  // Loading state
  if (loading || runtimeLoading) {
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

  // Runtime subscription error - let ErrorBoundary handle it
  if (runtimeError) {
    throw runtimeError;
  }

  // Valid workspace - render children with error boundary
  return (
    <SubscriptionErrorBoundary>
      {children}
    </SubscriptionErrorBoundary>
  );
}
