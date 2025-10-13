/**
 * MCP Configuration Helpers
 *
 * WHY: Utilities for parsing MCP Registry server configurations and generating
 * dynamic form fields. Handles packages (NPM, PyPI, Docker, OCI) and remotes (STREAM, SSE).
 *
 * ARCHITECTURE:
 * - Parse JSON strings from MCPRegistryServer
 * - Extract configurable fields (env vars, args, headers, query params)
 * - Enrich configurations with user-provided values while preserving schema shape
 * - Support STDIO, SSE, and STREAM transports
 */

import type { SubscribeMcpRegistriesSubscription } from '@/graphql/generated/graphql';
import { mcpRegistry } from '@2ly/common';

// Extract server type
type MCPRegistryServer = NonNullable<
  NonNullable<SubscribeMcpRegistriesSubscription['mcpRegistries']>[number]['servers']
>[number];

// Use official MCP Registry schema types
type Package = mcpRegistry.components['schemas']['Package'];
type Transport = mcpRegistry.components['schemas']['Transport'];

// Configuration option for dropdown
export interface ConfigOption {
  id: string;
  label: string;
  type: 'package' | 'remote';
  transport: 'STDIO' | 'SSE' | 'STREAM';
  config: Package | Transport;
  isSupported: boolean;
}

// Dynamic form field
export interface ConfigField {
  name: string;
  label: string;
  description?: string;
  type: 'string' | 'boolean' | 'choices';
  context: 'env' | 'arg' | 'header' | 'query';
  required: boolean;
  secret: boolean;
  default?: string;
  choices?: string[];
  value?: string;
}

/**
 * Check if a transport type is supported
 */
export function isTransportSupported(transport: string): boolean {
  const supported = ['STDIO', 'SSE', 'STREAM'];
  return supported.includes(transport.toUpperCase());
}

/**
 * Check if a config option is supported
 */
export function isConfigSupported(option: ConfigOption): boolean {
  return isTransportSupported(option.transport);
}

/**
 * Extract all configuration options from a server
 */
export function extractConfigOptions(server: MCPRegistryServer): ConfigOption[] {
  const options: ConfigOption[] = [];

  // Parse packages
  try {
    if (server.packages) {
      const packages = JSON.parse(server.packages) as Package[];
      if (Array.isArray(packages)) {
        packages.forEach((pkg, index) => {
          const transport = pkg.transport?.type?.toUpperCase() || 'STDIO';
          const label = `${transport}: ${pkg.identifier}@${pkg.version}`;
          const isSupported = isTransportSupported(transport);

          options.push({
            id: `pkg-${index}-${pkg.identifier}-${pkg.version}`,
            label,
            type: 'package',
            transport: transport as 'STDIO' | 'SSE' | 'STREAM',
            config: pkg,
            isSupported,
          });
        });
      }
    }
  } catch (error) {
    console.error('Failed to parse packages:', error);
  }

  // Parse remotes
  try {
    if (server.remotes) {
      const remotes = JSON.parse(server.remotes) as Transport[];
      if (Array.isArray(remotes)) {
        remotes.forEach((remote, index) => {
          const transport =
            remote.type === 'streamable' || remote.type === 'streamableHttp'
              ? 'STREAM'
              : remote.type === 'sse'
                ? 'SSE'
                : 'STREAM';
          const label = `${transport}: Remote ${remote.url || ''}`;
          const isSupported = isTransportSupported(transport);

          options.push({
            id: `remote-${index}-${remote.type}`,
            label,
            type: 'remote',
            transport: transport as 'STDIO' | 'SSE' | 'STREAM',
            config: remote,
            isSupported,
          });
        });
      }
    }
  } catch (error) {
    console.error('Failed to parse remotes:', error);
  }

  return options;
}

/**
 * Extract configurable fields from a config option
 */
