/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, performLogin, seedPresets } from '../../fixtures/database';
import { buildFilesystemServerConfig } from '../../fixtures/mcp-builders';
import { Page } from '@playwright/test';
import { sendToolsetHandshake, waitForOnboardingStepComplete } from '../../fixtures/nats-helpers';

// TODO: unskip tests when we have a runtime running

/**
 * Onboarding Flow E2E Tests
 *
 * Tests the complete onboarding flow with all three steps:
 * 1. Install an MCP Server
 * 2. Create Your First Tool Set
 * 3. Connect your Agent
 *
 * Strategy: Seeded
 * - Database is pre-populated with test data
 * - Tests run sequentially to follow the onboarding progression
 * - Uses comprehensive seed data with servers, tools, and agents
 */

const configureMCPServer = async (
  graphql: <T = any>(query: string, variables?: Record<string, any>) => Promise<T>,
  workspaceId: string,
  runOn: 'GLOBAL' | 'AGENT' | 'EDGE',
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
  const registryServersResult = await graphql<{ getRegistryServers: { id: string; name: string }[] }>(registryServersQuery, { workspaceId });
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

    await graphql<{ createMCPServer: { id: string; name: string; description: string; repositoryUrl: string; transport: string; config: string; runOn: string } }>(mutation, {
      name: 'Test MCP Server',
      description: 'Test MCP Server Description',
      repositoryUrl: 'https://github.com/test/test',
      transport: 'STDIO',
      config: JSON.stringify(buildFilesystemServerConfig('/tmp')),
      runOn,
      workspaceId,
      registryServerId,
    });
};

const createRuntime = async (
  graphql: <T = any>(query: string, variables?: Record<string, any>) => Promise<T>,
  page: Page,
  workspaceId: string,
  name: string,
  description: string,
  type: 'EDGE' | 'MCP',
) => {
  const mutation = `
    mutation CreateRuntime($name: String!, $description: String!, $type: RuntimeType!, $workspaceId: ID!) {
      createRuntime(name: $name, description: $description, type: $type, workspaceId: $workspaceId) {
        id
        name
        description
        type
      }
    }
  `;
  const result = await graphql<{ createRuntime: { id: string; name: string; description: string; type: 'EDGE' | 'MCP' } }>(mutation, {
    name,
    description,
    type,
    workspaceId,
  });

  // Wait 10s, letting the time to the runtime to spawn the server and discover the tools
  await page.waitForTimeout(10000);

  return {
    runtimeId: result.createRuntime.id,
  };
};

const createToolset = async (
  graphql: <T = any>(query: string, variables?: Record<string, any>) => Promise<T>,
  workspaceId: string,
  name: string,
  description: string,
  nbToolsToLink: number,
) => {
  // get tools
  const toolQuery = `
    query GetTools($workspaceId: ID!) {
      mcpTools(workspaceId: $workspaceId) {
        id
      }
    }
  `;
  const toolResult = await graphql<{ mcpTools: Array<{ id: string }> }>(toolQuery, { workspaceId });

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
    }
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

  for (let i = 0; i < nbToolsToLink; i++) {
    await graphql(addToolMutation, {
      mcpToolId: toolResult.mcpTools[i]!.id,
      toolSetId: toolSetResult.createToolSet.id,
    });
  }

  return {
    toolsetId: toolSetResult.createToolSet.id,
  };
};


