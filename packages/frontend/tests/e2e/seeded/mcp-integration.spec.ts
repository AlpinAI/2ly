/**
 * MCP Integration E2E Tests - Seeded Strategy with Containerized Runtime
 *
 * This test suite verifies the complete MCP server lifecycle with a real containerized runtime:
 * 1. Configure FileSystem MCP server from registry
 * 2. Deploy server to containerized runtime
 * 3. Discover tools dynamically from deployed server
 * 4. Create tool set from discovered tools
 * 5. Execute tool calls against the real MCP server
 * 6. Verify deep-linking across dynamically created entities
 *
 * Strategy: Seeded with Global Runtime
 * - Database is reset + seeded before tests (workspace/user exist)
 * - Runtime container is started globally (shared across all E2E tests)
 * - MCP entities are created dynamically during test execution
 * - Tests complete within 2 minutes with proper timeouts
 */

import { test, expect, seedPresets } from '../../fixtures/database';
import { mcpRegistry } from '@2ly/common';
type Package = mcpRegistry.components['schemas']['Package'];
type Argument = mcpRegistry.components['schemas']['Argument'];
type AugmentedArgument = Argument & { isConfigurable: boolean };

const config: Package & {packageArguments: AugmentedArgument[]} = {
  registryType: 'npm',
  identifier: "@modelcontextprotocol/server-filesystem",
  version: '2025.8.21',
  packageArguments: [
    {
      name: 'directory_path',
      description: 'The directory path to allow access to',
      format: 'string',
      type: 'positional',
      isRequired: false,
      value: '/tmp',
      isConfigurable: true,
    },
  ],
  environmentVariables: [],
  runtimeArguments: [],
};

// Test configuration
const TEST_FILE_PATH = '/tmp/test.txt';
const TEST_FILE_CONTENT = 'Hello from MCP integration test!';

