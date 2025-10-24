/**
 * Tests for MCP Configuration Helpers
 */

import { describe, it, expect } from 'vitest';
import {
  extractVariablesFromTemplate,
  substituteVariables,
  getAllVariablesFromPackage,
  getAllVariablesFromTransport,
  getAllVariablesFromConfig,
  substitutePackageVariables,
  substituteTransportVariables,
  substituteAllVariables,
  hasUnsubstitutedVariables,
  findUnsubstitutedVariables,
} from './mcp-config.helpers';
import type { mcpRegistry } from './types';

type Package = mcpRegistry.components['schemas']['Package'];
type Transport = mcpRegistry.components['schemas']['Transport'];

describe('extractVariablesFromTemplate', () => {
  it('should extract single variable', () => {
    expect(extractVariablesFromTemplate('Bearer {token}')).toEqual(['token']);
  });

  it('should extract multiple variables', () => {
    expect(extractVariablesFromTemplate('type=bind,src={src_path},dst={dst_path}')).toEqual(['src_path', 'dst_path']);
  });

  it('should extract duplicate variables only once', () => {
    expect(extractVariablesFromTemplate('{var} and {var} again')).toEqual(['var']);
  });

  it('should handle empty string', () => {
    expect(extractVariablesFromTemplate('')).toEqual([]);
  });

  it('should handle string with no variables', () => {
    expect(extractVariablesFromTemplate('no variables here')).toEqual([]);
  });

  it('should handle complex variable names', () => {
    expect(extractVariablesFromTemplate('{API_KEY} and {api_key_2}')).toEqual(['API_KEY', 'api_key_2']);
  });

  it('should not extract invalid variable names', () => {
    // Variables must start with letter or underscore
    expect(extractVariablesFromTemplate('{123abc}')).toEqual([]);
    expect(extractVariablesFromTemplate('{-invalid}')).toEqual([]);
  });
});

describe('substituteVariables', () => {
  it('should substitute single variable', () => {
    expect(substituteVariables('Bearer {token}', { token: 'abc123' })).toBe('Bearer abc123');
  });

  it('should substitute multiple variables', () => {
    expect(substituteVariables('src={src},dst={dst}', { src: '/home', dst: '/app' })).toBe('src=/home,dst=/app');
  });

  it('should leave unmatched variables as-is', () => {
    expect(substituteVariables('Bearer {token}', {})).toBe('Bearer {token}');
    expect(substituteVariables('{a} and {b}', { a: 'A' })).toBe('A and {b}');
  });

  it('should handle empty string', () => {
    expect(substituteVariables('', { token: 'abc' })).toBe('');
  });

  it('should handle no variables in template', () => {
    expect(substituteVariables('no variables', { token: 'abc' })).toBe('no variables');
  });

  it('should handle duplicate variables', () => {
    expect(substituteVariables('{var} and {var}', { var: 'X' })).toBe('X and X');
  });

  it('should handle empty variable value', () => {
    expect(substituteVariables('Bearer {token}', { token: '' })).toBe('Bearer ');
  });
});

