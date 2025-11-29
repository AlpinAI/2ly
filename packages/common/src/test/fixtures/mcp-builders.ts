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
  const officialFilesystemServer = {
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
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  officialFilesystemServer;
  const agentInfraFilesystemServer = {
    registryType: 'npm',
    registryBaseUrl: 'https://registry.npmjs.org',
    identifier: '@agent-infra/mcp-server-filesystem',
    version: 'latest',
    transport: {
      type: 'stdio',
    },
    packageArguments: [
      {
        name: 'allowed-directories',
        description: 'Comma-separated list of allowed directories for file operations',
        format: 'string',
        type: 'named',
        isRequired: true,
        value: directoryPath,
        isConfigurable: true,
      } as AugmentedArgument,
    ],
    runtimeHint: 'npx',
    environmentVariables: [],
    runtimeArguments: [],
  };
  return agentInfraFilesystemServer;
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

  const officialFilesystemRegistryServer = {
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
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  officialFilesystemRegistryServer;
  const agentInfraFilesystemRegistryServer = {
    name: options?.name ?? '@agent-infra/mcp-server-filesystem',
    description: options?.description ?? 'FileSystem MCP server for integration testing',
    title: options?.title ?? 'FileSystem Test Server',
    repositoryUrl: 'https://github.com/agent-infra/mcp-server-filesystem',
    version: 'latest',
    packages: [
      {
        identifier: '@agent-infra/mcp-server-filesystem',
        packageArguments: [
          {
            name: 'allowed-directories',
            description: 'Comma-separated list of allowed directories for file operations',
            format: 'string',
            type: 'named',
            isRequired: true,
          },
        ],
        runtimeArguments: [],
        environmentVariables: [],
        registryType: 'npm',
        version: '2025.8.21',
      },
    ],
  };


  return {
    ...agentInfraFilesystemRegistryServer,
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
  runOn: 'AGENT' | 'EDGE';
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
  runOn?: 'AGENT' | 'EDGE';
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
    runOn: options?.runOn ?? 'AGENT',
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
  runOn?: 'AGENT' | 'EDGE';
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
  runOn?: 'AGENT' | 'EDGE';
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
  runOn?: 'AGENT' | 'EDGE';
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

/**
 * Get runtime ID for a specific runtime type
 * This is used in tests to query for runtime IDs dynamically
 *
 * @param graphql - GraphQL query function
 * @param workspaceId - Workspace ID to query runtimes for
 * @param runtimeType - Type of runtime to find ('MCP' or 'EDGE')
 * @returns Runtime ID if found, undefined otherwise
 */
export const getRuntimeIdByType = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  graphql: <T = any>(query: string, variables?: Record<string, any>) => Promise<T>,
  _workspaceId: string,
  runtimeType: 'MCP' | 'EDGE',
): Promise<string | undefined> => {
  const query = `
    query GetSystemRuntimes {
      system {
        runtimes {
          id
          type
          status
        }
      }
    }
  `;
  const result = await graphql<{ system: { runtimes: Array<{ id: string; type: string; status: string }> } }>(
    query
  );
  const runtime = result.system.runtimes.find(r => r.type === runtimeType && r.status === 'ACTIVE');
  return runtime?.id;
};

/**
 * Helper function to configure a FileSystem MCP server dynamically via GraphQL
 * This is used in tests that need to create servers on the fly
 *
 * @param graphql - GraphQL query function
 * @param workspaceId - Workspace ID to create the server in
 * @param runOn - Where the server should run ('AGENT' or 'EDGE')
 * @param runtimeId - Optional runtime ID for EDGE deployments
 * @param authToken - Optional JWT token for authenticated requests
 */
export const configureFileSystemMCPServer = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  graphql: <T = any>(query: string, variables?: Record<string, any>, authToken?: string) => Promise<T>,
  workspaceId: string,
  runOn: 'AGENT' | 'EDGE',
  runtimeId?: string,
  authToken?: string,
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
  const registryServersResult = await graphql<{ getRegistryServers: { id: string; name: string }[] }>(registryServersQuery, { workspaceId }, authToken);
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

  const createMCPServerResult = await graphql<{ createMCPServer: { id: string; name: string; description: string; repositoryUrl: string; transport: string; config: string; runOn: string } }>(mutation, {
    name: 'Test MCP Server',
    description: 'Test MCP Server Description',
    repositoryUrl: 'https://github.com/test/test',
    transport: 'STDIO',
    config: JSON.stringify(buildFilesystemServerConfig('/tmp')),
    runOn,
    workspaceId,
    registryServerId,
  }, authToken);

  const mcpServerId = createMCPServerResult.createMCPServer.id;

  // If EDGE and runtimeId provided, link the server to the specific runtime
  if (runOn === 'EDGE' && runtimeId) {
    const updateMutation = `
      mutation UpdateMCPServerRunOn($mcpServerId: ID!, $runOn: MCPServerRunOn!, $runtimeId: ID) {
        updateMCPServerRunOn(mcpServerId: $mcpServerId, runOn: $runOn, runtimeId: $runtimeId) {
          id
          runOn
          runtime {
            id
            name
          }
        }
      }
    `;
    await graphql(updateMutation, { mcpServerId, runOn, runtimeId }, authToken);
  }

  return {
    mcpServerId,
  };
};

/**
 * Helper function to create a toolset dynamically via GraphQL
 * This is used in tests that need to create toolsets on the fly
 *
 * @param authToken - Optional JWT token for authenticated requests
 */
export const createToolset = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  graphql: <T = any>(query: string, variables?: Record<string, any>, authToken?: string) => Promise<T>,
  workspaceId: string,
  name: string,
  description: string,
  nbToolsToLink: number,
  authToken?: string,
) => {
  // get tools
  const toolQuery = `
    query GetTools($workspaceId: ID!) {
      mcpTools(workspaceId: $workspaceId) {
        id
      }
    }
  `;
  const toolResult = await graphql<{ mcpTools: Array<{ id: string }> }>(toolQuery, { workspaceId }, authToken);

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
    },
    authToken
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

  const maxTools = Math.min(nbToolsToLink, toolResult.mcpTools.length);

  for (let i = 0; i < maxTools; i++) {
    await graphql(addToolMutation, {
      mcpToolId: toolResult.mcpTools[i]!.id,
      toolSetId: toolSetResult.createToolSet.id,
    }, authToken);
  }

  return {
    toolsetId: toolSetResult.createToolSet.id,
  };
};

