/* eslint-disable @typescript-eslint/no-explicit-any */
import { test as base, type Page } from '@playwright/test';
import { comprehensiveSeededData } from '../e2e/fixtures/seed-data';
import { dgraphQL } from './dgraph-client';
import { hashPassword, startRuntime, stopRuntime } from '@2ly/common/test/testcontainers';
import { dgraphResolversTypes } from '@2ly/common';
import type { RegistryServerSeed, MCPServerSeed, OmitGenerated } from './mcp-types';
import { buildFilesystemRegistryServer, buildMinimalFilesystemServer } from './mcp-builders';

/**
 * Database Fixture for Playwright Tests
 *
 * Provides utilities for managing database state across different test strategies:
 * - resetDatabase: Drop all data and start fresh
 * - seedDatabase: Populate database with predefined test data
 * - graphql: Execute GraphQL queries against the backend
 * - getDatabaseState: Inspect current database state
 * - performLogin: Helper to log in a user (for authenticated test scenarios)
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Seed data interface - uses dgraphResolversTypes for consistency with schema
 * Object references are converted to string IDs for seeding convenience
 */
export interface SeedData {
  workspaces?: Array<Pick<dgraphResolversTypes.Workspace, 'name'>>;
  users?: Array<Pick<dgraphResolversTypes.User, 'email' | 'password'>>;
  mcpServers?: Array<MCPServerSeed>;
  registryServers?: Array<RegistryServerSeed>;
  tools?: Array<OmitGenerated<dgraphResolversTypes.McpTool, 'runtimes' | 'toolCalls' | 'workspace' | 'mcpServer'> & {
    mcpServerId: string; // ID reference for seeding
  }
  >;
  runtimes?: Array<OmitGenerated<dgraphResolversTypes.Runtime, 'mcpToolCapabilities' | 'mcpServers' | 'toolCalls' | 'toolResponses' | 'workspace'> & {
    workspaceId: string; // ID reference for seeding
  }
  >;
  toolCalls?: Array<
    OmitGenerated<dgraphResolversTypes.ToolCall, 'executedBy' | 'calledBy' | 'calledAt' | 'completedAt' | 'mcpTool'> & {
      calledAt: string; // DateTime as string for seeding
      completedAt?: string; // DateTime as string for seeding
      mcpToolId: string; // ID reference for seeding
      calledById: string; // ID reference for seeding
      executedById?: string; // ID reference for seeding
    }
  >;
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
  resetDatabase: (shouldStartRuntime?: boolean) => Promise<void>;

  /**
   * Seed the database with predefined test data
   * Returns a map of entity keys to their generated IDs
   */
  seedDatabase: (data: SeedData) => Promise<Record<string, string>>;

  /**
   * Execute a GraphQL query against the backend
   */
  graphql: <T = any>(query: string, variables?: Record<string, any>) => Promise<T>;

  /**
   * Get current database state (for debugging/assertions)
   */
  getDatabaseState: () => Promise<DatabaseState>;

