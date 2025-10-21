# E2E Test Organization

This directory contains end-to-end tests organized into **three strategies** based on database state requirements and test dependencies.

## 📋 Overview

Different tests have different requirements for database state and test isolation. We organize tests into three categories to optimize for both test reliability and execution speed:

| Strategy | Database Reset | Test Execution | Use Case |
|----------|---------------|----------------|----------|
| **Clean Slate** | Before EACH test | Sequential (1 worker) | Data mutations, complete isolation |
| **Seeded** | Before EACH describe | Sequential per file | Query testing with known data |
| **Parallel** | Once before ALL tests | Parallel | UI tests, order-independent |

---

## 🧹 Strategy 1: Clean Slate Tests

**Location:** `e2e/clean/`

**Database State:** Fresh/empty before EACH test

**Execution:** Sequential (workers: 1 - one test at a time)

**Best For:**
- Data mutations and modifications
- Creating, updating, or deleting data
- Testing with empty database scenarios
- Complete test isolation required
- Tests that need predictable database state

**Example Use Cases:**
- Verify system starts in uninitialized state
- Create first workspace on empty system
- Test validation errors with no existing data
- Backend API health checks

**Example Test:**
```typescript
import { test, expect } from '../../fixtures/database';

test.describe('Workspace Creation', () => {
  test.beforeEach(async ({ resetDatabase }) => {
    await resetDatabase(); // Fresh DB for each test
  });

  test('should create first workspace', async ({ graphql }) => {
    // Database is completely empty here
    const result = await graphql(CREATE_WORKSPACE_MUTATION, {
      name: 'My First Workspace'
    });

    expect(result.addWorkspace.workspace[0].name).toBe('My First Workspace');
  });
});
```

**Running Clean Tests:**
```bash
# All browsers (each runs sequentially with workers: 1)
npm run test:e2e -- --project=clean-chromium --project=clean-firefox --project=clean-webkit

# Single browser
npm run test:e2e -- --project=clean-chromium

# Specific file
npx playwright test tests/e2e/clean/workspace-creation.spec.ts
```

**Note:** Clean tests run with `workers: 1` to prevent race conditions. Each test calls `resetDatabase()` in `beforeEach()`, ensuring complete isolation.

---

## 🌱 Strategy 2: Seeded Tests

**Location:** `e2e/seeded/`

**Database State:** Pre-populated before EACH describe block

**Execution:** Sequential per file (workers: 1), serial within describe blocks

**Best For:**
- Testing queries and filters
- GraphQL query verification
- Search functionality
- Pagination
- Read-only operations within a describe block

**Example Use Cases:**
- Query workspaces from pre-seeded data
- Test workspace filtering
- Verify pagination with known dataset
- Display multiple MCP servers

**⚠️ Important:**
- Each `describe` block resets and seeds the database
- Tests within a describe run serially (use `test.describe.configure({ mode: 'serial' })`)
- Tests should be read-only within each describe block

**Example Test:**
```typescript
import { test, expect, seedPresets } from '../../fixtures/database';

test.describe('Workspace Management', () => {
  // Reset and seed before this describe block
  test.beforeAll(async ({ resetDatabase, seedDatabase }) => {
    await resetDatabase();
    await seedDatabase(seedPresets.multipleWorkspaces);
  });

  // Configure tests to run serially within this describe
  test.describe.configure({ mode: 'serial' });

  test('should display all workspaces', async ({ graphql }) => {
    // Database has 3 workspaces from seed
    const result = await graphql(GET_WORKSPACES_QUERY);
    expect(result.workspace).toHaveLength(3);
  });

  test('should filter workspaces by name', async ({ graphql }) => {
    // Tests run serially, database state is consistent
    const result = await graphql(GET_WORKSPACES_QUERY, {
      filter: { name: { eq: 'Development' } }
    });
    expect(result.workspace[0].name).toBe('Development');
  });
});

test.describe('Workspace Pagination', () => {
  // Each describe block resets and seeds independently
  test.beforeAll(async ({ resetDatabase, seedDatabase }) => {
    await resetDatabase();
    await seedDatabase(seedPresets.multipleWorkspaces);
  });

  test.describe.configure({ mode: 'serial' });

  test('should paginate results', async ({ graphql }) => {
    // Fresh seeded data for this describe block
    const result = await graphql(GET_WORKSPACES_QUERY, { first: 2 });
    expect(result.workspace).toHaveLength(2);
  });
});
```

**Available Seed Presets:**

See `tests/fixtures/database.ts` for all available presets:

```typescript
import { seedPresets } from '../../fixtures/database';

// Single workspace
seedPresets.defaultWorkspace

// 3 workspaces (Development, Production, Testing)
seedPresets.multipleWorkspaces

// Workspace with MCP servers
seedPresets.workspaceWithServers

// Complete setup (users, workspaces, servers)
seedPresets.fullSetup
```

