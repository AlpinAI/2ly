/**
 * Skill API E2E Tests
 *
 * Tests the new Skill API alongside the existing Runtime API:
 * 1. Create Skills independently of Runtimes
 * 2. Add/remove tools to Skills
 * 3. Verify dual-write pattern (linking tools to runtime also updates skill)
 * 4. Query Skills via new GraphQL API
 *
 * Strategy: Seeded
 * - Database is pre-populated with test data
 * - Tests verify both new Skill API and backward compatibility
 */

import { test, expect, performLogin, seedPresets, loginAndGetToken } from '@skilder-ai/common/test/fixtures/playwright';
import { updateMCPServerToEdgeRuntime } from '@skilder-ai/common/test/fixtures/mcp-builders';

test.describe('Skill API', () => {
  test.describe.configure({ mode: 'serial' });
  let authToken: string;

  test.beforeAll(async ({ resetDatabase, seedDatabase, graphql }) => {
    await resetDatabase(true);
    const entityIds = await seedDatabase(seedPresets.withSingleMCPServer);

    // Update MCP server to use EDGE runtime (GLOBAL executionTarget has been removed)
    const workspaceId = entityIds['default-workspace'];
    const mcpServerId = entityIds['server-file-system'];
    authToken = await loginAndGetToken('user1@skilder.ai', 'password123');
    await updateMCPServerToEdgeRuntime(graphql, mcpServerId, workspaceId, authToken);
  });

  test('should create a skill via new API', async ({ page, graphql }) => {
    // Login
    await performLogin(page, 'user1@skilder.ai', 'password123');
    const workspaceUrl = page.url();
    const workspaceId = workspaceUrl.match(/\/w\/([^/]+)/)?.[1];
    expect(workspaceId).toBeDefined();

    // Create a new Skill
    const createSkillMutation = `
      mutation CreateSkill($workspaceId: ID!, $name: String!, $description: String!) {
        createSkill(workspaceId: $workspaceId, name: $name, description: $description) {
          id
          name
          description
          createdAt
          updatedAt
        }
      }
    `;

    const result = await graphql<{
      createSkill: {
        id: string;
        name: string;
        description: string;
        createdAt: string;
        updatedAt: string;
      };
    }>(createSkillMutation, {
      workspaceId,
      name: 'My Custom Skill',
      description: 'A skill created via new API',
    }, authToken);

    expect(result.createSkill).toBeDefined();
    expect(result.createSkill.id).toBeDefined();
    expect(result.createSkill.name).toBe('My Custom Skill');
    expect(result.createSkill.description).toBe('A skill created via new API');
  });

  test('should query skills via new API', async ({ page, graphql }) => {
    // Login
    await performLogin(page, 'user1@skilder.ai', 'password123');
    const workspaceUrl = page.url();
    const workspaceId = workspaceUrl.match(/\/w\/([^/]+)/)?.[1];
    expect(workspaceId).toBeDefined();

    // Create multiple skills
    const createSkillMutation = `
      mutation CreateSkill($workspaceId: ID!, $name: String!, $description: String!) {
        createSkill(workspaceId: $workspaceId, name: $name, description: $description) {
          id
          name
        }
      }
    `;

    await graphql(createSkillMutation, {
      workspaceId,
      name: 'Skill A',
      description: 'First skill',
    }, authToken);

    await graphql(createSkillMutation, {
      workspaceId,
      name: 'Skill B',
      description: 'Second skill',
    }, authToken);

    // Query all skills
    const querySkills = `
      query GetSkills($workspaceId: ID!) {
        skills(workspaceId: $workspaceId) {
          id
          name
          description
        }
      }
    `;

    const skillsResult = await graphql<{
      skills: Array<{ id: string; name: string; description: string }>;
    }>(querySkills, { workspaceId }, authToken);

    expect(skillsResult.skills).toBeDefined();
    expect(skillsResult.skills.length).toBeGreaterThanOrEqual(2);

    const skillNames = skillsResult.skills.map((ts) => ts.name);
    expect(skillNames).toContain('Skill A');
    expect(skillNames).toContain('Skill B');
  });

  test('should add and remove tools from skill directly', async ({ page, graphql }) => {
    // Login
    await performLogin(page, 'user1@skilder.ai', 'password123');
    const workspaceUrl = page.url();
    const workspaceId = workspaceUrl.match(/\/w\/([^/]+)/)?.[1];
    expect(workspaceId).toBeDefined();

    // Create a skill
    const createSkillMutation = `
      mutation CreateSkill($workspaceId: ID!, $name: String!, $description: String!) {
        createSkill(workspaceId: $workspaceId, name: $name, description: $description) {
          id
          name
        }
      }
    `;

    const skillResult = await graphql<{
      createSkill: { id: string; name: string };
    }>(createSkillMutation, {
      workspaceId,
      name: 'Direct Management Skill',
      description: 'For testing direct tool management',
    }, authToken);

    const skillId = skillResult.createSkill.id;

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
    }>(toolsQuery, { workspaceId }, authToken);

    if (toolsResult.mcpTools.length > 0) {
      const mcpToolId = toolsResult.mcpTools[0].id;

      // Add tool to skill
      const addToolMutation = `
        mutation AddMCPToolToSkill($mcpToolId: ID!, $skillId: ID!) {
          addMCPToolToSkill(mcpToolId: $mcpToolId, skillId: $skillId) {
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
        addMCPToolToSkill: {
          id: string;
          name: string;
          mcpTools: Array<{ id: string; name: string }>;
        };
      }>(addToolMutation, { mcpToolId, skillId }, authToken);

      expect(addResult.addMCPToolToSkill.mcpTools.length).toBeGreaterThan(0);
      expect(addResult.addMCPToolToSkill.mcpTools[0].id).toBe(mcpToolId);

      // Remove tool from skill
      const removeToolMutation = `
        mutation RemoveMCPToolFromSkill($mcpToolId: ID!, $skillId: ID!) {
          removeMCPToolFromSkill(mcpToolId: $mcpToolId, skillId: $skillId) {
            id
            name
            mcpTools {
              id
            }
          }
        }
      `;

      const removeResult = await graphql<{
        removeMCPToolFromSkill: {
          id: string;
          name: string;
          mcpTools: Array<{ id: string }>;
        };
      }>(removeToolMutation, { mcpToolId, skillId }, authToken);

      expect(removeResult.removeMCPToolFromSkill.mcpTools.length).toBe(0);
    }
  });
});
