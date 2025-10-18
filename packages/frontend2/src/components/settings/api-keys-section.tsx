/**
 * ApiKeysSection Component
 *
 * WHY: Manage API keys for programmatic access to the platform.
 * Currently a placeholder for future implementation.
 *
 * WHAT IT WILL SHOW:
 * - List of active API keys
 * - Create new API keys
 * - Revoke/delete API keys
 * - View key permissions and usage
 */

import { Key, Info } from 'lucide-react';
import { SettingsSection } from './settings-section';

export function ApiKeysSection() {
  return (
    <SettingsSection
      title="API Keys"
      description="Manage API keys for programmatic access to your workspace."
      icon={Key}
    >
      {/* Placeholder Content */}
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-full p-4 mb-4">
          <Info className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Coming Soon
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md">
          API key management features are currently under development.
          You'll be able to create, revoke, and manage API keys for programmatic access here.
        </p>
      </div>

      {/* Future Implementation Preview */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Planned Features:
        </h5>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
            Generate new API keys with custom names
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
            Set expiration dates and automatic key rotation
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
            Configure permissions and scopes per API key
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
            View API usage statistics and rate limits
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
            Instantly revoke compromised keys
          </li>
        </ul>
      </div>
    </SettingsSection>
  );
}
