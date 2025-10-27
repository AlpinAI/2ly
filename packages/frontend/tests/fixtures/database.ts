/* eslint-disable @typescript-eslint/no-explicit-any */
import { test as base } from '@playwright/test';
import { comprehensiveSeededData } from '../e2e/fixtures/seed-data';

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
   * Populates database with test data
   */
  seedDatabase: async ({ graphql }, use) => {
    const seed = async (data: SeedData) => {
      // Track created entity IDs for cross-referencing
      const entityIds: Record<string, string> = {};

      // Seed users first (initializes system)
      if (data.users && data.users.length > 0) {
        // Use initSystem for the first user (this initializes the system)
        const firstUser = data.users[0];
        const initMutation = `
          mutation InitSystem($email: String!, $adminPassword: String!) {
            initSystem(email: $email, adminPassword: $adminPassword) {
              id
              initialized
              defaultWorkspace {
                id
              }
            }
          }
        `;
        const initResult = await graphql<{
          initSystem: { id: string; defaultWorkspace: { id: string } };
        }>(initMutation, {
          email: firstUser.email,
          adminPassword: firstUser.password,
        });

        // Store the default workspace ID
        if (initResult.initSystem.defaultWorkspace) {
          entityIds['default-workspace'] = initResult.initSystem.defaultWorkspace.id;
        }

        // Use registerUser for remaining users
        for (let i = 1; i < data.users.length; i++) {
          const user = data.users[i];
          const registerMutation = `
            mutation RegisterUser($input: RegisterUserInput!) {
              registerUser(input: $input) {
                success
                user {
                  id
                  email
                }
                errors
              }
            }
          `;
          await graphql(registerMutation, {
            input: {
              email: user.email,
              password: user.password,
            },
          });
        }
      }

      // Seed workspaces
      if (data.workspaces) {
        for (const workspace of data.workspaces) {
          const mutation = `
            mutation CreateWorkspace($name: String!, $description: String) {
              addWorkspace(input: {
                name: $name
                description: $description
              }) {
                workspace {
                  id
                  name
                }
              }
            }
          `;
          const result = await graphql<{
            addWorkspace: { workspace: Array<{ id: string; name: string }> };
          }>(mutation, workspace);
          // Store workspace ID using normalized name as key
          const key = workspace.name.toLowerCase().replace(/\s+/g, '-');
          entityIds[key] = result.addWorkspace.workspace[0].id;
        }
      }

      // Get the workspace ID to use (either from seed or default)
      const workspaceId =
        entityIds['test-workspace'] || entityIds['default-workspace'] || entityIds[Object.keys(entityIds)[0]];

      // Seed registry servers
      if (data.registryServers && workspaceId) {
        for (const registryServer of data.registryServers) {
          const mutation = `
            mutation AddServerToRegistry(
              $workspaceId: ID!
              $name: String!
              $description: String!
              $title: String!
              $repositoryUrl: String!
              $version: String!
              $packages: String
              $remotes: String
            ) {
              addServerToRegistry(
                workspaceId: $workspaceId
                name: $name
                description: $description
                title: $title
                repositoryUrl: $repositoryUrl
                version: $version
                packages: $packages
                remotes: $remotes
              ) {
                id
                name
              }
            }
          `;
          const result = await graphql<{
            addServerToRegistry: { id: string; name: string };
          }>(mutation, {
            ...registryServer,
            workspaceId,
          });
          // Store registry server ID
          entityIds[`registry-${registryServer.name}`] = result.addServerToRegistry.id;
        }
      }

      // Seed MCP servers
      if (data.mcpServers && workspaceId) {
        const serverNames = ['filesystem-server', 'web-fetch-server', 'development-tools', 'database-server'];
        for (let i = 0; i < data.mcpServers.length; i++) {
          const server = data.mcpServers[i];
          // For now, create basic MCP servers without registry linkage
          // This is a simplified approach - in production, you'd properly link to registry
          const registryServerId = entityIds[`registry-${server.name.toLowerCase().replace(/\s+/g, '-')}`];

          if (registryServerId) {
            const mutation = `
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
            const result = await graphql<{
              createMCPServer: { id: string; name: string };
            }>(mutation, {
              name: server.name,
              description: server.name,
              repositoryUrl: 'https://github.com/example/repo',
              transport: server.transport,
              config: JSON.stringify({ command: server.command, args: server.args }),
              workspaceId,
              registryServerId,
            });
            // Store server ID using simplified key
            entityIds[serverNames[i]] = result.createMCPServer.id;
          }
        }
      }

      // Seed runtimes (agents and edge runtimes)
      if (data.runtimes && workspaceId) {
        const runtimeKeys = ['claude-desktop-agent', 'web-assistant-agent', 'edge-runtime'];
        for (let i = 0; i < data.runtimes.length; i++) {
          const runtime = data.runtimes[i];
          const mutation = `
            mutation CreateRuntime(
              $name: String!
              $description: String!
              $capabilities: [String!]!
              $workspaceId: ID!
            ) {
              createRuntime(
                name: $name
                description: $description
                capabilities: $capabilities
                workspaceId: $workspaceId
              ) {
                id
                name
              }
            }
          `;
          const result = await graphql<{
            createRuntime: { id: string; name: string };
          }>(mutation, {
            ...runtime,
            workspaceId,
          });
          // Store runtime ID
          entityIds[runtimeKeys[i]] = result.createRuntime.id;
        }
      }

      // Seed tools
      if (data.tools) {
        for (const tool of data.tools) {
          const mcpServerId = entityIds[tool.mcpServerId];
          if (mcpServerId) {
            // Tools are typically created by the runtime when connecting to MCP servers
            // For testing, we need to use a direct mutation or backend seeding approach
            // This requires a custom mutation or using backend repository directly
            const mutation = `
              mutation AddMCPTool(
                $name: String!
                $description: String!
                $inputSchema: String!
                $annotations: String!
                $status: ActiveStatus!
                $mcpServerId: ID!
                $workspaceId: ID!
              ) {
                addMCPTool(input: {
                  name: $name
                  description: $description
                  inputSchema: $inputSchema
                  annotations: $annotations
                  status: $status
                  createdAt: "${new Date().toISOString()}"
                  lastSeenAt: "${new Date().toISOString()}"
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
              const result = await graphql<{
                addMCPTool: { mCPTool: Array<{ id: string; name: string }> };
              }>(mutation, {
                ...tool,
                mcpServerId,
                workspaceId,
              });
              // Store tool ID using normalized name
              const toolKey = tool.name.replace(/[^a-zA-Z0-9]/g, '_');
              entityIds[toolKey] = result.addMCPTool.mCPTool[0].id;
            } catch (error) {
              // If mutation fails, continue (tools might need runtime to register them)
              console.warn(`Failed to seed tool ${tool.name}:`, error);
            }
          }
        }
      }

      // Seed tool calls
      if (data.toolCalls) {
        for (const toolCall of data.toolCalls) {
          const mcpToolId = entityIds[toolCall.mcpToolId.replace(/[^a-zA-Z0-9]/g, '_')];
          const calledById = entityIds[toolCall.calledById];
          const executedById = toolCall.executedById ? entityIds[toolCall.executedById] : undefined;

          if (mcpToolId && calledById) {
            const mutation = `
              mutation AddToolCall(
                $toolInput: String!
                $calledAt: DateTime!
                $calledById: ID!
                $mcpToolId: ID!
                $status: ToolCallStatus!
                $completedAt: DateTime
                $toolOutput: String
                $error: String
                $executedById: ID
              ) {
                addToolCall(input: {
                  toolInput: $toolInput
                  calledAt: $calledAt
                  status: $status
                  completedAt: $completedAt
                  toolOutput: $toolOutput
                  error: $error
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
              await graphql(mutation, {
                ...toolCall,
                mcpToolId,
                calledById,
                executedById,
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
      const query = `
        query GetDatabaseState {
          workspace: queryWorkspace {
            id
            name
            description
          }
          user: queryUser {
            id
            email
            name
          }
          mCPServer: queryMCPServer {
            id
            name
            transport
          }
          system {
            id
            initialized
          }
        }
      `;

      const result = await graphql<{
        workspace: any[];
        user: any[];
        mCPServer: any[];
        system: any;
      }>(query);

      return {
        workspaces: result.workspace || [],
        users: result.user || [],
        mcpServers: result.mCPServer || [],
        system: result.system,
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