describe('getAllVariablesFromPackage', () => {
  it('should extract variables from packageArguments', () => {
    const pkg: Package = {
      identifier: 'test-pkg',
      version: '1.0.0',
      registryType: 'npm',
      packageArguments: [
        {
          type: 'named',
          name: '--config',
          value: '{config_path}',
          variables: {
            config_path: {
              description: 'Path to config file',
              format: 'filepath',
              isRequired: true,
            },
          },
        },
      ],
    };

    const vars = getAllVariablesFromPackage(pkg);
    expect(vars).toHaveLength(1);
    expect(vars[0]).toMatchObject({
      name: 'config_path',
      description: 'Path to config file',
      format: 'filepath',
      isRequired: true,
      context: 'packageArguments',
    });
  });

  it('should extract variables from runtimeArguments', () => {
    const pkg: Package = {
      identifier: 'test-pkg',
      version: '1.0.0',
      registryType: 'npm',
      runtimeArguments: [
        {
          type: 'named',
          name: '--port',
          value: '{port_number}',
          variables: {
            port_number: {
              description: 'Port to bind',
              default: '8080',
            },
          },
        },
      ],
    };

    const vars = getAllVariablesFromPackage(pkg);
    expect(vars).toHaveLength(1);
    expect(vars[0]).toMatchObject({
      name: 'port_number',
      description: 'Port to bind',
      default: '8080',
      context: 'runtimeArguments',
    });
  });

  it('should extract variables from environmentVariables', () => {
    const pkg: Package = {
      identifier: 'test-pkg',
      version: '1.0.0',
      registryType: 'npm',
      environmentVariables: [
        {
          name: 'API_KEY',
          value: '{user_api_key}',
          variables: {
            user_api_key: {
              description: 'Your API key',
              isRequired: true,
              isSecret: true,
            },
          },
        },
      ],
    };

    const vars = getAllVariablesFromPackage(pkg);
    expect(vars).toHaveLength(1);
    expect(vars[0]).toMatchObject({
      name: 'user_api_key',
      description: 'Your API key',
      isRequired: true,
      isSecret: true,
      context: 'environmentVariables',
    });
  });

  it('should extract variables from multiple fields', () => {
    const pkg: Package = {
      identifier: 'test-pkg',
      version: '1.0.0',
      registryType: 'npm',
      packageArguments: [
        {
          type: 'named',
          name: '--mount',
          value: 'src={src},dst={dst}',
          variables: {
            src: { description: 'Source path' },
            dst: { description: 'Dest path' },
          },
        },
      ],
      environmentVariables: [
        {
          name: 'TOKEN',
          value: '{api_token}',
          variables: {
            api_token: { description: 'API token', isSecret: true },
          },
        },
      ],
    };

    const vars = getAllVariablesFromPackage(pkg);
    expect(vars).toHaveLength(3);
    expect(vars.map((v) => v.name)).toEqual(['src', 'dst', 'api_token']);
  });

  it('should handle package with no variables', () => {
    const pkg: Package = {
      identifier: 'test-pkg',
      version: '1.0.0',
      registryType: 'npm',
    };

    expect(getAllVariablesFromPackage(pkg)).toEqual([]);
  });

  it('should handle arguments without variables property', () => {
    const pkg: Package = {
      identifier: 'test-pkg',
      version: '1.0.0',
      registryType: 'npm',
      packageArguments: [
        {
          type: 'positional',
          value: 'start',
        },
      ],
    };

    expect(getAllVariablesFromPackage(pkg)).toEqual([]);
  });
});

describe('getAllVariablesFromTransport', () => {
  it('should extract variables from headers', () => {
    const transport: Transport = {
      type: 'sse',
      url: 'https://api.example.com',
      headers: [
        {
          name: 'Authorization',
          value: 'Bearer {github_pat}',
          variables: {
            github_pat: {
              description: 'GitHub Personal Access Token',
              isRequired: true,
              isSecret: true,
            },
          },
        },
      ],
    };

    const vars = getAllVariablesFromTransport(transport);
    expect(vars).toHaveLength(1);
    expect(vars[0]).toMatchObject({
      name: 'github_pat',
      description: 'GitHub Personal Access Token',
      isRequired: true,
      isSecret: true,
      context: 'headers',
    });
  });

  it('should extract variables from multiple headers', () => {
    const transport: Transport = {
      type: 'sse',
      url: 'https://api.example.com',
      headers: [
        {
          name: 'Authorization',
          value: 'Bearer {token}',
          variables: {
            token: { description: 'Auth token', isSecret: true },
          },
        },
        {
          name: 'X-API-Version',
          value: '{api_version}',
          variables: {
            api_version: { description: 'API version', default: 'v1' },
          },
        },
      ],
    };

    const vars = getAllVariablesFromTransport(transport);
    expect(vars).toHaveLength(2);
    expect(vars.map((v) => v.name)).toEqual(['token', 'api_version']);
  });

  it('should handle transport with no headers', () => {
    const transport: Transport = {
      type: 'sse',
      url: 'https://api.example.com',
    };

    expect(getAllVariablesFromTransport(transport)).toEqual([]);
  });
});

