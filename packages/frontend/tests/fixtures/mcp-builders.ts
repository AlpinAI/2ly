/**
 * Builder utilities for creating MCP server seed data in E2E tests
 *
 * These builders provide reusable, strongly-typed functions for creating
 * common MCP server configurations used across test suites.
 */

import type {
  MCPServerConfig,
  RegistryServerSeed,
  MCPServerSeed,
  AugmentedArgument,
} from './mcp-types';
import { apolloResolversTypes } from '@2ly/common';

type McpTransportType = apolloResolversTypes.McpTransportType;
type McpServerRunOn = apolloResolversTypes.McpServerRunOn;

/**
 * Build a FileSystem MCP server configuration
 * This is the most commonly used MCP server in tests
 *
 * @param directoryPath - The directory path to allow access to (default: /tmp)
 * @returns Typed MCPServerConfig for filesystem server
 */
export function buildFilesystemServerConfig(directoryPath = '/tmp'): MCPServerConfig {
  return {
    registryType: 'npm',
    identifier: '@modelcontextprotocol/server-filesystem',
    version: '2025.8.21',
    packageArguments: [
      {
        name: 'directory_path',
        description: 'The directory path to allow access to',
        format: 'string',
        type: 'positional',
        isRequired: false,
        value: directoryPath,
        isConfigurable: true,
      } as AugmentedArgument,
    ],
    environmentVariables: [],
    runtimeArguments: [],
  };
}

/**
 * Build a registry server seed entry for the FileSystem server
 *
 * @param options - Optional configuration
 * @returns Typed RegistryServerSeed
 */
export function buildFilesystemRegistryServer(options?: {
  name?: string;
  description?: string;
  title?: string;
  workspaceId?: string;
}): RegistryServerSeed {
  return {
    name: options?.name ?? '@modelcontextprotocol/server-filesystem',
    description: options?.description ?? 'FileSystem MCP server for integration testing',
    title: options?.title ?? 'FileSystem Test Server',
    repositoryUrl: 'https://github.com/modelcontextprotocol/servers',
    version: '2025.8.21',
    packages: [
      {
        identifier: '@modelcontextprotocol/server-filesystem',
        packageArguments: [
          {
            name: 'directory_path',
            description: 'The directory path to allow access to',
            format: 'string',
            type: 'positional',
            isRequired: false,
          },
        ],
        runtimeArguments: [],
        environmentVariables: [],
        registryType: 'npm',
        version: '2025.8.21',
      },
    ],
    remotes: [],
    workspaceId: options?.workspaceId,
  };
}

/**
 * Build a complete MCP server seed entry
 *
 * @param options - MCP server configuration options
 * @returns Typed MCPServerSeed
 */
export function buildMCPServerSeed(options: {
  name: string;
  description: string;
  repositoryUrl: string;
  transport: 'STDIO' | 'SSE' | 'STREAM';
  config: MCPServerConfig;
  runOn: 'GLOBAL' | 'AGENT' | 'EDGE';
  registryServerId?: string;
  workspaceId?: string;
}): MCPServerSeed {
  return {
    name: options.name,
    description: options.description,
    repositoryUrl: options.repositoryUrl,
    transport: options.transport as McpTransportType,
    config: options.config,
    runOn: options.runOn as McpServerRunOn,
    registryServerId: options.registryServerId,
    workspaceId: options.workspaceId,
  };
}

/**
 * Build a minimal FileSystem MCP server seed (most common use case)
 *
 * @param options - Optional configuration overrides
 * @returns Typed MCPServerSeed ready for seeding
 */
export function buildMinimalFilesystemServer(options?: {
  name?: string;
  description?: string;
  runOn?: 'GLOBAL' | 'AGENT' | 'EDGE';
  directoryPath?: string;
  registryServerId?: string;
  workspaceId?: string;
}): MCPServerSeed {
  return buildMCPServerSeed({
    name: options?.name ?? 'Test MCP Server',
    description: options?.description ?? 'FileSystem MCP server for E2E testing',
    repositoryUrl: 'https://github.com/modelcontextprotocol/servers',
    transport: 'STDIO',
    config: buildFilesystemServerConfig(options?.directoryPath),
    runOn: options?.runOn ?? 'GLOBAL',
    registryServerId: options?.registryServerId,
    workspaceId: options?.workspaceId,
  });
}

/**
 * Build a generic MCP server config for SSE/STREAM transports
 * Used for servers that don't require command-line arguments
 *
 * @param identifier - NPM package identifier
 * @param version - Package version
 * @returns Typed MCPServerConfig
 */
export function buildGenericServerConfig(identifier: string, version: string): MCPServerConfig {
  return {
    registryType: 'npm',
    identifier,
    version,
    packageArguments: [],
    environmentVariables: [],
    runtimeArguments: [],
  };
}

/**
 * Build a Web Fetch MCP server (SSE transport)
 *
 * @param options - Optional configuration
 * @returns Typed MCPServerSeed
 */
export function buildWebFetchServer(options?: {
  name?: string;
  description?: string;
  runOn?: 'GLOBAL' | 'AGENT' | 'EDGE';
  registryServerId?: string;
  workspaceId?: string;
}): MCPServerSeed {
  return buildMCPServerSeed({
    name: options?.name ?? 'Web Fetch Server',
    description: options?.description ?? 'HTTP request MCP server',
    repositoryUrl: 'https://github.com/example/web-fetch-mcp',
    transport: 'SSE',
    config: buildGenericServerConfig('@example/web-fetch-mcp-server', '1.5.0'),
    runOn: options?.runOn ?? 'AGENT',
    registryServerId: options?.registryServerId,
    workspaceId: options?.workspaceId,
  });
}

/**
 * Build a Development Tools MCP server (STREAM transport)
 *
 * @param options - Optional configuration
 * @returns Typed MCPServerSeed
 */
export function buildDevelopmentToolsServer(options?: {
  name?: string;
  description?: string;
  runOn?: 'GLOBAL' | 'AGENT' | 'EDGE';
  registryServerId?: string;
  workspaceId?: string;
}): MCPServerSeed {
  return buildMCPServerSeed({
    name: options?.name ?? 'Development Tools',
    description: options?.description ?? 'Development and git operations',
    repositoryUrl: 'https://github.com/example/dev-tools-mcp',
    transport: 'STREAM',
    config: buildGenericServerConfig('@example/dev-tools-mcp-server', '2.1.0'),
    runOn: options?.runOn ?? 'AGENT',
    registryServerId: options?.registryServerId,
    workspaceId: options?.workspaceId,
  });
}

/**
 * Build a Database MCP server (STDIO transport)
 *
 * @param options - Optional configuration
 * @returns Typed MCPServerSeed
 */
export function buildDatabaseServer(options?: {
  name?: string;
  description?: string;
  runOn?: 'GLOBAL' | 'AGENT' | 'EDGE';
  registryServerId?: string;
  workspaceId?: string;
}): MCPServerSeed {
  return buildMCPServerSeed({
    name: options?.name ?? 'Database Server',
    description: options?.description ?? 'Database query and management MCP server',
    repositoryUrl: 'https://github.com/example/database-mcp',
    transport: 'STDIO',
    config: buildGenericServerConfig('@example/database-mcp-server', '3.2.1'),
    runOn: options?.runOn ?? 'AGENT',
    registryServerId: options?.registryServerId,
    workspaceId: options?.workspaceId,
  });
}
