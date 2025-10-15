/**
 * Registry Split Button Component
 *
 * WHY: Provides a split-button UI for quickly adding common registries.
 * Combines a primary action (Official Registry) with dropdown options for other presets.
 *
 * FEATURES:
 * - Primary button for Official MCP Registry
 * - Dropdown with other preset registries (NimbleTools, etc.)
 * - Disabled state for already-added registries
 * - Loading state support
 * - Consistent with existing SplitButton component
 *
 * USAGE:
 * ```tsx
 * <RegistrySplitButton
 *   onSelectRegistry={(name, url) => handleAddRegistry(name, url)}
 *   isLoading={isCreating}
 *   existingRegistryUrls={['https://registry.modelcontextprotocol.io/v0/servers']}
 * />
 * ```
 */

import { RefreshCw } from 'lucide-react';
import { SplitButton } from '@/components/ui/split-button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { REGISTRY_PRESETS, OFFICIAL_REGISTRY } from '@/constants/registry-presets';

interface RegistrySplitButtonProps {
  onSelectRegistry: (name: string, upstreamUrl: string) => void;
  isLoading: boolean;
  existingRegistryUrls: string[];
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
}

export function RegistrySplitButton({
  onSelectRegistry,
  isLoading,
  existingRegistryUrls,
  className,
  variant = 'default',
}: RegistrySplitButtonProps) {
  const handlePrimaryAction = () => {
    onSelectRegistry(OFFICIAL_REGISTRY.name, OFFICIAL_REGISTRY.upstreamUrl);
  };

  const otherRegistries = REGISTRY_PRESETS.slice(1);

  return (
    <SplitButton
      primaryLabel={
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          {OFFICIAL_REGISTRY.name}
        </>
      }
      onPrimaryAction={handlePrimaryAction}
      primaryDisabled={
        isLoading || existingRegistryUrls.includes(OFFICIAL_REGISTRY.upstreamUrl)
      }
      dropdownContent={
        <>
          {otherRegistries.map((preset) => {
            const isAlreadyAdded = existingRegistryUrls.includes(preset.upstreamUrl);
            return (
              <DropdownMenuItem
                key={preset.upstreamUrl}
                onClick={() => onSelectRegistry(preset.name, preset.upstreamUrl)}
                disabled={isAlreadyAdded || isLoading}
              >
                {preset.name}
                {isAlreadyAdded && (
                  <span className="ml-2 text-xs text-gray-500">(Added)</span>
                )}
              </DropdownMenuItem>
            );
          })}
        </>
      }
      className={className}
      variant={variant}
    />
  );
}
