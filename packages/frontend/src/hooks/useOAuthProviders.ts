/**
 * useOAuthProviders Hook
 *
 * Wrapper around Apollo Client hooks for OAuth provider management:
 * - Fetches OAuth provider configurations for workspace
 * - Provides mutations for configuring, enabling/disabling, and removing providers
 */

import { useQuery, useMutation } from '@apollo/client/react';
import {
  GetOAuthProvidersDocument,
  ConfigureOAuthProviderDocument,
  UpdateOAuthProviderEnabledDocument,
  RemoveOAuthProviderDocument,
  OAuthProviderType,
} from '@/graphql/generated/graphql';
import { useWorkspaceId } from '@/stores/workspaceStore';

export function useOAuthProviders() {
  const workspaceId = useWorkspaceId();

  // Query: Get all OAuth providers for workspace
  const { data, loading, error, refetch } = useQuery(GetOAuthProvidersDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId,
    fetchPolicy: 'cache-and-network',
  });

  // Mutation: Configure provider
  const [configureProviderMutation, { loading: configuring }] = useMutation(ConfigureOAuthProviderDocument, {
    refetchQueries: [{ query: GetOAuthProvidersDocument, variables: { workspaceId } }],
  });

  // Mutation: Update provider enabled status
  const [updateEnabledMutation, { loading: updating }] = useMutation(UpdateOAuthProviderEnabledDocument, {
    refetchQueries: [{ query: GetOAuthProvidersDocument, variables: { workspaceId } }],
  });

  // Mutation: Remove provider
  const [removeProviderMutation, { loading: removing }] = useMutation(RemoveOAuthProviderDocument, {
    refetchQueries: [{ query: GetOAuthProvidersDocument, variables: { workspaceId } }],
  });

  const providers = data?.getOAuthProviders ?? [];

  /**
   * Configure an OAuth provider (validates and persists).
   */
  const configureProvider = async (
    provider: OAuthProviderType,
    clientId: string,
    clientSecret: string,
    tenantId?: string
  ) => {
    if (!workspaceId) return null;

    const result = await configureProviderMutation({
      variables: {
        workspaceId,
        provider,
        clientId,
        clientSecret,
        tenantId,
      },
    });

    return result.data?.configureOAuthProvider;
  };

  /**
   * Update the enabled status of a provider.
   */
  const updateEnabled = async (providerId: string, enabled: boolean) => {
    const result = await updateEnabledMutation({
      variables: {
        providerId,
        enabled,
      },
    });

    return result.data?.updateOAuthProviderEnabled;
  };

  /**
   * Remove an OAuth provider configuration.
   */
  const removeProvider = async (providerId: string) => {
    if (!workspaceId) return false;

    const result = await removeProviderMutation({
      variables: {
        providerId,
      },
    });

    return result.data?.removeOAuthProvider ?? false;
  };

  return {
    providers,
    loading,
    error,
    refetch,
    configureProvider,
    configuring,
    updateEnabled,
    updating,
    removeProvider,
    removing,
  };
}

// OAuth Provider display info
export const OAUTH_PROVIDER_INFO: Record<
  OAuthProviderType,
  {
    name: string;
    description: string;
    icon: string;
    requiresTenantId: boolean;
    documentationUrl: string;
  }
> = {
  [OAuthProviderType.Google]: {
    name: 'Google',
    description: 'Google Workspace, Gmail, Drive, Calendar integrations',
    icon: 'G',
    requiresTenantId: false,
    documentationUrl: 'https://developers.google.com/identity/protocols/oauth2',
  },
  [OAuthProviderType.Microsoft]: {
    name: 'Microsoft',
    description: 'Microsoft 365, Azure AD, Teams, OneDrive integrations',
    icon: 'M',
    requiresTenantId: true,
    documentationUrl: 'https://docs.microsoft.com/en-us/azure/active-directory/develop/',
  },
  [OAuthProviderType.Notion]: {
    name: 'Notion',
    description: 'Notion workspace integrations and API access',
    icon: 'N',
    requiresTenantId: false,
    documentationUrl: 'https://developers.notion.com/docs/authorization',
  },
};
