/**
 * Unit tests for MCP Configuration Helpers
 *
 * Tests specifically focus on extractFieldsFromStoredConfig which is used
 * to extract editable fields from stored MCP server configurations.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  mcpRegistry,
} from '@2ly/common';

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

// Mock @2ly/common to avoid decorator issues in tests
/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock('@2ly/common', () => ({
  mcpRegistry: {} as any,
  getAllVariablesFromConfig: (config: any) => {
    const variables: any[] = [];

    // Extract variables from environmentVariables
    if ('environmentVariables' in config) {
      config.environmentVariables?.forEach((env: any) => {
        if (env.variables) {
          Object.entries(env.variables).forEach(([name, def]: [string, any]) => {
            variables.push({
              name,
              fieldName: env.name,
              context: 'environmentVariables',
              description: def.description,
              isRequired: def.isRequired,
              isSecret: def.isSecret,
              default: def.default,
              format: def.format,
              choices: def.choices,
            });
          });
        }
      });
    }

    // Extract variables from packageArguments
    if ('packageArguments' in config) {
      config.packageArguments?.forEach((arg: any, index: number) => {
        if (arg.variables) {
          const argName = arg.name || arg.valueHint || `arg-${index}`;
          Object.entries(arg.variables).forEach(([name, def]: [string, any]) => {
            variables.push({
              name,
              fieldName: argName,
              context: 'packageArguments',
              description: def.description,
              isRequired: def.isRequired,
              isSecret: def.isSecret,
              default: def.default,
              format: def.format,
              choices: def.choices,
            });
          });
        }
      });
    }

    // Extract variables from runtimeArguments
    if ('runtimeArguments' in config) {
      config.runtimeArguments?.forEach((arg: any, index: number) => {
        if (arg.variables) {
          const argName = arg.name || arg.valueHint || `runtime-arg-${index}`;
          Object.entries(arg.variables).forEach(([name, def]: [string, any]) => {
            variables.push({
              name,
              fieldName: argName,
              context: 'runtimeArguments',
              description: def.description,
              isRequired: def.isRequired,
              isSecret: def.isSecret,
              default: def.default,
              format: def.format,
              choices: def.choices,
            });
          });
        }
      });
    }

    // Extract variables from headers
    if ('headers' in config) {
      config.headers?.forEach((header: any) => {
        if (header.variables) {
          Object.entries(header.variables).forEach(([name, def]: [string, any]) => {
            variables.push({
              name,
              fieldName: header.name,
              context: 'headers',
              description: def.description,
              isRequired: def.isRequired,
              isSecret: def.isSecret,
              default: def.default,
              format: def.format,
              choices: def.choices,
            });
          });
        }
      });
    }

    return variables;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  substituteAllVariables: (config: any, _variables: Record<string, string>) => {
    return config; // Simplified for tests
  },
}));
/* eslint-enable @typescript-eslint/no-explicit-any */

import { extractFields, type ConfigOption } from './mcpConfigHelpers';
import { McpTransportType } from '@/graphql/generated/graphql';

