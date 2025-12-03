# Test Fixtures

Shared test fixtures for integration tests (Vitest) and E2E tests (Playwright).

## Overview

This directory provides framework-agnostic test utilities and Playwright-specific fixtures for database seeding, MCP server configuration, and test helpers.

## Structure

```
fixtures/
├── core.ts                        # Framework-agnostic utilities (graphql, resetDatabase, etc.)
├── dgraph-client.ts               # Direct Dgraph GraphQL access
├── mcp-client.ts                  # MCP client for transport testing (STDIO, SSE, STREAM)
├── mcp-types.ts                   # MCP server type definitions
├── mcp-builders.ts                # MCP server builder functions
├── nats-helpers.ts                # NATS messaging utilities
├── seed-data.types.ts             # SeedData interface
├── seed-data.presets.ts           # Predefined seed data presets
├── seed-data.comprehensive.ts     # Comprehensive seed data for E2E
└── index.ts                       # Main exports

playwright/
├── database.fixture.ts            # Playwright test.extend() wrapper
└── index.ts                       # Playwright-specific exports (re-exports from fixtures)
```

## Usage

### Integration Tests (Vitest)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  graphql,
  resetDatabase,
  seedDatabase,
  seedPresets,
  createMCPClient, // ← Now available for integration tests!
} from '@2ly/common/test/fixtures';

describe('My Feature Tests', () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedDatabase(seedPresets.defaultWorkspace);
  });

  it('should test something', async () => {
    const result = await graphql(`
      query {
        workspaces {
          id
          name
        }
      }
    `);
    expect(result.workspaces).toHaveLength(1);
  });

  it('should test MCP transport', async () => {
    // Now you can test MCP clients in integration tests!
    const client = createMCPClient();
    await client.connectSTREAM('http://localhost:3001', { masterKey: 'test' });
    const tools = await client.listTools();
    expect(tools.tools.length).toBeGreaterThan(0);
    await client.disconnect();
  });
});
```

### E2E Tests (Playwright)

```typescript
import { test, expect, seedPresets, performLogin } from '@2ly/common/test/fixtures/playwright';

test.describe('My Feature', () => {
  test.beforeEach(async ({ resetDatabase, seedDatabase, page }) => {
    await resetDatabase();
    await seedDatabase(seedPresets.withSingleMCPServer);
    await performLogin(page, 'user1@2ly.ai', 'password123');
  });

  test('should display MCP server', async ({ page, workspaceId }) => {
    // Test implementation
  });
});
```

## Core Utilities

### `graphql(query, variables)`

Execute GraphQL queries against the backend API.

### `resetDatabase()`

Drop all data and reset database to empty state.

### `seedDatabase(data)`

Populate database with test data.

- **Integration tests**: Use simple version via backend API
- **E2E tests**: Use Playwright fixture for comprehensive seeding with direct Dgraph access

### `getDatabaseState()`

Inspect current database state for debugging/assertions.

### `request(path, options)`

Make direct HTTP requests to the backend.

## Seed Presets

### `seedPresets.defaultWorkspace`

Single workspace with no additional data.

### `seedPresets.multipleWorkspaces`

Multiple workspaces for testing workspace management.

### `seedPresets.withUsers`

Basic user setup for authentication tests.

### `seedPresets.withSingleMCPServer`

Minimal MCP server setup (recommended for most tests).

### `seedPresets.workspaceWithServers`

Multiple MCP servers without users.

### `seedPresets.fullSetup`

Complete setup with users, workspaces, and servers.

### `seedPresets.comprehensive`

Complete setup with multiple servers, tools, runtimes, and tool calls (E2E only).

## MCP Builders

### `buildFilesystemServerConfig(directoryPath?)`

Create filesystem server configuration.

### `buildFilesystemRegistryServer(options?)`

Create registry server entry for filesystem server.

### `buildMinimalFilesystemServer(options?)`

Create minimal filesystem server seed (most common use case).

### `buildGenericServerConfig(identifier, version)`

Create generic server config for SSE/STREAM transports.

### `buildWebFetchServer(options?)`

Build a Web Fetch MCP server (SSE transport).

### `buildDevelopmentToolsServer(options?)`

Build a Development Tools MCP server (STREAM transport).

### `buildDatabaseServer(options?)`

Build a Database MCP server (STDIO transport).

## Dynamic Helpers

These helpers create entities dynamically via GraphQL:

### `configureFileSystemMCPServer(graphql, workspaceId, runOn)`

Create a filesystem MCP server via GraphQL.

### `createRuntime(graphql, waitForTimeout, workspaceId, name, description, type)`

Create a runtime dynamically.

### `createSkill(graphql, workspaceId, name, description, nbToolsToLink)`

Create a skill and link tools dynamically.

## NATS Helpers

### `sendSkillHandshake(params)`

Send a skill handshake message to trigger onboarding step 3.

### `waitForOnboardingStepComplete(workspaceId, stepId, timeoutMs, pollIntervalMs)`

Poll for onboarding step completion using direct Dgraph queries.

### `closeNatsConnection()`

Close the NATS connection.

## Playwright-Specific

### `test`

Extended Playwright test with database fixtures.

### `performLogin(page, email, password)`

Automate login flow for authenticated test scenarios.

### `createMCPClient()`

Create an MCP client for testing STDIO, SSE, and STREAM transports.

## Best Practices

1. **Use presets when possible** - `seedPresets.withSingleMCPServer` covers most cases
2. **Use builders for custom configs** - Don't manually create config objects
3. **Avoid seeding too much data** - Use minimal presets for faster tests
4. **Seed in beforeEach, not in tests** - Keep test bodies focused on assertions
5. **Reset database between test suites** - Ensure clean state for each suite

## Type Safety

All fixtures are strongly-typed using:

- `SeedData` interface for seed data
- `MCPServerConfig` for MCP server configurations
- `RegistryServerSeed` for registry servers
- `OmitGenerated<T>` helper to exclude auto-generated fields

This ensures compile-time validation and autocomplete support in IDEs.
