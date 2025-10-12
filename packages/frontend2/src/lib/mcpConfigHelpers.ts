/**
 * MCP Configuration Helpers
 *
 * WHY: Utilities for parsing MCP Registry server configurations and generating
 * dynamic form fields. Handles packages (NPM, PyPI, Docker, OCI) and remotes (STREAM, SSE).
 *
 * ARCHITECTURE:
 * - Parse JSON strings from MCPRegistryUpstreamServer
 * - Extract configurable fields (env vars, args, headers, query params)
 * - Map form data to GraphQL mutation inputs
 * - Support STDIO, SSE, and STREAM transports
 */

import type { SubscribeMcpRegistriesSubscription } from '@/graphql/generated/graphql';

// Extract server type
type MCPRegistryUpstreamServer = NonNullable<
  NonNullable<SubscribeMcpRegistriesSubscription['mcpRegistries']>[number]['servers']
>[number];

// Package configuration from registry
interface PackageConfig {
  identifier: string;
  version: string;
  registryType: 'npm' | 'pypi' | 'docker' | 'oci';
  registryBaseUrl?: string;
  runtimeHint?: string;
  transport?: {
    type: string;
  };
  packageArguments?: Array<{
    name?: string;
    description?: string;
    format: 'string' | 'boolean';
    type?: 'positional' | 'named';
    isRequired?: boolean;
    isSecret?: boolean;
    default?: string | boolean;
    value?: string | boolean;
  }>;
  environmentVariables?: Array<{
    name: string;
    description?: string;
    format: 'string' | 'boolean';
    isRequired?: boolean;
    isSecret?: boolean;
    default?: string | boolean;
    value?: string | boolean;
    choices?: Array<string | boolean>;
  }>;
}

// Remote configuration from registry
interface RemoteConfig {
  type: 'streamable' | 'sse';
  url?: string;
  headers?: Array<{
    name: string;
    description?: string;
    format: 'string' | 'boolean';
    isRequired?: boolean;
    isSecret?: boolean;
    default?: string | boolean;
    value?: string | boolean;
    choices?: Array<string | boolean>;
  }>;
  queryVariables?: Array<{
    name: string;
    description?: string;
    format: 'string' | 'boolean';
    isRequired?: boolean;
    isSecret?: boolean;
    default?: string | boolean;
    value?: string | boolean;
    choices?: Array<string | boolean>;
  }>;
}

// Configuration option for dropdown
export interface ConfigOption {
  id: string;
  label: string;
  type: 'package' | 'remote';
  transport: 'STDIO' | 'SSE' | 'STREAM';
  config: PackageConfig | RemoteConfig;
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
export function extractConfigOptions(server: MCPRegistryUpstreamServer): ConfigOption[] {
  const options: ConfigOption[] = [];

  // Parse packages
  try {
    if (server.packages) {
      const packages = JSON.parse(server.packages) as PackageConfig[];
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
      const remotes = JSON.parse(server.remotes) as RemoteConfig[];
      if (Array.isArray(remotes)) {
        remotes.forEach((remote, index) => {
          const transport = remote.type === 'streamable' ? 'STREAM' : remote.type === 'sse' ? 'SSE' : 'STREAM';
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
    const pkg = option.config as PackageConfig;

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
  } else if (option.type === 'remote') {
    const remote = option.config as RemoteConfig;

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

    // Query variables
    remote.queryVariables?.forEach((query) => {
      if (query.format === 'boolean') {
        fields.push({
          name: query.name,
          label: query.name,
          description: query.description,
          type: 'boolean',
          context: 'query',
          required: query.isRequired || false,
          secret: false,
          default: String(query.default ?? 'false'),
          value: String(query.value ?? query.default ?? 'false'),
        });
      } else {
        fields.push({
          name: query.name,
          label: query.name,
          description: query.description,
          type: 'string',
          context: 'query',
          required: query.isRequired || false,
          secret: query.isSecret || false,
          default: String(query.default ?? ''),
          value: String(query.value ?? query.default ?? ''),
        });
      }
    });
  }

  return fields;
}

/**
 * Map configuration to GraphQL mutation input
 */
export function mapToServerInput(
  server: MCPRegistryUpstreamServer,
  option: ConfigOption,
  fields: ConfigField[],
  customName?: string
): {
  name: string;
  description: string;
  repositoryUrl: string;
  transport: 'STDIO' | 'SSE' | 'STREAM';
  command: string;
  args: string;
  ENV: string;
  serverUrl: string;
  headers: string;
} {
  const name = customName || server.title || server.name;
  const description = server.description || '';
  const repositoryUrl = server.repositoryUrl || '';
  const transport = option.transport;

  let command = '';
  let args = '';
  let ENV = '';
  let serverUrl = '';
  let headers = '';

  if (option.type === 'package') {
    const pkg = option.config as PackageConfig;

    // Build command based on registry type
    switch (pkg.registryType) {
      case 'npm':
        command = 'npx';
        args = `${pkg.identifier}@${pkg.version}`;
        break;
      case 'pypi':
        command = 'uvx';
        args = pkg.identifier;
        break;
      case 'docker':
        command = 'docker';
        args = `run -i --rm ${pkg.identifier}:${pkg.version}`;
        break;
      case 'oci':
        command = 'docker';
        args = `run -i --rm ${pkg.registryBaseUrl}/${pkg.identifier}:${pkg.version}`;
        break;
    }

    // Add package arguments
    const argFields = fields.filter((f) => f.context === 'arg');
    const argStrings: string[] = [];
    pkg.packageArguments?.forEach((arg, index) => {
      const field = argFields.find((f) => f.name === (arg.name || `arg-${index}`));
      const value = field?.value || String(arg.default ?? '');
      if (value) {
        if (arg.type === 'positional') {
          argStrings.push(value);
        } else if (arg.type === 'named' && arg.name) {
          argStrings.push(`--${arg.name}=${value}`);
        }
      }
    });
    if (argStrings.length > 0) {
      args += ' ' + argStrings.join(' ');
    }

    // Build environment variables
    const envFields = fields.filter((f) => f.context === 'env');
    const envStrings: string[] = [];
    envFields.forEach((field) => {
      const value = field.value || field.default || '';
      if (value) {
        envStrings.push(`${field.name}=${value}`);
      }
    });
    ENV = envStrings.join('\n');
  } else if (option.type === 'remote') {
    const remote = option.config as RemoteConfig;
    serverUrl = remote.url || '';

    // Build headers
    const headerFields = fields.filter((f) => f.context === 'header');
    const headerStrings: string[] = [];
    headerFields.forEach((field) => {
      const value = field.value || field.default || '';
      if (value) {
        headerStrings.push(`${field.name}: ${value}`);
      }
    });
    headers = headerStrings.join('\n');

    // Build query parameters (append to serverUrl)
    const queryFields = fields.filter((f) => f.context === 'query');
    if (queryFields.length > 0) {
      const queryParams: string[] = [];
      queryFields.forEach((field) => {
        const value = field.value || field.default || '';
        if (value) {
          queryParams.push(`${field.name}=${encodeURIComponent(value)}`);
        }
      });
      if (queryParams.length > 0) {
        const separator = serverUrl.includes('?') ? '&' : '?';
        serverUrl += separator + queryParams.join('&');
      }
    }
  }

  return {
    name,
    description,
    repositoryUrl,
    transport,
    command,
    args,
    ENV,
    serverUrl,
    headers,
  };
}

/**
 * Get display name for a server (prefers title over name)
 */
export function getServerDisplayName(server: MCPRegistryUpstreamServer): string {
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
