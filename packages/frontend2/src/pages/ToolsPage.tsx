/**
 * Tools Page
 *
 * WHY: Placeholder page for managing MCP tools.
 * Will eventually show tool catalog, installation, and configuration.
 *
 * ARCHITECTURE:
 * - Uses AppLayout (header + navigation are automatic)
 * - Follows same patterns as DashboardPage
 * - Ready for future implementation
 */

export default function ToolsPage() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        MCP Tools
      </h2>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <p className="text-gray-600 dark:text-gray-400">
          MCP tool catalog and management interface coming soon...
        </p>
      </div>
    </div>
  );
}
