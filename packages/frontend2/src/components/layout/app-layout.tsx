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
 * - Global AddToolWorkflow (accessible from any page)
 * - Responsive container with max-width
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

import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppHeader } from './app-header';
import { AppNavigation } from './app-navigation';
import { AddToolWorkflow } from '@/components/tools/add-tool-workflow';
import { useUIStore } from '@/stores/uiStore';

export function AppLayout() {
  // Use individual selectors to avoid object reference issues
  const isOpen = useUIStore((state) => state.addToolWorkflowOpen);
  const setOpen = useUIStore((state) => state.setAddToolWorkflowOpen);
  const location = useLocation();

  // Close dialog when navigating to a different page
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, setOpen]);

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

      {/* Global Add Tool Workflow - accessible from any page */}
      <AddToolWorkflow isOpen={isOpen} onClose={() => setOpen(false)} />
    </div>
  );
}