  /**
   * Get the default workspace ID
   * Useful for tests that need to interact with workspace-specific resources
   */
  workspaceId: string;
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
   * Optionally starts runtime container if startRuntime is true
   */
  // eslint-disable-next-line no-empty-pattern
  resetDatabase: async ({ }, use) => {
    const reset = async (shouldStartRuntime?: boolean) => {
      try {
        await stopRuntime();
      } catch (error) {
        throw new Error(`Failed to stop runtime: ${error instanceof Error ? error.message : String(error)}`);
      }

      const apiUrl = process.env.API_URL || 'http://localhost:3000';
      const resetUrl = `${apiUrl}/reset`;

      // Call backend's reset endpoint
      const response = await fetch(resetUrl, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to reset database: ${response.statusText}`);
      }

      // Wait a bit for the reset to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Start runtime container if requested
      if (shouldStartRuntime) {
        try {
          await startRuntime();
        } catch (error) {
          throw new Error(`Failed to start runtime: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
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
  seedDatabase: async ({ graphql: _graphql }, use) => {
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
          // Hash the password before storing
          const hashedPassword = await hashPassword(user.password);
          const userMutation = `
            mutation AddUser($workspaceId: ID!) {
              addUser(input: {
                email: "${user.email}"
                password: "${hashedPassword}"
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
                packages: "${JSON.stringify(registryServer.packages ?? []).replace(/"/g, '\\"')}"
                remotes: "${JSON.stringify(registryServer.remotes ?? []).replace(/"/g, '\\"')}"
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
        for (const server of data.mcpServers) {
          const normalizedName = server.name.toLowerCase().replace(/\s+/g, '-');

          // Use provided registryServerId or look up by normalized name
          const registryServerId = server.registryServerId ?? entityIds[`registry-${normalizedName}`];

          if (registryServerId) {
            const configStr = JSON.stringify(server.config).replace(/"/g, '\\"');
            const serverMutation = `
              mutation AddMCPServer($workspaceId: ID!, $registryServerId: ID!) {
                addMCPServer(input: {
                  name: "${server.name}"
                  description: "${server.description}"
                  repositoryUrl: "${server.repositoryUrl}"
                  transport: ${server.transport}
                  config: "${configStr}"
                  runOn: ${server.runOn}
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
            // Store server ID for cross-referencing
            entityIds[`server-${normalizedName}`] = result.addMCPServer.mCPServer[0].id;
          }
        }
      }

      // 6. Create Runtimes (agents and edge runtimes)
      if (data.runtimes && workspaceId) {
        const runtimeKeys = ['claude-desktop-agent', 'web-assistant-agent', 'edge-runtime'];
        for (let i = 0; i < data.runtimes.length; i++) {
          const runtime = data.runtimes[i];
          const capsStr = runtime.capabilities?.map((c: string) => `"${c}"`).join(', ') ?? '';
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

      return entityIds;
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

  /**
   * Workspace ID fixture
   * Provides the default workspace ID for tests to use
   */
  workspaceId: async ({ graphql }, use) => {
    const query = `
      query GetWorkspaceId {
        workspace {
          id
        }
      }
    `;

    const result = await graphql<{
      workspace: Array<{ id: string }>;
    }>(query);

    const workspaceId = result.workspace[0]?.id;

    if (!workspaceId) {
      throw new Error('No workspace found. Make sure to seed the database before using workspaceId fixture.');
    }

    await use(workspaceId);
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
      },
      {
        name: 'Production',
      },
      {
        name: 'Testing',
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
      },
    ],
    registryServers: [
      buildFilesystemRegistryServer(),
      buildFilesystemRegistryServer({
        name: '@modelcontextprotocol/server-github',
        title: 'GitHub Server',
        description: 'GitHub MCP server',
      }),
    ],
    mcpServers: [
      buildMinimalFilesystemServer({ name: 'Filesystem Server' }),
      buildMinimalFilesystemServer({
        name: 'GitHub Server',
        description: 'GitHub MCP server',
      }),
    ],
  },

  /**
   * Complete setup with users, workspaces, and servers
   */
  fullSetup: {
    workspaces: [
      {
        name: 'Main Workspace',
      },
    ],
    users: [
      {
        email: 'test@example.com',
        password: 'testpassword123',
      },
    ],
    registryServers: [buildFilesystemRegistryServer()],
    mcpServers: [buildMinimalFilesystemServer({ name: 'Filesystem Server' })],
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

  /**
   * Minimal setup with a single MCP server (filesystem) using typed config
   * Perfect for basic MCP server testing without the overhead of comprehensive data
   */
  withSingleMCPServer: {
    users: [
      {
        email: 'user1@example.com',
        password: 'password123',
      },
    ],
    registryServers: [buildFilesystemRegistryServer()],
    mcpServers: [buildMinimalFilesystemServer({ name: '@modelcontextprotocol/server-filesystem' })],
  },
} satisfies Record<string, SeedData | { comprehensive: SeedData }>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Perform login for a user
 *
 * This helper function automates the login flow for authenticated test scenarios.
 * It navigates to /login, fills in credentials, submits the form, and waits for
 * the workspace redirect.
 *
 * @param page - Playwright page object
 * @param email - User email
 * @param password - User password
 */
export async function performLogin(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');

  // Fill in credentials
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  // Submit the form
  await page.click('button[type="submit"]');

  // Wait for redirect to workspace
  await page.waitForURL(/\/w\/.+\/overview/, { timeout: 5000 });
}

// Re-export expect for convenience
export { expect } from '@playwright/test';
