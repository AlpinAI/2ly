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
 * - Responsive container with max-width
 *
 * USAGE:
 * Wrap this around protected routes in App.tsx
 *
 * @example
 * ```tsx
 * <Route path="/app" element={<AppLayout />}>
 *   <Route path="overview" element={<DashboardPage />} />
 *   <Route path="agents" element={<AgentsPage />} />
 * </Route>
 * ```
 */

import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { AppNavigation } from './AppNavigation';
import { WorkspaceSwitcher } from '@/components/workspace/WorkspaceSwitcher';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors font-mono">
      {/* Header */}
      <AppHeader />

      {/* Navigation */}
      <AppNavigation />

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Workspace Switcher (Cmd/Ctrl+K) */}
      <WorkspaceSwitcher />
    </div>
  );
}
