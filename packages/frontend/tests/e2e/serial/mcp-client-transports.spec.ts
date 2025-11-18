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

test.describe('MCP Client Transports', () => {
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

        const status = mcpClient.getConnectionStatus();
        expect(status.connected).toBe(true);
        expect(status.type).toBe('STREAM');

        // Step 2: List tools from runtime
        const toolsResult = await mcpClient.listTools();

        expect(toolsResult).toBeDefined();
        expect(toolsResult.tools).toBeDefined();
        expect(Array.isArray(toolsResult.tools)).toBe(true);
        expect(toolsResult.tools.length).toBeGreaterThan(0);

        // Validate tool structure
        toolsResult.tools.forEach(tool => {
          expect(tool.name).toBeDefined();
          expect(typeof tool.name).toBe('string');
          expect(tool.name.length).toBeGreaterThan(0);
        });

        // Step 3: Call a tool without arguments
        const listAllowedDirectories = toolsResult.tools.find(t => t.name === 'list_allowed_directories');
        expect(listAllowedDirectories).toBeDefined();
        try {
          const callResult = (await mcpClient.callTool('list_allowed_directories', {})) as {content: {type: string, text: string}[]};
          expect(callResult).toBeDefined();
          expect(callResult.content[0].text).toBe('Allowed directories:\n/tmp');
        } catch (error) {
          console.log(`[STREAM Test] ⚠ Tool call failed:`, error instanceof Error ? error.message : String(error));
          throw error; // This should succeed, so throw if it fails
        }

        // Step 4: Call a tool with arguments
        // The filesystem server should provide tools like read_file, write_file, list_directory
        // Try to find list_directory as it's the safest to test (read-only, minimal args)
        const listDirectoryTool = toolsResult.tools.find(t => t.name === 'list_directory');
        expect(listDirectoryTool).toBeDefined();

        try {
          // Call list_directory with /tmp path (configured in the filesystem server)
          const callResult = await mcpClient.callTool('list_directory', {
            path: '/tmp',
          });

          expect(callResult).toBeDefined();
        } catch (error) {
          console.log(`[STREAM Test] ⚠ Tool call failed:`, error instanceof Error ? error.message : String(error));
          throw error; // This should succeed, so throw if it fails
        }

        // Step 5: Disconnect cleanly
        await mcpClient.disconnect();

        const finalStatus = mcpClient.getConnectionStatus();
        expect(finalStatus.connected).toBe(false);
        expect(finalStatus.type).toBe(null);

        // Verify client cannot be used after disconnect
        await expect(async () => {
          await mcpClient.listTools();
        }).rejects.toThrow('Client not connected');

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

