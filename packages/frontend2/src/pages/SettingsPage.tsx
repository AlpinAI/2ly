/**
 * Settings Page
 *
 * WHY: Application and user settings, including MCP Registry management.
 * Manages upstream registry connections and synchronization.
 *
 * ARCHITECTURE:
 * - Uses AppLayout (header + navigation are automatic)
 * - Apollo subscriptions for real-time registry updates
 * - Follows same patterns as DashboardPage
 * - Composed of smaller, focused components from /components/settings/
 */

import { useState } from 'react';
import { useMutation, useSubscription } from '@apollo/client/react';
import { useWorkspaceId } from '@/stores/workspaceStore';
import {
  SubscribeMcpRegistriesDocument,
  CreateMcpRegistryDocument,
  DeleteMcpRegistryDocument,
  SyncUpstreamRegistryDocument,
} from '@/graphql/generated/graphql';
import type { SubscribeMcpRegistriesSubscription } from '@/graphql/generated/graphql';
import { mcpRegistry } from '@2ly/common';
import { McpRegistrySection } from '@/components/settings/McpRegistrySection';

// Generated types from MCP Registry OpenAPI schema - available for future use
// @ts-expect-error - Imported for documentation and future use
type ServerJSON = mcpRegistry.components['schemas']['ServerJSON'];
// @ts-expect-error - Imported for documentation and future use
type ServerResponse = mcpRegistry.components['schemas']['ServerResponse'];

export default function SettingsPage() {
  const workspaceId = useWorkspaceId();
  const [syncingId, setSyncingId] = useState<string | null>(null);

  console.log('[SettingsPage] Rendering with workspaceId:', workspaceId);

  // Subscribe to registries
  const { data, loading, error } = useSubscription<SubscribeMcpRegistriesSubscription>(SubscribeMcpRegistriesDocument, {
    variables: { workspaceId: workspaceId || '' },
    skip: !workspaceId,
    onError: (err) => {
      console.error('[SettingsPage] Subscription error:', err);
    },
  });

  console.log('[SettingsPage] Subscription state:', { data, loading, error: error?.message });

  // Mutations
  const [createRegistry, { loading: creating }] = useMutation(CreateMcpRegistryDocument, {
    onError: (err) => {
      console.error('[SettingsPage] Create registry error:', err);
    },
  });

  const [deleteRegistry] = useMutation(DeleteMcpRegistryDocument, {
    onError: (err) => {
      console.error('[SettingsPage] Delete registry error:', err);
    },
  });

  const [syncRegistry] = useMutation(SyncUpstreamRegistryDocument, {
    onCompleted: () => {
      setSyncingId(null);
    },
    onError: (err) => {
      console.error('[SettingsPage] Sync registry error:', err);
      setSyncingId(null);
    },
  });

  const registries = data?.mcpRegistries || [];

  const handleCreateRegistry = async (name: string, upstreamUrl: string) => {
    if (!workspaceId) return;

    await createRegistry({
      variables: {
        workspaceId,
        name,
        upstreamUrl,
      },
    });
  };

  const handleDeleteRegistry = async (id: string) => {
    await deleteRegistry({ variables: { id } });
  };

  const handleSyncRegistry = async (id: string) => {
    setSyncingId(id);
    await syncRegistry({ variables: { registryId: id } });
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Settings</h2>

      {/* MCP Registry Management Section */}
      <McpRegistrySection
        registries={registries}
        loading={loading}
        error={error}
        syncingId={syncingId}
        onCreateRegistry={handleCreateRegistry}
        onSyncRegistry={handleSyncRegistry}
        onDeleteRegistry={handleDeleteRegistry}
        isCreating={creating}
        workspaceId={workspaceId}
      />

      {/* Future settings sections can be added here:
        - User Profile Settings
        - Workspace Settings
        - Notification Preferences
        - etc.
      */}
    </div>
  );
}
