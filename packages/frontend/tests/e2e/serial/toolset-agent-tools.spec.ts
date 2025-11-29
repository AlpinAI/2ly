/**
 * ToolSet AGENT Runtime Tool Call Tests
 *
 * Tests MCP server tools configured to run on AGENT side (embedded in toolset runtime).
 * Uses a real MCP SDK client to connect and call tools on an AGENT runOn MCP server.
 *
 * Key differences from EDGE tests:
 * - MCP servers run in the toolset's own runtime process (not a separate edge runtime)
 * - No runtime ID is stored in the database (runtime field is null)
 * - Tool calls route directly to toolset runtime via targeted NATS subscription
 * - Each toolset has its own isolated MCP server instances
 *
 * This validates:
 * - AGENT runOn configuration works with MCP clients
 * - Tools can be discovered and called without edge runtime
 * - MCP server has no runtime link (runOn: AGENT, runtime: null)
 */

import { test, expect, seedPresets, dgraphQL, loginAndGetToken } from '@2ly/common/test/fixtures/playwright';
import { createToolset, updateMCPServerToEdgeRuntime } from '@2ly/common/test/fixtures/mcp-builders';
import { createMCPClient } from '@2ly/common/test/fixtures/playwright';
import {
  assertToolListing,
  assertListAllowedDirectoriesCall,
  assertListDirectoryCall,
  assertDisconnect,
  assertConnectionStatus,
} from '@2ly/common/test/fixtures/mcp-test-helpers';

test.describe('MCP Client with AGENT RunOn Configuration', () => {
  const natsUrl = process.env.TEST_NATS_CLIENT_URL || 'nats://localhost:4222';
  let workspaceKey: string | undefined;
  let mcpServerId: string;
  let workspaceId: string;

  // Configure tests to run serially (one at a time)
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ resetDatabase, seedDatabase, graphql }) => {
    // Reset database and start runtime with HTTP server (port 3001)
    await resetDatabase(true);

    // Seed database with single MCP server (filesystem - STDIO transport)
    // By default, seeded MCP servers use AGENT runOn
    const entityIds = await seedDatabase(seedPresets.withSingleMCPServer);
    workspaceId = entityIds['default-workspace'];
    mcpServerId = entityIds['server-file-system'];

    // IMPORTANT: FIRST configure the MCP Server on the EDGE for tool discovery
    // and then configure it to AGENT runOn for tool execution
    await updateMCPServerToEdgeRuntime(graphql, mcpServerId, workspaceId);

    // Wait 15s for tool discovery to complete
    await new Promise((resolve) => setTimeout(resolve, 15000));

    // Explicitly ensure MCP server is set to AGENT runOn with no runtime
    const updateMutation = `
      mutation UpdateMCPServerRunOn($mcpServerId: ID!, $runOn: MCPServerRunOn!) {
        updateMCPServerRunOn(mcpServerId: $mcpServerId, runOn: $runOn) {
          id
          runOn
          runtime {
            id
          }
        }
      }
    `;

    const updateResult = await graphql<{
      updateMCPServerRunOn: { id: string; runOn: string; runtime: { id: string } | null };
    }>(updateMutation, {
      mcpServerId,
      runOn: 'AGENT',
    });

    // Verify the MCP server is configured correctly
    expect(updateResult.updateMCPServerRunOn.runOn).toBe('AGENT');
    expect(updateResult.updateMCPServerRunOn.runtime).toBeNull();

    // Get the workspace key
    const result = await dgraphQL<{
      queryIdentityKey: Array<{ key: string }>;
    }>(`query { queryIdentityKey(filter: { relatedId: { eq: "${workspaceId}" } }) { key } }`);
    workspaceKey = result.queryIdentityKey[0]?.key;
    expect(workspaceKey).toBeDefined();

    // Get auth token for authenticated API calls
    const authToken = await loginAndGetToken('user1@2ly.ai', 'password123');

    // Create a shared toolset that all tests will use
    await createToolset(graphql, workspaceId, 'My tool set', 'My tool set description', 100, authToken);
  });

  /**
   * STDIO Transport Tests with AGENT RunOn
   *
   * Tests that MCP clients can connect via STDIO transport and call tools
   * on an AGENT runOn MCP server.
   */
  test.describe('STDIO Transport with AGENT RunOn', () => {
    test('should connect and call tool on AGENT runOn MCP server via STDIO', async () => {
      const mcpClient = createMCPClient();

      try {
        // Step 1: Connect via STDIO by spawning runtime process
        await mcpClient.connectSTDIO(
          {
            command: 'node',
            args: ['../runtime/dist/index.js'],
            env: {
              NATS_SERVERS: natsUrl,
            },
          },
          {
            workspaceKey,
            toolsetName: 'My tool set',
          }
        );

        assertConnectionStatus(mcpClient, true, 'STDIO');

        // Step 2: List tools from AGENT MCP server
        await assertToolListing(mcpClient);

        // Wait 5s
        // await new Promise((resolve) => setTimeout(resolve, 5000));

        // Step 3: Call a tool without arguments
        try {
          await assertListAllowedDirectoriesCall(mcpClient);
        } catch (error) {
          console.error(
            `[AGENT STDIO Test] ⚠ Tool call failed:`,
            error instanceof Error ? error.message : String(error)
          );
          throw error;
        }

        // Step 4: Call a tool with arguments
        try {
          await assertListDirectoryCall(mcpClient);
        } catch (error) {
          console.error(
            `[AGENT STDIO Test] ⚠ Tool call failed:`,
            error instanceof Error ? error.message : String(error)
          );
          throw error;
        }

        // Step 5: Disconnect cleanly
        await assertDisconnect(mcpClient);
      } catch (error) {
        console.error('[AGENT STDIO Test] ✗ Test failed:', error);
        // Clean up even if test fails
        await mcpClient.disconnect();
        throw error;
      }
    });
  });

  /**
   * STREAM Transport Tests with AGENT RunOn
   *
   * Tests that MCP clients can connect via STREAM transport and call tools
   * on an AGENT runOn MCP server (no edge runtime required).
   */
  test.describe('STREAM Transport with AGENT RunOn', () => {
    test('should connect but tools on AGENT side should not be part of the list tools', async () => {
      // todo: implement this test
    });
  });

  /**
   * SSE Transport Tests with AGENT RunOn
   *
   * Tests that MCP clients can connect via SSE transport and call tools
   * on an AGENT runOn MCP server.
   */
  test.describe('SSE Transport with AGENT RunOn', () => {
    test('should connect but tools on AGENT side should not be part of the list tools', async () => {
      // todo: implement this test
    });
  });
});