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
import { Page } from '@playwright/test';
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

export const configureFileSystemMCPServer = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  graphql: <T = any>(query: string, variables?: Record<string, any>) => Promise<T>,
  workspaceId: string,
  runOn: 'GLOBAL' | 'AGENT' | 'EDGE',
) => {
  // Get the FileSystem MCP Server from the registry
  const registryServersQuery = `
    query GetRegistryServers($workspaceId: ID!) {
      getRegistryServers(workspaceId: $workspaceId) {
        id
        name
      }
    }
  `;
  const registryServersResult = await graphql<{ getRegistryServers: { id: string; name: string }[] }>(registryServersQuery, { workspaceId });
  const registryServer = registryServersResult.getRegistryServers.find(r => r.name === '@modelcontextprotocol/server-filesystem');
  if (!registryServer) {
    throw new Error('Filesystem MCP Server not found in registry');
  }
  const registryServerId = registryServer.id;

  const mutation = `
      mutation CreateMCPServer($name: String!, $description: String!, $repositoryUrl: String!, $transport: MCPTransportType!, $config: String!, $runOn: MCPServerRunOn!, $workspaceId: ID!, $registryServerId: ID!) {
        createMCPServer(name: $name, description: $description, repositoryUrl: $repositoryUrl, transport: $transport, config: $config, runOn: $runOn, workspaceId: $workspaceId, registryServerId: $registryServerId) {
          id
          name
          description
          repositoryUrl
          transport
          config
          runOn
        }
      }
    `;
  
    await graphql<{ createMCPServer: { id: string; name: string; description: string; repositoryUrl: string; transport: string; config: string; runOn: string } }>(mutation, {
      name: 'Test MCP Server',
      description: 'Test MCP Server Description',
      repositoryUrl: 'https://github.com/test/test',
      transport: 'STDIO',
      config: JSON.stringify(buildFilesystemServerConfig('/tmp')),
      runOn,
      workspaceId,
      registryServerId,
    });
};

export const createRuntime = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  graphql: <T = any>(query: string, variables?: Record<string, any>) => Promise<T>,
  page: Page,
  workspaceId: string,
  name: string,
  description: string,
  type: 'EDGE' | 'MCP',
) => {
  const mutation = `
    mutation CreateRuntime($name: String!, $description: String!, $type: RuntimeType!, $workspaceId: ID!) {
      createRuntime(name: $name, description: $description, type: $type, workspaceId: $workspaceId) {
        id
        name
        description
        type
      }
    }
  `;
  const result = await graphql<{ createRuntime: { id: string; name: string; description: string; type: 'EDGE' | 'MCP' } }>(mutation, {
    name,
    description,
    type,
    workspaceId,
  });

  // Wait 10s, letting the time to the runtime to spawn the server and discover the tools
  await page.waitForTimeout(10000);

  return {
    runtimeId: result.createRuntime.id,
  };
};

export const createToolset = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  graphql: <T = any>(query: string, variables?: Record<string, any>) => Promise<T>,
  workspaceId: string,
  name: string,
  description: string,
  nbToolsToLink: number,
) => {
  // get tools
  const toolQuery = `
    query GetTools($workspaceId: ID!) {
      mcpTools(workspaceId: $workspaceId) {
        id
      }
    }
  `;
  const toolResult = await graphql<{ mcpTools: Array<{ id: string }> }>(toolQuery, { workspaceId });
  // Create a ToolSet
  const createToolSetMutation = `
    mutation CreateToolSet($name: String!, $description: String!, $workspaceId: ID!) {
      createToolSet(name: $name, description: $description, workspaceId: $workspaceId) {
        id
        name
      }
    }
  `;

  const toolSetResult = await graphql<{ createToolSet: { id: string; name: string } }>(
    createToolSetMutation,
    {
      name,
      description,
      workspaceId,
    }
  );

  // Add tools to the toolset
  const addToolMutation = `
    mutation AddToolToToolSet($mcpToolId: ID!, $toolSetId: ID!) {
      addMCPToolToToolSet(mcpToolId: $mcpToolId, toolSetId: $toolSetId) {
        id
        mcpTools {
          id
          name
        }
      }
    }
  `;

  for (let i = 0; i < nbToolsToLink; i++) {
    console.log('adding tool', i, toolResult.mcpTools[i]!.id);
    await graphql(addToolMutation, {
      mcpToolId: toolResult.mcpTools[i]!.id,
      toolSetId: toolSetResult.createToolSet.id,
    });
  }

  console.log('toolset created', toolSetResult.createToolSet.id);
  return {
    toolsetId: toolSetResult.createToolSet.id,
  };
};
