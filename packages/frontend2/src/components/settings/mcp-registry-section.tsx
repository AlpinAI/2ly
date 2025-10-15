/**
 * McpRegistrySection Component
 *
 * WHY: Complete section for MCP Registry management in settings
 *
 * WHAT IT SHOWS:
 * - Section header with icon and description
 * - Quick-add button for official registry
 * - Form to add custom registries
 * - List of all configured registries
 * - Error states
 */

import { Database, AlertCircle } from 'lucide-react';
import { RegistryForm } from './registry-form';
import { RegistryList } from './registry-list';
import { RegistrySplitButton } from '@/components/registry/registry-split-button';
import type { Registry } from './registry-card';

interface McpRegistrySectionProps {
  registries: Registry[];
  loading: boolean;
  error?: Error | null;
  isSyncing: (id: string) => boolean;
  onCreateRegistry: (name: string, upstreamUrl: string) => Promise<void>;
  onSyncRegistry: (id: string) => Promise<void>;
  onDeleteRegistry: (id: string) => Promise<void>;
  isCreating: boolean;
  workspaceId?: string | null;
}

export function McpRegistrySection({
  registries,
  loading,
  error,
  isSyncing,
  onCreateRegistry,
  onSyncRegistry,
  onDeleteRegistry,
  isCreating,
}: McpRegistrySectionProps) {

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm mb-6">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-4">
        <Database className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          MCP Registry Management
        </h3>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Connect to upstream MCP registries to sync available servers and tools.
      </p>

      {/* Error State */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
              Failed to load registries
            </h4>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {error.message}
            </p>
          </div>
        </div>
      )}

      {/* Quick Add Split Button */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Quick Add Registry
        </label>
        <RegistrySplitButton
          onSelectRegistry={onCreateRegistry}
          isLoading={isCreating}
          existingRegistryUrls={registries.map(r => r.upstreamUrl)}
        />
      </div>

      {/* Custom Registry Form */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Add Custom Registry
        </label>
        <RegistryForm onSubmit={onCreateRegistry} isLoading={isCreating} />
      </div>

      {/* Registries List */}
      <RegistryList
        registries={registries}
        loading={loading}
        isSyncing={isSyncing}
        onSync={onSyncRegistry}
        onDelete={onDeleteRegistry}
      />
    </div>
  );
}
