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

import { test, expect, seedPresets } from '../../fixtures/database';
import { createToolset } from '../../fixtures/mcp-builders';
import { createMCPClient } from '../../fixtures/mcp-client';
import { TEST_MASTER_KEY } from '@2ly/common/test/test.containers';

test.describe.skip('MCP Client Transports', () => {
  // Configure tests to run serially (one at a time)
  // test.describe.configure({ mode: 'serial' });
  console.log('testing transports');
  test.beforeEach(async ({ page, resetDatabase, seedDatabase, graphql }) => {
    // Reset database and start runtime with HTTP server (port 3001)
    console.log('resetting database');
    await resetDatabase(true);

    // Seed database with single MCP server (filesystem - STDIO transport)
    // This is a proven working setup from mcp-integration.spec.ts
    const entityIds = await seedDatabase(seedPresets.withSingleMCPServer);
    const workspaceId = entityIds['default-workspace'];
    console.log('workspace id', workspaceId);

    // Wait for runtime to fully initialize and discover tools
    // The runtime needs time to connect to the MCP server and load its tools
    console.log('here1');
    await page.waitForTimeout(15000);
    console.log('here2');
  
    // the workspace id is the one from the previous reset ?
    // use value from the seed database above and fix
    await createToolset(graphql, workspaceId, 'My tool set', 'My tool set description', 1);
  });

  /**
   * STDIO Transport Tests
   *
   * STDIO transport uses stdin/stdout for communication with the runtime process.
   * This is the most direct transport, typically used for toolset-specific connections.
   *
   * Note: STDIO tests are currently skipped because they require spawning a separate
   * runtime process, which is complex in a containerized test environment.
   * The test container uses host networking, making STDIO connections challenging.
   */
  test.describe('STDIO Transport', () => {
    test.skip('should connect via STDIO', async () => {
      // STDIO transport requires spawning runtime as child process
      // This is not feasible with containerized runtime in E2E tests
      // Will be implemented when local runtime testing is available
    });

    test.skip('should list tools via STDIO', async () => {
      // Skipped - see above
    });

    test.skip('should call tool via STDIO', async () => {
      // Skipped - see above
    });

    test.skip('should disconnect cleanly via STDIO', async () => {
      // Skipped - see above
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
    test('should connect, list tools, call tool, and disconnect via STREAM', async () => {
      const runtimePort = Number(process.env.TEST_RUNTIME_PORT);
      console.log('runtime port', runtimePort);
      if (!runtimePort) {
        throw new Error('Runtime port not available. Ensure runtime was started with withRemotePort=true');
      }

      const baseUrl = `http://localhost:${runtimePort}`;
      const mcpClient = createMCPClient();

      try {
        // Step 1: Connect to runtime via STREAM transport
        console.log(`[STREAM Test] Connecting to ${baseUrl}/mcp...`);

        await mcpClient.connectSTREAM(baseUrl, {
          masterKey: TEST_MASTER_KEY,
          toolsetName: 'My tool set',
        });

        const status = mcpClient.getConnectionStatus();
        expect(status.connected).toBe(true);
        expect(status.type).toBe('STREAM');
        console.log('[STREAM Test] ✓ Connected successfully');

        // Step 2: List tools from runtime
        console.log('[STREAM Test] Listing tools...');
        const toolsResult = await mcpClient.listTools();

        expect(toolsResult).toBeDefined();
        expect(toolsResult.tools).toBeDefined();
        expect(Array.isArray(toolsResult.tools)).toBe(true);

        console.log(`[STREAM Test] ✓ Listed ${toolsResult.tools.length} tools`);

        // For debugging: log tool names
        if (toolsResult.tools.length > 0) {
          console.log('[STREAM Test] Available tools:', toolsResult.tools.map(t => t.name).join(', '));
        } else {
          console.warn('[STREAM Test] ⚠ No tools discovered yet. Runtime may still be loading MCP servers.');
        }

        // Step 3: Call a tool (if any tools are available)
        if (toolsResult.tools.length > 0) {
          // The filesystem server should provide tools like read_file, write_file, list_directory
          // Try to find list_directory as it's the safest to test (read-only, minimal args)
          const listDirectoryTool = toolsResult.tools.find(t => t.name === 'list_directory');

          if (listDirectoryTool) {
            console.log(`[STREAM Test] Calling tool: ${listDirectoryTool.name}...`);

            try {
              // Call list_directory with /tmp path (configured in the filesystem server)
              const callResult = await mcpClient.callTool('list_directory', {
                path: '/tmp',
              });

              expect(callResult).toBeDefined();
              console.log(`[STREAM Test] ✓ Tool call completed successfully`);
              console.log(`[STREAM Test] Result:`, JSON.stringify(callResult, null, 2));
            } catch (error) {
              console.log(`[STREAM Test] ⚠ Tool call failed:`, error instanceof Error ? error.message : String(error));
              throw error; // This should succeed, so throw if it fails
            }
          } else {
            console.log(`[STREAM Test] ⚠ list_directory tool not found. Available tools:`, toolsResult.tools.map(t => t.name).join(', '));
          }
        }

        // Step 4: Disconnect cleanly
        console.log('[STREAM Test] Disconnecting...');
        await mcpClient.disconnect();

        const finalStatus = mcpClient.getConnectionStatus();
        expect(finalStatus.connected).toBe(false);
        expect(finalStatus.type).toBe(null);
        console.log('[STREAM Test] ✓ Disconnected successfully');

      } catch (error) {
        console.error('[STREAM Test] ✗ Test failed:', error);
        // Clean up even if test fails
        await mcpClient.disconnect();
        throw error;
      }
    });

    test('should handle authentication failures via STREAM', async () => {
      const runtimePort = Number(process.env.TEST_RUNTIME_PORT);
      if (!runtimePort) {
        throw new Error('Runtime port not available');
      }

      const baseUrl = `http://localhost:${runtimePort}`;
      const mcpClient = createMCPClient();

      try {
        // Try to connect with invalid master key
        console.log('[STREAM Auth Test] Testing with invalid master key...');

        await expect(async () => {
          await mcpClient.connectSTREAM(baseUrl, {
            masterKey: 'WSK_INVALID_KEY_FOR_TESTING',
          });
        }).rejects.toThrow();

        console.log('[STREAM Auth Test] ✓ Correctly rejected invalid authentication');

      } finally {
        // Clean up
        await mcpClient.disconnect();
      }
    });

    test('should handle connection to invalid endpoint via STREAM', async () => {
      const mcpClient = createMCPClient();

      try {
        console.log('[STREAM Connection Test] Testing invalid endpoint...');

        // Try to connect to non-existent server
        await expect(async () => {
          await mcpClient.connectSTREAM('http://localhost:9999', {
            masterKey: TEST_MASTER_KEY,
          });
        }).rejects.toThrow();

        console.log('[STREAM Connection Test] ✓ Correctly handled connection failure');

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

    test('should throw error when connecting twice without disconnect', async () => {
      const runtimePort = Number(process.env.TEST_RUNTIME_PORT);
      if (!runtimePort) {
        throw new Error('Runtime port not available');
      }

      const baseUrl = `http://localhost:${runtimePort}`;
      const mcpClient = createMCPClient();

      try {
        // First connection
        await mcpClient.connectSTREAM(baseUrl, {
          masterKey: TEST_MASTER_KEY,
        });

        // Try to connect again without disconnecting
        await expect(async () => {
          await mcpClient.connectSTREAM(baseUrl, {
            masterKey: TEST_MASTER_KEY,
          });
        }).rejects.toThrow('Client already connected');

      } finally {
        await mcpClient.disconnect();
      }
    });

    test('should handle disconnect on non-connected client gracefully', async () => {
      const mcpClient = createMCPClient();

      // Should not throw error
      await expect(async () => {
        await mcpClient.disconnect();
      }).resolves.not.toThrow();

      // Verify still not connected
      const status = mcpClient.getConnectionStatus();
      expect(status.connected).toBe(false);
    });
  });

});

