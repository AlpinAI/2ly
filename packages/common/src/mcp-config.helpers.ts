/**
 * MCP Configuration Helpers
 *
 * WHY: Shared utilities for parsing and transforming MCP Registry server configurations.
 * Used by frontend (for extracting config fields), runtime (for building transports),
 * and backend (for validation).
 *
 * FEATURES:
 * - Variable extraction from template strings with {placeholder} syntax
 * - Variable substitution in templates
 * - Config enrichment with variable replacement
 * - Support for Package (STDIO) and Transport (SSE/STREAM) configs
 *
 * ARCHITECTURE:
 * - Pure functions with no side effects
 * - Works with official MCP Registry schema types
 * - Handles missing/undefined variables gracefully
 */

import { mcpRegistry } from './types';

type Package = mcpRegistry.components['schemas']['Package'];
type Transport = mcpRegistry.components['schemas']['Transport'];
type Argument = mcpRegistry.components['schemas']['Argument'];
type KeyValueInput = mcpRegistry.components['schemas']['KeyValueInput'];

/**
 * Variable definition with metadata
 */
export interface VariableDefinition {
  /** Variable name (e.g., "api_token") */
  name: string;
  /** Human-readable description */
  description?: string;
  /** Default value */
  default?: string;
  /** Whether this variable is required */
  isRequired?: boolean;
  /** Whether this variable should be treated as a secret (password field) */
  isSecret?: boolean;
  /** Format hint (e.g., "boolean", "filepath") */
  format?: string;
  /** Valid choices for this variable (null is treated same as undefined) */
  choices?: string[] | null;
  /** Context where this variable is used (for debugging) */
  context?: 'packageArguments' | 'runtimeArguments' | 'environmentVariables' | 'headers' | 'queryParams';
  /** The field name this variable belongs to (for debugging) */
  fieldName?: string;
}

/**
 * Extract variable names from a template string.
 * Finds all {variable_name} patterns in a string.
 *
 * Example:
 * ```typescript
 * extractVariablesFromTemplate("Bearer {api_token}")
 * // Returns: ["api_token"]
 *
 * extractVariablesFromTemplate("type=bind,src={src_path},dst={dst_path}")
 * // Returns: ["src_path", "dst_path"]
 * ```
 *
 * @param template - String that may contain {variable} placeholders
 * @returns Array of unique variable names (without braces)
 */
export function extractVariablesFromTemplate(template: string): string[] {
  if (!template) return [];

  const regex = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
  const matches = [...template.matchAll(regex)];
  return [...new Set(matches.map((m) => m[1]))];
}

/**
 * Substitute variables in a template string.
 * Replaces {variable_name} with values from the variables map.
 * Leaves unmatched placeholders as-is.
 *
 * Example:
 * ```typescript
 * substituteVariables("Bearer {token}", { token: "abc123" })
 * // Returns: "Bearer abc123"
 *
 * substituteVariables("src={src},dst={dst}", { src: "/home", dst: "/app" })
 * // Returns: "src=/home,dst=/app"
 *
 * // Missing variable - left as-is
 * substituteVariables("Bearer {token}", {})
 * // Returns: "Bearer {token}"
 * ```
 *
 * @param template - String with {variable} placeholders
 * @param variables - Map of variable names to values
 * @returns String with variables substituted
 */
export function substituteVariables(template: string, variables: Record<string, string>): string {
  if (!template) return template;

  return template.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (match, varName) => {
    return variables[varName] !== undefined ? variables[varName] : match;
  });
}

/**
 * Extract variable definitions from an Input object's variables property.
 *
 * @param input - Input object with optional variables property
 * @returns Array of variable definitions
 */
function extractVariablesFromInput(
  input: Argument | KeyValueInput,
  context?: VariableDefinition['context'],
  fieldName?: string,
): VariableDefinition[] {
  if (!input.variables) return [];

  return Object.entries(input.variables).map(([varName, varDef]) => ({
    name: varName,
    description: varDef.description,
    default: varDef.default,
    isRequired: varDef.isRequired,
    isSecret: varDef.isSecret,
    format: varDef.format,
    choices: varDef.choices,
    context,
    fieldName,
  }));
}

/**
 * Extract all variable definitions from a Package config.
 * Scans packageArguments, runtimeArguments, and environmentVariables for variables.
 *
 * @param pkg - Package configuration
 * @returns Array of all variable definitions
 */
export function getAllVariablesFromPackage(pkg: Package): VariableDefinition[] {
  const variables: VariableDefinition[] = [];

  // Package arguments
  pkg.packageArguments?.forEach((arg) => {
    const argName = arg.name || arg.valueHint || 'arg';
    variables.push(...extractVariablesFromInput(arg, 'packageArguments', argName));
  });

  // Runtime arguments
  pkg.runtimeArguments?.forEach((arg) => {
    const argName = arg.name || arg.valueHint || 'runtime-arg';
    variables.push(...extractVariablesFromInput(arg, 'runtimeArguments', argName));
  });

  // Environment variables
  pkg.environmentVariables?.forEach((env) => {
    variables.push(...extractVariablesFromInput(env, 'environmentVariables', env.name));
  });

  return variables;
}

/**
 * Extract all variable definitions from a Transport config.
 * Scans headers and potentially queryParams for variables.
 *
 * @param transport - Transport configuration
 * @returns Array of all variable definitions
 */
