/**
 * Type definitions for MCP server seeding in E2E tests
 *
 * This module provides strongly-typed structures for creating MCP server
 * configurations in test fixtures, ensuring type safety and consistency.
 */

import { mcpRegistry, dgraphResolversTypes } from '@2ly/common';


/**
 * Base types from the MCP registry schema
 */
export type Package = mcpRegistry.components['schemas']['Package'];
export type Argument = mcpRegistry.components['schemas']['Argument'];
export type Transport = mcpRegistry.components['schemas']['Transport'];

/**
 * Helper type to omit auto-generated fields from Dgraph types
 * These fields are automatically created by the database and shouldn't be in seed data
 */
export type OmitGenerated<T, K extends keyof T = never> = Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'lastSeenAt' | '_meta' | K>;

/**
 * Extended argument type with configurability flag
 */
export type AugmentedArgument = Argument & {
  isConfigurable: boolean;
};

/**
 * Complete MCP server configuration for seeding
 * Combines Package type with augmented arguments
 */
export type MCPServerConfig = Package & {
  packageArguments: AugmentedArgument[];
};

/**
 * Registry server seed data structure
 */
export type RegistryServerSeed = OmitGenerated<dgraphResolversTypes.McpRegistryServer, 'workspace' | 'configurations' | 'packages' | 'remotes'> & {
  workspaceId?: string; // ID reference for seeding
  packages: Package[];
  remotes: Transport[];
};

/**
 * MCP server seed data structure
 * Uses MCPServerConfig for type-safe configuration
 */
export type MCPServerSeed = OmitGenerated<dgraphResolversTypes.McpServer, 'config' | 'registryServer' | 'workspace'> & {
  config: MCPServerConfig; // Typed config object (not JSON string)
  registryServerId?: string; // ID reference for seeding
  workspaceId?: string; // ID reference for seeding
};

/**
 * Type guard to check if an argument is augmented
 */
export function isAugmentedArgument(arg: Argument | AugmentedArgument): arg is AugmentedArgument {
  return 'isConfigurable' in arg;
}

/**
 * Type guard to validate MCPServerConfig structure
 */
export function isValidMCPServerConfig(config: unknown): config is MCPServerConfig {
  if (!config || typeof config !== 'object') return false;

  const c = config as Record<string, unknown>;

  return (
    typeof c.registryType === 'string' &&
    typeof c.identifier === 'string' &&
    typeof c.version === 'string' &&
    Array.isArray(c.packageArguments) &&
    Array.isArray(c.environmentVariables) &&
    Array.isArray(c.runtimeArguments)
  );
}