describe('getAllVariablesFromConfig', () => {
  it('should handle Package config', () => {
    const pkg: Package = {
      identifier: 'test-pkg',
      version: '1.0.0',
      registryType: 'npm',
      environmentVariables: [
        {
          name: 'KEY',
          value: '{key_var}',
          variables: {
            key_var: { description: 'Key' },
          },
        },
      ],
    };

    const vars = getAllVariablesFromConfig(pkg);
    expect(vars).toHaveLength(1);
    expect(vars[0].name).toBe('key_var');
  });

  it('should handle Transport config', () => {
    const transport: Transport = {
      type: 'sse',
      url: 'https://api.example.com',
      headers: [
        {
          name: 'Auth',
          value: '{token}',
          variables: {
            token: { description: 'Token' },
          },
        },
      ],
    };

    const vars = getAllVariablesFromConfig(transport);
    expect(vars).toHaveLength(1);
    expect(vars[0].name).toBe('token');
  });
});

describe('substitutePackageVariables', () => {
  it('should substitute variables in packageArguments', () => {
    const pkg: Package = {
      identifier: 'test-pkg',
      version: '1.0.0',
      registryType: 'npm',
      packageArguments: [
        {
          type: 'named',
          name: '--config',
          value: '{config_path}',
        },
      ],
    };

    const result = substitutePackageVariables(pkg, { config_path: '/etc/config.json' });
    expect(result.packageArguments?.[0].value).toBe('/etc/config.json');
  });

  it('should substitute variables in runtimeArguments', () => {
    const pkg: Package = {
      identifier: 'test-pkg',
      version: '1.0.0',
      registryType: 'npm',
      runtimeArguments: [
        {
          type: 'named',
          name: '--port',
          value: '{port}',
        },
      ],
    };

    const result = substitutePackageVariables(pkg, { port: '3000' });
    expect(result.runtimeArguments?.[0].value).toBe('3000');
  });

  it('should substitute variables in environmentVariables', () => {
    const pkg: Package = {
      identifier: 'test-pkg',
      version: '1.0.0',
      registryType: 'npm',
      environmentVariables: [
        {
          name: 'API_KEY',
          value: 'Bearer {token}',
        },
      ],
    };

    const result = substitutePackageVariables(pkg, { token: 'secret123' });
    expect(result.environmentVariables?.[0].value).toBe('Bearer secret123');
  });

  it('should substitute multiple variables in one value', () => {
    const pkg: Package = {
      identifier: 'test-pkg',
      version: '1.0.0',
      registryType: 'npm',
      packageArguments: [
        {
          type: 'named',
          name: '--mount',
          value: 'type=bind,src={src},dst={dst}',
        },
      ],
    };

    const result = substitutePackageVariables(pkg, { src: '/home/user', dst: '/app' });
    expect(result.packageArguments?.[0].value).toBe('type=bind,src=/home/user,dst=/app');
  });

  it('should not modify original package', () => {
    const pkg: Package = {
      identifier: 'test-pkg',
      version: '1.0.0',
      registryType: 'npm',
      environmentVariables: [
        {
          name: 'KEY',
          value: '{var}',
        },
      ],
    };

    const original = pkg.environmentVariables?.[0].value;
    substitutePackageVariables(pkg, { var: 'value' });
    expect(pkg.environmentVariables?.[0].value).toBe(original);
  });

  it('should handle package with no arguments or env vars', () => {
    const pkg: Package = {
      identifier: 'test-pkg',
      version: '1.0.0',
      registryType: 'npm',
    };

    const result = substitutePackageVariables(pkg, { token: 'abc' });
    expect(result).toEqual(pkg);
  });
});

describe('substituteTransportVariables', () => {
  it('should substitute variables in headers', () => {
    const transport: Transport = {
      type: 'sse',
      url: 'https://api.example.com',
      headers: [
        {
          name: 'Authorization',
          value: 'Bearer {token}',
        },
      ],
    };

    const result = substituteTransportVariables(transport, { token: 'ghp_abc123' });
    expect(result.headers?.[0].value).toBe('Bearer ghp_abc123');
  });

  it('should substitute multiple variables', () => {
    const transport: Transport = {
      type: 'sse',
      url: 'https://api.example.com',
      headers: [
        {
          name: 'X-Custom',
          value: '{prefix}-{suffix}',
        },
      ],
    };

    const result = substituteTransportVariables(transport, { prefix: 'start', suffix: 'end' });
    expect(result.headers?.[0].value).toBe('start-end');
  });

  it('should not modify original transport', () => {
    const transport: Transport = {
      type: 'sse',
      url: 'https://api.example.com',
      headers: [
        {
          name: 'Auth',
          value: '{token}',
        },
      ],
    };

    const original = transport.headers?.[0].value;
    substituteTransportVariables(transport, { token: 'abc' });
    expect(transport.headers?.[0].value).toBe(original);
  });

  it('should handle transport with no headers', () => {
    const transport: Transport = {
      type: 'sse',
      url: 'https://api.example.com',
    };

    const result = substituteTransportVariables(transport, { token: 'abc' });
    expect(result).toEqual(transport);
  });
});

