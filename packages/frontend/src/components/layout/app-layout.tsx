/**
 * App Layout Component
 *
 * WHY: Main layout wrapper for authenticated application.
 * Provides consistent header and navigation across all pages.
 *
 * WHAT IT PROVIDES:
 * - AppHeader (logo, search, notifications, user menu, theme)
 * - AppNavigation (horizontal menu bar)
 * - Content area with React Router Outlet
 * - Global bottom panels (AddSourceWorkflow, ToolManagementPanel)
 * - Toast notifications
 * - Responsive container with max-width
 *
 * ARCHITECTURE:
 * - Pure layout component (no state management)
 * - All panels are self-contained and manage their own state
 * - Auto-close on navigation handled by individual components
 *
 * USAGE:
 * Wrap this around protected routes in App.tsx
 *
 * @example
 * ```tsx
 * <Route path="/app" element={<AppLayout />}>
 *   <Route path="overview" element={<DashboardPage />} />
 *   <Route path="toolsets" element={<ToolSetsPage />} />
 * </Route>
 * ```
 */

import { Outlet } from 'react-router-dom';
import { AppHeader } from './app-header';
import { AppNavigation } from './app-navigation';
import { AddSourceWorkflow } from '@/components/sources/add-source-workflow';
import { AddServerWorkflow } from '@/components/registry/add-server-workflow';
import { ToolManagementPanel } from '@/components/toolsets/tool-management-panel';
import { CreateToolSetDialog } from '@/components/tool-sets/create-tool-set-dialog';
import { ConnectAgentDialog } from '@/components/agents/connect-agent-dialog';

export function AppLayout() {

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 transition-colors font-mono flex flex-col">
      {/* Header */}
      <AppHeader />

      {/* Navigation */}
      <AppNavigation />

      {/* Main Content */}
      <main className="flex-1 p-6 min-h-0">
        <Outlet />
      </main>

      {/* Global bottom panels - self-contained, accessible from any page */}
      <AddSourceWorkflow />
      <AddServerWorkflow />
      <ToolManagementPanel />

      {/* Global dialogs - accessible from any page */}
      <CreateToolSetDialog />
      <ConnectAgentDialog />
    </div>
  );
}