describe('extractFields', () => {
  describe('Pattern 1: Direct Configuration (Package)', () => {
    it('should extract environment variable with direct value when isConfigurable is true', () => {
      const configOption: ConfigOption = {
        id: 'test-pkg',
        label: 'Test Package',
        type: 'package',
        transport: McpTransportType.Stdio,
        config: {
          identifier: '@test/package',
          version: '1.0.0',
          registryType: 'npm',
          transport: { type: 'stdio' },
          environmentVariables: [
            {
              name: 'BRAVE_API_KEY',
              description: 'Your Brave Search API key',
              value: 'sk-test-12345',
              isRequired: true,
              isSecret: true,
              isConfigurable: true,
            },
          ] as AugmentedKeyValueInput[],
        } as Package,
        isSupported: true,
      };

      const fields = extractFields(configOption);

      expect(fields).toHaveLength(1);
      expect(fields[0]).toMatchObject({
        name: 'BRAVE_API_KEY',
        label: 'BRAVE_API_KEY',
        description: 'Your Brave Search API key',
        type: 'string',
        context: 'env',
        required: true,
        secret: true,
        value: 'sk-test-12345',
        isVariable: false,
      });
    });

    it('should extract package argument with direct value', () => {
      const configOption: ConfigOption = {
        id: 'test-pkg',
        label: 'Test Package',
        type: 'package',
        transport: McpTransportType.Stdio,
        config: {
          identifier: '@test/package',
          version: '1.0.0',
          registryType: 'npm',
          transport: { type: 'stdio' },
          packageArguments: [
            {
              name: 'config-path',
              description: 'Path to config file',
              value: '/path/to/config.json',
              isConfigurable: true,
              isRequired: false,
            },
          ] as AugmentedArgument[],
        } as Package,
        isSupported: true,
      };

      const fields = extractFields(configOption);

      expect(fields).toHaveLength(1);
      expect(fields[0]).toMatchObject({
        name: 'config-path',
        label: 'config-path',
        description: 'Path to config file',
        type: 'string',
        context: 'arg',
        required: false,
        value: '/path/to/config.json',
      isConfigurable: true,
        isVariable: false,
      });
    });

    it('should extract runtime argument with direct value', () => {
      const configOption: ConfigOption = {
        id: 'test-pkg',
        label: 'Test Package',
        type: 'package',
        transport: McpTransportType.Stdio,
        config: {
          identifier: '@test/package',
          version: '1.0.0',
          registryType: 'npm',
          transport: { type: 'stdio' },
          runtimeArguments: [
            {
              name: 'port',
              description: 'Server port',
              value: '3000',
              isConfigurable: true,
              isRequired: true,
            },
          ] as AugmentedArgument[],
        } as Package,
        isSupported: true,
      };

      const fields = extractFields(configOption);

      expect(fields).toHaveLength(1);
      expect(fields[0]).toMatchObject({
        name: 'port',
        label: 'port',
        description: 'Server port',
        type: 'string',
        context: 'arg',
        required: true,
        value: '3000',
              isConfigurable: true,
        isVariable: false,
      });
    });

    it('should extract boolean field with value', () => {
      const configOption: ConfigOption = {
        id: 'test-pkg',
        label: 'Test Package',
        type: 'package',
        transport: McpTransportType.Stdio,
        config: {
          identifier: '@test/package',
          version: '1.0.0',
          registryType: 'npm',
          transport: { type: 'stdio' },
          environmentVariables: [
            {
              name: 'DEBUG',
              description: 'Enable debug mode',
              format: 'boolean',
              value: 'true',
              isConfigurable: true,
              isRequired: false,
            },
          ] as AugmentedKeyValueInput[],
        } as Package,
        isSupported: true,
      };

      const fields = extractFields(configOption);

      expect(fields).toHaveLength(1);
      expect(fields[0]).toMatchObject({
        name: 'DEBUG',
        type: 'boolean',
        value: 'true',
              isConfigurable: true,
        isVariable: false,
      });
    });

    it('should extract choices field with value', () => {
      const configOption: ConfigOption = {
        id: 'test-pkg',
        label: 'Test Package',
        type: 'package',
        transport: McpTransportType.Stdio,
        config: {
          identifier: '@test/package',
          version: '1.0.0',
          registryType: 'npm',
          transport: { type: 'stdio' },
          environmentVariables: [
            {
              name: 'LOG_LEVEL',
              description: 'Logging level',
              choices: ['debug', 'info', 'warn', 'error'],
              value: 'info',
              isConfigurable: true,
              isRequired: true,
            },
          ] as AugmentedKeyValueInput[],
        } as Package,
        isSupported: true,
      };

      const fields = extractFields(configOption);

      expect(fields).toHaveLength(1);
      expect(fields[0]).toMatchObject({
        name: 'LOG_LEVEL',
        type: 'choices',
        choices: ['debug', 'info', 'warn', 'error'],
        value: 'info',
        isConfigurable: true,
        isVariable: false,
      });
    });
  });

  describe('Pattern 2: Template Variables (Package)', () => {
    it('should extract variable from template environment variable', () => {
      const configOption: ConfigOption = {
        id: 'test-pkg',
        label: 'Test Package',
        type: 'package',
        transport: McpTransportType.Stdio,
        config: {
          identifier: '@test/package',
          version: '1.0.0',
          registryType: 'npm',
          transport: { type: 'stdio' },
          environmentVariables: [
            {
              name: 'AUTH_TOKEN',
              value: 'Bearer ghp_test12345',
              isConfigurable: true,
              variables: {
                github_pat: {
                  description: 'GitHub Personal Access Token',
                  isRequired: true,
                  isSecret: true,
                },
              },
            },
          ] as AugmentedKeyValueInput[],
        } as Package,
        isSupported: true,
      };

      const fields = extractFields(configOption);

      expect(fields).toHaveLength(1);
      expect(fields[0]).toMatchObject({
        name: 'github_pat',
        label: 'github_pat',
        description: 'GitHub Personal Access Token',
        type: 'string',
        context: 'env',
        required: true,
        secret: true,
        isVariable: true,
      });
    });

    it('should extract variable from template package argument', () => {
      const configOption: ConfigOption = {
        id: 'test-pkg',
        label: 'Test Package',
        type: 'package',
        transport: McpTransportType.Stdio,
        config: {
          identifier: '@test/package',
          version: '1.0.0',
          registryType: 'npm',
          transport: { type: 'stdio' },
          packageArguments: [
            {
              name: 'url',
              value: 'https://api.example.com/v1',
              isConfigurable: true,
              type: 'named',
              variables: {
                api_version: {
                  description: 'API version',
                  isRequired: false,
                  default: 'v1',
                },
              },
            },
          ] as AugmentedArgument[],
        } as Package,
        isSupported: true,
      };

      const fields = extractFields(configOption);

      expect(fields).toHaveLength(1);
      expect(fields[0]).toMatchObject({
        name: 'api_version',
        label: 'api_version',
        description: 'API version',
        type: 'string',
        context: 'arg',
        required: false,
        isVariable: true,
      });
    });
  });

  describe('Pattern 1: Direct Configuration (Remote)', () => {
    it('should extract header with direct value', () => {
      const configOption: ConfigOption = {
        id: 'test-remote',
        label: 'Test Remote',
        type: 'remote',
        transport: McpTransportType.Sse,
        config: {
          type: 'sse',
          registryType: 'remote',
          url: 'https://example.com/mcp',
          headers: [
            {
              name: 'X-API-Key',
              description: 'API Key for authentication',
              value: 'sk-test-67890',
              isConfigurable: true,
              isRequired: true,
              isSecret: true,
            },
          ] as AugmentedKeyValueInput[],
        } as Transport,
        isSupported: true,
      };

      const fields = extractFields(configOption);

      expect(fields).toHaveLength(1);
      expect(fields[0]).toMatchObject({
        name: 'X-API-Key',
        label: 'X-API-Key',
        description: 'API Key for authentication',
        type: 'string',
        context: 'header',
        required: true,
        secret: true,
        value: 'sk-test-67890',
              isConfigurable: true,
        isVariable: false,
      });
    });
  });

  describe('Pattern 2: Template Variables (Remote)', () => {
    it('should extract variable from template header', () => {
      const configOption: ConfigOption = {
        id: 'test-remote',
        label: 'Test Remote',
        type: 'remote',
        transport: McpTransportType.Sse,
        config: {
          type: 'sse',
          registryType: 'remote',
          url: 'https://example.com/mcp',
          headers: [
            {
              name: 'Authorization',
              value: 'Bearer token_abc123',
              isConfigurable: true,
              variables: {
                bearer_token: {
                  description: 'Bearer token for auth',
                  isRequired: true,
                  isSecret: true,
                },
              },
            },
          ] as AugmentedKeyValueInput[],
        } as Transport,
        isSupported: true,
      };

      const fields = extractFields(configOption);

      expect(fields).toHaveLength(1);
      expect(fields[0]).toMatchObject({
        name: 'bearer_token',
        label: 'bearer_token',
        description: 'Bearer token for auth',
        type: 'string',
        context: 'header',
        required: true,
        secret: true,
        isVariable: true,
      });
    });
  });

  describe('Multiple fields', () => {
    it('should extract multiple environment variables', () => {
      const configOption: ConfigOption = {
        id: 'test-pkg',
        label: 'Test Package',
        type: 'package',
        transport: McpTransportType.Stdio,
        config: {
          identifier: '@test/package',
          version: '1.0.0',
          registryType: 'npm',
          transport: { type: 'stdio' },
          environmentVariables: [
            {
              name: 'API_KEY',
              value: 'key-123',
              isConfigurable: true,
              isRequired: true,
              isSecret: true,
            },
            {
              name: 'API_URL',
              value: 'https://api.example.com',
              isConfigurable: true,
              isRequired: true,
            },
            {
              name: 'DEBUG',
              format: 'boolean',
              value: 'false',
              isConfigurable: true,
            },
          ] as AugmentedKeyValueInput[],
        } as Package,
        isSupported: true,
      };

      const fields = extractFields(configOption);

      expect(fields).toHaveLength(3);
      expect(fields[0].name).toBe('API_KEY');
      expect(fields[1].name).toBe('API_URL');
      expect(fields[2].name).toBe('DEBUG');
    });

    it('should extract mix of direct fields and template variables', () => {
      const configOption: ConfigOption = {
        id: 'test-pkg',
        label: 'Test Package',
        type: 'package',
        transport: McpTransportType.Stdio,
        config: {
          identifier: '@test/package',
          version: '1.0.0',
          registryType: 'npm',
          transport: { type: 'stdio' },
          environmentVariables: [
            {
              name: 'API_KEY',
              value: 'direct-key-123',
              isConfigurable: true,
              isRequired: true,
              isSecret: true,
            },
            {
              name: 'AUTH_HEADER',
              value: 'Bearer token_xyz',
              isConfigurable: true,
              variables: {
                token: {
                  description: 'Auth token',
                  isRequired: true,
                  isSecret: true,
                },
              },
            },
          ] as AugmentedKeyValueInput[],
        } as Package,
        isSupported: true,
      };

      const fields = extractFields(configOption);

      expect(fields).toHaveLength(2);
      expect(fields[0]).toMatchObject({
        name: 'API_KEY',
        value: 'direct-key-123',
              isConfigurable: true,
        isVariable: false,
      });
      expect(fields[1]).toMatchObject({
        name: 'token',
        isVariable: true,
      });
    });
  });

  describe('Edge cases', () => {
    it('should return empty array for config with no configurable fields', () => {
      const configOption: ConfigOption = {
        id: 'test-pkg',
        label: 'Test Package',
        type: 'package',
        transport: McpTransportType.Stdio,
        config: {
          identifier: '@test/package',
          version: '1.0.0',
          registryType: 'npm',
          transport: { type: 'stdio' },
        } as Package,
        isSupported: true,
      };

      const fields = extractFields(configOption);

      expect(fields).toHaveLength(0);
    });

    it('should handle empty arrays', () => {
      const configOption: ConfigOption = {
        id: 'test-pkg',
        label: 'Test Package',
        type: 'package',
        transport: McpTransportType.Stdio,
        config: {
          identifier: '@test/package',
          version: '1.0.0',
          registryType: 'npm',
          transport: { type: 'stdio' },
          environmentVariables: [],
          packageArguments: [],
          runtimeArguments: [],
        } as Package,
        isSupported: true,
      };

      const fields = extractFields(configOption);

      expect(fields).toHaveLength(0);
    });

    it('should handle numeric values', () => {
      const configOption: ConfigOption = {
        id: 'test-pkg',
        label: 'Test Package',
        type: 'package',
        transport: McpTransportType.Stdio,
        config: {
          identifier: '@test/package',
          version: '1.0.0',
          registryType: 'npm',
          transport: { type: 'stdio' },
          environmentVariables: [
            {
              name: 'PORT',
              value: '3000',
              isConfigurable: true,
              isRequired: true,
            },
          ] as AugmentedArgument[],
        } as Package,
        isSupported: true,
      };

      const fields = extractFields(configOption);

      expect(fields).toHaveLength(1);
      expect(fields[0].value).toBe('3000');
    });

    it('should handle undefined values gracefully', () => {
      const configOption: ConfigOption = {
        id: 'test-pkg',
        label: 'Test Package',
        type: 'package',
        transport: McpTransportType.Stdio,
        config: {
          identifier: '@test/package',
          version: '1.0.0',
          registryType: 'npm',
          transport: { type: 'stdio' },
          environmentVariables: [
            {
              name: 'OPTIONAL_KEY',
              value: undefined,
              isConfigurable: true,
            },
          ] as AugmentedKeyValueInput[],
        } as Package,
        isSupported: true,
      };

      const fields = extractFields(configOption);

      expect(fields).toHaveLength(1);
      // Should use default value when value is undefined
      expect(fields[0].value).toBe('');
    });
  });

  describe('isConfigurable flag behavior', () => {
    it('should filter out fields with isConfigurable: false in edit mode', () => {
      const configOption: ConfigOption = {
        id: 'test-pkg',
        label: 'Test Package',
        type: 'package',
        transport: McpTransportType.Stdio,
        config: {
          identifier: '@test/package',
          version: '1.0.0',
          registryType: 'npm',
          transport: { type: 'stdio' },
          environmentVariables: [
            {
              name: 'API_KEY',
              value: 'key-123',
              isConfigurable: true,
            },
            {
              name: 'FIXED_VALUE',
              value: 'not-editable',
              isConfigurable: false,
            },
          ] as AugmentedKeyValueInput[],
        } as Package,
        isSupported: true,
      };

      const fields = extractFields(configOption);

      // Only the field with isConfigurable: true should be extracted
      expect(fields).toHaveLength(1);
      expect(fields[0].name).toBe('API_KEY');
      expect(fields[0].isConfigurable).toBe(true);
    });

    it('should default to false for backward compatibility (missing isConfigurable)', () => {
      const configOption: ConfigOption = {
        id: 'test-pkg',
        label: 'Test Package',
        type: 'package',
        transport: McpTransportType.Stdio,
        config: {
          identifier: '@test/package',
          version: '1.0.0',
          registryType: 'npm',
          transport: { type: 'stdio' },
          environmentVariables: [
            {
              name: 'OLD_FIELD',
              value: 'some-value',
              // No isConfigurable property (old config)
            },
          ] as KeyValueInput[],
        } as Package,
        isSupported: true,
      };

      const fields = extractFields(configOption);

      // Should skip field when isConfigurable is missing (defaults to false)
      expect(fields).toHaveLength(0);
    });

    it('should extract all fields with isConfigurable: true in edit mode', () => {
      const configOption: ConfigOption = {
        id: 'test-pkg',
        label: 'Test Package',
        type: 'package',
        transport: McpTransportType.Stdio,
        config: {
          identifier: '@test/package',
          version: '1.0.0',
          registryType: 'npm',
          transport: { type: 'stdio' },
          environmentVariables: [
            {
              name: 'API_KEY',
              value: 'key-123',
              isConfigurable: true,
            },
            {
              name: 'API_URL',
              value: 'https://api.example.com',
              isConfigurable: true,
            },
          ] as AugmentedKeyValueInput[],
          packageArguments: [
            {
              name: 'port',
              value: '3000',
              isConfigurable: true,
            },
          ] as AugmentedArgument[],
        } as Package,
        isSupported: true,
      };

      const fields = extractFields(configOption);

      expect(fields).toHaveLength(3);
      expect(fields[0].name).toBe('API_KEY');
      expect(fields[1].name).toBe('API_URL');
      expect(fields[2].name).toBe('port');
      expect(fields.every(f => f.isConfigurable)).toBe(true);
    });

    it('should handle template variables with isConfigurable flag in edit mode', () => {
      const configOption: ConfigOption = {
        id: 'test-pkg',
        label: 'Test Package',
        type: 'package',
        transport: McpTransportType.Stdio,
        config: {
          identifier: '@test/package',
          version: '1.0.0',
          registryType: 'npm',
          transport: { type: 'stdio' },
          environmentVariables: [
            {
              name: 'AUTH_TOKEN',
              value: 'Bearer ghp_test12345',
              isConfigurable: true,
              variables: {
                github_pat: {
                  description: 'GitHub PAT',
                  isRequired: true,
                  isSecret: true,
                },
              },
            },
          ] as AugmentedKeyValueInput[],
        } as Package,
        isSupported: true,
      };

      const fields = extractFields(configOption);

      expect(fields).toHaveLength(1);
      expect(fields[0].name).toBe('github_pat');
      expect(fields[0].isVariable).toBe(true);
      expect(fields[0].isConfigurable).toBe(true);
    });

    it('should skip template variables with isConfigurable: false in edit mode', () => {
      const configOption: ConfigOption = {
        id: 'test-pkg',
        label: 'Test Package',
        type: 'package',
        transport: McpTransportType.Stdio,
        config: {
          identifier: '@test/package',
          version: '1.0.0',
          registryType: 'npm',
          transport: { type: 'stdio' },
          environmentVariables: [
            {
              name: 'AUTH_TOKEN',
              value: 'Bearer fixed_token',
              isConfigurable: false,
              variables: {
                github_pat: {
                  description: 'GitHub PAT',
                  isRequired: true,
                  isSecret: true,
                },
              },
            },
          ] as AugmentedKeyValueInput[],
        } as Package,
        isSupported: true,
      };

      const fields = extractFields(configOption);

      // Should skip because isConfigurable: false
      expect(fields).toHaveLength(0);
    });
  });

  describe('Unified extraction logic (no mode parameter)', () => {
    it('should extract fields without values (new server setup)', () => {
      const configOption: ConfigOption = {
        id: 'test-pkg',
        label: 'Test Package',
        type: 'package',
        transport: McpTransportType.Stdio,
        config: {
          identifier: '@test/package',
          version: '1.0.0',
          registryType: 'npm',
          transport: { type: 'stdio' },
          environmentVariables: [
            {
              name: 'API_KEY',
              description: 'Your API key',
              isRequired: true,
              // No value - should be extracted (unified condition: !value)
            },
          ] as KeyValueInput[],
        } as Package,
        isSupported: true,
      };

      const fields = extractFields(configOption);

      expect(fields).toHaveLength(1);
      expect(fields[0].name).toBe('API_KEY');
      expect(fields[0].isConfigurable).toBe(true);
    });

    it('should skip fields with values when not marked isConfigurable', () => {
      const configOption: ConfigOption = {
        id: 'test-pkg',
        label: 'Test Package',
        type: 'package',
        transport: McpTransportType.Stdio,
        config: {
          identifier: '@test/package',
          version: '1.0.0',
          registryType: 'npm',
          transport: { type: 'stdio' },
          environmentVariables: [
            {
              name: 'FIXED_VALUE',
              value: 'already-set',
              // Has value but no isConfigurable flag - should be skipped
            },
          ] as KeyValueInput[],
        } as Package,
        isSupported: true,
      };

      const fields = extractFields(configOption);

      // Should skip field with value and no isConfigurable flag
      expect(fields).toHaveLength(0);
    });

    it('should extract template variables regardless of value', () => {
      const configOption: ConfigOption = {
        id: 'test-pkg',
        label: 'Test Package',
        type: 'package',
        transport: McpTransportType.Stdio,
        config: {
          identifier: '@test/package',
          version: '1.0.0',
          registryType: 'npm',
          transport: { type: 'stdio' },
          environmentVariables: [
            {
              name: 'AUTH_TOKEN',
              value: 'Bearer {github_pat}',
              variables: {
                github_pat: {
                  description: 'GitHub PAT',
                  isRequired: true,
                  isSecret: true,
                },
              },
            },
          ] as KeyValueInput[],
        } as Package,
        isSupported: true,
      };

      const fields = extractFields(configOption);

      // Template variables are extracted unless isConfigurable is explicitly false
      expect(fields).toHaveLength(1);
      expect(fields[0].name).toBe('github_pat');
      expect(fields[0].isVariable).toBe(true);
      expect(fields[0].isConfigurable).toBe(true);
    });
  });
});