export function extractConfigurableFields(option: ConfigOption): ConfigField[] {
  const fields: ConfigField[] = [];

  if (option.type === 'package') {
    const pkg = option.config as Package;

    // Environment variables
    pkg.environmentVariables?.forEach((env) => {
      if (env.choices && env.choices.length > 0) {
        fields.push({
          name: env.name,
          label: env.name,
          description: env.description,
          type: 'choices',
          context: 'env',
          required: env.isRequired || false,
          secret: env.isSecret || false,
          default: String(env.default ?? ''),
          choices: env.choices.map((c) => String(c)),
          value: String(env.value ?? env.default ?? ''),
        });
      } else if (env.format === 'boolean') {
        fields.push({
          name: env.name,
          label: env.name,
          description: env.description,
          type: 'boolean',
          context: 'env',
          required: env.isRequired || false,
          secret: false,
          default: String(env.default ?? 'false'),
          value: String(env.value ?? env.default ?? 'false'),
        });
      } else {
        fields.push({
          name: env.name,
          label: env.name,
          description: env.description,
          type: 'string',
          context: 'env',
          required: env.isRequired || false,
          secret: env.isSecret || false,
          default: String(env.default ?? ''),
          value: String(env.value ?? env.default ?? ''),
        });
      }
    });

    // Package arguments
    pkg.packageArguments?.forEach((arg) => {
      const argName = arg.name || `arg-${fields.length}`;
      if (arg.format === 'boolean') {
        fields.push({
          name: argName,
          label: argName,
          description: arg.description,
          type: 'boolean',
          context: 'arg',
          required: arg.isRequired || false,
          secret: false,
          default: String(arg.default ?? 'false'),
          value: String(arg.value ?? arg.default ?? 'false'),
        });
      } else {
        fields.push({
          name: argName,
          label: argName,
          description: arg.description,
          type: 'string',
          context: 'arg',
          required: arg.isRequired || false,
          secret: arg.isSecret || false,
          default: String(arg.default ?? ''),
          value: String(arg.value ?? arg.default ?? ''),
        });
      }
    });

    // Runtime arguments (if present)
    pkg.runtimeArguments?.forEach((arg) => {
      const argName = arg.name || `runtime-arg-${fields.length}`;
      if (arg.format === 'boolean') {
        fields.push({
          name: argName,
          label: argName,
          description: arg.description,
          type: 'boolean',
          context: 'arg',
          required: arg.isRequired || false,
          secret: false,
          default: String(arg.default ?? 'false'),
          value: String(arg.value ?? arg.default ?? 'false'),
        });
      } else {
        fields.push({
          name: argName,
          label: argName,
          description: arg.description,
          type: 'string',
          context: 'arg',
          required: arg.isRequired || false,
          secret: arg.isSecret || false,
          default: String(arg.default ?? ''),
          value: String(arg.value ?? arg.default ?? ''),
        });
      }
    });
  } else if (option.type === 'remote') {
    const remote = option.config as Transport;

    // Headers
    remote.headers?.forEach((header) => {
      if (header.choices && header.choices.length > 0) {
        fields.push({
          name: header.name,
          label: header.name,
          description: header.description,
          type: 'choices',
          context: 'header',
          required: header.isRequired || false,
          secret: header.isSecret || false,
          default: String(header.default ?? ''),
          choices: header.choices.map((c) => String(c)),
          value: String(header.value ?? header.default ?? ''),
        });
      } else if (header.format === 'boolean') {
        fields.push({
          name: header.name,
          label: header.name,
          description: header.description,
          type: 'boolean',
          context: 'header',
          required: header.isRequired || false,
          secret: false,
          default: String(header.default ?? 'false'),
          value: String(header.value ?? header.default ?? 'false'),
        });
      } else {
        fields.push({
          name: header.name,
          label: header.name,
          description: header.description,
          type: 'string',
          context: 'header',
          required: header.isRequired || false,
          secret: header.isSecret || false,
          default: String(header.default ?? ''),
          value: String(header.value ?? header.default ?? ''),
        });
      }
    });
  }

  return fields;
}

/**
 * Enrich configuration with user-provided values while preserving the official MCP registry schema shape.
 * IMPORTANT: This function ONLY adds the "value" property to configurable fields.
 * It does NOT change the shape of the config - all other properties are preserved exactly as they are.
 *
 * Returns a config object following the MCP registry Package or Transport schema.
 */
export function enrichConfigWithValues(
  server: MCPRegistryServer,
  option: ConfigOption,
  fields: ConfigField[],
  customName?: string,
): {
  name: string;
  description: string;
  repositoryUrl: string;
  transport: 'STDIO' | 'SSE' | 'STREAM';
  config: string; // JSON string containing Package or Transport config
} {
  const name = customName || server.title || server.name;
  const description = server.description || '';
  const repositoryUrl = server.repositoryUrl || '';
  const transport = option.transport;

  // Deep clone the config to avoid mutating the original
  const configObj = JSON.parse(JSON.stringify(option.config));

  if (option.type === 'package') {
    const pkg = configObj as Package;

    // Enrich package arguments with values
    if (pkg.packageArguments) {
      pkg.packageArguments.forEach((arg) => {
        const argName = arg.name || '';
        const field = fields.find((f) => f.context === 'arg' && f.name === argName);
        if (field) {
          arg.value = field.value || String(arg.default ?? '');
        }
      });
    }

    // Enrich runtime arguments with values
    if (pkg.runtimeArguments) {
      pkg.runtimeArguments.forEach((arg) => {
        const argName = arg.name || '';
        const field = fields.find((f) => f.context === 'arg' && f.name === argName);
        if (field) {
          arg.value = field.value || String(arg.default ?? '');
        }
      });
    }

    // Enrich environment variables with values
    if (pkg.environmentVariables) {
      pkg.environmentVariables.forEach((env) => {
        const field = fields.find((f) => f.context === 'env' && f.name === env.name);
        if (field) {
          env.value = field.value || String(env.default ?? '');
        }
      });
    }
  } else if (option.type === 'remote') {
    const remote = configObj as Transport;

    // Enrich headers with values
    if (remote.headers) {
      remote.headers.forEach((header) => {
        const field = fields.find((f) => f.context === 'header' && f.name === header.name);
        if (field) {
          header.value = field.value || String(header.default ?? '');
        }
      });
    }

    // Note: Query parameters are typically handled via URL modification
    // but we preserve the Transport schema structure exactly
  }

  return {
    name,
    description,
    repositoryUrl,
    transport,
    config: JSON.stringify(configObj),
  };
}

/**
 * Get display name for a server (prefers title over name)
 */
export function getServerDisplayName(server: MCPRegistryServer): string {
  return server.title || server.name;
}

/**
 * Validate that all required fields are filled
 */
export function validateFields(fields: ConfigField[]): boolean {
  return fields.every((field) => {
    if (!field.required) return true;
    const value = (field.value || field.default || '').trim();
    return value !== '';
  });
}