**Running Seeded Tests:**
```bash
# All browsers (each runs sequentially with workers: 1)
npm run test:e2e -- --project=seeded-chromium --project=seeded-firefox --project=seeded-webkit

# Single browser
npm run test:e2e -- --project=seeded-chromium

# Specific file
npx playwright test tests/e2e/seeded/workspace-management.spec.ts
```

**Note:** Seeded tests run with `workers: 1` and use `test.describe.configure({ mode: 'serial' })` within each describe block.

---

## ⚡ Strategy 3: Parallel Tests

**Location:** `e2e/parallel/`

**Database State:** Seeded ONCE before all tests

**Execution:** Parallel (full parallelization)

**Best For:**
- UI-focused tests
- Tests that don't depend on specific data
- Visual regression tests
- Accessibility tests
- Tests that can run in any order

**Example Use Cases:**
- Verify page loads without errors
- Test responsive design
- Check accessibility features
- Test navigation elements
- Verify UI components render correctly
- Test user interactions that don't modify data

**⚠️ Important:**
- Database is seeded once and **never modified**
- Tests must be **order-independent**
- Tests should **not modify data** (or modifications don't affect other tests)
- Perfect for UI/UX testing where data state doesn't matter

**Example Test:**
```typescript
import { test, expect, seedPresets } from '../../fixtures/database';

// Seed once before all tests
test.beforeAll(async ({ resetDatabase, seedDatabase }) => {
  await resetDatabase();
  await seedDatabase(seedPresets.multipleWorkspaces);
});

test.describe('Workspace UI Display', () => {
  test('should display workspace list page', async ({ page }) => {
    await page.goto('/workspaces');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should show workspace cards', async ({ page }) => {
    await page.goto('/workspaces');
    const cards = page.locator('[data-testid="workspace-card"]');
    await expect(cards.first()).toBeVisible();
  });
});

test.describe('Workspace UI Interactions', () => {
  test('should handle page load without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/workspaces');
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/workspaces');
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile
    await expect(page.locator('body')).toBeVisible();
  });
});
```

**Running Parallel Tests:**
```bash
# All browsers (full parallelization)
npm run test:e2e -- --project=parallel-chromium --project=parallel-firefox --project=parallel-webkit

# Single browser
npm run test:e2e -- --project=parallel-chromium

# Specific file
npx playwright test tests/e2e/parallel/workspace-ui.spec.ts
```

**Note:** Parallel tests use the global `fullyParallel: true` setting and don't have `workers: 1` restriction.

---

## 🛠️ Database Fixture API

All tests have access to database helper functions via fixtures:

### `resetDatabase()`
Drops all data from the database.

```typescript
await resetDatabase();
```

### `seedDatabase(data)`
Populates database with test data.

```typescript
await seedDatabase({
  workspaces: [
    { name: 'Dev Workspace', description: 'For development' }
  ],
  mcpServers: [
    { name: 'FS Server', transport: 'STDIO', command: 'npx', args: [...] }
  ]
});
```

### `graphql(query, variables?)`
Execute GraphQL queries/mutations.

```typescript
const result = await graphql<{ workspace: Workspace[] }>(
  `query { workspace: queryWorkspace { id name } }`,
  { filter: { name: { eq: 'Test' } } }
);
```

### `getDatabaseState()`
Get current database state (for debugging/assertions).

```typescript
const state = await getDatabaseState();
console.log(state.workspaces);
console.log(state.mcpServers);
console.log(state.users);
console.log(state.system);
```

---

## 📊 Decision Matrix

**Choose the right strategy for your test:**

| Your Test Needs... | Use Strategy |
|-------------------|--------------|
| Empty database each time | **Clean Slate** |
| To create, update, or delete data | **Clean Slate** |
| Existing data to query | **Seeded** |
| To test queries/filters with known data | **Seeded** |
| Complete test isolation | **Clean Slate** |
| UI/UX testing without data dependencies | **Parallel** |
| Tests that can run in any order | **Parallel** |
| Fastest execution with pre-seeded data | **Parallel** |
| GraphQL query testing | **Seeded** |
| Visual/accessibility testing | **Parallel** |

---

## 🎯 Best Practices

### Clean Slate Tests ✅
- ✅ Always call `resetDatabase()` in `beforeEach()`
- ✅ Test one specific feature per test
- ✅ Keep tests independent
- ✅ Use for data mutations (create/update/delete)
- ✅ Tests run sequentially (workers: 1)

### Seeded Tests ✅
- ✅ Use `beforeAll()` with `resetDatabase()` and `seedDatabase()` in each describe
- ✅ Add `test.describe.configure({ mode: 'serial' })` in each describe
- ✅ **READ-ONLY operations within each describe**
- ✅ Use seed presets for consistency
- ✅ Test queries, filters, pagination
- ✅ Multiple describe blocks can have different seed data
- ❌ Don't create/update/delete data within a describe block

### Parallel Tests ✅
- ✅ Seed database once in `beforeAll()` at file level
- ✅ Tests must be order-independent
- ✅ Perfect for UI/UX testing
- ✅ No data modifications (or modifications don't affect other tests)
- ✅ Full parallelization for fastest execution
- ❌ Don't depend on specific data state
- ❌ Don't modify data that affects other tests

---

## 🏃 Running Tests

### Run All Tests
```bash
npm run test:e2e
```

### Run by Strategy
```bash
# Clean slate tests (sequential execution)
npm run test:e2e -- --project=clean-chromium

# Seeded tests (sequential per file)
npm run test:e2e -- --project=seeded-chromium

# Parallel tests (full parallelization)
npm run test:e2e -- --project=parallel-chromium
```

### Run by Browser
```bash
# Chromium only (all strategies)
npm run test:e2e -- --project=clean-chromium --project=seeded-chromium --project=parallel-chromium

# Firefox only (all strategies)
npm run test:e2e -- --project=clean-firefox --project=seeded-firefox --project=parallel-firefox

# WebKit/Safari only (all strategies)
npm run test:e2e -- --project=clean-webkit --project=seeded-webkit --project=parallel-webkit
```

### Debug Mode
```bash
# UI mode (recommended)
npm run test:e2e:ui

# Headed mode (see browser)
npm run test:e2e:headed

# Debug mode (inspector)
npm run test:e2e:debug
```

---

## 📝 Examples

### Clean Slate Example
```typescript
// tests/e2e/clean/workspace-creation.spec.ts
import { test, expect } from '../../fixtures/database';

test.describe('Workspace Creation', () => {
  test.beforeEach(async ({ resetDatabase }) => {
    await resetDatabase();
  });

  test('should create workspace', async ({ graphql, getDatabaseState }) => {
    const initialState = await getDatabaseState();
    expect(initialState.workspaces).toHaveLength(0);

    await graphql(CREATE_WORKSPACE_MUTATION, { name: 'Test' });

    const finalState = await getDatabaseState();
    expect(finalState.workspaces).toHaveLength(1);
  });
});
```

### Seeded Example
```typescript
// tests/e2e/seeded/workspace-queries.spec.ts
import { test, expect, seedPresets } from '../../fixtures/database';

test.describe('Workspace Queries', () => {
  test.beforeAll(async ({ resetDatabase, seedDatabase }) => {
    await resetDatabase();
    await seedDatabase(seedPresets.multipleWorkspaces);
  });

  test('should query all workspaces', async ({ graphql }) => {
    const result = await graphql(GET_WORKSPACES_QUERY);
    expect(result.workspace).toHaveLength(3);
  });
});
```

### Parallel Example
```typescript
// tests/e2e/parallel/workspace-ui.spec.ts
import { test, expect, seedPresets } from '../../fixtures/database';

// Seed once for all tests
test.beforeAll(async ({ resetDatabase, seedDatabase }) => {
  await resetDatabase();
  await seedDatabase(seedPresets.multipleWorkspaces);
});

test.describe('Workspace UI', () => {
  test('should display page', async ({ page }) => {
    await page.goto('/workspaces');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/workspaces');
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });
});
```

---

## 🔍 Troubleshooting

**Tests failing due to database race conditions?**
- Make sure clean tests have `workers: 1` configured
- Check that `resetDatabase()` is called in `beforeEach()` for clean tests
- Verify seeded tests use `test.describe.configure({ mode: 'serial' })`

**Tests in seeded strategy modifying each other's data?**
- Ensure each `describe` block has its own `beforeAll()` with reset + seed
- Add `test.describe.configure({ mode: 'serial' })` in each describe
- Make sure tests within a describe are read-only

**Database not resetting between tests?**
- Check `beforeEach` vs `beforeAll` usage
- Verify `resetDatabase()` is being called correctly
- Confirm backend `/reset` endpoint is working

**Parallel tests failing unexpectedly?**
- Ensure tests don't modify data (or modifications don't affect other tests)
- Check that tests are truly order-independent
- Verify database is seeded once before all tests

**Need to debug database state?**
- Use `getDatabaseState()` to inspect current data
- Add console.log statements
- Use Playwright UI mode to step through tests
- Check backend logs for reset endpoint calls

---

For more information, see:
- [Main Test Documentation](../README.md)
- [Playwright Documentation](https://playwright.dev)
- [Database Fixture Source](../fixtures/database.ts)
