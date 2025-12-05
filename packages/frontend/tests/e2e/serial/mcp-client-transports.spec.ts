/**
 * MCP Client Transport E2E Tests
 *
 * Tests direct MCP client connectivity to 2ly runtime using real MCP SDK client.
 * Uses a single filesystem MCP server (STDIO transport) deployed on the runtime,
 * then connects to the runtime via STREAM transport to access those tools.
 *
 * This validates:
 * - Runtime exposes MCP tools via HTTP (Streamable HTTP protocol)
 * - MCP SDK client can connect, list tools, and call tools
 * - Error handling for authentication and connection failures
 *
 * Note: STDIO and SSE transport tests are skipped as they require different
 * runtime configurations not suitable for the current test setup.
 */

import { test, expect, seedPresets, loginAndGetToken } from '@2ly/common/test/fixtures/playwright';
import { createSkill, updateMCPServerToEdgeRuntime } from '@2ly/common/test/fixtures/mcp-builders';
import { createMCPClient } from '@2ly/common/test/fixtures/playwright';
import {
  assertToolListing,
  assertListAllowedDirectoriesCall,
  assertListDirectoryCall,
  assertDisconnect,
  assertConnectionStatus,
} from '@2ly/common/test/fixtures/mcp-test-helpers';
import { dgraphQL } from '@2ly/common/test/fixtures';

