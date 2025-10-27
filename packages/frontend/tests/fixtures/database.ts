/* eslint-disable @typescript-eslint/no-explicit-any */
import { test as base } from '@playwright/test';
import { comprehensiveSeededData } from '../e2e/fixtures/seed-data';
import { dgraphQL } from './dgraph-client';

/**
 * Database Fixture for Playwright Tests
 *
 * Provides utilities for managing database state across different test strategies:
 * - resetDatabase: Drop all data and start fresh
 * - seedDatabase: Populate database with predefined test data
 * - graphql: Execute GraphQL queries against the backend
 * - getDatabaseState: Inspect current database state
 */

// ============================================================================
// Types
// ============================================================================

export interface SeedData {
  workspaces?: Array<{
    name: string;
    description?: string;
  }>;
  users?: Array<{
    email: string;
    password: string;
    name?: string;
  }>;
  mcpServers?: Array<{
    name: string;
    transport: 'STDIO' | 'SSE' | 'STREAM';
    command?: string;
    args?: string[];
  }>;
  registryServers?: Array<{
    name: string;
    description: string;
    title: string;
    repositoryUrl: string;
    version: string;
    packages: string;
    remotes?: string;
    workspaceId: string;
  }>;
  tools?: Array<{
    name: string;
    description: string;
    inputSchema: string;
    annotations: string;
    status: 'ACTIVE' | 'INACTIVE';
    mcpServerId: string;
  }>;
  runtimes?: Array<{
    name: string;
    description: string;
    status: 'ACTIVE' | 'INACTIVE';
    capabilities: string[];
    workspaceId: string;
  }>;
  toolCalls?: Array<{
    toolInput: string;
    calledAt: string;
    completedAt?: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    toolOutput?: string;
    error?: string;
    mcpToolId: string;
    calledById: string;
    executedById?: string;
  }>;
}

export interface DatabaseState {
  workspaces: any[];
  users: any[];
  mcpServers: any[];
  system: any;
}

export interface DatabaseFixture {
  /**
   * Reset the database to empty state
   * WARNING: This will delete ALL data!
   */
  resetDatabase: () => Promise<void>;

  /**
   * Seed the database with predefined test data
   */
  seedDatabase: (data: SeedData) => Promise<void>;

  /**
   * Execute a GraphQL query against the backend
   */
  graphql: <T = any>(query: string, variables?: Record<string, any>) => Promise<T>;

  /**
   * Get current database state (for debugging/assertions)
   */
  getDatabaseState: () => Promise<DatabaseState>;
}

// ============================================================================
// Fixtures
// ============================================================================

