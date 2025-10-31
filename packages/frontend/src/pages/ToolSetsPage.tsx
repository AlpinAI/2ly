/**
 * Tool Sets Page
 *
 * WHY: Manage and view tool set runtimes with detailed information.
 * Shows tool set list with filters and detail panel.
 *
 * LAYOUT:
 * - 2/3: Tool set table with search and filters
 * - 1/3: Tool set detail panel
 *
 * FEATURES:
 * - Real-time tool set updates (subscription)
 * - Search by name/description/tool names
 * - Filter by source(s), status
 * - Click tool set to view details
 * - Show tool set capabilities, sources, and tools
 */

import { useMemo, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { MasterDetailLayout } from '@/components/layout/master-detail-layout';
import { AgentTable } from '@/components/agents/agent-table';
import { AgentDetail } from '@/components/agents/agent-detail';
import { Button } from '@/components/ui/button';
import { useAgents } from '@/hooks/useAgents';
import { useMCPServers } from '@/hooks/useMCPServers';
import { useRuntimeData } from '@/stores/runtimeStore';
import { useCreateToolSetDialog, useManageToolsDialog } from '@/stores/uiStore';
import { useUrlSync } from '@/hooks/useUrlSync';

export default function ToolSetsPage() {
  const { selectedId, setSelectedId } = useUrlSync();
  const { openDialog } = useCreateToolSetDialog();

  // Fetch runtimes and servers
  const { runtimes, loading, error } = useRuntimeData();
  const { filteredAgents, filters } = useAgents(runtimes);
  const { servers } = useMCPServers();

  // Get selected agent from URL
  const selectedAgent = useMemo(() => {
    if (!selectedId) return null;
    return filteredAgents.find((a) => a.id === selectedId) || null;
  }, [selectedId, filteredAgents]);

  // Auto-open detail panel if ID in URL and agent exists
  useEffect(() => {
    if (selectedId && !selectedAgent && !loading) {
      // Agent not found - might have been deleted or invalid ID
      setSelectedId(null);
    }
  }, [selectedId, selectedAgent, loading, setSelectedId]);

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
          <p className="text-red-600 dark:text-red-400">Error loading tool sets</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  const manageToolsDialog = useManageToolsDialog();
  const handleCreateToolSet = () => {
    openDialog((toolSetId) => {
      setSelectedId(toolSetId);
      manageToolsDialog.setSelectedToolSetId(toolSetId);
      manageToolsDialog.setOpen(true);
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Tool Sets</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage AI tool sets and view their capabilities</p>
        </div>
        <Button
          onClick={handleCreateToolSet}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Tool Set
        </Button>
      </div>

      {/* Master-Detail Layout */}
      <MasterDetailLayout
        table={
          <AgentTable
            agents={filteredAgents}
            selectedAgentId={selectedId}
            onSelectAgent={setSelectedId}
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
        onCloseDetail={() => setSelectedId(null)}
      />
    </div>
  );
}
