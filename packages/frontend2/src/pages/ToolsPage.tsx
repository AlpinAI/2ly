/**
 * Tools Page
 *
 * WHY: Page for managing tools with catalog browser.
 * Users can browse, search, and add tools from the registry.
 *
 * ARCHITECTURE:
 * - Uses AppLayout (header + navigation are automatic)
 * - AddToolWorkflow is global (rendered in AppLayout, controlled via Zustand)
 * - Follows same patterns as DashboardPage
 */

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/uiStore';

export default function ToolsPage() {
  const setOpen = useUIStore((state) => state.setAddToolWorkflowOpen);

  return (
    <div>
      {/* Header with Add Tools button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Tools</h2>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Tools
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <p className="text-gray-600 dark:text-gray-400">MCP tool catalog and management interface coming soon...</p>
      </div>
    </div>
  );
}
