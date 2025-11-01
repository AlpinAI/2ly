/**
 * Tool Sets Page
 *
 * WHY: Manage and view tool sets with detailed information.
 * Shows tool set list with filters and detail panel.
 *
 * LAYOUT:
 * - 2/3: Tool set table with search and filters
 * - 1/3: Tool set detail panel
 *
 * FEATURES:
 * - Real-time tool set updates (subscription)
 * - Search by name/description/tool names
 * - Filter by status
 * - Click tool set to view details
 * - Show tool set tools and metadata
 */

import { useMemo, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { MasterDetailLayout } from '@/components/layout/master-detail-layout';
import { ToolSetTable } from '@/components/tool-sets/tool-set-table';
import { ToolSetDetail } from '@/components/tool-sets/tool-set-detail';
import { Button } from '@/components/ui/button';
import { useToolSets } from '@/hooks/useToolSets';
import { useCreateToolSetDialog, useManageToolsDialog } from '@/stores/uiStore';
import { useUrlSync } from '@/hooks/useUrlSync';

export default function ToolSetsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { selectedId, setSelectedId } = useUrlSync();
  const { openDialog } = useCreateToolSetDialog();

  // Fetch tool sets via Apollo subscription
  const { filteredToolSets, loading, error, filters } = useToolSets(workspaceId || '');

  // Get selected tool set from URL
  const selectedToolSet = useMemo(() => {
    if (!selectedId) return null;
    return filteredToolSets.find((ts) => ts.id === selectedId) || null;
  }, [selectedId, filteredToolSets]);

  // Auto-close detail panel if tool set not found
  useEffect(() => {
    if (selectedId && !selectedToolSet && !loading) {
      // Tool set not found - might have been deleted or invalid ID
      setSelectedId(null);
    }
  }, [selectedId, selectedToolSet, loading, setSelectedId]);

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
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Tool Sets</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your tool sets and organize your tools
          </p>
        </div>
        <Button onClick={handleCreateToolSet} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Tool Set
        </Button>
      </div>

      {/* Master-Detail Layout */}
      <MasterDetailLayout
        table={
          <ToolSetTable
            toolSets={filteredToolSets}
            selectedToolSetId={selectedId}
            onSelectToolSet={setSelectedId}
            search={filters.search}
            onSearchChange={filters.setSearch}
            statusFilter={filters.statuses}
            onStatusFilterChange={filters.setStatuses}
            loading={loading}
          />
        }
        detail={selectedToolSet ? <ToolSetDetail toolSet={selectedToolSet} /> : null}
        onCloseDetail={() => setSelectedId(null)}
      />
    </div>
  );
}
