/**
 * Settings Page
 *
 * WHY: Placeholder page for application and user settings.
 * Will eventually show user profile, preferences, and system configuration.
 *
 * ARCHITECTURE:
 * - Uses AppLayout (header + navigation are automatic)
 * - Follows same patterns as DashboardPage
 * - Ready for future implementation
 */

export default function SettingsPage() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Settings
      </h2>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <p className="text-gray-600 dark:text-gray-400">
          Settings and preferences interface coming soon...
        </p>
      </div>
    </div>
  );
}
