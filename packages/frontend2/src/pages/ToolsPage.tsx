/**
 * Tools Page
 *
 * WHY: Manage and test MCP tools with detailed information.
 * Shows tool list with filters, detail panel with testing capability.
 *
 * LAYOUT:
 * - 2/3: Tool table with search and filters
 * - 1/3: Tool detail panel with tester
 *
 * FEATURES:
 * - Real-time tool updates (subscription)
 * - Search by name/description
 * - Filter by server(s), agent(s)
 * - Click tool to view details and test
 * - Execute tools with input parameters
 * - "Add Tools" button (opens AddToolWorkflow)
 */

import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MasterDetailLayout } from '@/components/layout/master-detail-layout';
import { ToolTable } from '@/components/tools/tool-table';
import { ToolDetail } from '@/components/tools/tool-detail';
import { useMCPTools } from '@/hooks/useMCPTools';
import { useMCPServers } from '@/hooks/useMCPServers';
import { useAgents } from '@/hooks/useAgents';
import { useUIStore } from '@/stores/uiStore';
import { useRuntimeData } from '@/stores/runtimeStore';

export default function ToolsPage() {
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const setAddToolWorkflowOpen = useUIStore((state) => state.setAddToolWorkflowOpen);

  // Fetch tools, servers, and agents
  const { runtimes } = useRuntimeData();
  const { filteredTools, loading, error, filters } = useMCPTools();
  const { servers } = useMCPServers();
  const { agents } = useAgents(runtimes);

  // Get selected tool
  const selectedTool = useMemo(() => {
    if (!selectedToolId) return null;
    return filteredTools.find((t) => t?.id === selectedToolId) || null;
  }, [selectedToolId, filteredTools]);

  // Available servers and agents for filters
  const availableServers = useMemo(() => {
    return servers.map((server) => ({
      id: server.id,
      name: server.name,
    }));
  }, [servers]);

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
          <p className="text-red-600 dark:text-red-400">Error loading tools</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Tools</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Browse, test, and manage your MCP tools</p>
        </div>
        <Button onClick={() => setAddToolWorkflowOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Tools
        </Button>
      </div>

      {/* Master-Detail Layout */}
      <MasterDetailLayout
        table={
          <ToolTable
            tools={filteredTools}
            selectedToolId={selectedToolId}
            onSelectTool={setSelectedToolId}
            search={filters.search}
            onSearchChange={filters.setSearch}
            serverFilter={filters.serverIds}
            onServerFilterChange={filters.setServerIds}
            agentFilter={filters.agentIds}
            onAgentFilterChange={filters.setAgentIds}
            availableServers={availableServers}
            availableAgents={availableAgents}
            loading={loading}
          />
        }
        detail={selectedTool ? <ToolDetail tool={selectedTool} /> : null}
        onCloseDetail={() => setSelectedToolId(null)}
      />
    </div>
  );
}
