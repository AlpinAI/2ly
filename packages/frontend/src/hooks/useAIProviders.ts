/**
 * useAIProviders Hook
 *
 * WHY: Wrapper around Apollo Client hooks for AI provider management
 * - Fetches AI provider configurations for workspace
 * - Provides mutations for configuring, activating, removing, and testing providers
 * - Automatic error handling
 * - Loading states
 *
 * USAGE:
 * ```tsx
 * function AIProvidersSettings() {
 *   const { providers, loading, error, configureProvider } = useAIProviders();
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *
 *   return <div>{providers.map(p => <ProviderCard key={p.id} provider={p} />)}</div>;
 * }
 * ```
 */

import { useQuery, useMutation } from '@apollo/client/react';
import {
  GetAiProvidersDocument,
  ConfigureAiProviderDocument,
  SetActiveAiProviderDocument,
  RemoveAiProviderDocument,
  TestAiProviderDocument,
  AiProviderType,
} from '@/graphql/generated/graphql';
import { useWorkspaceId } from '@/stores/workspaceStore';

export function useAIProviders() {
  const workspaceId = useWorkspaceId();

  const { data, loading, error, refetch } = useQuery(GetAiProvidersDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId,
    fetchPolicy: 'cache-and-network',
  });

  const [configureProviderMutation, { loading: configuring }] = useMutation(
    ConfigureAiProviderDocument,
    {
      refetchQueries: [{ query: GetAiProvidersDocument, variables: { workspaceId } }],
    }
  );

  const [setActiveProviderMutation, { loading: settingActive }] = useMutation(
    SetActiveAiProviderDocument,
    {
      refetchQueries: [{ query: GetAiProvidersDocument, variables: { workspaceId } }],
    }
  );

  const [removeProviderMutation, { loading: removing }] = useMutation(
    RemoveAiProviderDocument,
    {
      refetchQueries: [{ query: GetAiProvidersDocument, variables: { workspaceId } }],
    }
  );

  const [testProviderMutation, { loading: testing }] = useMutation(TestAiProviderDocument);

  const providers = data?.aiProviders ?? [];

  // Get the currently active provider
  const activeProvider = providers.find((p) => p.isActive);

  // Get providers grouped by configuration status
  const configuredProviders = providers.filter((p) => p.isConfigured);
  const unconfiguredProviders = providers.filter((p) => !p.isConfigured);

  const configureProvider = async (
    provider: AiProviderType,
    apiKey?: string,
    baseUrl?: string,
    defaultModel?: string
  ) => {
    if (!workspaceId) return null;

    const result = await configureProviderMutation({
      variables: {
        workspaceId,
        provider,
        apiKey,
        baseUrl,
        defaultModel,
      },
    });

    return result.data?.configureAIProvider;
  };

  const setActiveProvider = async (provider: AiProviderType) => {
    if (!workspaceId) return null;

    const result = await setActiveProviderMutation({
      variables: {
        workspaceId,
        provider,
      },
    });

    return result.data?.setActiveAIProvider;
  };

  const removeProvider = async (provider: AiProviderType) => {
    if (!workspaceId) return false;

    const result = await removeProviderMutation({
      variables: {
        workspaceId,
        provider,
      },
    });

    return result.data?.removeAIProvider ?? false;
  };

  const testProvider = async (provider: AiProviderType, prompt?: string) => {
    if (!workspaceId) return null;

    const result = await testProviderMutation({
      variables: {
        workspaceId,
        provider,
        prompt,
      },
    });

    return result.data?.testAIProvider;
  };

  return {
    providers,
    activeProvider,
    configuredProviders,
    unconfiguredProviders,
    loading,
    error,
    refetch,
    configureProvider,
    setActiveProvider,
    removeProvider,
    testProvider,
    configuring,
    settingActive,
    removing,
    testing,
  };
}

// Provider display info
export const PROVIDER_INFO: Record<
  AiProviderType,
  { name: string; description: string; requiresKey: boolean; icon: string }
> = {
  [AiProviderType.Openai]: {
    name: 'OpenAI',
    description: 'GPT-4o, GPT-4, GPT-3.5 Turbo and more',
    requiresKey: true,
    icon: '🤖',
  },
  [AiProviderType.Anthropic]: {
    name: 'Anthropic',
    description: 'Claude 3.5, Claude 3 Opus, Sonnet, Haiku',
    requiresKey: true,
    icon: '🧠',
  },
  [AiProviderType.Google]: {
    name: 'Google AI',
    description: 'Gemini 2.0, Gemini 1.5 Pro, Flash',
    requiresKey: true,
    icon: '✨',
  },
  [AiProviderType.Ollama]: {
    name: 'Ollama',
    description: 'Local models - Llama, Mistral, Phi, and more',
    requiresKey: false,
    icon: '🦙',
  },
};