export function getAllVariablesFromTransport(transport: Transport): VariableDefinition[] {
  const variables: VariableDefinition[] = [];

  // Headers
  transport.headers?.forEach((header) => {
    variables.push(...extractVariablesFromInput(header, 'headers', header.name));
  });

  return variables;
}

/**
 * Extract all variable definitions from a config (Package or Transport).
 *
 * @param config - Package or Transport configuration
 * @returns Array of all variable definitions
 */
export function getAllVariablesFromConfig(config: Package | Transport): VariableDefinition[] {
  if ('identifier' in config) {
    return getAllVariablesFromPackage(config);
  } else {
    return getAllVariablesFromTransport(config);
  }
}

/**
 * Substitute variables in an Argument.
 * Creates a new argument with variables replaced in the value field.
 *
 * @param arg - Argument to process
 * @param variables - Variable values map
 * @returns New argument with substituted value
 */
function substituteArgumentVariables(arg: Argument, variables: Record<string, string>): Argument {
  if (!arg.value) return arg;

  return {
    ...arg,
    value: substituteVariables(arg.value, variables),
  };
}

/**
 * Substitute variables in a KeyValueInput (env var or header).
 * Creates a new object with variables replaced in the value field.
 *
 * @param kv - KeyValueInput to process
 * @param variables - Variable values map
 * @returns New KeyValueInput with substituted value
 */
function substituteKeyValueVariables(kv: KeyValueInput, variables: Record<string, string>): KeyValueInput {
  if (!kv.value) return kv;

  return {
    ...kv,
    value: substituteVariables(kv.value, variables),
  };
}

/**
 * Substitute all variables in a Package config.
 * Creates a new Package with all {variable} placeholders replaced.
 * Processes packageArguments, runtimeArguments, and environmentVariables.
 *
 * Example:
 * ```typescript
 * const pkg = {
 *   identifier: "my-server",
 *   environmentVariables: [
 *     { name: "AUTH", value: "Bearer {token}", variables: { token: {...} } }
 *   ]
 * };
 * const result = substitutePackageVariables(pkg, { token: "abc123" });
 * // result.environmentVariables[0].value === "Bearer abc123"
 * ```
 *
 * @param pkg - Package configuration
 * @param variables - Variable values map
 * @returns New Package with substituted values
 */
export function substitutePackageVariables(pkg: Package, variables: Record<string, string>): Package {
  return {
    ...pkg,
    packageArguments: pkg.packageArguments?.map((arg) => substituteArgumentVariables(arg, variables)),
    runtimeArguments: pkg.runtimeArguments?.map((arg) => substituteArgumentVariables(arg, variables)),
    environmentVariables: pkg.environmentVariables?.map((env) => substituteKeyValueVariables(env, variables)),
  };
}

/**
 * Substitute all variables in a Transport config.
 * Creates a new Transport with all {variable} placeholders replaced.
 * Processes headers.
 *
 * Example:
 * ```typescript
 * const transport = {
 *   type: "sse",
 *   url: "https://api.example.com",
 *   headers: [
 *     { name: "Authorization", value: "Bearer {api_key}", variables: { api_key: {...} } }
 *   ]
 * };
 * const result = substituteTransportVariables(transport, { api_key: "secret123" });
 * // result.headers[0].value === "Bearer secret123"
 * ```
 *
 * @param transport - Transport configuration
 * @param variables - Variable values map
 * @returns New Transport with substituted values
 */
export function substituteTransportVariables(transport: Transport, variables: Record<string, string>): Transport {
  return {
    ...transport,
    headers: transport.headers?.map((header) => substituteKeyValueVariables(header, variables)),
  };
}

/**
 * Substitute all variables in a config (Package or Transport).
 * Creates a new config with all {variable} placeholders replaced.
 *
 * @param config - Package or Transport configuration
 * @param variables - Variable values map
 * @returns New config with substituted values
 */
export function substituteAllVariables(config: Package | Transport, variables: Record<string, string>): Package | Transport {
  if ('identifier' in config) {
    return substitutePackageVariables(config, variables);
  } else {
    return substituteTransportVariables(config, variables);
  }
}

/**
 * Check if a string contains any unsubstituted variable placeholders.
 *
 * @param text - String to check
 * @returns true if string contains {variable} patterns
 */
export function hasUnsubstitutedVariables(text: string): boolean {
  if (!text) return false;
  return /\{[a-zA-Z_][a-zA-Z0-9_]*\}/.test(text);
}

/**
 * Find all unsubstituted variables in a config.
 * Useful for debugging and validation.
 *
 * @param config - Package or Transport configuration
 * @returns Array of variable names that have not been substituted
 */
export function findUnsubstitutedVariables(config: Package | Transport): string[] {
  const unsubstituted: Set<string> = new Set();

  const checkValue = (value?: string) => {
    if (value && hasUnsubstitutedVariables(value)) {
      extractVariablesFromTemplate(value).forEach((v) => unsubstituted.add(v));
    }
  };

  if ('identifier' in config) {
    // Package
    config.packageArguments?.forEach((arg) => checkValue(arg.value));
    config.runtimeArguments?.forEach((arg) => checkValue(arg.value));
    config.environmentVariables?.forEach((env) => checkValue(env.value));
  } else {
    // Transport
    config.headers?.forEach((header) => checkValue(header.value));
  }

  return Array.from(unsubstituted);
}
