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
 * - Filter by server(s), skill(s)
 * - Click item to view details and test
 * - Execute tools with input parameters
 * - "Add Tools" button (opens AddSourceWorkflow)
 */

import { useMemo, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MasterDetailLayout } from '@/components/layout/master-detail-layout';
import { ToolTable } from '@/components/tools/tool-table';
import { ToolDetail } from '@/components/tools/tool-detail';
import { useToolItems } from '@/hooks/useToolItems';
import { useMCPServers } from '@/hooks/useMCPServers';
import { useSkills } from '@/hooks/useSkills';
import { useUIStore } from '@/stores/uiStore';
import { useUrlSync } from '@/hooks/useUrlSync';

export default function ToolsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { selectedId, setSelectedId } = useUrlSync();
  const setAddSourceWorkflowOpen = useUIStore((state) => state.setAddSourceWorkflowOpen);

  // Fetch tool items, servers, and skills
  const { filteredItems, loading, error, filters } = useToolItems();
  const { servers } = useMCPServers();
  const { skills } = useSkills(workspaceId || '');

  // Get selected item from URL
  const selectedItem = useMemo(() => {
    if (!selectedId) return null;
    return filteredItems.find((item) => item?.id === selectedId) || null;
  }, [selectedId, filteredItems]);

  // Auto-clear selection if item not found (might have been deleted or invalid ID)
  useEffect(() => {
    if (selectedId && !selectedItem && !loading) {
      setSelectedId(null);
    }
  }, [selectedId, selectedItem, loading, setSelectedId]);

  // Available servers and skills for filters
  const availableServers = useMemo(() => {
    return servers.map((server) => ({
      id: server.id,
      name: server.name,
    }));
  }, [servers]);

  const availableSkills = useMemo(() => {
    return skills.map((skill: { id: string; name: string }) => ({
      id: skill.id,
      name: skill.name,
    }));
  }, [skills]);

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
        <Button onClick={() => setAddSourceWorkflowOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Tools
        </Button>
      </div>

      {/* Master-Detail Layout */}
      <MasterDetailLayout
        table={
          <ToolTable
            items={filteredItems}
            selectedItemId={selectedId}
            onSelectItem={setSelectedId}
            search={filters.search}
            onSearchChange={filters.setSearch}
            serverFilter={filters.serverIds}
            onServerFilterChange={filters.setServerIds}
            skillFilter={filters.skillIds}
            onSkillFilterChange={filters.setSkillIds}
            availableServers={availableServers}
            availableSkills={availableSkills}
            loading={loading}
          />
        }
        detail={selectedItem ? <ToolDetail item={selectedItem} /> : null}
        onCloseDetail={() => setSelectedId(null)}
      />
    </div>
  );
}
