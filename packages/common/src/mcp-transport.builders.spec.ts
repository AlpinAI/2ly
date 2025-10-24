/**
 * Tests for MCP Transport Builders
 */

import { describe, it, expect } from 'vitest';
import {
  getCommandFromRegistryType,
  buildStdioArgs,
  buildEnvironmentVariables,
  buildHeadersMap,
  buildStdioTransport,
  buildSseTransport,
  buildStreamTransport,
} from './mcp-transport.builders';
import type { mcpRegistry } from './types';
import { KeyValueInput } from 'packages/frontend/src/lib/mcpSchemas';

type Package = mcpRegistry.components['schemas']['Package'];
type Transport = mcpRegistry.components['schemas']['Transport'];

describe('getCommandFromRegistryType', () => {
  it('should return npx for npm', () => {
    expect(getCommandFromRegistryType('npm')).toBe('npx');
  });

  it('should return uvx for pypi', () => {
    expect(getCommandFromRegistryType('pypi')).toBe('uvx');
  });

  it('should return dnx for nuget', () => {
    expect(getCommandFromRegistryType('nuget')).toBe('dnx');
  });

  it('should return docker for oci', () => {
    expect(getCommandFromRegistryType('oci')).toBe('docker');
  });

  it('should throw error for unsupported registry type', () => {
    expect(() => getCommandFromRegistryType('invalid')).toThrow(
      'Unsupported registry type: invalid. Supported types: npm, pypi, nuget, oci',
    );
  });
});

describe('buildStdioArgs', () => {
  it('should build args for npm package with identifier only', () => {
    const pkg: Package = {
      identifier: '@brave/brave-search-mcp-server',
      version: '2.0.58',
      registryType: 'npm',
    };

    const args = buildStdioArgs(pkg);
    expect(args).toEqual(['@brave/brave-search-mcp-server']);
  });

  it('should handle npm: prefix in identifier', () => {
    const pkg: Package = {
      identifier: 'npm:@brave/brave-search-mcp-server',
      version: '2.0.58',
      registryType: 'npm',
    };

    const args = buildStdioArgs(pkg);
    expect(args).toEqual(['@brave/brave-search-mcp-server']);
  });

  it('should add docker run subcommand for oci packages', () => {
    const pkg: Package = {
      identifier: 'my-org/my-container',
      version: '1.0.0',
      registryType: 'oci',
    };

    const args = buildStdioArgs(pkg);
    expect(args).toEqual(['run', 'my-org/my-container']);
  });

  it('should handle positional package arguments', () => {
    const pkg: Package = {
      identifier: '@modelcontextprotocol/server-filesystem',
      version: '1.0.0',
      registryType: 'npm',
      packageArguments: [
        {
          type: 'positional',
          value: '/Users/test/Documents',
        },
      ],
    };

    const args = buildStdioArgs(pkg);
    expect(args).toEqual(['@modelcontextprotocol/server-filesystem', '/Users/test/Documents']);
  });

  it('should handle named package arguments', () => {
    const pkg: Package = {
      identifier: 'test-package',
      version: '1.0.0',
      registryType: 'npm',
      packageArguments: [
        {
          type: 'named',
          name: 'config',
          value: '/path/to/config.json',
        },
      ],
    };

    const args = buildStdioArgs(pkg);
    expect(args).toEqual(['test-package', '--config', '/path/to/config.json']);
  });

  it('should handle runtime arguments before identifier', () => {
    const pkg: Package = {
      identifier: 'test-package',
      version: '1.0.0',
      registryType: 'npm',
      runtimeArguments: [
        {
          type: 'named',
          name: 'version',
          value: '18',
        },
      ],
    };

    const args = buildStdioArgs(pkg);
    expect(args).toEqual(['--version', '18', 'test-package']);
  });

  it('should handle both runtime and package arguments', () => {
    const pkg: Package = {
      identifier: 'test-package',
      version: '1.0.0',
      registryType: 'npm',
      runtimeArguments: [
        {
          type: 'named',
          name: 'yes',
        },
      ],
      packageArguments: [
        {
          type: 'positional',
          value: 'start',
        },
      ],
    };

    const args = buildStdioArgs(pkg);
    expect(args).toEqual(['--yes', 'test-package', 'start']);
  });

  it('should skip arguments without values', () => {
    const pkg: Package = {
      identifier: 'test-package',
      version: '1.0.0',
      registryType: 'npm',
      packageArguments: [
        {
          type: 'positional',
          // No value
        },
        {
          type: 'positional',
          value: 'with-value',
        },
      ],
    };

    const args = buildStdioArgs(pkg);
    expect(args).toEqual(['test-package', 'with-value']);
  });
});

