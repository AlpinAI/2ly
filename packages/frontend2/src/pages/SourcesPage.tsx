/**
 * Sources Page
 *
 * WHY: Manage and view MCP sources with detailed configuration.
 * Shows source list with filters and detail panel.
 *
 * LAYOUT:
 * - 2/3: Source table with search and filters
 * - 1/3: Source detail panel
 *
 * FEATURES:
 * - Real-time source updates (subscription)
 * - Search by name/description
 * - Filter by transport, runOn, tool set
 * - Click source to view details
 * - Show source configuration with masked secrets
 */

import { useState, useMemo } from 'react';
import { MasterDetailLayout } from '@/components/layout/master-detail-layout';
import { ServerTable } from '@/components/servers/server-table';
import { ServerDetail } from '@/components/servers/server-detail';
import { useMCPServers } from '@/hooks/useMCPServers';
import { useAgents } from '@/hooks/useAgents';
import { useRuntimeData } from '@/stores/runtimeStore';

export default function SourcesPage() {
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
          <p className="text-red-600 dark:text-red-400">Error loading sources</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Sources</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage MCP sources and their configurations
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
