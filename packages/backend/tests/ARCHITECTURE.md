# Backend Test Architecture

## Global Setup vs Setup Files

This project uses Vitest's **globalSetup** for integration tests, not `setupFiles`. Understanding the difference is critical:

### `setupFiles` ❌ (Don't use for testcontainers)
- Runs **once per test file** or **once per worker**
- If you have 5 test files and 3 workers, it could run 3-5 times
- Would create **multiple TestEnvironment instances**
- Each instance tries to start Docker containers
- Results in port conflicts, resource exhaustion, and race conditions

### `globalSetup` ✅ (Correct for testcontainers)
- Runs **exactly once** before all tests start
- Creates **one TestEnvironment** for the entire test suite
- All test files share the same containers
- Efficient and predictable
- Teardown runs once after all tests complete

## Configuration

In `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    // ✅ Correct: Global setup for shared resources
    globalSetup: ['packages/backend/tests/setup.ts'],

    // ❌ Wrong: Would create multiple environments
    // setupFiles: ['packages/backend/tests/setup.ts'],
  }
});
```

## How It Works

1. **Before all tests**: `globalSetup` runs `packages/backend/tests/setup.ts`
   - Starts TestEnvironment (Dgraph, NATS, Backend containers)
   - Sets environment variables (API_URL, NATS_URL, etc.)
   - Returns teardown function

2. **During tests**: All test files run
   - Import fixtures from `tests/fixtures/database.ts`
   - Fixtures read `process.env.API_URL` (set by global setup)
   - All tests use the same backend instance

3. **After all tests**: Teardown function runs
   - Stops all containers
   - Cleans up resources

## Environment Variables

The global setup sets these variables for all tests:

```bash
API_URL=http://localhost:55432        # Backend API
DGRAPH_URL=http://localhost:55433/graphql  # Dgraph GraphQL
NATS_URL=localhost:55434              # NATS client
```

Port numbers are dynamically allocated by testcontainers.

## Test Isolation

Even though all tests share the same backend:
- Each test should call `resetDatabase()` in `beforeEach` if it needs a clean slate
- Use `seedDatabase()` to set up specific test data
- Tests can run in parallel as long as they don't modify shared state

## Debugging

To see when the environment starts:

```bash
npx vitest run packages/backend/tests/integration
```

You should see **exactly one** of these messages:
```
🚀 Starting test environment (ONCE for all backend tests)...
```

If you see this message multiple times, `globalSetup` is not configured correctly.

## Common Pitfalls

1. **Don't use `beforeAll` in test files for TestEnvironment**
   - `beforeAll` runs per test file, creating multiple environments
   - Use `globalSetup` in vitest.config.ts instead

2. **Don't manually start/stop TestEnvironment in tests**
   - The global setup handles lifecycle
   - Tests should only use the fixtures

3. **Don't hardcode URLs**
   - Always read from `process.env.API_URL`
   - The fixtures handle this automatically

## Performance

With global setup:
- First run: ~60-90 seconds (Docker build + container startup)
- Subsequent runs: ~30-45 seconds (cached Docker image)
- Teardown: ~5-10 seconds

If you see longer times or multiple container startups, check your config.
