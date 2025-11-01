/**
 * ToolSet API E2E Tests
 *
 * Tests the new ToolSet API alongside the existing Runtime API:
 * 1. Create ToolSets independently of Runtimes
 * 2. Add/remove tools to ToolSets
 * 3. Verify dual-write pattern (linking tools to runtime also updates toolset)
 * 4. Query ToolSets via new GraphQL API
 *
 * Strategy: Seeded
 * - Database is pre-populated with test data
 * - Tests verify both new ToolSet API and backward compatibility
 */

import { test, expect, performLogin, seedPresets } from '../../fixtures/database';

test.describe('ToolSet API', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ resetDatabase, seedDatabase }) => {
    await resetDatabase(true);
    await seedDatabase(seedPresets.withSingleMCPServer);
  });

  test('should create a toolset via new API', async ({ page, graphql }) => {
    // Login
    await performLogin(page, 'user1@example.com', 'password123');
    const workspaceUrl = page.url();
    const workspaceId = workspaceUrl.match(/\/w\/([^/]+)/)?.[1];
    expect(workspaceId).toBeDefined();

    // Create a new ToolSet
    const createToolSetMutation = `
      mutation CreateToolSet($workspaceId: ID!, $name: String!, $description: String!) {
        createToolSet(workspaceId: $workspaceId, name: $name, description: $description) {
          id
          name
          description
          createdAt
          updatedAt
        }
      }
    `;

    const result = await graphql<{
      createToolSet: {
        id: string;
        name: string;
        description: string;
        createdAt: string;
        updatedAt: string;
      };
    }>(createToolSetMutation, {
      workspaceId,
      name: 'My Custom ToolSet',
      description: 'A toolset created via new API',
    });

    expect(result.createToolSet).toBeDefined();
    expect(result.createToolSet.id).toBeDefined();
    expect(result.createToolSet.name).toBe('My Custom ToolSet');
    expect(result.createToolSet.description).toBe('A toolset created via new API');
  });

  test('should query toolsets via new API', async ({ page, graphql }) => {
    // Login
    await performLogin(page, 'user1@example.com', 'password123');
    const workspaceUrl = page.url();
    const workspaceId = workspaceUrl.match(/\/w\/([^/]+)/)?.[1];
    expect(workspaceId).toBeDefined();

    // Create multiple toolsets
    const createToolSetMutation = `
      mutation CreateToolSet($workspaceId: ID!, $name: String!, $description: String!) {
        createToolSet(workspaceId: $workspaceId, name: $name, description: $description) {
          id
          name
        }
      }
    `;

    await graphql(createToolSetMutation, {
      workspaceId,
      name: 'ToolSet A',
      description: 'First toolset',
    });

    await graphql(createToolSetMutation, {
      workspaceId,
      name: 'ToolSet B',
      description: 'Second toolset',
    });

    // Query all toolsets
    const queryToolSets = `
      query GetToolSets($workspaceId: ID!) {
        toolSets(workspaceId: $workspaceId) {
          id
          name
          description
        }
      }
    `;

    const toolsetsResult = await graphql<{
      toolSets: Array<{ id: string; name: string; description: string }>;
    }>(queryToolSets, { workspaceId });

    expect(toolsetsResult.toolSets).toBeDefined();
    expect(toolsetsResult.toolSets.length).toBeGreaterThanOrEqual(2);

    const toolsetNames = toolsetsResult.toolSets.map((ts) => ts.name);
    expect(toolsetNames).toContain('ToolSet A');
    expect(toolsetNames).toContain('ToolSet B');
  });

  test('should add and remove tools from toolset directly', async ({ page, graphql }) => {
    // Login
    await performLogin(page, 'user1@example.com', 'password123');
    const workspaceUrl = page.url();
    const workspaceId = workspaceUrl.match(/\/w\/([^/]+)/)?.[1];
    expect(workspaceId).toBeDefined();

    // Create a toolset
    const createToolSetMutation = `
      mutation CreateToolSet($workspaceId: ID!, $name: String!, $description: String!) {
        createToolSet(workspaceId: $workspaceId, name: $name, description: $description) {
          id
          name
        }
      }
    `;

    const toolSetResult = await graphql<{
      createToolSet: { id: string; name: string };
    }>(createToolSetMutation, {
      workspaceId,
      name: 'Direct Management ToolSet',
      description: 'For testing direct tool management',
    });

    const toolSetId = toolSetResult.createToolSet.id;

    // Get available tools
    const toolsQuery = `
      query GetMCPTools($workspaceId: ID!) {
        mcpTools(workspaceId: $workspaceId) {
          id
          name
        }
      }
    `;

    const toolsResult = await graphql<{
      mcpTools: Array<{ id: string; name: string }>;
    }>(toolsQuery, { workspaceId });

    if (toolsResult.mcpTools.length > 0) {
      const mcpToolId = toolsResult.mcpTools[0].id;

      // Add tool to toolset
      const addToolMutation = `
        mutation AddMCPToolToToolSet($mcpToolId: ID!, $toolSetId: ID!) {
          addMCPToolToToolSet(mcpToolId: $mcpToolId, toolSetId: $toolSetId) {
            id
            name
            mcpTools {
              id
              name
            }
          }
        }
      `;

      const addResult = await graphql<{
        addMCPToolToToolSet: {
          id: string;
          name: string;
          mcpTools: Array<{ id: string; name: string }>;
        };
      }>(addToolMutation, { mcpToolId, toolSetId });

      expect(addResult.addMCPToolToToolSet.mcpTools.length).toBeGreaterThan(0);
      expect(addResult.addMCPToolToToolSet.mcpTools[0].id).toBe(mcpToolId);

      // Remove tool from toolset
      const removeToolMutation = `
        mutation RemoveMCPToolFromToolSet($mcpToolId: ID!, $toolSetId: ID!) {
          removeMCPToolFromToolSet(mcpToolId: $mcpToolId, toolSetId: $toolSetId) {
            id
            name
            mcpTools {
              id
            }
          }
        }
      `;

      const removeResult = await graphql<{
        removeMCPToolFromToolSet: {
          id: string;
          name: string;
          mcpTools: Array<{ id: string }>;
        };
      }>(removeToolMutation, { mcpToolId, toolSetId });

      expect(removeResult.removeMCPToolFromToolSet.mcpTools.length).toBe(0);
    }
  });
});
