/**
 * Database Fixtures for Backend Integration Tests
 *
 * Provides utilities for managing database state in Vitest integration tests:
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
    name?: string;
  }>;
  mcpServers?: Array<{
    name: string;
    description?: string;
    repositoryUrl?: string;
    transport: 'STDIO' | 'SSE' | 'STREAM';
    config: string; // JSON string containing Package or Transport config
  }>;
}

export interface DatabaseState {
  workspaces: any[];
  users: any[];
  mcpServers: any[];
  system: any;
}

// ============================================================================
// Fixture Functions
// ============================================================================

/**
 * Get the API URL from environment (set by global setup)
 */
function getApiUrl(): string {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error('API_URL not set. Ensure global setup has run.');
  }
  return apiUrl;
}

/**
 * Execute a GraphQL query against the backend
 */
export async function graphql<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
  const response = await fetch(`${getApiUrl()}/graphql`, {
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
}

/**
 * Reset the database to empty state
 * WARNING: This will delete ALL data!
 */
export async function resetDatabase(): Promise<void> {
  const resetUrl = `${getApiUrl()}/reset`;

  const response = await fetch(resetUrl, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to reset database: ${response.statusText}`);
  }

  // Wait for the reset to complete
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

/**
 * Seed the database with predefined test data
 */
export async function seedDatabase(data: SeedData): Promise<void> {
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
  if (data.users) {
    for (const user of data.users) {
      const mutation = `
        mutation CreateUser($email: String!, $name: String) {
          addUser(input: {
            email: $email
            name: $name
          }) {
            user {
              id
              email
            }
          }
        }
      `;
      await graphql(mutation, user);
    }
  }

  // Seed MCP servers
  if (data.mcpServers) {
    for (const server of data.mcpServers) {
      const mutation = `
        mutation CreateMCPServer(
          $name: String!
          $description: String!
          $repositoryUrl: String!
          $transport: MCPTransportType!
          $config: String!
          $workspaceId: ID!
        ) {
          createMCPServer(
            name: $name
            description: $description
            repositoryUrl: $repositoryUrl
            transport: $transport
            config: $config
            workspaceId: $workspaceId
          ) {
            id
            name
          }
        }
      `;
      await graphql(mutation, {
        name: server.name,
        description: server.description || '',
        repositoryUrl: server.repositoryUrl || 'https://github.com/example/server',
        transport: server.transport,
        config: server.config,
        workspaceId: 'default', // TODO: Get actual workspace ID
      });
    }
  }

  // Wait for data to be committed
  await new Promise((resolve) => setTimeout(resolve, 500));
}

/**
 * Get current database state (for debugging/assertions)
 */
export async function getDatabaseState(): Promise<DatabaseState> {
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
}

/**
 * Make a direct HTTP request to the backend
 */
export async function request(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${getApiUrl()}${path}`, options);
}

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
        description: 'File system operations',
        repositoryUrl: 'https://github.com/modelcontextprotocol/server-filesystem',
        transport: 'STDIO' as const,
        config: JSON.stringify({
          identifier: 'npm:@modelcontextprotocol/server-filesystem',
          packageArguments: [
            {
              name: 'path',
              type: 'string',
              value: '/tmp',
              isRequired: true,
            },
          ],
          environmentVariables: [],
        }),
      },
      {
        name: 'GitHub Server',
        description: 'GitHub integration',
        repositoryUrl: 'https://github.com/modelcontextprotocol/server-github',
        transport: 'STDIO' as const,
        config: JSON.stringify({
          identifier: 'npm:@modelcontextprotocol/server-github',
          packageArguments: [],
          environmentVariables: [],
        }),
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
        name: 'Test User',
      },
    ],
    mcpServers: [
      {
        name: 'Filesystem Server',
        description: 'File system operations',
        repositoryUrl: 'https://github.com/modelcontextprotocol/server-filesystem',
        transport: 'STDIO' as const,
        config: JSON.stringify({
          identifier: 'npm:@modelcontextprotocol/server-filesystem',
          packageArguments: [
            {
              name: 'path',
              type: 'string',
              value: '/tmp',
              isRequired: true,
            },
          ],
          environmentVariables: [],
        }),
      },
    ],
  },
} satisfies Record<string, SeedData>;
