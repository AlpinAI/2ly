/**
 * Playwright-specific Test Fixtures
 *
 * Exports Playwright test extensions and helpers for E2E testing.
 */

// Main Playwright test with database fixtures
export {
  test,
  expect,
  performLogin,
  seedPresets,
  type DatabaseFixture,
} from './database.fixture';

// MCP client for transport testing (re-exported from fixtures)
export {
  MCPClientFixture,
  createMCPClient,
  type MCPAuthParams,
  type STDIOConnectionParams,
} from '../fixtures';

// Re-export all shared types and utilities from fixtures
export type {
  SeedData,
  DatabaseState,
  Package,
  Argument,
  Transport,
  OmitGenerated,
  AugmentedArgument,
  MCPServerConfig,
  RegistryServerSeed,
  MCPServerSeed,
} from '../fixtures';

export {
  dgraphQL,
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
  sendToolsetHandshake,
  waitForOnboardingStepComplete,
  closeNatsConnection,
  comprehensiveSeededData,
  loginAndGetToken,
} from '../fixtures';
