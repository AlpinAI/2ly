/**
 * RegistryList Component
 *
 * WHY: Manages the list of MCP registries with loading and empty states
 *
 * WHAT IT SHOWS:
 * - Loading state while fetching registries
 * - Empty state when no registries exist
 * - List of RegistryCard components
 */

import { Loader2 } from 'lucide-react';
import { RegistryCard, type Registry } from './registry-card';

interface RegistryListProps {
  registries: Registry[];
  loading: boolean;
  syncingId: string | null;
  onSync: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function RegistryList({ registries, loading, syncingId, onSync, onDelete }: RegistryListProps) {
  if (loading && registries.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">
          Loading registries...
        </span>
      </div>
    );
  }

  if (registries.length === 0) {
    return (
      <p className="text-gray-600 dark:text-gray-400 py-8 text-center">
        No registries configured. Add your first registry to get started.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {registries.map((registry) => (
        <RegistryCard
          key={registry.id}
          registry={registry}
          onSync={onSync}
          onDelete={onDelete}
          isSyncing={syncingId === registry.id}
        />
      ))}
    </div>
  );
}
