/**
 * useAIProviders Hook
 *
 * Wrapper around Apollo Client hooks for AI provider management:
 * - Fetches AI provider configurations for workspace
 * - Provides mutations for configuring, activating, removing providers
 * - Test configuration before persisting
 * - Chat with models
 */

import { useQuery, useMutation } from '@apollo/client/react';
import {
  GetAiProvidersDocument,
  GetAiModelsDocument,
  GetDefaultAiModelDocument,
  ConfigureAiProviderDocument,
  RemoveAiProviderDocument,
  SetDefaultAiModelDocument,
  ChatWithModelDocument,
  AiProviderType,
} from '@/graphql/generated/graphql';
import { useWorkspaceId } from '@/stores/workspaceStore';

export function useAIProviders() {
  const workspaceId = useWorkspaceId();

  // Query: Get all providers for workspace
  const { data, loading, error, refetch } = useQuery(GetAiProvidersDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId,
    fetchPolicy: 'cache-and-network',
  });

  // Query: Get all available models from all configured providers
  const { data: modelsData, refetch: refetchModels } = useQuery(GetAiModelsDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId,
    fetchPolicy: 'cache-and-network',
  });

  // Query: Get default AI model for workspace
  const { data: defaultModelData, refetch: refetchDefaultModel } = useQuery(GetDefaultAiModelDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId,
    fetchPolicy: 'cache-and-network',
  });

  // Mutation: Configure provider (with persist)
  const [configureProviderMutation, { loading: configuring }] = useMutation(ConfigureAiProviderDocument, {
    refetchQueries: [
      { query: GetAiProvidersDocument, variables: { workspaceId } },
      { query: GetAiModelsDocument, variables: { workspaceId } },
    ],
  });

  // Mutation: Remove provider
  const [removeProviderMutation, { loading: removing }] = useMutation(RemoveAiProviderDocument, {
    refetchQueries: [
      { query: GetAiProvidersDocument, variables: { workspaceId } },
      { query: GetAiModelsDocument, variables: { workspaceId } },
    ],
  });

  // Mutation: Chat with model
  const [chatMutation, { loading: chatting }] = useMutation(ChatWithModelDocument);

  // Mutation: Set default AI model
  const [setDefaultModelMutation, { loading: settingDefaultModel }] = useMutation(SetDefaultAiModelDocument, {
    refetchQueries: [
      { query: GetDefaultAiModelDocument, variables: { workspaceId } },
    ],
  });

  const providers = data?.getAIProviders ?? [];
  const allModels = modelsData?.getAIModels ?? [];
  const defaultModel = defaultModelData?.workspace?.defaultAIModel ?? null;

  /**
   * Set the workspace's default AI model.
   * @param model - Format: "provider/model-name" (e.g., "openai/gpt-4o") or null to clear
   */
  const setDefaultModel = async (model: string | null) => {
    if (!workspaceId) return false;
    if (!model) {
      // For now, we can't clear the default model via GraphQL (mutation requires non-null)
      // The component will handle the null case by not calling this
      return false;
    }

    const result = await setDefaultModelMutation({
      variables: {
        workspaceId,
        defaultModel: model,
      },
    });

    return result.data?.setDefaultAIModel ?? false;
  };

  /**
   * Configure a provider (tests and persists).
   */
  const configureProvider = async (
    provider: AiProviderType,
    apiKey?: string,
    baseUrl?: string,
  ) => {
    if (!workspaceId) return null;

    const result = await configureProviderMutation({
      variables: {
        workspaceId,
        provider,
        apiKey,
        baseUrl,
      },
    });

    return result.data?.configureAIProvider;
  };

  /**
   * Remove a provider configuration.
   */
  const removeProvider = async (providerId: string) => {
    if (!workspaceId) return false;

    const result = await removeProviderMutation({
      variables: {
        providerId,
      },
    });

    return result.data?.removeAIProvider ?? false;
  };

  /**
   * Chat with a specific model.
   * @param model - Format: "provider/model-name" (e.g., "openai/gpt-4o")
   */
  const chatWithModel = async (model: string, message: string) => {
    if (!workspaceId) return null;

    const result = await chatMutation({
      variables: {
        workspaceId,
        model,
        message,
      },
    });

    return result.data?.chatWithModel;
  };

  return {
    providers,
    allModels,
    defaultModel,
    loading,
    error,
    refetch,
    refetchModels,
    refetchDefaultModel,
    configureProvider,
    configuring,
    removeProvider,
    removing,
    setDefaultModel,
    settingDefaultModel,
    chatWithModel,
    chatting,
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
