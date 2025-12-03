/**
 * Core Test Fixtures (Framework-Agnostic)
 *
 * Provides framework-independent utilities for managing database state in tests:
 * - graphql: Execute GraphQL queries against the backend
 * - resetDatabase: Drop all data and start fresh
 * - getDatabaseState: Inspect current database state
 * - request: Make HTTP requests to the backend
 * - seedDatabase: Populate database with predefined test data
 *
 * These functions can be used directly in Vitest integration tests or wrapped
 * in Playwright fixtures for E2E tests.
 */

import type { SeedData } from './seed-data.types';
import { dgraphQL } from './dgraph-client';
import { hashPassword } from '@2ly/common/test/test.containers';
import { testWarn } from '../test.containers.logger';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the API URL from environment
 */
function getApiUrl(): string {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error('API_URL not set. Ensure global setup has run.');
  }
  return apiUrl;
}

// ============================================================================
// Core Fixture Functions
// ============================================================================

/**
 * Execute a GraphQL query against the backend
 * @param authToken - Optional JWT token for authenticated requests
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function graphql<T = any>(query: string, variables?: Record<string, any>, authToken?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${getApiUrl()}/graphql`, {
    method: 'POST',
    headers,
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
export async function resetDatabase(retry = 3): Promise<void> {
  const resetUrl = `${getApiUrl()}/reset`;

  try {
    const response = await fetch(resetUrl, {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error(`Failed to reset database: ${response.statusText}`);
    }
    // Wait for the reset to complete
    await new Promise((resolve) => setTimeout(resolve, 100));
  } catch (error) {
    testWarn(`Failed to reset database: ${error instanceof Error ? error.message : String(error)}`);
    if (retry > 0) {
      await new Promise((resolve) => setTimeout(resolve, (3-retry) * 1000));
      await resetDatabase(retry - 1);
    } else {
      throw error;
    }
  }
}

/**
 * Make a direct HTTP request to the backend
 */
export async function request(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${getApiUrl()}${path}`, options);
}

/**
 * Login and get authentication token
 * @returns JWT access token for authenticated requests
 */
export async function loginAndGetToken(email: string, password: string): Promise<string> {
  const loginMutation = `
    mutation Login($input: LoginInput!) {
      login(input: $input) {
        accessToken
        refreshToken
        user {
          id
          email
        }
      }
    }
  `;

  const result = await graphql<{
    login: {
      accessToken: string;
      refreshToken: string;
      user: { id: string; email: string };
    };
  }>(loginMutation, { input: { email, password } });

  return result.login.accessToken;
}

/**
 * Seed the database with comprehensive test data
 *
 * Uses direct Dgraph GraphQL API to support all entity types:
 * - System initialization
 * - Users (with password hashing)
 * - Registry Servers
 * - MCP Servers
 * - Tools
 * - Skills (with tool linking)
 * - Runtimes
 * - ToolCalls
 *
 * Returns a map of entity IDs for cross-referencing in tests.
 */
export async function seedDatabase(data: SeedData): Promise<Record<string, string>> {
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
    const runtimeKeys = ['main-runtime', 'stage-runtime', 'edge-runtime'];
    for (let i = 0; i < data.runtimes.length; i++) {
      const runtime = data.runtimes[i];
      const type = runtime.type ?? 'MCP';
      const runtimeMutation = `
        mutation AddRuntime($workspaceId: ID!) {
          addRuntime(input: {
            name: "${runtime.name}"
            description: "${runtime.description}"
            status: ACTIVE
            type: ${type}
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
          testWarn(`Failed to seed tool ${tool.name}:`, error);
        }
      }
    }
  }

  // 8. Create Skills
  if (data.skills && workspaceId) {
    const skillKeys = ['claude-desktop-agent', 'web-assistant-agent'];
    for (let i = 0; i < data.skills.length; i++) {
      const skill = data.skills[i];
      // Create the skill first
      const skillMutation = `
        mutation AddSkill($workspaceId: ID!) {
          addSkill(input: {
            name: "${skill.name}"
            description: "${skill.description ?? ''}"
            createdAt: "${now}"
            workspace: { id: $workspaceId }
          }) {
            skill {
              id
              name
            }
          }
        }
      `;
      try {
        const result = await dgraphQL<{
          addSkill: { skill: Array<{ id: string; name: string }> };
        }>(skillMutation, { workspaceId });

        const skillId = result.addSkill.skill[0].id;
        const skillKey = skill.name.toLowerCase().replace(/\s+/g, '-');
        entityIds[`skill-${skillKey}`] = skillId;
        // Store skill ID for cross-referencing
        entityIds[skillKeys[i]] = skillId;

        // Link tools to the skill using direct Dgraph mutations
        if (skill.toolIds && skill.toolIds.length > 0) {
          const toolIdsToLink: string[] = [];
          for (const toolName of skill.toolIds) {
            const toolKey = toolName.replace(/[^a-zA-Z0-9]/g, '_');
            const toolId = entityIds[toolKey];
            if (toolId) {
              toolIdsToLink.push(toolId);
            }
          }

          if (toolIdsToLink.length > 0) {
            const toolRefs = toolIdsToLink.map(id => `{ id: "${id}" }`).join(', ');
            const linkMutation = `
              mutation LinkToolsToSkill($skillId: ID!) {
                updateSkill(input: {
                  filter: { id: [$skillId] }
                  set: {
                    mcpTools: [${toolRefs}]
                  }
                }) {
                  skill {
                    id
                    name
                  }
                }
              }
            `;
            try {
              await dgraphQL(linkMutation, { skillId });
            } catch (error) {
              testWarn(`Failed to link tools to skill ${skill.name}:`, error);
            }
          }
        }
      } catch (error) {
        testWarn(`Failed to seed skill ${skill.name}:`, error);
      }
    }
  }

  // 9. Create Tool Calls
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
              isTest: ${toolCall.isTest}
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
          testWarn('Failed to seed tool call:', error);
        }
      }
    }
  }

  // Wait a bit for data to be committed
  await new Promise((resolve) => setTimeout(resolve, 500));

  return entityIds;
}

/**
 * Get current database state (for debugging/assertions)
 *
 * Uses direct Dgraph queries to bypass Apollo authentication requirements.
 * This is a test utility function that needs to work regardless of auth state.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getDatabaseState(): Promise<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workspaces: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  users: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mcpServers: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  system: any;
}> {
  // Query workspaces and system directly from Dgraph
  const query1 = `
    query GetDatabaseState {
      queryWorkspace {
        id
        name
      }
      querySystem {
        id
        initialized
      }
    }
  `;

  const result1 = await dgraphQL<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryWorkspace: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    querySystem: any[];
  }>(query1);

  const workspaces = result1.queryWorkspace || [];
  const system = result1.querySystem?.[0] || null;
  const workspaceId = workspaces[0]?.id;

  // If we have a workspace, get MCP servers for it directly from Dgraph
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mcpServers: any[] = [];
  if (workspaceId) {
    const query2 = `
      query GetMCPServers($workspaceId: ID!) {
        getWorkspace(id: $workspaceId) {
          id
          mcpServers {
            id
            name
            transport
          }
        }
      }
    `;
    const result2 = await dgraphQL<{
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getWorkspace: { mcpServers: any[] } | null;
    }>(query2, { workspaceId });
    mcpServers = result2.getWorkspace?.mcpServers || [];
  }

  return {
    workspaces,
    users: [], // Cannot query users without auth - tests should seed and track separately
    mcpServers,
    system,
  };
}
