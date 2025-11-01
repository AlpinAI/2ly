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

import { useState } from 'react';
import { Database, Users, Cpu, Key, Plus } from 'lucide-react';
import { useWorkspaceId } from '@/stores/workspaceStore';
import { useMCPRegistries } from '@/hooks/useMCPRegistries';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PrivateRegistrySection } from '@/components/settings/private-registry-section';
import { UsersRolesSection } from '@/components/settings/users-roles-section';
import { RuntimesSection } from '@/components/settings/runtimes-section';
import { AISettingsSection } from '@/components/settings/ai-settings-section';
import { useAddServerWorkflow } from '@/stores/uiStore';


export default function SettingsPage() {
  const workspaceId = useWorkspaceId();
  const { registryServers, loading, error } = useMCPRegistries();
  const { setOpen: setAddServerWorkflowOpen } = useAddServerWorkflow();
  const [activeTab, setActiveTab] = useState('private-registry');

  console.log('[SettingsPage] Rendering with workspaceId:', workspaceId);

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Settings</h2>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="private-registry" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span>Private Registry</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Users & Roles</span>
            </TabsTrigger>
            <TabsTrigger value="runtimes" className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              <span>Runtimes</span>
            </TabsTrigger>
            <TabsTrigger value="ai-settings" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              <span>AI Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Conditional Action Button - Only show for Private Registry */}
          {activeTab === 'private-registry' && !loading && (
            <Button onClick={() => setAddServerWorkflowOpen(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add MCP Server
            </Button>
          )}
        </div>

        <TabsContent value="private-registry" className="flex-1 min-h-0">
          <PrivateRegistrySection
            registryServers={registryServers}
            loading={loading}
            error={error}
          />
        </TabsContent>

        <TabsContent value="users">
          <UsersRolesSection />
        </TabsContent>

        <TabsContent value="runtimes">
          <RuntimesSection />
        </TabsContent>

        <TabsContent value="ai-settings">
          <AISettingsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
