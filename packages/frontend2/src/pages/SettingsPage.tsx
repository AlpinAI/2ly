/**
 * Settings Page
 *
 * WHY: Application and user settings with organized sections.
 * Manages upstream registry connections, users, runtimes, and API keys.
 *
 * ARCHITECTURE:
 * - Uses AppLayout (header + navigation are automatic)
 * - Tab-based navigation for different settings sections
 * - useMCPRegistries hook for real-time registry updates
 * - Composed of smaller, focused components from /components/settings/
 */

import { Database, Users, Cpu, Key } from 'lucide-react';
import { useMutation } from '@apollo/client/react';
import { useWorkspaceId } from '@/stores/workspaceStore';
import { useMCPRegistries } from '@/hooks/useMCPRegistries';
import { useRegistrySyncStore } from '@/stores/registrySyncStore';
import {
  CreateMcpRegistryDocument,
  DeleteMcpRegistryDocument,
  SyncUpstreamRegistryDocument,
} from '@/graphql/generated/graphql';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { McpRegistrySection } from '@/components/settings/mcp-registry-section';
import { UsersRolesSection } from '@/components/settings/users-roles-section';
import { RuntimesSection } from '@/components/settings/runtimes-section';
import { ApiKeysSection } from '@/components/settings/api-keys-section';


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

      <Tabs defaultValue="registries" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="registries" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span>MCP Registries</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Users & Roles</span>
          </TabsTrigger>
          <TabsTrigger value="runtimes" className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            <span>Runtimes</span>
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span>API Keys</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registries">
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
        </TabsContent>

        <TabsContent value="users">
          <UsersRolesSection />
        </TabsContent>

        <TabsContent value="runtimes">
          <RuntimesSection />
        </TabsContent>

        <TabsContent value="api-keys">
          <ApiKeysSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
