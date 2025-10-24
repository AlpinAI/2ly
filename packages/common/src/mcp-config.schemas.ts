/**
 * Zod Validation Schemas for MCP Registry Types
 *
 * WHY: Provide runtime validation for JSON config data to ensure type safety
 * and catch errors early. These schemas match the official MCP Registry schema types.
 *
 * USAGE:
 * ```typescript
 * import { parsePackage, parseTransport } from './mcp-config.schemas';
 *
 * try {
 *   const config = parsePackage(jsonData);
 *   // config is now validated and type-safe
 * } catch (error) {
 *   // Handle validation error
 * }
 * ```
 */

import { z } from 'zod';

/**
 * Input schema - variable definition for template substitution
 */
const InputSchema = z.object({
  choices: z.array(z.string()).nullable().optional(),
  default: z.string().optional(),
  description: z.string().optional(),
  format: z.string().optional(),
  isRequired: z.boolean().optional(),
  isSecret: z.boolean().optional(),
  value: z.string().optional(),
});

/**
 * Argument schema - command-line argument or parameter
 */
const ArgumentSchema = z.object({
  choices: z.array(z.string()).nullable().optional(),
  default: z.string().optional(),
  description: z.string().optional(),
  format: z.string().optional(),
  isRepeated: z.boolean().optional(),
  isRequired: z.boolean().optional(),
  isSecret: z.boolean().optional(),
  name: z.string().optional(),
  type: z.string(),
  value: z.string().optional(),
  valueHint: z.string().optional(),
  variables: z.record(z.string(), InputSchema).optional(),
});

/**
 * KeyValueInput schema - environment variable or HTTP header
 */
const KeyValueInputSchema = z.object({
  choices: z.array(z.string()).nullable().optional(),
  default: z.string().optional(),
  description: z.string().optional(),
  format: z.string().optional(),
  isRequired: z.boolean().optional(),
  isSecret: z.boolean().optional(),
  name: z.string(),
  value: z.string().optional(),
  variables: z.record(z.string(), InputSchema).optional(),
});

/**
 * Transport schema (nested within Package)
 */
const TransportSchemaInner = z.object({
  type: z.string(),
});

/**
 * Package schema - STDIO package configuration
 */
export const PackageSchema = z.object({
  environmentVariables: z.array(KeyValueInputSchema).nullable().optional(),
  fileSha256: z.string().optional(),
  identifier: z.string(),
  packageArguments: z.array(ArgumentSchema).nullable().optional(),
  registryBaseUrl: z.string().optional(),
  registryType: z.string(),
  runtimeArguments: z.array(ArgumentSchema).nullable().optional(),
  runtimeHint: z.string().optional(),
  transport: TransportSchemaInner.optional(),
  version: z.string(),
});

/**
 * Transport schema - SSE or STREAM remote transport configuration
 */
export const TransportSchema = z.object({
  headers: z.array(KeyValueInputSchema).nullable().optional(),
  type: z.string(),
  url: z.string().optional(),
});

/**
 * Union schema for Package or Transport config
 */
export const ConfigSchema = z.union([PackageSchema, TransportSchema]);

/**
 * Parse and validate a Package configuration
 *
 * @param data - Unknown data to validate
 * @returns Validated Package object
 * @throws ZodError if validation fails
 */
export function parsePackage(data: unknown) {
  return PackageSchema.parse(data);
}

/**
 * Parse and validate a Transport configuration
 *
 * @param data - Unknown data to validate
 * @returns Validated Transport object
 * @throws ZodError if validation fails
 */
export function parseTransport(data: unknown) {
  return TransportSchema.parse(data);
}

/**
 * Parse and validate a config (Package or Transport)
 *
 * @param data - Unknown data to validate
 * @returns Validated Package or Transport object
 * @throws ZodError if validation fails
 */
export function parseConfig(data: unknown) {
  return ConfigSchema.parse(data);
}

/**
 * Safe parse that returns a result object instead of throwing
 *
 * @param data - Unknown data to validate
 * @returns Result object with success flag and data or error
 */
export function safeParsePackage(data: unknown) {
  return PackageSchema.safeParse(data);
}

/**
 * Safe parse for Transport
 *
 * @param data - Unknown data to validate
 * @returns Result object with success flag and data or error
 */
export function safeParseTransport(data: unknown) {
  return TransportSchema.safeParse(data);
}

/**
 * Safe parse for Package or Transport
 *
 * @param data - Unknown data to validate
 * @returns Result object with success flag and data or error
 */
export function safeParseConfig(data: unknown) {
  return ConfigSchema.safeParse(data);
}

/**
 * Type exports for validated data
 */
export type ValidatedPackage = z.infer<typeof PackageSchema>;
export type ValidatedTransport = z.infer<typeof TransportSchema>;
export type ValidatedConfig = z.infer<typeof ConfigSchema>;
