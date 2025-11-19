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

import { test, expect, seedPresets } from '@2ly/common/test/fixtures/playwright';
import { createToolset } from '@2ly/common/test/fixtures/mcp-builders';
import { createMCPClient } from '@2ly/common/test/fixtures/playwright';
import { TEST_MASTER_KEY } from '@2ly/common/test/test.containers';
import {
  assertToolListing,
  assertListAllowedDirectoriesCall,
  assertListDirectoryCall,
  assertDisconnect,
  assertConnectionStatus,
} from '@2ly/common/test/fixtures/mcp-test-helpers';

test.describe('MCP Client Transports', () => {
  const natsUrl = process.env.TEST_NATS_CLIENT_URL || 'nats://localhost:4222';
  // Configure tests to run serially (one at a time)
  // test.describe.configure({ mode: 'serial' });
  test.beforeEach(async ({ page, resetDatabase, seedDatabase, graphql }) => {
    // Reset database and start runtime with HTTP server (port 3001)
    await resetDatabase(true);

    // Seed database with single MCP server (filesystem - STDIO transport)
    // This is a proven working setup from mcp-integration.spec.ts
    const entityIds = await seedDatabase(seedPresets.withSingleMCPServer);
    const workspaceId = entityIds['default-workspace'];

    // Wait for runtime to fully initialize and discover tools
    // The runtime needs time to connect to the MCP server and load its tools
    await page.waitForTimeout(15000);
  
    // the workspace id is the one from the previous reset ?
    // use value from the seed database above and fix
    // add 20 tools => will add all
    await createToolset(graphql, workspaceId, 'My tool set', 'My tool set description', 100);
  });

  /**
   * STDIO Transport Tests
   *
   * STDIO transport uses stdin/stdout for communication with the runtime process.
   * This is the most direct transport, typically used for toolset-specific connections.
   *
   * Unlike STREAM/SSE transports which connect to an HTTP server, STDIO spawns the
   * runtime as a child process and communicates via stdin/stdout pipes.
   *
   * Key differences:
   * - No HTTP server required (no REMOTE_PORT)
   * - Authentication via environment variables (TOOLSET_NAME/KEY + MASTER_KEY)
   * - 1:1 relationship with a single toolset
   * - Process lifecycle managed by MCP SDK
   */
  test.describe('STDIO Transport', () => {
    test('should connect, list tools, call tool, and disconnect via STDIO', async () => {
      const mcpClient = createMCPClient();

      try {
        // Step 1: Connect via STDIO by spawning runtime process
        // The runtime will run in STDIO mode when TOOLSET_NAME is set and REMOTE_PORT is not
        await mcpClient.connectSTDIO(
          {
            command: 'node',
            args: ['../runtime/dist/index.js'],
            env: {
              NATS_SERVERS: natsUrl,
            },
          },
          {
            masterKey: TEST_MASTER_KEY,
            toolsetName: 'My tool set',
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
        // Try to connect with invalid master key
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
              masterKey: 'WSK_INVALID_KEY_FOR_TESTING',
              toolsetName: 'My tool set',
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
            masterKey: TEST_MASTER_KEY,
            toolsetName: 'My tool set',
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
   * Note: SSE tests are currently skipped because the SSE implementation appears to be
   * deprecated in favor of Streamable HTTP (/mcp endpoint). The SSE service has its own
   * Fastify instance (port 3002) that's not integrated with the shared FastifyManagerService.
   */
  test.describe('SSE Transport', () => {
    test.skip('should connect via SSE', async () => {
      // SSE implementation appears deprecated - uses separate Fastify instance on port 3002
      // STREAM transport (/mcp endpoint) is the modern replacement
      // Keeping tests for documentation but skipping execution
    });

    test.skip('should list tools via SSE', async () => {
      // Skipped - see above
    });

    test.skip('should call tool via SSE', async () => {
      // Skipped - see above
    });

    test.skip('should disconnect cleanly via SSE', async () => {
      // Skipped - see above
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
          masterKey: TEST_MASTER_KEY,
          toolsetName: 'My tool set',
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
        // Try to connect with invalid master key - should reject
        await expect(async () => {
          await mcpClient.connectSTREAM(baseUrl, {
            masterKey: 'WSK_INVALID_KEY_FOR_TESTING',
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
            masterKey: TEST_MASTER_KEY,
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
          masterKey: TEST_MASTER_KEY,
          toolsetName: 'My tool set',
        });

        // Try to connect again without disconnecting
        await expect(async () => {
          await mcpClient.connectSTREAM(baseUrl, {
            masterKey: TEST_MASTER_KEY,
            toolsetName: 'My tool set',
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

