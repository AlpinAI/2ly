# E2E Test Fixtures

This directory contains reusable fixtures and utilities for E2E testing with Playwright. The fixtures provide type-safe database seeding, MCP server configuration, and test helpers.

## Overview

The fixtures system provides:

- **Type-safe database seeding** with predefined presets
- **Strongly-typed MCP server builders** for creating test configurations
- **GraphQL client** for interacting with the backend API
- **Helper functions** for common test operations (login, database state inspection)

## Core Files

### `database.ts`

Main fixture file providing:
- `resetDatabase()` - Clear all data and optionally start runtime
- `seedDatabase(data)` - Populate database with seed data
- `graphql(query, variables)` - Execute GraphQL queries
- `getDatabaseState()` - Inspect current database state
- `workspaceId` - Get default workspace ID

### `mcp-types.ts`

Type definitions for MCP server configuration:
- `MCPServerConfig` - Complete typed config for MCP servers
- `RegistryServerSeed` - Registry server seed structure
- `MCPServerSeed` - MCP server seed structure
- Type guards for validation

### `mcp-builders.ts`

Builder functions for creating typed MCP server configurations:
- `buildFilesystemServerConfig(directoryPath?)` - Create filesystem server config
- `buildFilesystemRegistryServer(options?)` - Create registry server entry
- `buildMCPServerSeed(options)` - Create complete MCP server seed
- `buildMinimalFilesystemServer(options?)` - Create minimal filesystem server

## Seed Presets

Pre-configured seed data for common test scenarios:

### `seedPresets.withUsers`
Basic user setup for authentication tests
```typescript
await seedDatabase(seedPresets.withUsers);
// Creates: user1@example.com / password123, user2@example.com / password456
```

### `seedPresets.withSingleMCPServer`
Minimal MCP server setup (recommended for most tests)
```typescript
await seedDatabase(seedPresets.withSingleMCPServer);
// Creates: 1 user, 1 registry server, 1 filesystem MCP server
```

### `seedPresets.comprehensive`
Complete setup with multiple servers, tools, runtimes, and tool calls
```typescript
await seedDatabase(seedPresets.comprehensive);
// Creates: 2 users, 4 MCP servers, 23 tools, 3 runtimes, 15 tool calls
```

### `seedPresets.workspaceWithServers`
Multiple MCP servers without users
```typescript
await seedDatabase(seedPresets.workspaceWithServers);
// Creates: Filesystem and GitHub servers
```

## Usage Examples

### Basic Test with Seeded Data

```typescript
import { test, expect, seedPresets, performLogin } from '../../fixtures/database';

test.describe('My Feature', () => {
  test.beforeEach(async ({ resetDatabase, seedDatabase, page }) => {
    await resetDatabase();
    await seedDatabase(seedPresets.withSingleMCPServer);
    await performLogin(page, 'user1@example.com', 'password123');
  });

  test('should display MCP server', async ({ page, workspaceId }) => {
    // Test implementation
  });
});
```

### Creating Custom Seed Data with Builders

```typescript
import { buildMinimalFilesystemServer, buildFilesystemRegistryServer } from '../../fixtures/mcp-builders';

test.beforeEach(async ({ seedDatabase }) => {
  await seedDatabase({
    users: [
      { email: 'test@example.com', password: 'pass123' }
    ],
    registryServers: [
      buildFilesystemRegistryServer({
        name: 'my-custom-server',
        title: 'Custom Server'
      })
    ],
    mcpServers: [
      buildMinimalFilesystemServer({
        name: 'Custom MCP Server',
        runOn: 'EDGE',
        directoryPath: '/custom/path'
      })
    ]
  });
});
```

### Dynamic Server Creation in Tests

For tests that need to create servers dynamically (e.g., testing the server creation flow):

```typescript
import { buildFilesystemServerConfig } from '../../fixtures/mcp-builders';

test('should create MCP server', async ({ graphql, workspaceId }) => {
  // Get registry server ID
  const registryResult = await graphql(`
    query GetRegistry($workspaceId: ID!) {
      getRegistryServers(workspaceId: $workspaceId) { id name }
    }
  `, { workspaceId });

  // Create MCP server with typed config
  await graphql(`
    mutation CreateServer($config: String!, ...) {
      createMCPServer(config: $config, ...) { id }
    }
  `, {
    config: JSON.stringify(buildFilesystemServerConfig('/tmp')),
    // ... other params
  });
});
```

## Type Safety Benefits

The new typed system ensures:

1. **Compile-time validation** - TypeScript catches config errors before runtime
2. **Autocomplete support** - IDEs provide suggestions for config options
3. **Consistent structure** - All MCP servers use the same config format
4. **Easier refactoring** - Changes to config structure propagate automatically

## Backward Compatibility

The `SeedData` interface supports both old and new formats:

**Old format** (still supported):
```typescript
mcpServers: [{
  name: 'Server',
  transport: 'STDIO',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp']
}]
```

**New typed format** (recommended):
```typescript
mcpServers: [buildMinimalFilesystemServer()]
```

## Best Practices

1. **Use presets when possible** - `seedPresets.withSingleMCPServer` covers most cases
2. **Use builders for custom configs** - Don't manually create config objects
3. **Avoid seeding too much data** - Use minimal presets for faster tests
4. **Seed in beforeEach, not in tests** - Keep test bodies focused on assertions
5. **Reset database between test suites** - Ensure clean state for each suite

## Migration Guide

If you have existing tests with hardcoded MCP server configs:

**Before:**
```typescript
const config = {
  registryType: 'npm',
  identifier: '@modelcontextprotocol/server-filesystem',
  version: '2025.8.21',
  packageArguments: [{ name: 'directory_path', value: '/tmp', ... }],
  environmentVariables: [],
  runtimeArguments: [],
};
```

**After:**
```typescript
import { buildFilesystemServerConfig } from '../../fixtures/mcp-builders';

const config = buildFilesystemServerConfig('/tmp');
```

## Troubleshooting

### "No workspace found" error
Make sure to seed the database before using `workspaceId` fixture:
```typescript
await seedDatabase(seedPresets.withUsers);
// Now workspaceId will be available
```

### Registry server not found
If using dynamic server creation, ensure the registry server exists:
```typescript
await seedDatabase({
  registryServers: [buildFilesystemRegistryServer()]
});
```

### Tools not discovered
Tools are discovered asynchronously. Add polling logic:
```typescript
let tools = [];
for (let i = 0; i < 10; i++) {
  const result = await graphql(toolsQuery, { workspaceId });
  tools = result.mcpTools;
  if (tools.length > 0) break;
  await page.waitForTimeout(2000);
}
```
