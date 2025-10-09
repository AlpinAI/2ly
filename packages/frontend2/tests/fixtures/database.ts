import { test as base } from '@playwright/test';

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
  resetDatabase: async ({ graphql }, use) => {
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
          await graphql(mutation, workspace);
        }
      }

      // Seed users
      if (data.users && data.users.length > 0) {
        // Use initSystem for the first user (this initializes the system)
        const firstUser = data.users[0];
        const initMutation = `
          mutation InitSystem($email: String!, $adminPassword: String!) {
            initSystem(email: $email, adminPassword: $adminPassword) {
              id
              initialized
            }
          }
        `;
        await graphql(initMutation, {
          email: firstUser.email,
          adminPassword: firstUser.password,
        });

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

      // Seed MCP servers
      if (data.mcpServers) {
        for (const server of data.mcpServers) {
          const mutation = `
            mutation CreateMCPServer(
              $name: String!
              $transport: MCPTransport!
              $command: String
              $args: [String!]
            ) {
              addMCPServer(input: {
                name: $name
                transport: $transport
                command: $command
                args: $args
              }) {
                mCPServer {
                  id
                  name
                }
              }
            }
          `;
          await graphql(mutation, server);
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
} satisfies Record<string, SeedData>;

// Re-export expect for convenience
export { expect } from '@playwright/test';
