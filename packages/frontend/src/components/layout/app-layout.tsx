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
 * - Global bottom panels (AddSourceWorkflow, SkillManagementPanel)
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
 *   <Route path="skills" element={<SkillsPage />} />
 * </Route>
 * ```
 */

import { Outlet } from 'react-router-dom';
import { AppHeader } from './app-header';
import { AppNavigation } from './app-navigation';
import { AddSourceWorkflow } from '@/components/sources/add-source-workflow';
import { AddServerWorkflow } from '@/components/registry/add-server-workflow';
import { SkillManagementPanel } from '@/components/skills/skill-management-panel';
import { CreateSkillDialog } from '@/components/skills/create-skill-dialog';
import { ConnectSkillDialog } from '@/components/skills/connect-skill-dialog';

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
      <SkillManagementPanel />

      {/* Global dialogs - accessible from any page */}
      <CreateSkillDialog />
      <ConnectSkillDialog />
    </div>
  );
}
