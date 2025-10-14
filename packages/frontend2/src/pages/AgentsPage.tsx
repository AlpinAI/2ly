/**
 * Agents Page
 *
 * WHY: Manage and view agent runtimes with detailed information.
 * Shows agent list with filters and detail panel.
 *
 * LAYOUT:
 * - 2/3: Agent table with search and filters
 * - 1/3: Agent detail panel
 *
 * FEATURES:
 * - Real-time agent updates (subscription)
 * - Search by name/description/tool names
 * - Filter by server(s), status
 * - Click agent to view details
 * - Show agent capabilities, servers, and tools
 */

import { useState, useMemo } from 'react';
import { MasterDetailLayout } from '@/components/layout/master-detail-layout';
import { AgentTable } from '@/components/agents/agent-table';
import { AgentDetail } from '@/components/agents/agent-detail';
import { useAgents } from '@/hooks/useAgents';
import { useMCPServers } from '@/hooks/useMCPServers';
import { useRuntimeData } from '@/stores/runtimeStore';

export default function AgentsPage() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Fetch runtimes and servers
  const { runtimes, loading, error } = useRuntimeData();
  const { filteredAgents, filters } = useAgents(runtimes);
  const { servers } = useMCPServers();

  // Get selected agent
  const selectedAgent = useMemo(() => {
    if (!selectedAgentId) return null;
    return filteredAgents.find((a) => a.id === selectedAgentId) || null;
  }, [selectedAgentId, filteredAgents]);

  // Available servers for filter
  const availableServers = useMemo(() => {
    return servers.map((server) => ({
      id: server.id,
      name: server.name,
    }));
  }, [servers]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Error loading agents</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Agents</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage AI agents and view their capabilities</p>
      </div>

      {/* Master-Detail Layout */}
      <MasterDetailLayout
        table={
          <AgentTable
            agents={filteredAgents}
            selectedAgentId={selectedAgentId}
            onSelectAgent={setSelectedAgentId}
            search={filters.search}
            onSearchChange={filters.setSearch}
            serverFilter={filters.serverIds}
            onServerFilterChange={filters.setServerIds}
            statusFilter={filters.statuses}
            onStatusFilterChange={filters.setStatuses}
            availableServers={availableServers}
            loading={loading}
          />
        }
        detail={selectedAgent ? <AgentDetail agent={selectedAgent} /> : null}
        onCloseDetail={() => setSelectedAgentId(null)}
      />
    </div>
  );
}
