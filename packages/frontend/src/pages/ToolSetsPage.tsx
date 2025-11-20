/**
 * Toolsets Page
 *
 * WHY: Manage and view toolsets with detailed information.
 * Shows toolset list with filters and detail panel.
 *
 * LAYOUT:
 * - 2/3: Tool set table with search
 * - 1/3: Tool set detail panel
 *
 * FEATURES:
 * - Real-time toolset updates (subscription)
 * - Search by name/description/tool names
 * - Click toolset to view details
 * - Show toolset tools and metadata
 */

import { useMemo, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { MasterDetailLayout } from '@/components/layout/master-detail-layout';
import { ToolsetTable } from '@/components/toolsets/toolset-table';
import { ToolsetDetail } from '@/components/toolsets/toolset-detail';
import { Button } from '@/components/ui/button';
import { useToolSets } from '@/hooks/useToolSets';
import { useCreateToolsetDialog, useManageToolsDialog } from '@/stores/uiStore';
import { useUrlSync } from '@/hooks/useUrlSync';

export default function ToolSetsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { selectedId, setSelectedId } = useUrlSync();
  const { openDialog } = useCreateToolsetDialog();

  // Fetch toolsets via Apollo subscription
  const { filteredToolSets, loading, error, filters } = useToolSets(workspaceId || '');

  console.log('filteredToolSets', filteredToolSets);

  // Get selected toolset from URL
  const selectedToolSet = useMemo(() => {
    if (!selectedId) return null;
    return filteredToolSets.find((ts) => ts.id === selectedId) || null;
  }, [selectedId, filteredToolSets]);

  // Auto-close detail panel if toolset not found
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
          <p className="text-red-600 dark:text-red-400">Error loading toolsets</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  const manageToolsDialog = useManageToolsDialog();
  const handleCreateToolSet = () => {
    openDialog((toolSetId) => {
      setSelectedId(toolSetId);
      manageToolsDialog.setSelectedToolsetId(toolSetId);
      manageToolsDialog.setOpen(true);
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Toolsets</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your toolsets and organize your tools
          </p>
        </div>
        <Button onClick={handleCreateToolSet} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Toolset
        </Button>
      </div>

      {/* Master-Detail Layout */}
      <MasterDetailLayout
        table={
          <ToolsetTable
            toolSets={filteredToolSets}
            selectedToolsetId={selectedId}
            onSelectToolSet={setSelectedId}
            search={filters.search}
            onSearchChange={filters.setSearch}
            loading={loading}
          />
        }
        detail={selectedToolSet ? <ToolsetDetail toolSet={selectedToolSet} /> : null}
        onCloseDetail={() => setSelectedId(null)}
      />
    </div>
  );
}
