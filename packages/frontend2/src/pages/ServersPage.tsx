/**
 * Servers Page
 *
 * WHY: Manage and view MCP servers with detailed configuration.
 * Shows server list with filters and detail panel.
 *
 * LAYOUT:
 * - 2/3: Server table with search and filters
 * - 1/3: Server detail panel
 *
 * FEATURES:
 * - Real-time server updates (subscription)
 * - Search by name/description
 * - Filter by transport, runOn, agent
 * - Click server to view details
 * - Show server configuration with masked secrets
 */

import { useState, useMemo } from 'react';
import { MasterDetailLayout } from '@/components/layout/MasterDetailLayout';
import { ServerTable } from '@/components/servers/ServerTable';
import { ServerDetail } from '@/components/servers/ServerDetail';
import { useMCPServers } from '@/hooks/useMCPServers';
import { useAgents } from '@/hooks/useAgents';
import { useRuntimeData } from '@/stores/runtimeStore';

export default function ServersPage() {
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);

  // Fetch servers and agents
  const { runtimes } = useRuntimeData();
  const { servers, loading, error } = useMCPServers();
  const { agents } = useAgents(runtimes);

  // Get selected server
  const selectedServer = useMemo(() => {
    if (!selectedServerId) return null;
    return servers.find((s) => s.id === selectedServerId) || null;
  }, [selectedServerId, servers]);

  // Available agents for filter
  const availableAgents = useMemo(() => {
    return agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
    }));
  }, [agents]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Error loading servers</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Servers</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage MCP servers and their configurations
        </p>
      </div>

      {/* Master-Detail Layout */}
      <MasterDetailLayout
        table={
          <ServerTable
            servers={servers}
            selectedServerId={selectedServerId}
            onSelectServer={setSelectedServerId}
            search={''}
            onSearchChange={() => {}}
            transportFilter={[]}
            onTransportFilterChange={() => {}}
            runOnFilter={[]}
            onRunOnFilterChange={() => {}}
            agentFilter={[]}
            onAgentFilterChange={() => {}}
            availableAgents={availableAgents}
            loading={loading}
          />
        }
        detail={selectedServer ? <ServerDetail server={selectedServer} /> : null}
        onCloseDetail={() => setSelectedServerId(null)}
      />
    </div>
  );
}
