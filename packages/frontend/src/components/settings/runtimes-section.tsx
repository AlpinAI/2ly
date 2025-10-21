/**
 * RuntimesSection Component
 *
 * WHY: Configure runtime settings and deployment options.
 * Currently a placeholder for future implementation.
 *
 * WHAT IT WILL SHOW:
 * - Runtime configuration options
 * - Deployment settings
 * - Resource limits
 * - Runtime health and monitoring settings
 */

import { Cpu, Info } from 'lucide-react';
import { SettingsSection } from './settings-section';

export function RuntimesSection() {
  return (
    <SettingsSection
      title="Runtime Configuration"
      description="Configure runtime settings, deployment options, and resource limits."
      icon={Cpu}
    >
      {/* Placeholder Content */}
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-full p-4 mb-4">
          <Info className="h-8 w-8 text-purple-600 dark:text-purple-400" />
        </div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Coming Soon
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md">
          Runtime configuration features are currently under development.
          You'll be able to configure deployment settings, resource limits, and monitoring here.
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
            Configure default runtime settings
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
            Set memory and CPU limits per runtime
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
            Configure auto-scaling and health check settings
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
            Set environment variables and secrets
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
            Configure logging and monitoring integrations
          </li>
        </ul>
      </div>
    </SettingsSection>
  );
}