// TODO: unskip these tests by fixing the runtime test container
// now that the runtime is able to reconnect after a reset, we can start the runtime
// with the rest of the containers and call the reset endpoint without worry, theoretically
test.describe('MCP Integration with Containerized Runtime', () => {
  // Configure tests to run serially
  test.describe.configure({ mode: 'serial' });

  /**
   * Setup: Reset and seed database with users and workspace
   * Runtime container is started globally in global-setup.ts
   */
  test.beforeAll(async ({ resetDatabase, seedDatabase }) => {
    await resetDatabase(true);
    await seedDatabase(seedPresets.withUsers);
  });

  test('should complete full MCP lifecycle: configure → deploy → discover → execute', async ({
    page,
    graphql,
  }) => {
    // ========================================================================
    // Step 1: Login and navigate to workspace
    // ========================================================================
    await page.goto('/login');
    await page.fill('input[type="email"]', 'user1@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/w\/.+\/overview/, { timeout: 5000 });

    const workspaceUrl = page.url();
    const workspaceId = workspaceUrl.match(/\/w\/([^/]+)/)?.[1];
    expect(workspaceId).toBeDefined();

    // ========================================================================
    // Step 2: Add FileSystem server to registry
    // ========================================================================
    const addRegistryServerMutation = `
      mutation AddServerToRegistry(
        $workspaceId: ID!
        $name: String!
        $description: String!
        $title: String!
        $repositoryUrl: String!
        $version: String!
        $packages: String!
      ) {
        addServerToRegistry(
          workspaceId: $workspaceId
          name: $name
          description: $description
          title: $title
          repositoryUrl: $repositoryUrl
          version: $version
          packages: $packages
        ) {
          id
          name
          title
        }
      }
    `;

    const registryServerResult = await graphql<{
      addServerToRegistry: { id: string; name: string; title: string };
    }>(addRegistryServerMutation, {
      workspaceId,
      name: 'filesystem-test',
      description: 'FileSystem MCP server for integration testing',
      title: 'FileSystem Test Server',
      repositoryUrl: 'https://github.com/modelcontextprotocol/servers',
      version: '0.6.2',
      packages: JSON.stringify([
        {
          identifier: '@modelcontextprotocol/server-filesystem',
          packageArguments: ['/tmp/test-fs'],
          runtimeArguments: ['-y'],
        },
      ]),
    });

    const registryServerId = registryServerResult.addServerToRegistry.id;

    // ========================================================================
    // Step 3: Configure MCP server from registry
    // ========================================================================
    const createMCPServerMutation = `
      mutation CreateMCPServer(
        $workspaceId: ID!
        $name: String!
        $description: String!
        $repositoryUrl: String!
        $transport: MCPTransportType!
        $config: String!
        $runOn: MCPServerRunOn!
        $registryServerId: ID!
      ) {
        createMCPServer(
          workspaceId: $workspaceId
          name: $name
          description: $description
          repositoryUrl: $repositoryUrl
          transport: $transport
          config: $config
          runOn: $runOn
          registryServerId: $registryServerId
        ) {
          id
          name
          transport
          runOn
        }
      }
    `;

    const mcpServerResult = await graphql<{
      createMCPServer: { id: string; name: string; transport: string; runOn: string };
    }>(createMCPServerMutation, {
      workspaceId,
      name: 'FileSystem Test Server',
      description: 'FileSystem MCP server for E2E testing',
      repositoryUrl: 'https://github.com/modelcontextprotocol/servers',
      transport: 'STDIO',
      config: JSON.stringify(config),
      runOn: 'GLOBAL',
      registryServerId,
    });

    const mcpServerId = mcpServerResult.createMCPServer.id;

    // ========================================================================
    // Step 4: Wait for tool discovery (runtime will load tools automatically)
    // ========================================================================
    let tools: Array<{ id: string; name: string; description: string }> = [];
    let discoveryAttempts = 0;
    const maxAttempts = 15; // 30 seconds with 2-second intervals

    while (discoveryAttempts < maxAttempts) {
      const toolsQuery = `
        query GetMCPTools($workspaceId: ID!) {
          mcpTools(workspaceId: $workspaceId) {
            id
            name
            description
            mcpServer {
              id
            }
          }
        }
      `;

      const toolsResult = await graphql<{
        mcpTools: Array<{ id: string; name: string; description: string; mcpServer: { id: string } }>;
      }>(toolsQuery, { workspaceId });

      // Filter tools from our test server
      tools = toolsResult.mcpTools.filter((tool) => tool.mcpServer.id === mcpServerId);

      if (tools.length > 0) {
        break;
      }

      discoveryAttempts++;
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
    }

    // Verify tools were discovered
    expect(tools.length).toBeGreaterThan(0);

    // Find specific tools we want to test
    const readFileTool = tools.find((t) => t.name === 'read_file');
    const writeFileTool = tools.find((t) => t.name === 'write_file');
    const listDirTool = tools.find((t) => t.name === 'list_directory');

    expect(readFileTool).toBeDefined();
    expect(writeFileTool).toBeDefined();
    expect(listDirTool).toBeDefined();

    // ========================================================================
    // Step 5: Create tool set from discovered tools (link tools to runtime)
    // ========================================================================
    // Create a new runtime with agent capability (tool set)
    const createRuntimeMutation = `
      mutation CreateRuntime(
        $workspaceId: ID!
        $name: String!
        $description: String!
        $capabilities: [String!]!
      ) {
        createRuntime(
          workspaceId: $workspaceId
          name: $name
          description: $description
          capabilities: $capabilities
        ) {
          id
          name
          description
          capabilities
          status
        }
      }
    `;

    const runtimeResult = await graphql<{
      createRuntime: { id: string; name: string; description: string; capabilities: string[]; status: string };
    }>(createRuntimeMutation, {
      workspaceId,
      name: 'MCP Integration Test Runtime',
      description: 'Runtime created for MCP integration E2E test',
      capabilities: ['agent'],
    });

    const runtime = runtimeResult.createRuntime;
    expect(runtime).toBeDefined();
    expect(runtime.capabilities).toContain('agent');

    // Link tools to runtime (create tool set)
    const linkToolMutation = `
      mutation LinkToolToRuntime($mcpToolId: ID!, $runtimeId: ID!) {
        linkMCPToolToRuntime(mcpToolId: $mcpToolId, runtimeId: $runtimeId) {
          id
          mcpToolCapabilities {
            id
            name
          }
        }
      }
    `;

    // Link write_file tool
    await graphql(linkToolMutation, {
      mcpToolId: writeFileTool!.id,
      runtimeId: runtime!.id,
    });

    // Link read_file tool
    await graphql(linkToolMutation, {
      mcpToolId: readFileTool!.id,
      runtimeId: runtime!.id,
    });

    // ========================================================================
    // Step 6: Execute tool calls against FileSystem server
    // ========================================================================
    // Since the tool discovery, the runtime has restarted the MCP server, so we need to wait for it to be ready
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test 1: Write a file
    const writeResult = await graphql<{
      callMCPTool: { success: boolean; result: string };
    }>(
      `
      mutation CallTool($toolId: ID!, $input: String!) {
        callMCPTool(toolId: $toolId, input: $input) {
          success
          result
        }
      }
    `,
      {
        toolId: writeFileTool!.id,
        input: JSON.stringify({
          path: TEST_FILE_PATH,
          content: TEST_FILE_CONTENT,
        }),
      }
    );

    expect(writeResult.callMCPTool.success).toBe(true);

    // Test 2: Read the file back
    const readResult = await graphql<{
      callMCPTool: { success: boolean; result: string };
    }>(
      `
      mutation CallTool($toolId: ID!, $input: String!) {
        callMCPTool(toolId: $toolId, input: $input) {
          success
          result
        }
      }
    `,
      {
        toolId: readFileTool!.id,
        input: JSON.stringify({
          path: TEST_FILE_PATH,
        }),
      }
    );

    expect(readResult.callMCPTool.success).toBe(true);
    const readResultParsed = JSON.parse(readResult.callMCPTool.result);
    expect(readResultParsed).toHaveProperty('[0].text');
    expect(readResultParsed[0].text).toContain(TEST_FILE_CONTENT);

    // Test 3: List directory
    const listResult = await graphql<{
      callMCPTool: { success: boolean; result: string };
    }>(
      `
      mutation CallTool($toolId: ID!, $input: String!) {
        callMCPTool(toolId: $toolId, input: $input) {
          success
          result
        }
      }
    `,
      {
        toolId: listDirTool!.id,
        input: JSON.stringify({
          path: '/tmp',
        }),
      }
    );

    expect(listResult.callMCPTool.success).toBe(true);

    // ========================================================================
    // Step 7: Verify deep-linking across dynamically created entities
    // ========================================================================

    // Verify server → tools link
    const serverToolsQuery = `
      query GetServerTools($workspaceId: ID!) {
        mcpServers(workspaceId: $workspaceId) {
          id
          name
          tools {
            id
            name
          }
        }
      }
    `;

    const serverToolsResult = await graphql<{
      mcpServers: Array<{ id: string; name: string; tools: Array<{ id: string; name: string }> }>;
    }>(serverToolsQuery, { workspaceId });

    const testServer = serverToolsResult.mcpServers.find((s) => s.id === mcpServerId);
    expect(testServer).toBeDefined();
    expect(testServer!.tools.length).toBeGreaterThan(0);

    // Verify tools → server link
    // Verify runtime → tools link (tool set)
    const toolServerQuery = `
      query GetToolServer($workspaceId: ID!) {
        mcpTools(workspaceId: $workspaceId) {
          id
          name
          mcpServer {
            id
            name
          }
          runtimes {
            id
            name
          }
        }
      }
    `;

    const toolServerResult = await graphql<{
      mcpTools: Array<{ id: string; name: string; mcpServer: { id: string; name: string }; runtimes: Array<{ id: string; name: string }> }>;
    }>(toolServerQuery, { workspaceId });

    const testTools = toolServerResult.mcpTools.filter((t) => t.mcpServer.id === mcpServerId);
    expect(testTools.length).toBeGreaterThan(0);
    testTools.forEach((tool) => {
      expect(tool.mcpServer.id).toBe(mcpServerId);
      if (tool.name === 'write_file' || tool.name === 'read_file') {
        expect(tool.runtimes.length).toBeGreaterThan(0);
        expect(tool.runtimes.find((r) => r.id === runtime!.id)).toBeDefined();
      }
    });
  });

  test('should handle tool call failures gracefully', async ({ page, graphql }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'user1@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/w\/.+\/overview/, { timeout: 5000 });

    const workspaceUrl = page.url();
    const workspaceId = workspaceUrl.match(/\/w\/([^/]+)/)?.[1];

    // Get tools from previous test
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

    const readFileTool = toolsResult.mcpTools.find((t) => t.name === 'read_file');
    expect(readFileTool).toBeDefined();

    // Try to read a non-existent file
    const failureResult = await graphql<{
      callMCPTool: { success: boolean; result: string };
    }>(
      `
      mutation CallTool($toolId: ID!, $input: String!) {
        callMCPTool(toolId: $toolId, input: $input) {
          success
          result
        }
      }
    `,
      {
        toolId: readFileTool!.id,
        input: JSON.stringify({
          path: '/tmp/test-fs/nonexistent-file.txt',
        }),
      }
    );

    // Tool call should fail gracefully
    expect(failureResult.callMCPTool.success).toBe(false);
    expect(failureResult.callMCPTool.result).toBeTruthy();
  });
});
