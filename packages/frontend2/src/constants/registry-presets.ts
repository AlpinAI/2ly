/**
 * Registry Presets Constants
 *
 * WHY: Centralized configuration for common MCP registries to enable quick setup.
 * Provides predefined registry configurations for the split button UI.
 *
 * USAGE:
 * ```tsx
 * import { REGISTRY_PRESETS, OFFICIAL_REGISTRY } from '@/constants/registry-presets';
 * 
 * // Use in split button
 * const primaryRegistry = OFFICIAL_REGISTRY;
 * const otherRegistries = REGISTRY_PRESETS.slice(1);
 * ```
 */

export interface RegistryPreset {
  name: string;
  upstreamUrl: string;
}

export const REGISTRY_PRESETS: RegistryPreset[] = [
  {
    name: 'Official Registry',
    upstreamUrl: 'https://registry.modelcontextprotocol.io/v0/servers',
  },
  {
    name: 'NimbleTools',
    upstreamUrl: 'https://registry.nimbletools.ai/v0/servers',
  },
];

export const OFFICIAL_REGISTRY = REGISTRY_PRESETS[0];