describe('substituteAllVariables', () => {
  it('should handle Package config', () => {
    const pkg: Package = {
      identifier: 'test-pkg',
      version: '1.0.0',
      registryType: 'npm',
      environmentVariables: [
        {
          name: 'KEY',
          value: '{var}',
        },
      ],
    };

    const result = substituteAllVariables(pkg, { var: 'value' }) as Package;
    expect(result.environmentVariables?.[0].value).toBe('value');
  });

  it('should handle Transport config', () => {
    const transport: Transport = {
      type: 'sse',
      url: 'https://api.example.com',
      headers: [
        {
          name: 'Auth',
          value: '{token}',
        },
      ],
    };

    const result = substituteAllVariables(transport, { token: 'secret' }) as Transport;
    expect(result.headers?.[0].value).toBe('secret');
  });
});

describe('hasUnsubstitutedVariables', () => {
  it('should detect unsubstituted variables', () => {
    expect(hasUnsubstitutedVariables('Bearer {token}')).toBe(true);
    expect(hasUnsubstitutedVariables('{a} and {b}')).toBe(true);
  });

  it('should return false for fully substituted strings', () => {
    expect(hasUnsubstitutedVariables('Bearer abc123')).toBe(false);
    expect(hasUnsubstitutedVariables('no variables')).toBe(false);
  });

  it('should handle empty string', () => {
    expect(hasUnsubstitutedVariables('')).toBe(false);
  });

  it('should handle strings with braces but not variables', () => {
    // Numbers at start don't match our pattern
    expect(hasUnsubstitutedVariables('{123}')).toBe(false);
    expect(hasUnsubstitutedVariables('{-invalid}')).toBe(false);
    // Regular text without braces
    expect(hasUnsubstitutedVariables('just text')).toBe(false);
  });
});

describe('findUnsubstitutedVariables', () => {
  it('should find unsubstituted variables in Package', () => {
    const pkg: Package = {
      identifier: 'test-pkg',
      version: '1.0.0',
      registryType: 'npm',
      packageArguments: [
        {
          type: 'named',
          name: '--config',
          value: '{config_path}',
        },
      ],
      environmentVariables: [
        {
          name: 'KEY',
          value: 'Bearer {token}',
        },
      ],
    };

    const vars = findUnsubstitutedVariables(pkg);
    expect(vars).toContain('config_path');
    expect(vars).toContain('token');
  });

  it('should find unsubstituted variables in Transport', () => {
    const transport: Transport = {
      type: 'sse',
      url: 'https://api.example.com',
      headers: [
        {
          name: 'Authorization',
          value: 'Bearer {github_pat}',
        },
        {
          name: 'X-Version',
          value: '{api_version}',
        },
      ],
    };

    const vars = findUnsubstitutedVariables(transport);
    expect(vars).toContain('github_pat');
    expect(vars).toContain('api_version');
  });

  it('should return empty array for fully substituted config', () => {
    const pkg: Package = {
      identifier: 'test-pkg',
      version: '1.0.0',
      registryType: 'npm',
      environmentVariables: [
        {
          name: 'KEY',
          value: 'fully_substituted_value',
        },
      ],
    };

    expect(findUnsubstitutedVariables(pkg)).toEqual([]);
  });

  it('should handle config with no values', () => {
    const pkg: Package = {
      identifier: 'test-pkg',
      version: '1.0.0',
      registryType: 'npm',
    };

    expect(findUnsubstitutedVariables(pkg)).toEqual([]);
  });
});