test.describe('MCP Client Transports', () => {
  const natsUrl = process.env.TEST_NATS_CLIENT_URL || 'nats://localhost:4222';
  let workspaceKey: string | undefined;

  // Configure tests to run serially (one at a time)
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ resetDatabase, seedDatabase, graphql }) => {
    // Reset database and start runtime with HTTP server (port 3001)
    // This only happens ONCE for all tests of this file
    await resetDatabase(true);

    // Seed database with single MCP server (filesystem - STDIO transport)
    // This is a proven working setup from mcp-integration.spec.ts
    const entityIds = await seedDatabase(seedPresets.withSingleMCPServer);
    const workspaceId = entityIds['default-workspace'];
    const mcpServerId = entityIds['server-file-system'];

    // Get auth token for authenticated API calls (needed for mutations)
    const authToken = await loginAndGetToken('user1@2ly.ai', 'password123');

    // Update MCP server to use EDGE runtime (GLOBAL executionTarget has been removed)
    await updateMCPServerToEdgeRuntime(graphql, mcpServerId, workspaceId, authToken);

    // Get the workspace key
    const result = await dgraphQL<{
      queryIdentityKey: Array<{ key: string }>;
    }>(`query { queryIdentityKey(filter: { relatedId: { eq: "${workspaceId}" } }) { key } }`);
    workspaceKey = result.queryIdentityKey[0]?.key;

    // Wait for runtime to fully initialize and discover tools
    // The runtime needs time to connect to the MCP server and load its tools
    // Using a simple setTimeout since we can't use page.waitForTimeout in beforeAll
    await new Promise((resolve) => setTimeout(resolve, 15000));

    // Create a shared skill that all tests will use
    // Tests only create their own MCP clients, they don't modify this skill
    await createSkill(graphql, workspaceId, 'My skill', 'My skill description', 100, authToken);
  });

  /**
   * STDIO Transport Tests
   *
   * STDIO transport uses stdin/stdout for communication with the runtime process.
   * This is the most direct transport, typically used for skill-specific connections.
   *
   * Unlike STREAM/SSE transports which connect to an HTTP server, STDIO spawns the
   * runtime as a child process and communicates via stdin/stdout pipes.
   *
   * Key differences:
   * - No HTTP server required (no REMOTE_PORT)
   * - Authentication via environment variables (SKILL_NAME/KEY + WORKSPACE_KEY)
   * - 1:1 relationship with a single skill
   * - Process lifecycle managed by MCP SDK
   */
  test.describe('STDIO Transport', () => {
    test('should connect, list tools, call tool, and disconnect via STDIO', async () => {
      const mcpClient = createMCPClient();

      try {
        // Step 1: Connect via STDIO by spawning runtime process
        // The runtime will run in STDIO mode when SKILL_NAME is set and REMOTE_PORT is not
        // TODO: fetch, provide and use the workspace key instead of the test system key to auth skills
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
            skillName: 'My skill',
          }
        );

        assertConnectionStatus(mcpClient, true, 'STDIO');

        // Step 2: List tools (using shared utility)
        await assertToolListing(mcpClient);

        // Step 3: Call a tool without arguments (using shared utility)
        try {
          await assertListAllowedDirectoriesCall(mcpClient);
        } catch (error) {
          console.log(`[STDIO Test] ⚠ Tool call failed:`, error instanceof Error ? error.message : String(error));
          throw error;
        }

        // Step 4: Call a tool with arguments (using shared utility)
        try {
          await assertListDirectoryCall(mcpClient);
        } catch (error) {
          console.log(`[STDIO Test] ⚠ Tool call failed:`, error instanceof Error ? error.message : String(error));
          throw error;
        }

        // Step 5: Disconnect cleanly (using shared utility)
        await assertDisconnect(mcpClient);

      } catch (error) {
        console.error('[STDIO Test] ✗ Test failed:', error);
        // Clean up even if test fails
        await mcpClient.disconnect();
        throw error;
      }
    });

    test('should handle authentication failures via STDIO', async () => {
      const mcpClient = createMCPClient();

      try {
        // Try to connect with invalid workspace key
        await expect(async () => {
          await mcpClient.connectSTDIO(
            {
              command: 'node',
              args: ['../runtime/dist/index.js'],
              env: {
                NATS_SERVERS: natsUrl,
              },
            },
            {
              workspaceKey: 'WSK_INVALID_KEY_FOR_TESTING',
              skillName: 'My skill',
            }
          );
        }).rejects.toThrow();

      } finally {
        await mcpClient.disconnect();
      }
    });

    test('should handle process lifecycle management via STDIO', async () => {
      const mcpClient = createMCPClient();

      try {
        // Connect successfully
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
            skillName: 'My skill',
          }
        );

        assertConnectionStatus(mcpClient, true, 'STDIO');

        // Disconnect - this should cleanly terminate the child process
        await mcpClient.disconnect();

        assertConnectionStatus(mcpClient, false, null);

        // Verify disconnect is idempotent (can be called multiple times)
        await mcpClient.disconnect();

        assertConnectionStatus(mcpClient, false, null);

      } catch (error) {
        console.error('[STDIO Lifecycle Test] ✗ Test failed:', error);
        await mcpClient.disconnect();
        throw error;
      }
    });
  });

  /**
   * SSE Transport Tests
   *
   * SSE (Server-Sent Events) transport uses HTTP streaming for real-time communication.
   * The runtime exposes an /sse endpoint for client connections.
   *
   * Connection flow:
   * 1. GET /sse with auth headers → establishes SSE stream and returns session ID
   * 2. POST /messages with session ID → sends JSON-RPC messages (list_tools, call_tool)
   * 3. Disconnect → closes SSE stream
   */
  test.describe('SSE Transport', () => {
    test('should connect, list tools, call tool, and disconnect via SSE', async ({ runtimePort }) => {
      if (!runtimePort) {
        throw new Error('Runtime port not available. Ensure runtime was started with resetDatabase(true)');
      }

      const baseUrl = `http://localhost:${runtimePort}`;
      const mcpClient = createMCPClient();

      try {
        // Step 1: Connect to runtime via SSE transport
        await mcpClient.connectSSE(baseUrl, {
          workspaceKey,
          skillName: 'My skill',
        });

        assertConnectionStatus(mcpClient, true, 'SSE');

        // Step 2: List tools from runtime
        await assertToolListing(mcpClient);

        // Step 3: Call a tool without arguments
        try {
          await assertListAllowedDirectoriesCall(mcpClient);
        } catch (error) {
          console.log(`[SSE Test] ⚠ Tool call failed:`, error instanceof Error ? error.message : String(error));
          throw error; // This should succeed, so throw if it fails
        }

        // Step 4: Call a tool with arguments
        try {
          await assertListDirectoryCall(mcpClient);
        } catch (error) {
          console.log(`[SSE Test] ⚠ Tool call failed:`, error instanceof Error ? error.message : String(error));
          throw error; // This should succeed, so throw if it fails
        }

        // Step 5: Disconnect cleanly
        await assertDisconnect(mcpClient);

      } catch (error) {
        console.error('[SSE Test] ✗ Test failed:', error);
        // Clean up even if test fails
        await mcpClient.disconnect();
        throw error;
      }
    });

    test('should handle authentication failures via SSE', async ({ runtimePort }) => {
      if (!runtimePort) {
        throw new Error('Runtime port not available');
      }

      const baseUrl = `http://localhost:${runtimePort}`;
      const mcpClient = createMCPClient();

      try {
        // Try to connect with invalid workspace key - should reject
        await expect(async () => {
          await mcpClient.connectSSE(baseUrl, {
            workspaceKey: 'WSK_INVALID_KEY_FOR_TESTING',
          });
        }).rejects.toThrow();

      } finally {
        // Clean up
        await mcpClient.disconnect();
      }
    });

    test('should handle connection to invalid endpoint via SSE', async () => {
      const mcpClient = createMCPClient();

      try {
        // Try to connect to non-existent server - should reject
        await expect(async () => {
          await mcpClient.connectSSE('http://localhost:9999', {
            workspaceKey,
          });
        }).rejects.toThrow();

      } finally {
        await mcpClient.disconnect();
      }
    });
  });

  /**
   * STREAM Transport Tests (Streamable HTTP)
   *
   * STREAM transport uses the modern /mcp endpoint with Streamable HTTP protocol.
   * This is the spec-compliant implementation using the shared FastifyManagerService.
   *
   * Connection flow:
   * 1. POST /mcp with initialize request → creates session → returns session ID
   * 2. GET /mcp?sessionId=... → opens SSE stream for server notifications
   * 3. POST /mcp with session ID → sends JSON-RPC messages (list_tools, call_tool)
   * 4. DELETE /mcp with session ID → terminates session
   */
  test.describe('STREAM Transport', () => {
    test('should connect, list tools, call tool, and disconnect via STREAM', async ({ runtimePort }) => {
      if (!runtimePort) {
        throw new Error('Runtime port not available. Ensure runtime was started with resetDatabase(true)');
      }

      const baseUrl = `http://localhost:${runtimePort}`;
      const mcpClient = createMCPClient();

      try {
        // Step 1: Connect to runtime via STREAM transport
        await mcpClient.connectSTREAM(baseUrl, {
          workspaceKey,
          skillName: 'My skill',
        });

        assertConnectionStatus(mcpClient, true, 'STREAM');

        // Step 2: List tools from runtime
        await assertToolListing(mcpClient);

        // Step 3: Call a tool without arguments
        try {
          await assertListAllowedDirectoriesCall(mcpClient);
        } catch (error) {
          console.log(`[STREAM Test] ⚠ Tool call failed:`, error instanceof Error ? error.message : String(error));
          throw error; // This should succeed, so throw if it fails
        }

        // Step 4: Call a tool with arguments
        // The filesystem server should provide tools like read_file, write_file, list_directory

        try {
          await assertListDirectoryCall(mcpClient);
        } catch (error) {
          console.log(`[STREAM Test] ⚠ Tool call failed:`, error instanceof Error ? error.message : String(error));
          throw error; // This should succeed, so throw if it fails
        }

        // Step 5: Disconnect cleanly
        await assertDisconnect(mcpClient);

      } catch (error) {
        console.error('[STREAM Test] ✗ Test failed:', error);
        // Clean up even if test fails
        await mcpClient.disconnect();
        throw error;
      }
    });

    test('should handle authentication failures via STREAM', async ({ runtimePort }) => {
      if (!runtimePort) {
        throw new Error('Runtime port not available');
      }

      const baseUrl = `http://localhost:${runtimePort}`;
      const mcpClient = createMCPClient();

      try {
        // Try to connect with invalid workspace key - should reject
        await expect(async () => {
          await mcpClient.connectSTREAM(baseUrl, {
            workspaceKey: 'WSK_INVALID_KEY_FOR_TESTING',
          });
        }).rejects.toThrow();

      } finally {
        // Clean up
        await mcpClient.disconnect();
      }
    });

    test('should handle connection to invalid endpoint via STREAM', async () => {
      const mcpClient = createMCPClient();

      try {
        // Try to connect to non-existent server - should reject
        await expect(async () => {
          await mcpClient.connectSTREAM('http://localhost:9999', {
            workspaceKey,
          });
        }).rejects.toThrow();

      } finally {
        await mcpClient.disconnect();
      }
    });
  });

  /**
   * General Error Handling Tests
   *
   * Tests error scenarios that apply across all transports
   */
  test.describe('Error Handling', () => {
    test('should throw error when calling methods before connection', async () => {
      const mcpClient = createMCPClient();

      // Try to list tools without connecting
      await expect(async () => {
        await mcpClient.listTools();
      }).rejects.toThrow('Client not connected');

      // Try to call tool without connecting
      await expect(async () => {
        await mcpClient.callTool('test_tool', {});
      }).rejects.toThrow('Client not connected');
    });

    test('should throw error when connecting twice without disconnect', async ({ runtimePort }) => {
      if (!runtimePort) {
        throw new Error('Runtime port not available');
      }

      const baseUrl = `http://localhost:${runtimePort}`;
      const mcpClient = createMCPClient();

      try {
        // First connection
        await mcpClient.connectSTREAM(baseUrl, {
          workspaceKey,
          skillName: 'My skill',
        });

        // Try to connect again without disconnecting
        await expect(async () => {
          await mcpClient.connectSTREAM(baseUrl, {
            workspaceKey,
            skillName: 'My skill',
          });
        }).rejects.toThrow('Client already connected');

      } finally {
        await mcpClient.disconnect();
      }
    });

    test('should handle disconnect on non-connected client gracefully', async () => {
      const mcpClient = createMCPClient();

      // Should not throw error
      await mcpClient.disconnect();

      // Verify still not connected
      const status = mcpClient.getConnectionStatus();
      expect(status.connected).toBe(false);
    });
  });

});

