# Backend Integration Tests

This directory contains integration tests for the backend package that run against a full test environment using testcontainers.

## Directory Structure

```
tests/
├── integration/           # Integration test specs
│   ├── api.spec.ts       # Backend API tests
│   └── workspace-management.spec.ts  # Workspace management tests (skipped)
├── setup.ts             # Global setup for testcontainers
└── README.md            # This file
```

## Running Tests

```bash
# Run all backend integration tests
npm run test -- packages/backend/tests/integration

# Run specific test file
npm run test -- packages/backend/tests/integration/api.spec.ts
```

## Test Environment

Integration tests use `TestEnvironment` from `@2ly/common` which spins up:
- **Dgraph** (Zero + Alpha) for database
- **NATS** with JetStream for messaging
- **Backend API** server

The environment is started **ONCE** via `globalSetup` before all tests across all workers, and torn down after all tests complete. This ensures:
- Only one set of containers is created (efficient)
- All tests share the same backend instance
- Environment variables (API_URL, etc.) are available to all tests

## Known Issues

⚠️ **Dgraph Authorization Issue**: The backend integration tests currently fail with:
```
unauthorized ip address: 172.21.0.5
```

This is a known issue with Dgraph's ACL configuration in Docker networks. The Dgraph Alpha container needs to be configured to allow connections from the backend container's IP.

**Workaround**: Use the frontend Playwright tests which have the same testcontainer setup but work correctly (timing differences in startup).

**To Fix**: Update `TestEnvironment` in `@2ly/common` to configure Dgraph Alpha with proper ACL settings or whitelist the Docker network CIDR.

## Test Fixtures

Test fixtures are now shared across the monorepo from `@2ly/common/test/fixtures`:

- `graphql(query, variables)` - Execute GraphQL queries
- `resetDatabase()` - Drop all data and reset to empty state
- `seedDatabase(data)` - Populate database with test data
- `getDatabaseState()` - Get current database state for assertions
- `request(path, options)` - Make HTTP requests to backend
- `seedPresets` - Predefined seed data (multipleWorkspaces, etc.)

## Writing Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { graphql, resetDatabase, seedDatabase, seedPresets } from '@2ly/common/test/fixtures';

describe('My Feature Tests', () => {
  beforeEach(async () => {
    await resetDatabase();
    // Optionally seed data
    await seedDatabase(seedPresets.multipleWorkspaces);
  });

  it('should test something', async () => {
    const result = await graphql(`query { workspace { id name } }`);
    expect(result.workspace).toHaveLength(3);
  });
});
```

## Migrated Tests

The following tests were moved from `frontend/tests/e2e/`:

1. **backend-api.spec.ts** (moved from `frontend/tests/e2e/clean/`)
   - System queries
   - Health checks
   - GraphQL introspection

2. **workspace-management.spec.ts** (moved from `frontend/tests/e2e/seeded/`)
   - Workspace queries and filtering
   - Pagination and ordering
   - Edge cases (kept skipped)

These tests don't require a browser and are more efficient in the backend package.
