/**
 * Test Fixtures - Main Export File
 *
 * Provides framework-agnostic test fixtures for database seeding and test utilities.
 * These can be used directly in Vitest integration tests or wrapped in Playwright fixtures.
 */

// Core fixture functions
export {
  graphql,
  resetDatabase,
  getDatabaseState,
  request,
  seedDatabase,
} from './core';

// Dgraph client for direct database access
export { dgraphQL } from './dgraph-client';

// MCP types and builders
export type {
  Package,
  Argument,
  Transport,
  OmitGenerated,
  AugmentedArgument,
  MCPServerConfig,
  RegistryServerSeed,
  MCPServerSeed,
} from './mcp-types';

export {
  isAugmentedArgument,
  isValidMCPServerConfig,
} from './mcp-types';

export {
  buildFilesystemServerConfig,
  buildFilesystemRegistryServer,
  buildMCPServerSeed,
  buildMinimalFilesystemServer,
  buildGenericServerConfig,
  buildWebFetchServer,
  buildDevelopmentToolsServer,
  buildDatabaseServer,
  configureFileSystemMCPServer,
  createToolset,
  updateMCPServerToEdgeRuntime,
} from './mcp-builders';

// NATS helpers
export {
  sendToolsetHandshake,
  waitForOnboardingStepComplete,
  closeNatsConnection,
} from './nats-helpers';

// MCP Client for transport testing
export {
  MCPClientFixture,
  createMCPClient,
  type MCPAuthParams,
  type STDIOConnectionParams,
} from './mcp-client';

// Seed data types and presets
export type {
  SeedData,
  DatabaseState,
} from './seed-data.types';

export { seedPresets } from './seed-data.presets';

export { comprehensiveSeededData } from './seed-data.comprehensive';
