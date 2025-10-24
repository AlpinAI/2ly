/**
 * MCP Registry Zod Schemas
 *
 * WHY: Provide runtime validation for MCP Registry server configurations
 * based on the official OpenAPI schema from registry.modelcontextprotocol.io
 *
 * SCHEMAS:
 * - Package: STDIO-based MCP server configuration
 * - Transport: Remote (SSE/HTTP) MCP server configuration
 * - Supporting types: Input, KeyValueInput, Argument
 *
 * These schemas match the types defined in @2ly/common/types/mcp-registry
 * and provide detailed validation errors for user input.
 */

import { z } from 'zod';

/**
 * Input schema - basic configuration value
 */
export const InputSchema = z.object({
  choices: z.array(z.string()).nullish(),
  default: z.string().optional(),
  description: z.string().optional(),
  format: z.string().optional(),
  isRequired: z.boolean().optional(),
  isSecret: z.boolean().optional(),
  value: z.string().optional(),
});

export type Input = z.infer<typeof InputSchema>;

/**
 * KeyValueInput schema - named configuration value (for env vars, headers)
 */
export const KeyValueInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  choices: z.array(z.string()).nullish(),
  default: z.string().optional(),
  description: z.string().optional(),
  format: z.string().optional(),
  isRequired: z.boolean().optional(),
  isSecret: z.boolean().optional(),
  value: z.string().optional(),
  variables: z.record(z.string(), InputSchema).optional(),
});

export type KeyValueInput = z.infer<typeof KeyValueInputSchema>;

/**
 * Argument schema - command-line argument or runtime argument
 */
export const ArgumentSchema = z.object({
  type: z.string().min(1, 'Argument type is required'),
  name: z.string().optional(),
  choices: z.array(z.string()).nullish(),
  default: z.string().optional(),
  description: z.string().optional(),
  format: z.string().optional(),
  isRepeated: z.boolean().optional(),
  isRequired: z.boolean().optional(),
  isSecret: z.boolean().optional(),
  value: z.string().optional(),
  valueHint: z.string().optional(),
  variables: z.record(z.string(), InputSchema).optional(),
});

export type Argument = z.infer<typeof ArgumentSchema>;

/**
 * Transport schema - for remote (SSE/HTTP) connections
 */
export const TransportSchema = z.object({
  type: z.string().min(1, 'Transport type is required'),
  url: z.string().optional(),
  headers: z.array(KeyValueInputSchema).nullish(),
});

export type Transport = z.infer<typeof TransportSchema>;

/**
 * Package schema - for STDIO-based local packages
 */
export const PackageSchema = z.object({
  identifier: z.string().min(1, 'Package identifier is required'),
  version: z.string().min(1, 'Package version is required'),
  registryType: z.string().min(1, 'Registry type is required (e.g., "npm", "pypi")'),
  transport: TransportSchema.optional(),
  environmentVariables: z.array(KeyValueInputSchema).nullish(),
  fileSha256: z.string().optional(),
  packageArguments: z.array(ArgumentSchema).nullish(),
  registryBaseUrl: z.string().optional(),
  runtimeArguments: z.array(ArgumentSchema).nullish(),
  runtimeHint: z.string().optional(),
});

export type Package = z.infer<typeof PackageSchema>;

/**
 * Validate an array of packages
 */
export const PackagesArraySchema = z.array(PackageSchema).min(1, 'At least one package is required');

/**
 * Validate an array of remotes (transports)
 */
export const RemotesArraySchema = z.array(TransportSchema).min(1, 'At least one remote is required');

/**
 * Format Zod errors into human-readable messages
 */
export function formatZodError(error: z.ZodError): string {
  const firstIssue = error.issues[0];
  if (!firstIssue) return 'Validation failed';

  const path = firstIssue.path.join('.');
  const message = firstIssue.message;

  if (path) {
    return `${path}: ${message}`;
  }
  return message;
}

/**
 * Validate packages JSON and return detailed result
 */
export function validatePackages(jsonString: string): {
  success: boolean;
  data?: Package[];
  error?: string;
  formatted?: string;
} {
  try {
    const parsed = JSON.parse(jsonString);
    const result = PackagesArraySchema.safeParse(parsed);

    if (result.success) {
      return {
        success: true,
        data: result.data,
        formatted: JSON.stringify(result.data, null, 2),
      };
    } else {
      return {
        success: false,
        error: formatZodError(result.error),
      };
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: `JSON Syntax Error: ${error.message}`,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validate remotes JSON and return detailed result
 */
export function validateRemotes(jsonString: string): {
  success: boolean;
  data?: Transport[];
  error?: string;
  formatted?: string;
} {
  try {
    const parsed = JSON.parse(jsonString);
    const result = RemotesArraySchema.safeParse(parsed);

    if (result.success) {
      return {
        success: true,
        data: result.data,
        formatted: JSON.stringify(result.data, null, 2),
      };
    } else {
      return {
        success: false,
        error: formatZodError(result.error),
      };
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: `JSON Syntax Error: ${error.message}`,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
