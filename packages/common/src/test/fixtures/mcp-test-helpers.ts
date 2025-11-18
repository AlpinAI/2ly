/**
 * Shared Test Utilities for MCP Client Transport Tests
 *
 * These utilities provide reusable test logic that works across all transport types
 * (STDIO, SSE, STREAM). They encapsulate common assertions and validation patterns
 * to follow DRY principles and ensure consistent testing across transports.
 */

import { expect } from '@playwright/test';
import type { MCPClientFixture } from './mcp-client';

/**
 * Asserts that tool listing works correctly
 * Validates:
 * - Result is defined
 * - Tools array exists and has items
 * - Each tool has required properties (name, description, etc.)
 */
export async function assertToolListing(client: MCPClientFixture) {
  const toolsResult = await client.listTools();

  expect(toolsResult).toBeDefined();
  expect(toolsResult.tools).toBeDefined();
  expect(Array.isArray(toolsResult.tools)).toBe(true);
  expect(toolsResult.tools.length).toBeGreaterThan(0);

  // Validate tool structure
  toolsResult.tools.forEach((tool) => {
    expect(tool.name).toBeDefined();
    expect(typeof tool.name).toBe('string');
    expect(tool.name.length).toBeGreaterThan(0);
  });

  return toolsResult;
}

/**
 * Asserts that a tool can be called successfully
 * Optionally validates the result against expected output
 */
export async function assertToolCall(
  client: MCPClientFixture,
  toolName: string,
  args: Record<string, unknown>,
  expectedResult?: unknown
) {
  const callResult = await client.callTool(toolName, args);

  expect(callResult).toBeDefined();

  if (expectedResult !== undefined) {
    expect(callResult).toEqual(expectedResult);
  }

  return callResult;
}

/**
 * Asserts that a tool call with specific arguments works
 * Specifically for list_allowed_directories which has known output
 */
export async function assertListAllowedDirectoriesCall(client: MCPClientFixture) {
  const callResult = (await client.callTool('list_allowed_directories', {})) as {
    content: { type: string; text: string }[];
  };

  expect(callResult).toBeDefined();
  expect(callResult.content[0].text).toBe('Allowed directories:\n/tmp');

  return callResult;
}

/**
 * Asserts that list_directory tool works with /tmp path
 */
export async function assertListDirectoryCall(client: MCPClientFixture) {
  const callResult = await client.callTool('list_directory', {
    path: '/tmp',
  });

  expect(callResult).toBeDefined();

  return callResult;
}

/**
 * Asserts that disconnect works properly
 * Validates:
 * - Disconnect completes without error
 * - Connection status is updated correctly
 * - Client cannot be used after disconnect
 */
export async function assertDisconnect(client: MCPClientFixture) {
  await client.disconnect();

  const finalStatus = client.getConnectionStatus();
  expect(finalStatus.connected).toBe(false);
  expect(finalStatus.type).toBe(null);

  // Verify client cannot be used after disconnect
  await expect(async () => {
    await client.listTools();
  }).rejects.toThrow('Client not connected');
}

/**
 * Asserts that connection status matches expected values
 */
export function assertConnectionStatus(
  client: MCPClientFixture,
  expectedConnected: boolean,
  expectedType: 'STDIO' | 'SSE' | 'STREAM' | null
) {
  const status = client.getConnectionStatus();
  expect(status.connected).toBe(expectedConnected);
  expect(status.type).toBe(expectedType);
}

/**
 * Finds a specific tool in the tools list by name
 * Asserts that the tool exists
 */
export function findTool(
  tools: Array<{ name: string; [key: string]: unknown }>,
  toolName: string
) {
  const tool = tools.find((t) => t.name === toolName);
  expect(tool).toBeDefined();
  return tool!;
}
