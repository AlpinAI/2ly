/**
 * Registry CRUD Integration Tests
 *
 * Tests the complete lifecycle of registry server operations:
 * - Workspace initialization creates featured servers
 * - Add/Update/Delete registry servers
 * - Configuration linking prevents deletion
 * - Concurrent modification handling
 *
 * Strategy: Clean + Sequential
 * - Each test starts with a fresh database
 * - Tests modify state (CREATE, UPDATE, DELETE)
 * - Tests run sequentially to avoid conflicts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { graphql, resetDatabase } from '../fixtures/database';

describe('Registry CRUD Operations', () => {
  let workspaceId: string;

  beforeEach(async () => {
    // Reset database before each test
    // The /reset endpoint automatically creates:
    // - System
    // - Admin user
    // - Default workspace with featured servers
    await resetDatabase();

    // Query for the auto-created default workspace
    const systemQuery = `
      query GetSystem {
        system {
          id
          initialized
          defaultWorkspace {
            id
            name
          }
        }
      }
    `;

    const systemResult = await graphql<{
      system: {
        id: string;
        initialized: boolean;
        defaultWorkspace: {
          id: string;
          name: string;
        };
      };
    }>(systemQuery);

    // Use the auto-created default workspace
    workspaceId = systemResult.system.defaultWorkspace.id;

    // Query for registry servers using the workspace ID
    const registryServersQuery = `
      query GetRegistryServers($workspaceId: ID!) {
        getRegistryServers(workspaceId: $workspaceId) {
          id
          name
          description
          version
        }
      }
    `;

    const registryServersResult = await graphql<{
      getRegistryServers: Array<{
        id: string;
        name: string;
        description: string;
        version: string;
      }>;
    }>(registryServersQuery, { workspaceId });

    // Verify featured servers were auto-created
    expect(registryServersResult.getRegistryServers).toBeDefined();
    expect(registryServersResult.getRegistryServers.length).toBeGreaterThan(0);
  });

  it('should create workspace with initial featured servers', async () => {
    const query = `
      query GetRegistryServers($workspaceId: ID!) {
        getRegistryServers(workspaceId: $workspaceId) {
          id
          name
          description
          version
          packages
          remotes
        }
      }
    `;

    const result = await graphql<{
      getRegistryServers: Array<{
        id: string;
        name: string;
        description: string;
        version: string;
        packages: string | null;
        remotes: string | null;
      }>;
    }>(query, { workspaceId });

    // Verify featured servers exist
    expect(result.getRegistryServers).toBeDefined();
    expect(result.getRegistryServers.length).toBeGreaterThanOrEqual(1);

    // Verify server structure
    result.getRegistryServers.forEach((server) => {
      expect(server.id).toBeDefined();
      expect(server.name).toBeDefined();
      expect(server.description).toBeDefined();
      expect(server.version).toBeDefined();
      // Either packages or remotes should be defined
      expect(server.packages || server.remotes).toBeTruthy();
    });
  });

  it('should add a new server to workspace', async () => {
    const addServerMutation = `
      mutation AddServerToRegistry(
        $workspaceId: ID!
        $name: String!
        $description: String!
        $title: String!
        $repositoryUrl: String!
        $version: String!
        $packages: String
      ) {
        addServerToRegistry(
          workspaceId: $workspaceId
          name: $name
          description: $description
          title: $title
          repositoryUrl: $repositoryUrl
          version: $version
          packages: $packages
        ) {
          id
          name
          description
          title
          repositoryUrl
          version
          packages
        }
      }
    `;

    const testPackage = JSON.stringify([
      {
        identifier: '@test/custom-server',
        version: '1.0.0',
        registryType: 'npm',
        transport: { type: 'stdio' },
      },
    ]);

    const result = await graphql<{
      addServerToRegistry: {
        id: string;
        name: string;
        description: string;
        title: string;
        repositoryUrl: string;
        version: string;
        packages: string;
      };
    }>(addServerMutation, {
      workspaceId: workspaceId,
      name: 'custom-test-server',
      description: 'A custom test MCP server',
      title: 'Custom Test Server',
      repositoryUrl: 'https://github.com/test/custom-server',
      version: '1.0.0',
      packages: testPackage,
    });

    expect(result.addServerToRegistry).toBeDefined();
    expect(result.addServerToRegistry.name).toBe('custom-test-server');
    expect(result.addServerToRegistry.description).toBe('A custom test MCP server');
    expect(result.addServerToRegistry.version).toBe('1.0.0');
    expect(result.addServerToRegistry.packages).toBe(testPackage);
  });

  it('should update server when no configurations exist', async () => {
    // First, add a server
    const addServerMutation = `
      mutation AddServerToRegistry(
        $workspaceId: ID!
        $name: String!
        $description: String!
        $title: String!
        $repositoryUrl: String!
        $version: String!
      ) {
        addServerToRegistry(
          workspaceId: $workspaceId
          name: $name
          description: $description
          title: $title
          repositoryUrl: $repositoryUrl
          version: $version
        ) {
          id
          name
          version
        }
      }
    `;

    const addResult = await graphql<{
      addServerToRegistry: { id: string; name: string; version: string };
    }>(addServerMutation, {
      workspaceId: workspaceId,
      name: 'test-update-server',
      description: 'Original description',
      title: 'Test Update Server',
      repositoryUrl: 'https://github.com/test/server',
      version: '1.0.0',
    });

    const serverId = addResult.addServerToRegistry.id;

    // Now update it
    const updateServerMutation = `
      mutation UpdateServerInRegistry(
        $serverId: ID!
        $version: String
        $description: String
      ) {
        updateServerInRegistry(
          serverId: $serverId
          version: $version
          description: $description
        ) {
          id
          name
          version
          description
        }
      }
    `;

    const updateResult = await graphql<{
      updateServerInRegistry: {
        id: string;
        name: string;
        version: string;
        description: string;
      };
    }>(updateServerMutation, {
      serverId,
      version: '2.0.0',
      description: 'Updated description',
    });

    expect(updateResult.updateServerInRegistry.id).toBe(serverId);
    expect(updateResult.updateServerInRegistry.version).toBe('2.0.0');
    expect(updateResult.updateServerInRegistry.description).toBe('Updated description');
  });

  it('should create MCP server configuration linked to registry server', async () => {
    // Get a featured server
    const getServersQuery = `
      query GetRegistryServers($workspaceId: ID!) {
        getRegistryServers(workspaceId: $workspaceId) {
          id
          name
          packages
        }
      }
    `;

    const serversResult = await graphql<{
      getRegistryServers: Array<{ id: string; name: string; packages: string | null }>;
    }>(getServersQuery, { workspaceId });

    const registryServer = serversResult.getRegistryServers[0];
    expect(registryServer).toBeDefined();

    // Create MCP server config linked to this registry server
    const createMcpServerMutation = `
      mutation CreateMCPServer(
        $name: String!
        $description: String!
        $repositoryUrl: String!
        $transport: MCPTransportType!
        $config: String!
        $workspaceId: ID!
        $registryServerId: ID!
      ) {
        createMCPServer(
          name: $name
          description: $description
          repositoryUrl: $repositoryUrl
          transport: $transport
          config: $config
          workspaceId: $workspaceId
          registryServerId: $registryServerId
        ) {
          id
          name
          registryServer {
            id
            name
          }
        }
      }
    `;

    const configResult = await graphql<{
      createMCPServer: {
        id: string;
        name: string;
        registryServer: { id: string; name: string };
      };
    }>(createMcpServerMutation, {
      name: 'Test MCP Config',
      description: 'Test configuration',
      repositoryUrl: 'https://github.com/test/server',
      transport: 'STDIO',
      config: registryServer.packages || '{}',
      workspaceId,
      registryServerId: registryServer.id,
    });

    expect(configResult.createMCPServer).toBeDefined();
    expect(configResult.createMCPServer.registryServer.id).toBe(registryServer.id);
  });

  it('should fail to update server with linked configurations', async () => {
    // Get a featured server
    const getServersQuery = `
      query GetRegistryServers($workspaceId: ID!) {
        getRegistryServers(workspaceId: $workspaceId) {
          id
          name
          packages
        }
      }
    `;

    const serversResult = await graphql<{
      getRegistryServers: Array<{ id: string; name: string; packages: string | null }>;
    }>(getServersQuery, { workspaceId });

    const registryServer = serversResult.getRegistryServers[0];

    // Create MCP server config
    const createMcpServerMutation = `
      mutation CreateMCPServer(
        $name: String!
        $description: String!
        $repositoryUrl: String!
        $transport: MCPTransportType!
        $config: String!
        $workspaceId: ID!
        $registryServerId: ID!
      ) {
        createMCPServer(
          name: $name
          description: $description
          repositoryUrl: $repositoryUrl
          transport: $transport
          config: $config
          workspaceId: $workspaceId
          registryServerId: $registryServerId
        ) {
          id
          name
        }
      }
    `;

    await graphql(createMcpServerMutation, {
      name: 'Blocking Config',
      description: 'Config that blocks updates',
      repositoryUrl: 'https://github.com/test/server',
      transport: 'STDIO',
      config: registryServer.packages || '{}',
      workspaceId,
      registryServerId: registryServer.id,
    });

    // Now try to update the registry server - should fail
    const updateServerMutation = `
      mutation UpdateServerInRegistry($serverId: ID!, $version: String) {
        updateServerInRegistry(serverId: $serverId, version: $version) {
          id
          version
        }
      }
    `;

    await expect(
      graphql(updateServerMutation, {
        serverId: registryServer.id,
        version: '2.0.0',
      }),
    ).rejects.toThrow(/used by.*source/);
  });

  it('should fail to delete server with linked configurations', async () => {
    // Get a featured server
    const getServersQuery = `
      query GetRegistryServers($workspaceId: ID!) {
        getRegistryServers(workspaceId: $workspaceId) {
          id
          name
          packages
        }
      }
    `;

    const serversResult = await graphql<{
      getRegistryServers: Array<{ id: string; name: string; packages: string | null }>;
    }>(getServersQuery, { workspaceId });

    const registryServer = serversResult.getRegistryServers[0];

    // Create MCP server config
    const createMcpServerMutation = `
      mutation CreateMCPServer(
        $name: String!
        $description: String!
        $repositoryUrl: String!
        $transport: MCPTransportType!
        $config: String!
        $workspaceId: ID!
        $registryServerId: ID!
      ) {
        createMCPServer(
          name: $name
          description: $description
          repositoryUrl: $repositoryUrl
          transport: $transport
          config: $config
          workspaceId: $workspaceId
          registryServerId: $registryServerId
        ) {
          id
          name
        }
      }
    `;

    await graphql(createMcpServerMutation, {
      name: 'Blocking Config',
      description: 'Config that blocks deletion',
      repositoryUrl: 'https://github.com/test/server',
      transport: 'STDIO',
      config: registryServer.packages || '{}',
      workspaceId,
      registryServerId: registryServer.id,
    });

    // Try to delete the registry server - should fail
    const deleteServerMutation = `
      mutation RemoveServerFromRegistry($serverId: ID!) {
        removeServerFromRegistry(serverId: $serverId) {
          id
        }
      }
    `;

    await expect(
      graphql(deleteServerMutation, {
        serverId: registryServer.id,
      }),
    ).rejects.toThrow(/used by.*source/);
  });

  it('should delete server after configurations are removed', async () => {
    // Get a featured server
    const getServersQuery = `
      query GetRegistryServers($workspaceId: ID!) {
        getRegistryServers(workspaceId: $workspaceId) {
          id
          name
          packages
        }
      }
    `;

    const serversResult = await graphql<{
      getRegistryServers: Array<{ id: string; name: string; packages: string | null }>;
    }>(getServersQuery, { workspaceId });

    const registryServer = serversResult.getRegistryServers[0];

    // Create MCP server config
    const createMcpServerMutation = `
      mutation CreateMCPServer(
        $name: String!
        $description: String!
        $repositoryUrl: String!
        $transport: MCPTransportType!
        $config: String!
        $workspaceId: ID!
        $registryServerId: ID!
      ) {
        createMCPServer(
          name: $name
          description: $description
          repositoryUrl: $repositoryUrl
          transport: $transport
          config: $config
          workspaceId: $workspaceId
          registryServerId: $registryServerId
        ) {
          id
          name
        }
      }
    `;

    const configResult = await graphql<{
      createMCPServer: { id: string; name: string };
    }>(createMcpServerMutation, {
      name: 'Temporary Config',
      description: 'Config to be removed',
      repositoryUrl: 'https://github.com/test/server',
      transport: 'STDIO',
      config: registryServer.packages || '{}',
      workspaceId,
      registryServerId: registryServer.id,
    });

    const configId = configResult.createMCPServer.id;

    // Delete the MCP server config
    const deleteMcpServerMutation = `
      mutation DeleteMCPServer($id: ID!) {
        deleteMCPServer(id: $id) {
          id
        }
      }
    `;

    await graphql(deleteMcpServerMutation, { id: configId });

    // Now delete should succeed
    const deleteServerMutation = `
      mutation RemoveServerFromRegistry($serverId: ID!) {
        removeServerFromRegistry(serverId: $serverId) {
          id
          name
        }
      }
    `;

    const deleteResult = await graphql<{
      removeServerFromRegistry: { id: string; name: string };
    }>(deleteServerMutation, {
      serverId: registryServer.id,
    });

    expect(deleteResult.removeServerFromRegistry).toBeDefined();
    expect(deleteResult.removeServerFromRegistry.id).toBe(registryServer.id);
  });

  it('should provide user-friendly error messages', async () => {
    // Get a featured server
    const getServersQuery = `
      query GetRegistryServers($workspaceId: ID!) {
        getRegistryServers(workspaceId: $workspaceId) {
          id
          name
          packages
        }
      }
    `;

    const serversResult = await graphql<{
      getRegistryServers: Array<{ id: string; name: string; packages: string | null }>;
    }>(getServersQuery, { workspaceId });

    const registryServer = serversResult.getRegistryServers[0];

    // Create 3 configurations
    const createMcpServerMutation = `
      mutation CreateMCPServer(
        $name: String!
        $description: String!
        $repositoryUrl: String!
        $transport: MCPTransportType!
        $config: String!
        $workspaceId: ID!
        $registryServerId: ID!
      ) {
        createMCPServer(
          name: $name
          description: $description
          repositoryUrl: $repositoryUrl
          transport: $transport
          config: $config
          workspaceId: $workspaceId
          registryServerId: $registryServerId
        ) {
          id
          name
        }
      }
    `;

    for (let i = 1; i <= 3; i++) {
      await graphql(createMcpServerMutation, {
        name: `Config ${i}`,
        description: `Test configuration ${i}`,
        repositoryUrl: 'https://github.com/test/server',
        transport: 'STDIO',
        config: registryServer.packages || '{}',
        workspaceId,
        registryServerId: registryServer.id,
      });
    }

    // Try to delete - error should include server name and config count
    const deleteServerMutation = `
      mutation RemoveServerFromRegistry($serverId: ID!) {
        removeServerFromRegistry(serverId: $serverId) {
          id
        }
      }
    `;

    try {
      await graphql(deleteServerMutation, {
        serverId: registryServer.id,
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // Error should include server name
      expect(errorMessage).toContain(registryServer.name);
      // Error should indicate multiple sources
      expect(errorMessage).toMatch(/3.*source/i);
      // Error should list configuration names
      expect(errorMessage).toContain('Config 1');
    }
  });
});
