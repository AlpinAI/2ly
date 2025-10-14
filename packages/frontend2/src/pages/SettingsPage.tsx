/**
 * Settings Page
 *
 * WHY: Application and user settings, including MCP Registry management.
 * Manages upstream registry connections and synchronization.
 *
 * ARCHITECTURE:
 * - Uses AppLayout (header + navigation are automatic)
 * - useMCPRegistries hook for real-time registry updates
 * - Follows same patterns as DashboardPage
 * - Composed of smaller, focused components from /components/settings/
 */

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useWorkspaceId } from '@/stores/workspaceStore';
import { useMCPRegistries } from '@/hooks/useMCPRegistries';
import {
  CreateMcpRegistryDocument,
  DeleteMcpRegistryDocument,
  SyncUpstreamRegistryDocument,
} from '@/graphql/generated/graphql';
import { McpRegistrySection } from '@/components/settings/McpRegistrySection';


export default function SettingsPage() {
  const workspaceId = useWorkspaceId();
  const [syncingId, setSyncingId] = useState<string | null>(null);

  console.log('[SettingsPage] Rendering with workspaceId:', workspaceId);

  // Get registries data via hook
  const { registries, loading, error } = useMCPRegistries();

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
