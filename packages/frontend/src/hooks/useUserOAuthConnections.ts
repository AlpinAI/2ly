/**
 * useUserOAuthConnections Hook
 *
 * Manages user's personal OAuth connections to workspace-enabled providers.
 * Used for connecting to Google, Microsoft, Notion to allow MCP tools
 * to access external APIs on behalf of the user.
 */

import { useQuery, useMutation } from '@apollo/client/react';
import { useWorkspaceId } from '@/stores/workspaceStore';
import {
  GetUserOAuthConnectionsDocument,
  InitiateOAuthConnectionDocument,
  DisconnectOAuthProviderDocument,
  OAuthProviderType,
} from '@/graphql/generated/graphql';

export function useUserOAuthConnections() {
  const workspaceId = useWorkspaceId();

  // Query: Get all user's OAuth connections for workspace
  const { data, loading, error, refetch } = useQuery(GetUserOAuthConnectionsDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId,
    fetchPolicy: 'cache-and-network',
  });

  // Mutation: Initiate OAuth connection (get authorization URL)
  const [initiateConnectionMutation, { loading: initiating }] = useMutation(
    InitiateOAuthConnectionDocument
  );

  // Mutation: Disconnect OAuth provider
  const [disconnectMutation, { loading: disconnecting }] = useMutation(
    DisconnectOAuthProviderDocument,
    {
      refetchQueries: [{ query: GetUserOAuthConnectionsDocument, variables: { workspaceId } }],
    }
  );

  const connections = data?.getUserOAuthConnections ?? [];

  /**
   * Initiate OAuth connection flow.
   * Returns the authorization URL to redirect the user to.
   */
  const initiateConnection = async (
    provider: OAuthProviderType,
    scopes?: string[]
  ): Promise<string | null> => {
    if (!workspaceId) return null;

    // Build the redirect URI (backend OAuth callback)
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    const redirectUri = `${backendUrl}/oauth/callback`;

    try {
      const result = await initiateConnectionMutation({
        variables: {
          workspaceId,
          provider,
          redirectUri,
          scopes: scopes || null,
        },
      });

      return result.data?.initiateOAuthConnection?.url ?? null;
    } catch (error) {
      console.error('Failed to initiate OAuth connection:', error);
      return null;
    }
  };

  /**
   * Disconnect an OAuth provider connection.
   */
  const disconnectConnection = async (connectionId: string): Promise<boolean> => {
    try {
      const result = await disconnectMutation({
        variables: { connectionId },
      });

      return result.data?.disconnectOAuthProvider ?? false;
    } catch (error) {
      console.error('Failed to disconnect OAuth provider:', error);
      return false;
    }
  };

  /**
   * Check if user has a connection for a specific provider.
   */
  const hasConnection = (provider: OAuthProviderType): boolean => {
    return connections.some((c) => c.provider === provider);
  };

  /**
   * Get connection for a specific provider.
   */
  const getConnection = (provider: OAuthProviderType) => {
    return connections.find((c) => c.provider === provider);
  };

  return {
    connections,
    loading,
    error,
    refetch,
    initiateConnection,
    initiating,
    disconnectConnection,
    disconnecting,
    hasConnection,
    getConnection,
  };
}