export const test = base.extend<DatabaseFixture>({
  /**
   * GraphQL client fixture
   * Provides a simple function to execute GraphQL queries
   */
  // eslint-disable-next-line no-empty-pattern
  graphql: async ({ }, use) => {
    const apiUrl = process.env.API_URL || 'http://localhost:3000';

    const graphqlClient = async <T = any>(
      query: string,
      variables?: Record<string, any>
    ): Promise<T> => {
      const response = await fetch(`${apiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors, null, 2)}`);
      }

      return result.data as T;
    };

    await use(graphqlClient);
  },

  /**
   * Reset database fixture
   * Drops all data from the database via backend reset endpoint
   */
  // eslint-disable-next-line no-empty-pattern
  resetDatabase: async ({ }, use) => {
    const reset = async () => {
      const apiUrl = process.env.API_URL || 'http://localhost:3000';
      const resetUrl = `${apiUrl}/reset`;

      // Call backend's reset endpoint
      const response = await fetch(resetUrl, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to reset database (): ${response.statusText}`);
      }

      // Wait a bit for the reset to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));
    };

    await use(reset);
  },

  /**
   * Seed database fixture
   * Populates database with test data using direct Dgraph GraphQL API
   *
   * This bypasses the Apollo API layer to enable comprehensive test fixtures
   * including backend-only entities (tools, toolCalls) that shouldn't be
   * exposed via the client API.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  seedDatabase: async ({ graphql }, use) => {
    const seed = async (data: SeedData) => {
      const initialSystemQuery = `
        query {
          querySystem {
            id
            initialized
            createdAt
            updatedAt
            instanceId
            defaultWorkspace {
              id
            }
          }
        }
      `;
      const initialSystemQueryResult = await dgraphQL(initialSystemQuery);
      const systemId = initialSystemQueryResult.querySystem[0].id;
      const workspaceId = initialSystemQueryResult.querySystem[0].defaultWorkspace.id;

      // Track created entity IDs for cross-referencing
      const entityIds: Record<string, string> = {};
      const now = new Date().toISOString();

      // 1. Update System to mark as initialized
      const systemMutation = `
        mutation UpdateSystem($systemId: ID!) {
          updateSystem(input: {
            filter: { id: [$systemId] }
            set: {
              initialized: true
              updatedAt: "${now}"
            }
          }) {
            system {
              id
              initialized
            }
          }
        }
      `;
      await dgraphQL<{
        updateSystem: { system: Array<{ id: string; initialized: boolean }> };
      }>(systemMutation, { systemId });

      entityIds['default-workspace'] = workspaceId;

      // Update system with defaultWorkspace
      const updateSystemMutation = `
        mutation UpdateSystem($systemId: ID!, $workspaceId: ID!) {
          updateSystem(input: {
            filter: { id: [$systemId] }
            set: {
              defaultWorkspace: { id: $workspaceId }
            }
          }) {
            system {
              id
            }
          }
        }
      `;
      await dgraphQL(updateSystemMutation, { systemId, workspaceId });

      // 3. Create Users
      if (data.users && data.users.length > 0) {
        for (const user of data.users) {
          const userMutation = `
            mutation AddUser($workspaceId: ID!) {
              addUser(input: {
                email: "${user.email}"
                password: "${user.password}"
                createdAt: "${now}"
                updatedAt: "${now}"
                adminOfWorkspaces: [{ id: $workspaceId }]
                membersOfWorkspaces: [{ id: $workspaceId }]
              }) {
                user {
                  id
                }
              }
            }
          `;
          await dgraphQL(userMutation, { workspaceId });
        }
      }

      // 4. Create Registry Servers
      if (data.registryServers && workspaceId) {
        for (const registryServer of data.registryServers) {
          const registryMutation = `
            mutation AddMCPRegistryServer($workspaceId: ID!) {
              addMCPRegistryServer(input: {
                name: "${registryServer.name}"
                description: "${registryServer.description}"
                title: "${registryServer.title}"
                repositoryUrl: "${registryServer.repositoryUrl}"
                version: "${registryServer.version}"
                packages: "${registryServer.packages.replace(/"/g, '\\"')}"
                ${registryServer.remotes ? `remotes: "${registryServer.remotes.replace(/"/g, '\\"')}"` : ''}
                createdAt: "${now}"
                lastSeenAt: "${now}"
                workspace: { id: $workspaceId }
              }) {
                mCPRegistryServer {
                  id
                  name
                }
              }
            }
          `;
          const result = await dgraphQL<{
            addMCPRegistryServer: { mCPRegistryServer: Array<{ id: string; name: string }> };
          }>(registryMutation, { workspaceId });
          // Store registry server ID
          const normalizedName = registryServer.name.toLowerCase().replace(/\s+/g, '-');
          entityIds[`registry-${normalizedName}`] = result.addMCPRegistryServer.mCPRegistryServer[0].id;
        }
      }

      // 5. Create MCP Servers
      if (data.mcpServers && workspaceId) {
        const serverNames = ['filesystem-server', 'web-fetch-server', 'development-tools', 'database-server'];
        for (let i = 0; i < data.mcpServers.length; i++) {
          const server = data.mcpServers[i];
          const normalizedName = server.name.toLowerCase().replace(/\s+/g, '-');
          const registryServerId = entityIds[`registry-${normalizedName}`];

          if (registryServerId) {
            const config = JSON.stringify({ command: server.command, args: server.args }).replace(/"/g, '\\"');
            const serverMutation = `
              mutation AddMCPServer($workspaceId: ID!, $registryServerId: ID!) {
                addMCPServer(input: {
                  name: "${server.name}"
                  description: "${server.name}"
                  repositoryUrl: "https://github.com/example/repo"
                  transport: ${server.transport}
                  config: "${config}"
                  runOn: GLOBAL
                  workspace: { id: $workspaceId }
                  registryServer: { id: $registryServerId }
                }) {
                  mCPServer {
                    id
                    name
                  }
                }
              }
            `;
            const result = await dgraphQL<{
              addMCPServer: { mCPServer: Array<{ id: string; name: string }> };
            }>(serverMutation, { workspaceId, registryServerId });
            // Store server ID
            entityIds[serverNames[i]] = result.addMCPServer.mCPServer[0].id;
          }
        }
      }

      // 6. Create Runtimes (agents and edge runtimes)
      if (data.runtimes && workspaceId) {
        const runtimeKeys = ['claude-desktop-agent', 'web-assistant-agent', 'edge-runtime'];
        for (let i = 0; i < data.runtimes.length; i++) {
          const runtime = data.runtimes[i];
          const capsStr = runtime.capabilities.map((c: string) => `"${c}"`).join(', ');
          const runtimeMutation = `
            mutation AddRuntime($workspaceId: ID!) {
              addRuntime(input: {
                name: "${runtime.name}"
                description: "${runtime.description}"
                status: ACTIVE
                capabilities: [${capsStr}]
                createdAt: "${now}"
                lastSeenAt: "${now}"
                workspace: { id: $workspaceId }
              }) {
                runtime {
                  id
                  name
                }
              }
            }
          `;
          const result = await dgraphQL<{
            addRuntime: { runtime: Array<{ id: string; name: string }> };
          }>(runtimeMutation, { workspaceId });
          // Store runtime ID
          entityIds[runtimeKeys[i]] = result.addRuntime.runtime[0].id;
        }
      }

      // 7. Create Tools
      if (data.tools) {
        for (const tool of data.tools) {
          const mcpServerId = entityIds[tool.mcpServerId];
          if (mcpServerId) {
            const escapedInputSchema = tool.inputSchema.replace(/"/g, '\\"').replace(/\n/g, '\\n');
            const escapedAnnotations = tool.annotations.replace(/"/g, '\\"').replace(/\n/g, '\\n');
            const toolMutation = `
              mutation AddMCPTool($mcpServerId: ID!, $workspaceId: ID!) {
                addMCPTool(input: {
                  name: "${tool.name}"
                  description: "${tool.description.replace(/"/g, '\\"')}"
                  inputSchema: "${escapedInputSchema}"
                  annotations: "${escapedAnnotations}"
                  status: ${tool.status}
                  createdAt: "${now}"
                  lastSeenAt: "${now}"
                  mcpServer: { id: $mcpServerId }
                  workspace: { id: $workspaceId }
                }) {
                  mCPTool {
                    id
                    name
                  }
                }
              }
            `;
            try {
              const result = await dgraphQL<{
                addMCPTool: { mCPTool: Array<{ id: string; name: string }> };
              }>(toolMutation, {
                mcpServerId,
                workspaceId,
              });
              // Store tool ID using normalized name
              const toolKey = tool.name.replace(/[^a-zA-Z0-9]/g, '_');
              entityIds[toolKey] = result.addMCPTool.mCPTool[0].id;
            } catch (error) {
              console.warn(`Failed to seed tool ${tool.name}:`, error);
            }
          }
        }
      }

      // 8. Create Tool Calls
      if (data.toolCalls) {
        for (const toolCall of data.toolCalls) {
          const mcpToolId = entityIds[toolCall.mcpToolId.replace(/[^a-zA-Z0-9]/g, '_')];
          const calledById = entityIds[toolCall.calledById];
          const executedById = toolCall.executedById ? entityIds[toolCall.executedById] : undefined;

          if (mcpToolId && calledById) {
            const escapedInput = toolCall.toolInput.replace(/"/g, '\\"').replace(/\n/g, '\\n');
            const escapedOutput = toolCall.toolOutput ? toolCall.toolOutput.replace(/"/g, '\\"').replace(/\n/g, '\\n') : '';
            const escapedError = toolCall.error ? toolCall.error.replace(/"/g, '\\"').replace(/\n/g, '\\n') : '';

            const toolCallMutation = `
              mutation AddToolCall($mcpToolId: ID!, $calledById: ID!${executedById ? ', $executedById: ID!' : ''}) {
                addToolCall(input: {
                  toolInput: "${escapedInput}"
                  calledAt: "${toolCall.calledAt}"
                  status: ${toolCall.status}
                  ${toolCall.completedAt ? `completedAt: "${toolCall.completedAt}"` : ''}
                  ${toolCall.toolOutput ? `toolOutput: "${escapedOutput}"` : ''}
                  ${toolCall.error ? `error: "${escapedError}"` : ''}
                  calledBy: { id: $calledById }
                  mcpTool: { id: $mcpToolId }
                  ${executedById ? 'executedBy: { id: $executedById }' : ''}
                }) {
                  toolCall {
                    id
                  }
                }
              }
            `;
            try {
              await dgraphQL(toolCallMutation, {
                mcpToolId,
                calledById,
                ...(executedById ? { executedById } : {}),
              });
            } catch (error) {
              console.warn('Failed to seed tool call:', error);
            }
          }
        }
      }

      // Wait a bit for data to be committed
      await new Promise((resolve) => setTimeout(resolve, 500));
    };

    await use(seed);
  },

  /**
   * Get database state fixture
   * Returns current database state for debugging/assertions
   */
  getDatabaseState: async ({ graphql }, use) => {
    const getState = async (): Promise<DatabaseState> => {
      // First get workspaces and system (no auth required)
      const query1 = `
        query GetDatabaseState {
          workspace {
            id
            name
          }
          system {
            id
            initialized
          }
        }
      `;

      const result1 = await graphql<{
        workspace: any[];
        system: any;
      }>(query1);

      const workspaces = result1.workspace || [];
      const workspaceId = workspaces[0]?.id;

      // If we have a workspace, get MCP servers for it
      let mcpServers: any[] = [];
      if (workspaceId) {
        const query2 = `
          query GetMCPServers($workspaceId: ID!) {
            mcpServers(workspaceId: $workspaceId) {
              id
              name
              transport
            }
          }
        `;
        const result2 = await graphql<{
          mcpServers: any[];
        }>(query2, { workspaceId });
        mcpServers = result2.mcpServers || [];
      }

      return {
        workspaces,
        users: [], // Cannot query users without auth - tests should seed and track separately
        mcpServers,
        system: result1.system,
      };
    };

    await use(getState);
  },
});

// ============================================================================
// Seed Presets
// ============================================================================

/**
 * Common seed data presets for different test scenarios
 */
export const seedPresets = {
  /**
   * Single workspace with no additional data
   */
  defaultWorkspace: {
    workspaces: [
      {
        name: 'Default Workspace',
        description: 'Default testing workspace',
      },
    ],
  },

  /**
   * Multiple workspaces for testing workspace management
   */
  multipleWorkspaces: {
    workspaces: [
      {
        name: 'Development',
        description: 'Development environment',
      },
      {
        name: 'Production',
        description: 'Production environment',
      },
      {
        name: 'Testing',
        description: 'Testing environment',
      },
    ],
  },

  /**
   * Workspace with MCP servers
   */
  workspaceWithServers: {
    workspaces: [
      {
        name: 'Development',
        description: 'Development workspace',
      },
    ],
    mcpServers: [
      {
        name: 'Filesystem Server',
        transport: 'STDIO' as const,
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
      },
      {
        name: 'GitHub Server',
        transport: 'STDIO' as const,
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
      },
    ],
  },

  /**
   * Complete setup with users, workspaces, and servers
   */
  fullSetup: {
    workspaces: [
      {
        name: 'Main Workspace',
        description: 'Main testing workspace',
      },
    ],
    users: [
      {
        email: 'test@example.com',
        password: 'testpassword123',
        name: 'Test User',
      },
    ],
    mcpServers: [
      {
        name: 'Filesystem Server',
        transport: 'STDIO' as const,
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
      },
    ],
  },

  /**
   * Setup with test users for authentication tests
   */
  withUsers: {
    users: [
      {
        email: 'user1@example.com',
        password: 'password123',
      },
      {
        email: 'user2@example.com',
        password: 'password456',
      },
    ],
  },

  /**
   * Comprehensive seed data for deep linking and navigation tests
   * Includes: users, workspaces, MCP servers, tools, runtimes (agents), and tool calls
   * This preset is imported from seed-data.ts for maintainability
   */
  get comprehensive() {
    return comprehensiveSeededData;
  },
} satisfies Record<string, SeedData | { comprehensive: SeedData }>;

// Re-export expect for convenience
export { expect } from '@playwright/test';
