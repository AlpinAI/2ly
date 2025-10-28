/**
 * MCP Configuration Helpers
 *
 * WHY: Utilities for parsing MCP Registry server configurations and generating
 * dynamic form fields. Handles packages (NPM, PyPI, Docker, OCI) and remotes (STREAM, SSE).
 *
 * ARCHITECTURE:
 * - Parse JSON strings from MCPRegistryServer
 * - Extract configurable variables from arguments, env vars, and headers
 * - Perform variable substitution in templates (e.g., "Bearer {token}" → "Bearer abc123")
 * - Support STDIO, SSE, and STREAM transports
 *
 * IMPORTANT: Uses shared utilities from @2ly/common for variable extraction and substitution.
 */

import type { GetRegistryServersQuery, McpTransportType } from '@/graphql/generated/graphql';
import {
  mcpRegistry,
  getAllVariablesFromConfig,
  substituteAllVariables,
  type VariableDefinition,
} from '@2ly/common';

// Extract server type
type MCPRegistryServer = GetRegistryServersQuery['getRegistryServers'][number];

// Use official MCP Registry schema types
type Package = mcpRegistry.components['schemas']['Package'];
type Transport = mcpRegistry.components['schemas']['Transport'];
type KeyValueInput = mcpRegistry.components['schemas']['KeyValueInput'];
type Argument = mcpRegistry.components['schemas']['Argument'];
type AugmentedKeyValueInput = KeyValueInput & {
  isConfigurable: boolean;
};
type AugmentedArgument = Argument & {
  isConfigurable: boolean;
};