/**
 * Update an existing MCP server to run on EDGE runtime
 * This is needed after seeding because presets default to AGENT runOn
 *
 * @param graphql - GraphQL query function
 * @param mcpServerId - ID of the MCP server to update
 * @param workspaceId - Workspace ID to find the EDGE runtime
 * @returns Updated MCP server data
 */
export const updateMCPServerToEdgeRuntime = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  graphql: <T = any>(query: string, variables?: Record<string, any>) => Promise<T>,
  mcpServerId: string,
  workspaceId: string,
): Promise<{ id: string; runOn: string; runtime: { id: string; name: string } }> => {
  // Get the EDGE runtime ID
  const runtimeId = await getRuntimeIdByType(graphql, workspaceId, 'EDGE');

  if (!runtimeId) {
    throw new Error('No EDGE runtime found. Ensure resetDatabase(true) was called.');
  }

  // Update MCP server to use EDGE runtime
  const updateMutation = `
    mutation UpdateMCPServerRunOn($mcpServerId: ID!, $runOn: MCPServerRunOn!, $runtimeId: ID) {
      updateMCPServerRunOn(mcpServerId: $mcpServerId, runOn: $runOn, runtimeId: $runtimeId) {
        id
        runOn
        runtime {
          id
          name
        }
      }
    }
  `;

  const result = await graphql<{
    updateMCPServerRunOn: { id: string; runOn: string; runtime: { id: string; name: string } };
  }>(updateMutation, {
    mcpServerId,
    runOn: 'EDGE',
    runtimeId,
  });

  return result.updateMCPServerRunOn;
};
