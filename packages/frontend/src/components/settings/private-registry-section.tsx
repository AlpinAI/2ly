/**
 * PrivateRegistrySection Component
 *
 * WHY: Displays the workspace's private MCP registry and manages its servers.
 * Each workspace has exactly one private registry for custom server configurations.
 *
 * WHAT IT SHOWS:
 * - Master-detail layout with server table and detail panel
 * - Server management actions (edit/delete if no configs linked)
 *
 * NOTE: The "Add MCP Server" button is now at the page level in SettingsPage
 */

import { useState, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { MasterDetailLayout } from '@/components/layout/master-detail-layout';
import { RegistryServerTable } from './registry-server-table';
import { RegistryServerDetail } from './registry-server-detail';
import { GetMcpRegistriesQuery } from '@/graphql/generated/graphql';

interface PrivateRegistrySectionProps {
  registries: GetMcpRegistriesQuery['mcpRegistries'];
  loading: boolean;
  error?: Error | null;
}

export function PrivateRegistrySection({
  registries,
  loading,
  error,
}: PrivateRegistrySectionProps) {
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);

  // Get the first (and only) registry - the private registry
  const privateRegistry = registries![0];
  const servers = privateRegistry?.servers || [];

  // Get selected server
  const selectedServer = useMemo(() => {
    if (!selectedServerId) return null;
    return servers.find((s) => s.id === selectedServerId) || null;
  }, [selectedServerId, servers]);

  return (
    <div className="h-full flex flex-col">
      {/* Error State */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
              Failed to load private registry
            </h4>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {error.message}
            </p>
          </div>
        </div>
      )}

      {/* Master-Detail Layout */}
      {!error && (
        <MasterDetailLayout
          table={
            <RegistryServerTable
              servers={servers}
              selectedServerId={selectedServerId}
              onSelectServer={setSelectedServerId}
              loading={loading}
            />
          }
          detail={selectedServer ? <RegistryServerDetail server={selectedServer} onDeleted={() => setSelectedServerId(null)} /> : null}
          onCloseDetail={() => setSelectedServerId(null)}
        />
      )}
    </div>
  );
}
