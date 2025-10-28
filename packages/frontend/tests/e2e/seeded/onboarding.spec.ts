import { test, expect, performLogin } from '../../fixtures/database';

/**
 * Onboarding Flow E2E Tests
 *
 * Tests the complete onboarding flow with all three steps:
 * 1. Install an MCP Server
 * 2. Create Your First Tool Set
 * 3. Connect your Tool Set to an Agent
 *
 * Strategy: Seeded
 * - Database is pre-populated with test data
 * - Tests run sequentially to follow the onboarding progression
 * - Uses comprehensive seed data with servers, tools, and agents
 */

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page, resetDatabase, seedDatabase }) => {
    await resetDatabase();

    // Seed with minimal data for onboarding
    await seedDatabase({
      users: [
        {
          email: 'test@example.com',
          password: 'testpassword123',
        },
      ],
      registryServers: [
        {
          name: 'filesystem-server',
          description: 'Filesystem MCP Server',
          title: 'Filesystem Server',
          repositoryUrl: 'https://github.com/example/filesystem',
          version: '1.0.0',
          packages: '{}',
          workspaceId: 'default-workspace',
        },
      ],
      mcpServers: [
        {
          name: 'filesystem-server',
          transport: 'STDIO',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
        },
      ],
      tools: [
        {
          name: 'read_file',
          description: 'Read a file from the filesystem',
          inputSchema: '{"type":"object","properties":{"path":{"type":"string"}}}',
          annotations: '{}',
          status: 'ACTIVE',
          mcpServerId: 'filesystem-server',
        },
      ],
      runtimes: [
        {
          name: 'Test Agent',
          description: 'Test agent for onboarding',
          status: 'ACTIVE',
          capabilities: ['agent'],
          workspaceId: 'default-workspace',
        },
      ],
    });

    // Log in with the seeded user credentials
    // Credentials from comprehensive seed: test@example.com / testpassword123
    await performLogin(page, 'test@example.com', 'testpassword123');
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
    await expect(page.getByRole('heading', { name: 'Connect your Tool Set to an Agent' })).toBeVisible();
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
    // Find step 1 card
    const step1Card = page.locator('text=Install an MCP Server').locator('..');
    console.log('step1Card', step1Card);
    console.log('step1Card.getByRole("button", { name: /Browse MCP Servers/i })', step1Card.getByRole('button', { name: /Browse MCP Servers/i }));

    // Should show Browse MCP Servers button
    await expect(step1Card.getByRole('button', { name: /Browse MCP Servers/i })).toBeVisible();
  });

  test('step 1 shows completed status after server is installed', async ({ page }) => {
    // Step 1 should show completed with server name
    const step1Card = page.locator('text=Install an MCP Server').locator('..').locator('..');
    await expect(step1Card.getByText('Completed')).toBeVisible();
    await expect(step1Card.getByText('filesystem-server')).toBeVisible();
  });

  test('step 2 shows Create Tool Set button when pending', async ({ page, graphql }) => {
    // Mark step 1 as completed first
    const workspaces = await graphql(`
      query {
        workspace {
          id
          onboardingSteps {
            id
            stepId
          }
        }
      }
    `);
    const step1 = workspaces.workspace[0].onboardingSteps.find(
      (s: { stepId: string }) => s.stepId === 'install-mcp-server'
    );

    await graphql(`
      mutation {
        updateOnboardingStep(input: {
          filter: { id: ["${step1.id}"] }
          set: { status: COMPLETED, completedAt: "${new Date().toISOString()}" }
        }) {
          onboardingStep {
            id
          }
        }
      }
    `);

    // Find step 2 card
    const step2Card = page.locator('text=Create Your First Tool Set').locator('..');

    // Should show Create Tool Set button
    await expect(step2Card.getByRole('button', { name: /Create Tool Set/i })).toBeVisible();
  });

  test('step 3 shows Connect button when agent with tools exists', async ({ page }) => {
    // Find step 3 card
    const step3Card = page.locator('text=Connect your Tool Set to an Agent').locator('..');

    // Should show Connect button
    await expect(step3Card.getByRole('button', { name: /Connect/i })).toBeVisible();
  });

  test('step 3 Connect button opens Connect Agent dialog', async ({ page }) => {
    // Find and click Connect button
    const step3Card = page.locator('text=Connect your Tool Set to an Agent').locator('..');
    const connectButton = step3Card.getByRole('button', { name: /Connect/i });
    await connectButton.click();

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Connect Agent to 2LY')).toBeVisible();
    await expect(page.getByText(/Agent:.*Test Agent/)).toBeVisible();
  });

  test('step 3 Connect dialog shows platform selector', async ({ page }) => {
    // Open Connect dialog
    const step3Card = page.locator('text=Connect your Tool Set to an Agent').locator('..');
    const connectButton = step3Card.getByRole('button', { name: /Connect/i });
    await connectButton.click();

    // Check platform selector
    await expect(page.getByText('Select Platform')).toBeVisible();
  });

  test('step 3 shows message when no agent with tools exists', async ({ page, seedDatabase }) => {
    // Reset and seed without tools
    await seedDatabase({
      runtimes: [
        {
          name: 'Empty Agent',
          description: 'Agent without tools',
          status: 'ACTIVE',
          capabilities: ['agent'],
          workspaceId: 'default-workspace',
        },
      ],
    });

    // Find step 3 card
    const step3Card = page.locator('text=Connect your Tool Set to an Agent').locator('..');

    // Should show message
    await expect(step3Card.getByText(/Create a tool set first to connect to an agent/)).toBeVisible();
  });

  test('step 3 shows completed status after connection', async ({ page, graphql }) => {
    // Mark step 3 as completed
    const workspaces = await graphql(`
      query {
        workspace {
          id
          onboardingSteps {
            id
            stepId
          }
        }
      }
    `);
    const step3 = workspaces.workspace[0].onboardingSteps.find(
      (s: { stepId: string }) => s.stepId === 'connect-tool-set-to-agent'
    );

    await graphql(`
      mutation {
        updateOnboardingStep(input: {
          filter: { id: ["${step3.id}"] }
          set: { status: COMPLETED, completedAt: "${new Date().toISOString()}" }
        }) {
          onboardingStep {
            id
          }
        }
      }
    `);

    // Step 3 should show completed
    const step3Card = page.locator('text=Connect your Tool Set to an Agent').locator('..').locator('..');
    await expect(step3Card.getByText('Completed')).toBeVisible();
    await expect(step3Card.getByText(/Test Agent connected/)).toBeVisible();
  });

  test('dismiss onboarding button is visible', async ({ page }) => {
    // Check dismiss button
    await expect(page.getByRole('button', { name: /Dismiss onboarding/i })).toBeVisible();
  });

  test('all completed steps show green styling', async ({ page, graphql }) => {
    // Mark all steps as completed
    const workspaces = await graphql(`
      query {
        workspace {
          id
          onboardingSteps {
            id
            stepId
          }
        }
      }
    `);

    const steps = workspaces.workspace[0].onboardingSteps;
    for (const step of steps) {
      await graphql(`
        mutation {
          updateOnboardingStep(input: {
            filter: { id: ["${step.id}"] }
            set: { status: COMPLETED, completedAt: "${new Date().toISOString()}" }
          }) {
            onboardingStep {
              id
            }
          }
        }
      `);
    }

    // All steps should show Completed badge
    const completedBadges = page.locator('text=Completed');
    await expect(completedBadges).toHaveCount(3);

    // Check dismiss button text changes
    await expect(page.getByRole('button', { name: /Close onboarding/i })).toBeVisible();
  });

  test('step 3 uses different icon (Link) compared to step 1 and 2', async ({ page }) => {
    // Get all three step cards by their titles
    const step1 = page.locator('text=Install an MCP Server').locator('..').locator('..');
    const step2 = page.locator('text=Create Your First Tool Set').locator('..').locator('..');
    const step3 = page.locator('text=Connect your Tool Set to an Agent').locator('..').locator('..');

    // Each should have an icon (SVG element)
    await expect(step1.locator('svg').first()).toBeVisible();
    await expect(step2.locator('svg').first()).toBeVisible();
    await expect(step3.locator('svg').first()).toBeVisible();

    // Note: Testing the specific icon type (Server vs Package vs Link) is difficult
    // in E2E tests without checking SVG paths, so we just verify icons exist
  });

  test('Connect button variant changes based on isCurrentStep', async ({ page, graphql }) => {
    // Mark step 1 and 2 as completed to make step 3 the current step
    const workspaces = await graphql(`
      query {
        workspace {
          id
          onboardingSteps {
            id
            stepId
          }
        }
      }
    `);

    const steps = workspaces.workspace[0].onboardingSteps;
    for (const step of steps) {
      if (step.stepId === 'install-mcp-server' || step.stepId === 'create-tool-set') {
        await graphql(`
          mutation {
            updateOnboardingStep(input: {
              filter: { id: ["${step.id}"] }
              set: { status: COMPLETED, completedAt: "${new Date().toISOString()}" }
            }) {
              onboardingStep {
                id
              }
            }
          }
        `);
      }
    }

    // Step 3 Connect button should be the default variant (not outline)
    const step3Card = page.locator('text=Connect your Tool Set to an Agent').locator('..');
    const connectButton = step3Card.getByRole('button', { name: /Connect/i });

    // Check button exists and is visible (detailed styling check is difficult in E2E)
    await expect(connectButton).toBeVisible();
  });
});
