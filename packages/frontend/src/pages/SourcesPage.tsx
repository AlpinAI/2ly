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

import { useState, useMemo, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MasterDetailLayout } from '@/components/layout/master-detail-layout';
import { SourceTable } from '@/components/sources/source-table';
import { SourceDetail } from '@/components/sources/source-detail';
import { useMCPServers } from '@/hooks/useMCPServers';
import { useAgents } from '@/hooks/useAgents';
import { useRuntimeData } from '@/stores/runtimeStore';
import { useUIStore } from '@/stores/uiStore';
import { SourceType } from '@/types/sources';
import { useUrlSync } from '@/hooks/useUrlSync';

export default function SourcesPage() {
  const { selectedId, setSelectedId } = useUrlSync();
  const [typeFilter, setTypeFilter] = useState<string[]>([]);

  // Fetch servers and agents
  const { runtimes } = useRuntimeData();
  const { servers, loading, error } = useMCPServers();
  const { agents } = useAgents(runtimes);

  // UI store for opening add source workflow
  const setAddSourceWorkflowOpen = useUIStore((state) => state.setAddSourceWorkflowOpen);
  const setAddSourceWorkflowInitialStep = useUIStore((state) => state.setAddSourceWorkflowInitialStep);

  // Add type field to sources
  const sourcesWithType = useMemo(() => {
    return servers.map(server => ({
      ...server,
      type: SourceType.MCP_SERVER,
    }));
  }, [servers]);

  // Apply type filtering
  const filteredSources = useMemo(() => {
    if (typeFilter.length === 0) return sourcesWithType;
    return sourcesWithType.filter(source => typeFilter.includes(source.type));
  }, [sourcesWithType, typeFilter]);

  // Get selected source from URL
  const selectedSource = useMemo(() => {
    if (!selectedId) return null;
    return sourcesWithType.find((s) => s.id === selectedId) || null;
  }, [selectedId, sourcesWithType]);

  // Auto-open detail panel if ID in URL and source exists
  useEffect(() => {
    if (selectedId && !selectedSource && !loading) {
      // Source not found - might have been deleted or invalid ID
      // Clear the selection
      setSelectedId(null);
    }
  }, [selectedId, selectedSource, loading, setSelectedId]);

  // Available agents for filter
  const availableAgents = useMemo(() => {
    return agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
    }));
  }, [agents]);

  // Handle add source button click
  const handleAddSource = () => {
    setAddSourceWorkflowInitialStep(null); // Start at category selection
    setAddSourceWorkflowOpen(true);
  };

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Sources</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage sources and their configurations
          </p>
        </div>
        <Button onClick={handleAddSource} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Source
        </Button>
      </div>

      {/* Master-Detail Layout */}
      <MasterDetailLayout
        table={
          <SourceTable
            sources={filteredSources}
            selectedSourceId={selectedId}
            onSelectSource={setSelectedId}
            search={''}
            onSearchChange={() => {}}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
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
        detail={selectedSource ? <SourceDetail source={selectedSource} /> : null}
        onCloseDetail={() => setSelectedId(null)}
      />
    </div>
  );
}
