/**
 * UsersRolesSection Component
 *
 * WHY: Manage users and roles within the workspace.
 * Currently a placeholder for future implementation.
 *
 * WHAT IT WILL SHOW:
 * - List of workspace users
 * - Role assignments
 * - User invitation functionality
 * - Permission management
 */

import { Users, Info } from 'lucide-react';
import { SettingsSection } from './settings-section';

export function UsersRolesSection() {
  return (
    <SettingsSection
      title="Users & Roles"
      description="Manage workspace members, roles, and permissions."
      icon={Users}
    >
      {/* Placeholder Content */}
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-full p-4 mb-4">
          <Info className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Coming Soon
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md">
          User and role management features are currently under development.
          You'll be able to invite users, assign roles, and manage permissions here.
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
            Invite workspace members via email
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
            Assign and manage user roles (Admin, Member, Viewer)
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
            Configure granular permissions per role
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
            View user activity and last seen status
          </li>
        </ul>
      </div>
    </SettingsSection>
  );
}
