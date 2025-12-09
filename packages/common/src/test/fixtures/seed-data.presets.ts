/**
 * Common seed data presets for different test scenarios
 *
 * Provides pre-configured seed data for common testing needs.
 * These presets work with both integration tests (Vitest) and E2E tests (Playwright).
 */

import type { SeedData } from './seed-data.types';
import {
  buildFilesystemRegistryServer,
  buildMinimalFilesystemServer,
} from './mcp-builders';
import { comprehensiveSeededData } from './seed-data.comprehensive';

/**
 * Common seed data presets for different test scenarios
 */
export const seedPresets = {
  /**
   * Single workspace with no additional data
   */
  defaultWorkspace: {
    workspaces: [
      {
        name: 'Default Workspace',
      },
    ],
  },

  /**
   * Multiple workspaces for testing workspace management
   */
  multipleWorkspaces: {
    workspaces: [
      {
        name: 'Development',
      },
      {
        name: 'Production',
      },
      {
        name: 'Testing',
      },
    ],
  },

  /**
   * Workspace with MCP servers
   */
  workspaceWithServers: {
    workspaces: [
      {
        name: 'Development',
      },
    ],
    registryServers: [
      buildFilesystemRegistryServer(),
      buildFilesystemRegistryServer({
        name: '@modelcontextprotocol/server-github',
        title: 'GitHub Server',
        description: 'GitHub MCP server',
      }),
    ],
    mcpServers: [
      buildMinimalFilesystemServer({ name: 'Filesystem Server' }),
      buildMinimalFilesystemServer({
        name: 'GitHub Server',
        description: 'GitHub MCP server',
      }),
    ],
  },

  /**
   * Complete setup with users, workspaces, and servers
   */
  fullSetup: {
    workspaces: [
      {
        name: 'Main Workspace',
      },
    ],
    users: [
      {
        email: 'user1@skilder.ai',
        password: 'testpassword123',
      },
    ],
    registryServers: [buildFilesystemRegistryServer()],
    mcpServers: [buildMinimalFilesystemServer({ name: 'Filesystem Server' })],
  },

  /**
   * Setup with test users for authentication tests
   */
  withUsers: {
    users: [
      {
        email: 'user1@skilder.ai',
        password: 'password123',
      },
      {
        email: 'user2@skilder.ai',
        password: 'password456',
      },
    ],
  },

  /**
   * Comprehensive seed data for deep linking and navigation tests
   * Includes: users, workspaces, MCP servers, tools, runtimes (agents), and tool calls
   * This preset is imported from seed-data.comprehensive.ts for maintainability
   */
  get comprehensive() {
    return comprehensiveSeededData;
  },

  /**
   * Minimal setup with a single MCP server (filesystem) using typed config
   * Perfect for basic MCP server testing without the overhead of comprehensive data
   */
  withSingleMCPServer: {
    users: [
      {
        email: 'user1@skilder.ai',
        password: 'password123',
      },
    ],
    registryServers: [buildFilesystemRegistryServer({ name: 'file-system' })],
    mcpServers: [buildMinimalFilesystemServer({ name: 'file-system', directoryPath: '/' })],
  },
} satisfies Record<string, SeedData | { comprehensive: SeedData }>;
