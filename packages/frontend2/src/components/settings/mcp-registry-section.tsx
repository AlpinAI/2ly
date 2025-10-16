/**
 * McpRegistrySection Component
 *
 * WHY: Complete section for MCP Registry management in settings
 *
 * WHAT IT SHOWS:
 * - Prominent "Add Registry" split button (presets + custom option)
 * - List of all configured registries
 * - Dialog for custom registry creation
 * - Error states
 */

import { useState } from 'react';
import { Database, AlertCircle } from 'lucide-react';
import { RegistryList } from './registry-list';
import { RegistrySplitButton } from '@/components/registry/registry-split-button';
import { AddCustomRegistryDialog } from './add-custom-registry-dialog';
import { SettingsSection } from './settings-section';
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <SettingsSection
        title="MCP Registry Management"
        description="Connect to upstream MCP registries to sync available servers and tools."
        icon={Database}
      >
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

        {/* Add Registry Split Button - Prominent position at top */}
        <div className="mb-6">
          <RegistrySplitButton
            onSelectRegistry={onCreateRegistry}
            onCustomClick={() => setIsDialogOpen(true)}
            isLoading={isCreating}
            existingRegistryUrls={registries.map((r) => r.upstreamUrl)}
          />
        </div>

        {/* Registries List */}
        <RegistryList
          registries={registries}
          loading={loading}
          isSyncing={isSyncing}
          onSync={onSyncRegistry}
          onDelete={onDeleteRegistry}
        />
      </SettingsSection>

      {/* Custom Registry Dialog */}
      <AddCustomRegistryDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={onCreateRegistry}
        isLoading={isCreating}
      />
    </>
  );
}
