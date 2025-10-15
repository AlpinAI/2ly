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

import { useMutation } from '@apollo/client/react';
import { useWorkspaceId } from '@/stores/workspaceStore';
import { useMCPRegistries } from '@/hooks/useMCPRegistries';
import { useRegistrySyncStore } from '@/stores/registrySyncStore';
import {
  CreateMcpRegistryDocument,
  DeleteMcpRegistryDocument,
  SyncUpstreamRegistryDocument,
} from '@/graphql/generated/graphql';
import { McpRegistrySection } from '@/components/settings/mcp-registry-section';


export default function SettingsPage() {
  const workspaceId = useWorkspaceId();
  const { startSync, endSync, updateLastSyncTime, isSyncing } = useRegistrySyncStore();

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

  const [syncRegistry] = useMutation(SyncUpstreamRegistryDocument);

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
    if (isSyncing(id)) return; // Prevent duplicate sync
    
    startSync(id);
    try {
      await syncRegistry({ variables: { registryId: id } });
      updateLastSyncTime(id, new Date());
    } finally {
      endSync(id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Settings</h2>

      {/* MCP Registry Management Section */}
      <McpRegistrySection
        registries={registries}
        loading={loading}
        error={error}
        isSyncing={isSyncing}
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
