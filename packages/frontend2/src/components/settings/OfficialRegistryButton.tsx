/**
 * OfficialRegistryButton Component
 *
 * WHY: Quick-add button for the official MCP registry
 *
 * WHAT IT SHOWS:
 * - Button to add official registry with one click
 * - Different states based on whether registry is already added
 * - Helper text when already added
 */

import { Plus, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

const OFFICIAL_MCP_REGISTRY = {
  name: 'Official MCP Registry',
  upstreamUrl: 'https://registry.modelcontextprotocol.io/v0/servers',
} as const;

interface OfficialRegistryButtonProps {
  onAdd: (name: string, upstreamUrl: string) => Promise<void>;
  isAdded: boolean;
  isLoading: boolean;
  disabled?: boolean;
}

export function OfficialRegistryButton({ onAdd, isAdded, isLoading, disabled }: OfficialRegistryButtonProps) {
  const handleAdd = async () => {
    await onAdd(OFFICIAL_MCP_REGISTRY.name, OFFICIAL_MCP_REGISTRY.upstreamUrl);
  };

  return (
    <div className="mb-6">
      <Button
        onClick={handleAdd}
        disabled={isLoading || isAdded || disabled}
        variant="outline"
        className="w-full md:w-auto"
      >
        {isAdded ? (
          <>
            <Database className="h-4 w-4" />
            Official MCP Registry Added
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            Add Official MCP Registry
          </>
        )}
      </Button>
      {isAdded && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          The official MCP registry is already configured.
        </p>
      )}
    </div>
  );
}

export { OFFICIAL_MCP_REGISTRY };