describe('buildEnvironmentVariables', () => {
  it('should build env vars map from array', () => {
    const envVars = [
      { name: 'API_KEY', value: 'sk-123' },
      { name: 'DEBUG', value: 'true' },
    ];

    const env = buildEnvironmentVariables(envVars);
    expect(env).toEqual({
      API_KEY: 'sk-123',
      DEBUG: 'true',
    });
  });

  it('should merge with default env vars', () => {
    const envVars = [{ name: 'API_KEY', value: 'sk-123' }];
    const defaultEnv = { PATH: '/usr/bin', HOME: '/home/user' };

    const env = buildEnvironmentVariables(envVars, defaultEnv);
    expect(env).toEqual({
      PATH: '/usr/bin',
      HOME: '/home/user',
      API_KEY: 'sk-123',
    });
  });

  it('should skip env vars without name or value', () => {
    const envVars = [
      { name: 'VALID', value: 'value' },
      { name: 'NO_VALUE' },
      { value: 'no-name' },
    ];

    const env = buildEnvironmentVariables(envVars as KeyValueInput[]);
    expect(env).toEqual({
      VALID: 'value',
    });
  });

  it('should handle empty array', () => {
    const env = buildEnvironmentVariables([]);
    expect(env).toEqual({});
  });

  it('should override default env vars', () => {
    const envVars = [{ name: 'PATH', value: '/custom/path' }];
    const defaultEnv = { PATH: '/usr/bin' };

    const env = buildEnvironmentVariables(envVars, defaultEnv);
    expect(env).toEqual({
      PATH: '/custom/path',
    });
  });
});

describe('buildHeadersMap', () => {
  it('should build headers map from array', () => {
    const headers = [
      { name: 'Authorization', value: 'Bearer abc123' },
      { name: 'Content-Type', value: 'application/json' },
    ];

    const headerMap = buildHeadersMap(headers);
    expect(headerMap).toEqual({
      Authorization: 'Bearer abc123',
      'Content-Type': 'application/json',
    });
  });

  it('should skip headers without name or value', () => {
    const headers = [
      { name: 'Valid', value: 'value' },
      { name: 'NO_VALUE' },
      { value: 'no-name' },
    ];

    const headerMap = buildHeadersMap(headers as KeyValueInput[]);
    expect(headerMap).toEqual({
      Valid: 'value',
    });
  });

  it('should handle empty array', () => {
    const headerMap = buildHeadersMap([]);
    expect(headerMap).toEqual({});
  });
});

describe('buildStdioTransport', () => {
  it('should build config for npm package (BRAVE example)', () => {
    const pkg: Package = {
      identifier: '@brave/brave-search-mcp-server',
      version: '2.0.58',
      registryType: 'npm',
      environmentVariables: [
        {
          name: 'BRAVE_API_KEY',
          value: 'sk-test-key-123',
        },
      ],
    };

    const config = buildStdioTransport(pkg);
    expect(config.command).toBe('npx');
    expect(config.args).toEqual(['@brave/brave-search-mcp-server']);
    expect(config.env).toEqual({
      BRAVE_API_KEY: 'sk-test-key-123',
    });
  });

  it('should build config for pypi package', () => {
    const pkg: Package = {
      identifier: 'my-pypi-package',
      version: '1.0.0',
      registryType: 'pypi',
    };

    const config = buildStdioTransport(pkg);
    expect(config.command).toBe('uvx');
    expect(config.args).toEqual(['my-pypi-package']);
  });

  it('should build config for oci package (docker)', () => {
    const pkg: Package = {
      identifier: 'my-org/my-container',
      version: '1.0.0',
      registryType: 'oci',
    };

    const config = buildStdioTransport(pkg);
    expect(config.command).toBe('docker');
    expect(config.args).toEqual(['run', 'my-org/my-container']);
  });

  it('should build config for filesystem server with directory argument', () => {
    const pkg: Package = {
      identifier: '@modelcontextprotocol/server-filesystem',
      version: '1.0.0',
      registryType: 'npm',
      packageArguments: [
        {
          type: 'positional',
          value: '/Users/test/Documents',
        },
      ],
    };

    const config = buildStdioTransport(pkg);
    expect(config.command).toBe('npx');
    expect(config.args).toEqual(['@modelcontextprotocol/server-filesystem', '/Users/test/Documents']);
  });

  it('should merge default environment variables', () => {
    const pkg: Package = {
      identifier: 'test-package',
      version: '1.0.0',
      registryType: 'npm',
      environmentVariables: [
        {
          name: 'API_KEY',
          value: 'sk-123',
        },
      ],
    };

    const defaultEnv = { PATH: '/usr/bin', NODE_ENV: 'production' };
    const config = buildStdioTransport(pkg, defaultEnv);

    expect(config.env).toEqual({
      PATH: '/usr/bin',
      NODE_ENV: 'production',
      API_KEY: 'sk-123',
    });
  });

  it('should throw error if identifier is missing', () => {
    const pkg: Package = {
      identifier: '',
      version: '1.0.0',
      registryType: 'npm',
    };

    expect(() => buildStdioTransport(pkg)).toThrow('Package identifier is required');
  });

  it('should throw error if registryType is missing', () => {
    const pkg: Package = {
      identifier: 'test-package',
      version: '1.0.0',
      registryType: '',
    };

    expect(() => buildStdioTransport(pkg)).toThrow('Package registryType is required');
  });

  it('should throw error for unsupported registry type', () => {
    const pkg: Package = {
      identifier: 'test-package',
      version: '1.0.0',
      registryType: 'invalid',
    };

    expect(() => buildStdioTransport(pkg)).toThrow('Unsupported registry type: invalid');
  });
});

