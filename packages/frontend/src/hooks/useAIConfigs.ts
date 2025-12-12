/**
 * useAIConfigs Hook
 *
 * Provides access to AI configuration (system prompts) for the workspace.
 * Supports querying, creating, updating, and deleting AI configs.
 */

import { useQuery, useMutation } from '@apollo/client/react';
import { useWorkspaceId } from '@/stores/workspaceStore';
import {
  GetAiConfigsDocument,
  SetAiConfigDocument,
  DeleteAiConfigDocument,
} from '@/graphql/generated/graphql';

export function useAIConfigs() {
  const workspaceId = useWorkspaceId();

  const { data, loading, error, refetch } = useQuery(GetAiConfigsDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId,
  });

  const [setConfigMutation, { loading: setting }] = useMutation(SetAiConfigDocument, {
    refetchQueries: [{ query: GetAiConfigsDocument, variables: { workspaceId } }],
  });

  const [deleteConfigMutation, { loading: deleting }] = useMutation(DeleteAiConfigDocument, {
    refetchQueries: [{ query: GetAiConfigsDocument, variables: { workspaceId } }],
  });

  const setConfig = async (key: string, value: string, description?: string) => {
    await setConfigMutation({
      variables: {
        workspaceId: workspaceId || '',
        key,
        value,
        description: description || null,
      },
    });
  };

  const deleteConfig = async (id: string) => {
    await deleteConfigMutation({
      variables: { id },
    });
  };

  return {
    configs: data?.getAIConfigs || [],
    loading,
    error,
    setting,
    deleting,
    setConfig,
    deleteConfig,
    refetch,
  };
}