test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page, resetDatabase, seedDatabase }) => {
    await resetDatabase(true);

    await seedDatabase(seedPresets.withUsers);

    // Log in with the seeded user credentials
    // Credentials from comprehensive seed: test@example.com / testpassword123
    await performLogin(page, 'user1@example.com', 'password123');
  });

  test('displays all three onboarding steps on initial load', async ({ page }) => {
    // Check that onboarding section is visible
    await expect(page.getByText('Get Started with 2LY')).toBeVisible();
    await expect(page.getByText('Complete these steps to set up your workspace')).toBeVisible();

    // Check step 1: Install MCP Server
    await expect(page.getByRole('heading', { name: 'Install an MCP Server' })).toBeVisible();
    await expect(page.getByText('Add your first MCP server to start using tools')).toBeVisible();

    // Check step 2: Create Tool Set
    await expect(page.getByRole('heading', { name: 'Create Your First Tool Set' })).toBeVisible();
    await expect(page.getByText('Create a tool set with at least one tool')).toBeVisible();

    // Check step 3: Connect Agent
    await expect(page.getByRole('heading', { name: 'Connect your Agent' })).toBeVisible();
    await expect(page.getByText('Connect your tool set to an agent to start using your tools in AI workflows')).toBeVisible();
  });

  test('shows step priority badges', async ({ page }) => {
    // Find the three priority badges (1, 2, 3)
    const badges = page.locator('.absolute.-top-3.-left-3 .flex');
    await expect(badges).toHaveCount(3);

    // Check that badges show correct numbers
    await expect(badges.nth(0)).toContainText('1');
    await expect(badges.nth(1)).toContainText('2');
    await expect(badges.nth(2)).toContainText('3');
  });

  test('step 1 shows Browse MCP Servers button when pending', async ({ page }) => {
    // Should show Browse MCP Servers button
    await expect(page.getByRole('button', { name: /Browse MCP Servers/i })).toBeVisible();
  });

  test('step 1 shows completed status after server is installed', async ({ page, graphql, workspaceId }) => {
    // complete step 1
    await configureMCPServer(graphql, workspaceId, 'GLOBAL');

    // Select the step 1 card containing the step title
    const step1Card = page
      .getByRole('heading', { name: 'Install an MCP Server' })
      .locator('xpath=ancestor::*[contains(@class,"onboarding-card")][1]');

    await expect(step1Card).toBeVisible();

    // Assert: card shows completion status and installed server name
    await expect(step1Card.getByText('Completed', { exact: true })).toBeVisible();
    await expect(step1Card.getByText('Test MCP Server', { exact: true })).toBeVisible();
  });

  test('step 2 shows Create Tool Set button when pending', async ({ page, graphql, workspaceId }) => {
    // complete step 1
    await configureMCPServer(graphql, workspaceId, 'GLOBAL');

    // Select the step 1 card containing the step title
    const step2Card = page
      .getByRole('heading', { name: 'Create Your First Tool Set' })
      .locator('xpath=ancestor::*[contains(@class,"onboarding-card")][1]');    
    
    // Should show Create Tool Set button
    await expect(step2Card.getByRole('button', { name: /Create Tool Set/i })).toBeVisible();
  });

  test('step 2 shows the installed server name', async ({ page, graphql, workspaceId }) => {
    // complete step 1
    await configureMCPServer(graphql, workspaceId, 'GLOBAL');

    // Select the step 1 card containing the step title
    const step1Card = page
      .getByRole('heading', { name: 'Install an MCP Server' })
      .locator('xpath=ancestor::*[contains(@class,"onboarding-card")][1]');    
    
    // Should show the installed server name
    await expect(step1Card.getByText('Test MCP Server', { exact: true })).toBeVisible();
  });

  test('step 3 shows Connect button when agent with tools exists', async ({ page, graphql, workspaceId }) => {
    // complete step 1
    await configureMCPServer(graphql, workspaceId, 'GLOBAL');

    // complete step 2
    await createRuntime(graphql, page, workspaceId, 'My Runtime', 'My runtime description', 'MCP');
    await createToolset(graphql, workspaceId, 'My tool set', 'My tool set description', 1);

    // Select the step 3 card containing the correct step title
    const step3Card = page
      .getByRole('heading', { name: 'Connect your Agent' })
      .locator('xpath=ancestor::*[contains(@class,"onboarding-card")][1]');

    // Wait for Connect button to be visible, replacing static timeout
    await expect(step3Card.getByRole('button', { name: /Connect/i })).toBeVisible();
  });

  test('step 3 Connect button opens Connect Agent dialog', async ({ page, graphql, workspaceId }) => {
    // complete step 1
    await configureMCPServer(graphql, workspaceId, 'GLOBAL');

    // complete step 2
    await createRuntime(graphql, page, workspaceId, 'My Runtime', 'My runtime description', 'MCP');
    await createToolset(graphql, workspaceId, 'My tool set', 'My tool set description', 1);

    // Select the step 3 card containing the correct step title
    const step3Card = page
      .getByRole('heading', { name: 'Connect your Agent' })
      .locator('xpath=ancestor::*[contains(@class,"onboarding-card")][1]');
    const connectButton = step3Card.getByRole('button', { name: /Connect/i });
    await expect(connectButton).toBeVisible();
    await connectButton.click();

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Connect Toolset to 2LY')).toBeVisible();
    await expect(page.getByText(/Toolset:.*My tool set/)).toBeVisible();
    await expect(page.getByText('Select Platform')).toBeVisible();
  });

  test('step 3 shows message when no agent with tools exists', async ({ page, graphql, workspaceId }) => {
    // complete step 1
    await configureMCPServer(graphql, workspaceId, 'GLOBAL');

    // complete step 2 - create runtime but no toolset
    await createRuntime(graphql, page, workspaceId, 'My Runtime', 'My runtime description', 'MCP');

    // Select the step 3 card containing the correct step title
    const step3Card = page
      .getByRole('heading', { name: 'Connect your Agent' })
      .locator('xpath=ancestor::*[contains(@class,"onboarding-card")][1]');

    // Should show message
    await expect(step3Card.getByText(/Create a tool set first to connect to an agent/)).toBeVisible();
  });

  test('step 3 shows completed status after connection', async ({ page, graphql, workspaceId }) => {
    // complete step 1
    await configureMCPServer(graphql, workspaceId, 'GLOBAL');

    // complete step 2
    await createRuntime(graphql, page, workspaceId, 'My Runtime', 'My runtime description', 'MCP');
    const { toolsetId } = await createToolset(graphql, workspaceId, 'My tool set', 'My tool set description', 1);

    // Get the toolset key
    const toolsetKeyQuery = `
      query GetToolsetKey($toolsetId: ID!) {
        toolsetKey(toolsetId: $toolsetId) {
          key
        }
      }
    `;
    const keyResult = await graphql<{ toolsetKey: { key: string } }>(toolsetKeyQuery, { toolsetId });

    // Send toolset handshake to complete step 3
    await sendToolsetHandshake({
      toolsetKey: keyResult.toolsetKey.key,
      toolsetName: 'My tool set',
    });

    // Wait for the onboarding step to be marked as complete
    await waitForOnboardingStepComplete(workspaceId, 'connect-tool-set-to-agent');

    // Select the step 3 card containing the correct step title
    const step3Card = page
      .getByRole('heading', { name: 'Connect your Agent' })
      .locator('xpath=ancestor::*[contains(@class,"onboarding-card")][1]');
    await expect(step3Card.getByText('Completed')).toBeVisible();
    await expect(step3Card.getByText(/My tool set connected/)).toBeVisible();
  });

  test('dismiss onboarding button is visible', async ({ page }) => {
    // Check dismiss button
    await expect(page.getByRole('button', { name: /Dismiss onboarding/i })).toBeVisible();
  });

  test('all completed steps show green styling', async ({ page, graphql, workspaceId }) => {
    // complete step 1
    await configureMCPServer(graphql, workspaceId, 'GLOBAL');

    // complete step 2
    await createRuntime(graphql, page, workspaceId, 'My Runtime', 'My runtime description', 'MCP');
    const { toolsetId } = await createToolset(graphql, workspaceId, 'My tool set', 'My tool set description', 1);

    // Get the toolset key
    const toolsetKeyQuery = `
      query GetToolsetKey($toolsetId: ID!) {
        toolsetKey(toolsetId: $toolsetId) {
          key
        }
      }
    `;
    const keyResult = await graphql<{ toolsetKey: { key: string } }>(toolsetKeyQuery, { toolsetId });

    // Send toolset handshake to complete step 3
    await sendToolsetHandshake({
      toolsetKey: keyResult.toolsetKey.key,
      toolsetName: 'My tool set',
    });

    // Wait for the onboarding step to be marked as complete
    await waitForOnboardingStepComplete(workspaceId, 'connect-tool-set-to-agent');

    // All steps should show Completed badge
    const completedBadges = page.locator('text=Completed');
    await expect(completedBadges).toHaveCount(3);

    // Check dismiss button text changes
    await expect(page.getByRole('button', { name: /Close onboarding/i })).toBeVisible();
  });
});
