/**
 * MCP Transport Builders
 *
 * WHY: Shared utilities for building MCP transport configurations from Package and Transport configs.
 * Extracted from runtime to make the logic reusable, testable, and maintainable.
 *
 * FEATURES:
 * - Build STDIO transport configs (npx, uvx, docker commands)
 * - Build SSE/STREAM transport configs (URLs and headers)
 * - Validate required fields and provide clear error messages
 * - Handle special cases (docker run, npm: prefix, etc.)
 *
 * ARCHITECTURE:
 * - Pure functions with no side effects
 * - Works with official MCP Registry schema types
 * - Comprehensive error handling with descriptive messages
 */

import { mcpRegistry } from './types';

type Package = mcpRegistry.components['schemas']['Package'];
type Transport = mcpRegistry.components['schemas']['Transport'];
type Argument = mcpRegistry.components['schemas']['Argument'];
type KeyValueInput = mcpRegistry.components['schemas']['KeyValueInput'];

/**
 * STDIO transport configuration
 */
export interface StdioTransportConfig {
  /** Command to execute (npx, uvx, dnx, docker) */
  command: string;
  /** Command-line arguments */
  args: string[];
  /** Environment variables */
  env: Record<string, string>;
}

/**
 * Remote transport configuration (SSE/STREAM)
 */
export interface RemoteTransportConfig {
  /** URL to connect to */
  url: string;
  /** HTTP headers */
  headers: Record<string, string>;
}

/**
 * Determine command from registry type.
 *
 * @param registryType - Registry type (npm, pypi, nuget, oci, none)
 * @returns Command to execute (empty string for "none" - command comes from identifier)
 * @throws Error if registry type is unsupported
 */
export function getCommandFromRegistryType(registryType: string): string {
  const supportedTypes = ['npm', 'pypi', 'nuget', 'oci', 'none'];

  switch (registryType) {
    case 'npm':
      return 'npx';
    case 'pypi':
      return 'uvx';
    case 'nuget':
      return 'dnx';
    case 'oci':
      return 'docker';
    case 'none':
      return ''; // Command will be extracted from identifier
    default:
      throw new Error(`Unsupported registry type: ${registryType}. Supported types: ${supportedTypes.join(', ')}`);
  }
}

/**
 * Build arguments array for STDIO transport.
 * Order: [runtimeArgs, (docker run), identifier, packageArgs]
 *
 * @param pkg - Package configuration
 * @param command - Command being executed (for special handling)
 * @returns Arguments array
 */
export function buildStdioArgs(pkg: Package): string[] {
  const args: string[] = [];
  const packageArgs = (pkg.packageArguments || []) as Argument[];
  const runtimeArgs = (pkg.runtimeArguments || []) as Argument[];
  const identifier = pkg.identifier || '';
  const registryType = pkg.registryType || '';

  // Process runtime arguments (before identifier)
  runtimeArgs.forEach((arg) => {
    if (arg.type === 'named' && arg.name) {
      // Named argument: --name value
      args.push(`--${arg.name}`);
      if (arg.value) {
        args.push(String(arg.value));
      }
    } else if (arg.value) {
      // Positional argument
      args.push(String(arg.value));
    }
  });

  // Add docker 'run' subcommand for OCI containers
  if (registryType === 'oci') {
    args.push('run');
  }

  // Add package identifier (skip for registryType="none" where identifier IS the command)
  if (registryType !== 'none') {
    // Some packages prefix the identifier with "npm:" which must be removed
    const normalizedIdentifier = identifier.replace(/^npm:/, '');
    args.push(normalizedIdentifier);
  }

  // Process package arguments (after identifier)
  packageArgs.forEach((arg) => {
    if (arg.type === 'named' && arg.name) {
      // Named argument: --name value
      args.push(`--${arg.name}`);
      if (arg.value) {
        args.push(String(arg.value));
      }
    } else if (arg.value) {
      // Positional argument (default or explicit type="positional")
      args.push(String(arg.value));
    }
  });

  return args;
}

/**
 * Build environment variables map from KeyValueInput array.
 *
 * @param envVars - Environment variables from config
 * @param defaultEnv - Default environment variables to merge in (optional)
 * @returns Environment variables map
 */
export function buildEnvironmentVariables(
  envVars: KeyValueInput[],
  defaultEnv: Record<string, string> = {},
): Record<string, string> {
  return envVars.reduce(
    (acc, envVar) => {
      if (envVar.name && envVar.value) {
        acc[envVar.name] = envVar.value;
      }
      return acc;
    },
    { ...defaultEnv },
  );
}