// Configuration option for dropdown
export interface ConfigOption {
  id: string;
  label: string;
  type: 'package' | 'remote';
  transport: McpTransportType;
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
  /**
   * True if this field represents a variable that will be substituted into a template (Pattern 2).
   * False if this field's value is set directly without substitution (Pattern 1).
   *
   * Pattern 1 (Direct): { name: "BRAVE_API_KEY", isRequired: true } → isVariable: false
   * Pattern 2 (Template): { value: "Bearer {github_pat}", variables: { github_pat: {...} } } → isVariable: true
   */
  isVariable: boolean;
  /**
   * Indicates whether this field was considered configurable during initial server setup.
   * This flag is stored in the database config and used to determine which fields
   * should be editable in the edit flow.
   *
   * - Set to `true` during initial configuration for fields that were extracted as configurable
   * - Stored inline in the config JSON (e.g., { name: "API_KEY", value: "...", isConfigurable: true })
   * - Used to filter fields in edit mode (only show fields where isConfigurable === true)
   * - Defaults to `false` for backward compatibility with old configs
   */
  isConfigurable: boolean;
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
            transport: transport as McpTransportType,
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
            transport: transport as McpTransportType,
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
 * Check if an input (argument, env var, header) has configurable variables (Pattern 2).
 * Pattern 2: { value: "Bearer {token}", variables: { token: {...} } }
 */
function hasConfigurableVariables(input: { variables?: Record<string, unknown> } | undefined): boolean {
  return !!(input && input.variables && Object.keys(input.variables).length > 0);
}

/**
 * Convert a VariableDefinition to a ConfigField for the UI (Pattern 2).
 * This represents a variable that will be substituted into a template.
 */
function variableToConfigField(variable: VariableDefinition): ConfigField {
  // Determine field type based on format and choices
  let fieldType: 'string' | 'boolean' | 'choices' = 'string';
  if (variable.choices && variable.choices.length > 0) {
    fieldType = 'choices';
  } else if (variable.format === 'boolean') {
    fieldType = 'boolean';
  }

  // Map context from variable to ConfigField context
  let context: 'env' | 'arg' | 'header' | 'query' = 'arg';
  if (variable.context === 'environmentVariables') {
    context = 'env';
  } else if (variable.context === 'headers') {
    context = 'header';
  } else if (variable.context === 'packageArguments' || variable.context === 'runtimeArguments') {
    context = 'arg';
  }

  return {
    name: variable.name,
    label: variable.name,
    description: variable.description,
    type: fieldType,
    context,
    required: variable.isRequired || false,
    secret: variable.isSecret || false,
    default: String(variable.default ?? (fieldType === 'boolean' ? 'false' : '')),
    choices: variable.choices?.map((c) => String(c)),
    value: String(variable.default ?? (fieldType === 'boolean' ? 'false' : '')),
    isVariable: true, // Pattern 2: This is a variable that will be substituted
    isConfigurable: true, // Variables are always configurable
  };
}

/**
 * Convert a direct input field to a ConfigField for the UI (Pattern 1).
 * This represents a field whose value is set directly without substitution.
 */
function directInputToConfigField(
  input: {
    name?: string;
    description?: string;
    format?: string;
    isRequired?: boolean;
    isSecret?: boolean;
    default?: string;
    value?: string;
    valueHint?: string;
    choices?: (string | number)[];
  },
  context: 'env' | 'arg' | 'header' | 'query',
  fallbackName?: string,
): ConfigField {
  // Determine field type
  let fieldType: 'string' | 'boolean' | 'choices' = 'string';
  if (input.choices && input.choices.length > 0) {
    fieldType = 'choices';
  } else if (input.format === 'boolean') {
    fieldType = 'boolean';
  }

  const name = input.name || input.valueHint || fallbackName || 'field';
  const defaultValue = fieldType === 'boolean' ? 'false' : '';

  return {
    name,
    label: name,
    description: input.description,
    type: fieldType,
    context,
    required: input.isRequired || false,
    secret: input.isSecret || false,
    default: String(input.default ?? defaultValue),
    choices: input.choices?.map((c) => String(c)),
    value: String(input.value ?? input.default ?? defaultValue),
    isVariable: false, // Pattern 1: This is a direct field (no substitution)
    isConfigurable: true, // Direct fields are configurable when extracted
  };
}

/**
 * Extract configurable fields from a config option.
 *
 * Uses unified condition: Extract fields if `isConfigurable === true` OR field has no value.
 * This works for both new server setup and editing existing servers:
 *
 * - **New setup**: Fields without values are extracted (isConfigurable not set yet)
 * - **Edit mode**: Fields marked `isConfigurable: true` are extracted (even if they have values)
 *
 * Supports TWO patterns:
 *
 * Pattern 1 (Direct Configuration):
 * ```typescript
 * environmentVariables: [{
 *   name: "BRAVE_API_KEY",
 *   description: "Your API key",
 *   isRequired: true,
 *   isSecret: true
 * }]
 * // Output: ConfigField { name: "BRAVE_API_KEY", isVariable: false, isConfigurable: true }
 * // User configures the field directly, value is set without substitution
 * ```
 *
 * Pattern 2 (Template Variables):
 * ```typescript
 * headers: [{
 *   name: "Authorization",
 *   value: "Bearer {github_pat}",
 *   variables: {
 *     github_pat: { description: "GitHub PAT", isRequired: true, isSecret: true }
 *   }
 * }]
 * // Output: ConfigField { name: "github_pat", isVariable: true, isConfigurable: true }
 * // User configures the variable, which gets substituted into "Bearer {github_pat}"
 * ```
 *
 * @param option - The config option to extract fields from
 * @returns Array of ConfigField objects
 */
export function extractFields(option: ConfigOption): ConfigField[] {
  const fields: ConfigField[] = [];

  if (option.type === 'package') {
    const pkg = option.config as Package;

    // Environment variables
    pkg.environmentVariables?.forEach((env) => {
      if (hasConfigurableVariables(env)) {
        // Pattern 2: Extract variables from "variables" property
        const isConfigurable = (env as AugmentedKeyValueInput).isConfigurable ?? undefined;

        // Pattern 2: Extract if not explicitly marked as non-configurable
        // (Undefined in new setup, true in edit mode, rarely/never false)
        if (isConfigurable === false) return;

        const variables = getAllVariablesFromConfig(option.config);
        variables
          .filter((v) => v.context === 'environmentVariables' && v.fieldName === env.name)
          .forEach((variable) => {
            const field = variableToConfigField(variable);
            field.isConfigurable = isConfigurable ?? true; // Default true for Pattern 2

            // Set current value from stored config if available
            if (env.value !== undefined) {
              field.value = String(env.value);
            }

            fields.push(field);
          });
      } else {
        // Pattern 1: Direct field
        const isConfigurable = (env as AugmentedKeyValueInput).isConfigurable;

        // Unified condition: Extract if marked configurable OR has no value
        if (isConfigurable !== true && env.value) {
          return; // Skip: has value AND not marked configurable
        }

        const field = directInputToConfigField({ ...env, choices: env.choices ?? undefined }, 'env');
        // Mark as configurable if extracted (either explicitly set or no value)
        field.isConfigurable = isConfigurable === true ? true : !env.value;

        // Set current value from stored config if available
        if (env.value !== undefined) {
          field.value = String(env.value);
        }

        fields.push(field);
      }
    });

    // Package arguments
    pkg.packageArguments?.forEach((arg, index) => {
      if (hasConfigurableVariables(arg)) {
        // Pattern 2: Extract variables from "variables" property
        const isConfigurable = (arg as AugmentedArgument).isConfigurable ?? undefined;

        // Pattern 2: Extract if not explicitly marked as non-configurable
        if (isConfigurable === false) return;

        const variables = getAllVariablesFromConfig(option.config);
        const argName = arg.name || arg.valueHint || `arg-${index}`;
        variables
          .filter((v) => v.context === 'packageArguments' && v.fieldName === argName)
          .forEach((variable) => {
            const field = variableToConfigField(variable);
            field.isConfigurable = isConfigurable ?? true; // Default true for Pattern 2

            // Set current value from stored config if available
            if (arg.value !== undefined) {
              field.value = String(arg.value);
            }

            fields.push(field);
          });
      } else {
        // Pattern 1: Direct field
        const isConfigurable = (arg as AugmentedArgument).isConfigurable;

        // Unified condition: Extract if marked configurable OR has no value
        if (isConfigurable !== true && arg.value) {
          return; // Skip: has value AND not marked configurable
        }

        const field = directInputToConfigField({ ...arg, choices: arg.choices ?? undefined }, 'arg', `arg-${index}`);
        // Mark as configurable if extracted (either explicitly set or no value)
        field.isConfigurable = isConfigurable === true ? true : !arg.value;

        // Set current value from stored config if available
        if (arg.value !== undefined) {
          field.value = String(arg.value);
        }

        fields.push(field);
      }
    });

    // Runtime arguments
    pkg.runtimeArguments?.forEach((arg, index) => {
      if (hasConfigurableVariables(arg)) {
        // Pattern 2: Extract variables from "variables" property
        const isConfigurable = (arg as AugmentedArgument).isConfigurable ?? undefined;

        // Pattern 2: Extract if not explicitly marked as non-configurable
        if (isConfigurable === false) return;

        const variables = getAllVariablesFromConfig(option.config);
        const argName = arg.name || arg.valueHint || `runtime-arg-${index}`;
        variables
          .filter((v) => v.context === 'runtimeArguments' && v.fieldName === argName)
          .forEach((variable) => {
            const field = variableToConfigField(variable);
            field.isConfigurable = isConfigurable ?? true; // Default true for Pattern 2

            // Set current value from stored config if available
            if (arg.value !== undefined) {
              field.value = String(arg.value);
            }

            fields.push(field);
          });
      } else {
        // Pattern 1: Direct field
        const isConfigurable = (arg as AugmentedArgument).isConfigurable;

        // Unified condition: Extract if marked configurable OR has no value
        if (isConfigurable !== true && arg.value) {
          return; // Skip: has value AND not marked configurable
        }

        const field = directInputToConfigField({ ...arg, choices: arg.choices ?? undefined }, 'arg', `runtime-arg-${index}`);
        // Mark as configurable if extracted (either explicitly set or no value)
        field.isConfigurable = isConfigurable === true ? true : !arg.value;

        // Set current value from stored config if available
        if (arg.value !== undefined) {
          field.value = String(arg.value);
        }

        fields.push(field);
      }
    });
  } else if (option.type === 'remote') {
    const remote = option.config as Transport;

    // Headers
    remote.headers?.forEach((header) => {
      if (hasConfigurableVariables(header)) {
        // Pattern 2: Extract variables from "variables" property
        const isConfigurable = (header as AugmentedKeyValueInput).isConfigurable ?? undefined;

        // Pattern 2: Extract if not explicitly marked as non-configurable
        if (isConfigurable === false) return;

        const variables = getAllVariablesFromConfig(option.config);
        variables
          .filter((v) => v.context === 'headers' && v.fieldName === header.name)
          .forEach((variable) => {
            const field = variableToConfigField(variable);
            field.isConfigurable = isConfigurable ?? true; // Default true for Pattern 2

            // Set current value from stored config if available
            if (header.value !== undefined) {
              field.value = String(header.value);
            }

            fields.push(field);
          });
      } else {
        // Pattern 1: Direct field
        const isConfigurable = (header as AugmentedKeyValueInput).isConfigurable;

        // Unified condition: Extract if marked configurable OR has no value
        if (isConfigurable !== true && header.value) {
          return; // Skip: has value AND not marked configurable
        }

        const field = directInputToConfigField({ ...header, choices: header.choices ?? undefined }, 'header');
        // Mark as configurable if extracted (either explicitly set or no value)
        field.isConfigurable = isConfigurable === true ? true : !header.value;

        // Set current value from stored config if available
        if (header.value !== undefined) {
          field.value = String(header.value);
        }

        fields.push(field);
      }
    });
  }

  return fields;
}


/**
 * Enrich configuration with user-provided values and perform variable substitution.
 *
 * Handles TWO patterns:
 *
 * Pattern 1 (Direct): Sets field values directly
 * ```typescript
 * // Input: { name: "BRAVE_API_KEY" }
 * // Field: { name: "BRAVE_API_KEY", value: "sk-123", isVariable: false }
 * // Output: { name: "BRAVE_API_KEY", value: "sk-123" }
 * ```
 *
 * Pattern 2 (Template): Substitutes variables into templates
 * ```typescript
 * // Input: { value: "Bearer {github_pat}", variables: {...} }
 * // Field: { name: "github_pat", value: "ghp_abc", isVariable: true }
 * // Output: { value: "Bearer ghp_abc", variables: {...} }
 * ```
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
  transport: McpTransportType;
  config: string; // JSON string containing Package or Transport config
} {
  const name = customName || server.title || server.name;
  const description = server.description || '';
  const repositoryUrl = server.repositoryUrl || '';
  const transport = option.transport;

  // Deep clone the config to avoid mutating the original
  const configObj = JSON.parse(JSON.stringify(option.config));

  // STEP 1: Set direct values for Pattern 1 fields (isVariable === false) and store isConfigurable flag
  if ('identifier' in configObj) {
    // Package config
    const pkg = configObj as Package;

    // Environment variables
    pkg.environmentVariables?.forEach((env) => {
      if (!hasConfigurableVariables(env)) {
        // Pattern 1: Find matching ConfigField and set value directly
        const field = fields.find((f) => f.context === 'env' && f.name === env.name && !f.isVariable);
        if (field) {
          env.value = field.value || field.default || '';
          (env as AugmentedKeyValueInput).isConfigurable = field.isConfigurable;
        }
      } else {
        // Pattern 2: Mark as configurable (variables are always configurable)
        (env as AugmentedKeyValueInput).isConfigurable = true;
      }
    });

    // Package arguments
    pkg.packageArguments?.forEach((arg) => {
      if (!hasConfigurableVariables(arg)) {
        // Pattern 1: Find matching ConfigField and set value directly
        const argName = arg.name || arg.valueHint || '';
        const field = fields.find((f) => f.context === 'arg' && f.name === argName && !f.isVariable);
        if (field) {
          arg.value = field.value || field.default || '';
          (arg as AugmentedArgument).isConfigurable = field.isConfigurable;
        }
      } else {
        // Pattern 2: Mark as configurable (variables are always configurable)
        (arg as AugmentedArgument).isConfigurable = true;
      }
    });

    // Runtime arguments
    pkg.runtimeArguments?.forEach((arg) => {
      if (!hasConfigurableVariables(arg)) {
        // Pattern 1: Find matching ConfigField and set value directly
        const argName = arg.name || arg.valueHint || '';
        const field = fields.find((f) => f.context === 'arg' && f.name === argName && !f.isVariable);
        if (field) {
          arg.value = field.value || field.default || '';
          (arg as AugmentedArgument).isConfigurable = field.isConfigurable;
        }
      } else {
        // Pattern 2: Mark as configurable (variables are always configurable)
        (arg as AugmentedArgument).isConfigurable = true;
      }
    });
  } else {
    // Transport config
    const transport = configObj as Transport;

    // Headers
    transport.headers?.forEach((header) => {
      if (!hasConfigurableVariables(header)) {
        // Pattern 1: Find matching ConfigField and set value directly
        const field = fields.find((f) => f.context === 'header' && f.name === header.name && !f.isVariable);
        if (field) {
          header.value = field.value || field.default || '';
          (header as AugmentedKeyValueInput).isConfigurable = field.isConfigurable;
        }
      } else {
        // Pattern 2: Mark as configurable (variables are always configurable)
        (header as AugmentedKeyValueInput).isConfigurable = true;
      }
    });
  }

  // STEP 2: Build variables map ONLY for Pattern 2 fields (isVariable === true)
  const variablesMap: Record<string, string> = {};
  fields.forEach((field) => {
    if (field.isVariable) {
      // Pattern 2: This is a variable that will be substituted
      variablesMap[field.name] = field.value || field.default || '';
    }
  });

  // STEP 3: Substitute variables in Pattern 2 templates
  const enrichedConfig = substituteAllVariables(configObj, variablesMap);

  return {
    name,
    description,
    repositoryUrl,
    transport,
    config: JSON.stringify(enrichedConfig),
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