describe('buildSseTransport', () => {
  it('should build config with URL and headers', () => {
    const transport: Transport = {
      type: 'sse',
      url: 'https://api.example.com/mcp',
      headers: [
        {
          name: 'Authorization',
          value: 'Bearer abc123',
        },
      ],
    };

    const config = buildSseTransport(transport);
    expect(config.url).toBe('https://api.example.com/mcp');
    expect(config.headers).toEqual({
      Authorization: 'Bearer abc123',
    });
  });

  it('should build config with multiple headers', () => {
    const transport: Transport = {
      type: 'sse',
      url: 'https://api.example.com/mcp',
      headers: [
        {
          name: 'Authorization',
          value: 'Bearer abc123',
        },
        {
          name: 'X-API-Version',
          value: 'v1',
        },
      ],
    };

    const config = buildSseTransport(transport);
    expect(config.headers).toEqual({
      Authorization: 'Bearer abc123',
      'X-API-Version': 'v1',
    });
  });

  it('should build config with no headers', () => {
    const transport: Transport = {
      type: 'sse',
      url: 'https://api.example.com/mcp',
    };

    const config = buildSseTransport(transport);
    expect(config.url).toBe('https://api.example.com/mcp');
    expect(config.headers).toEqual({});
  });

  it('should throw error if URL is missing', () => {
    const transport: Transport = {
      type: 'sse',
      url: '',
    };

    expect(() => buildSseTransport(transport)).toThrow('URL is required for SSE transport');
  });
});

describe('buildStreamTransport', () => {
  it('should build config with URL and headers', () => {
    const transport: Transport = {
      type: 'streamableHttp',
      url: 'https://api.example.com/mcp',
      headers: [
        {
          name: 'Authorization',
          value: 'Bearer abc123',
        },
      ],
    };

    const config = buildStreamTransport(transport);
    expect(config.url).toBe('https://api.example.com/mcp');
    expect(config.headers).toEqual({
      Authorization: 'Bearer abc123',
    });
  });

  it('should build config with multiple headers', () => {
    const transport: Transport = {
      type: 'streamableHttp',
      url: 'https://api.example.com/mcp',
      headers: [
        {
          name: 'Authorization',
          value: 'Bearer abc123',
        },
        {
          name: 'X-API-Version',
          value: 'v2',
        },
      ],
    };

    const config = buildStreamTransport(transport);
    expect(config.headers).toEqual({
      Authorization: 'Bearer abc123',
      'X-API-Version': 'v2',
    });
  });

  it('should build config with no headers', () => {
    const transport: Transport = {
      type: 'streamableHttp',
      url: 'https://api.example.com/mcp',
    };

    const config = buildStreamTransport(transport);
    expect(config.url).toBe('https://api.example.com/mcp');
    expect(config.headers).toEqual({});
  });

  it('should throw error if URL is missing', () => {
    const transport: Transport = {
      type: 'streamableHttp',
      url: '',
    };

    expect(() => buildStreamTransport(transport)).toThrow('URL is required for STREAM transport');
  });
});