/**
 * Build headers map from KeyValueInput array.
 *
 * @param headers - Headers from config
 * @returns Headers map
 */
export function buildHeadersMap(headers: KeyValueInput[]): Record<string, string> {
  const headerMap: Record<string, string> = {};

  headers.forEach((header) => {
    if (header.name && header.value) {
      headerMap[header.name] = header.value;
    }
  });

  return headerMap;
}

/**
 * Build STDIO transport configuration from Package config.
 *
 * This handles local package execution via npx, uvx, dnx, or docker.
 *
 * Example:
 * ```typescript
 * const pkg = {
 *   identifier: "@brave/brave-search-mcp-server",
 *   version: "2.0.58",
 *   registryType: "npm",
 *   environmentVariables: [
 *     { name: "BRAVE_API_KEY", value: "sk-123" }
 *   ]
 * };
 *
 * const config = buildStdioTransport(pkg);
 * // Returns: {
 * //   command: "npx",
 * //   args: ["@brave/brave-search-mcp-server"],
 * //   env: { BRAVE_API_KEY: "sk-123", ...defaultEnv }
 * // }
 * ```
 *
 * @param pkg - Package configuration
 * @param defaultEnv - Default environment variables (optional)
 * @returns STDIO transport configuration
 * @throws Error if identifier or registryType is missing, or registryType is unsupported
 */
export function buildStdioTransport(pkg: Package, defaultEnv: Record<string, string> = {}): StdioTransportConfig {
  const identifier = pkg.identifier || '';
  const registryType = pkg.registryType || '';
  const envVars = (pkg.environmentVariables || []) as KeyValueInput[];

  // Validate required fields
  if (!identifier) {
    throw new Error(`Package identifier is required`);
  }

  if (!registryType) {
    throw new Error(`Package registryType is required`);
  }

  // Determine command:
  // - For registryType="none": identifier IS the command (e.g., "node", "python3")
  // - For other types: get command from registry type (e.g., "npm" → "npx")
  const command = registryType === 'none' ? identifier : getCommandFromRegistryType(registryType);

  // Build args array
  const args = buildStdioArgs(pkg);

  // Build environment variables
  const env = buildEnvironmentVariables(envVars, defaultEnv);

  return {
    command,
    args,
    env,
  };
}

/**
 * Build SSE transport configuration from Transport config.
 *
 * Example:
 * ```typescript
 * const transport = {
 *   type: "sse",
 *   url: "https://api.example.com/mcp",
 *   headers: [
 *     { name: "Authorization", value: "Bearer abc123" }
 *   ]
 * };
 *
 * const config = buildSseTransport(transport);
 * // Returns: {
 * //   url: "https://api.example.com/mcp",
 * //   headers: { Authorization: "Bearer abc123" }
 * // }
 * ```
 *
 * @param transport - Transport configuration
 * @returns SSE transport configuration
 * @throws Error if URL is missing
 */
export function buildSseTransport(transport: Transport): RemoteTransportConfig {
  const url = transport.url || '';
  const headers = transport.headers || [];

  // Validate required fields
  if (!url) {
    throw new Error(`URL is required for SSE transport`);
  }

  return {
    url,
    headers: buildHeadersMap(headers),
  };
}

/**
 * Build STREAM (StreamableHTTP) transport configuration from Transport config.
 *
 * Example:
 * ```typescript
 * const transport = {
 *   type: "streamableHttp",
 *   url: "https://api.example.com/mcp",
 *   headers: [
 *     { name: "Authorization", value: "Bearer abc123" }
 *   ]
 * };
 *
 * const config = buildStreamTransport(transport);
 * // Returns: {
 * //   url: "https://api.example.com/mcp",
 * //   headers: { Authorization: "Bearer abc123" }
 * // }
 * ```
 *
 * @param transport - Transport configuration
 * @returns STREAM transport configuration
 * @throws Error if URL is missing
 */
export function buildStreamTransport(transport: Transport): RemoteTransportConfig {
  const url = transport.url || '';
  const headers = transport.headers || [];

  // Validate required fields
  if (!url) {
    throw new Error(`URL is required for STREAM transport`);
  }

  return {
    url,
    headers: buildHeadersMap(headers),
  };
}
