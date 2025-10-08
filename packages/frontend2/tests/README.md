# Integration Tests with Playwright

This directory contains end-to-end integration tests for the 2LY frontend using Playwright and Testcontainers.

## Overview

The test setup automatically:
1. Spins up a complete test environment using Docker containers:
   - **Dgraph** (Zero + Alpha) for database
   - **NATS** with JetStream for messaging
   - **Backend API** server
2. Starts the Vite dev server for the frontend
3. Runs tests against all major browsers (Chromium, Firefox, WebKit/Safari)
4. Tears down everything after tests complete

## Prerequisites

- **Docker** must be installed and running
- **Node.js** 18+
- All dependencies installed (`npm install`)

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run tests in UI mode (recommended for development)
```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see the browser)
```bash
npm run test:e2e:headed
```

### Run tests in debug mode
```bash
npm run test:e2e:debug
```

### Run specific test file
```bash
npx playwright test tests/e2e/login.spec.ts
```

### Run tests for specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Structure

```
tests/
├── e2e/                    # End-to-end test specs
│   └── login.spec.ts       # Example login page tests
├── fixtures/               # Test fixtures and helpers
├── global-setup.ts         # Starts test environment
├── global-teardown.ts      # Cleans up test environment
└── README.md               # This file
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/your-page');
  });

  test('should do something', async ({ page }) => {
    // Your test code here
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

### Environment Variables

The test environment exposes these URLs:

- `process.env.BASE_URL` - Frontend URL (http://localhost:8888)
- `process.env.API_URL` - Backend API URL
- `process.env.DGRAPH_URL` - Dgraph GraphQL endpoint
- `process.env.NATS_URL` - NATS connection URL

### Using the Test Environment in Backend Tests

The test environment setup is in `@2ly/common` and can be used for backend integration tests too:

```typescript
import { TestEnvironment } from '@2ly/common';

let testEnv: TestEnvironment;

beforeAll(async () => {
  testEnv = new TestEnvironment({
    startBackend: true,
    logging: { enabled: true },
  });
  await testEnv.start();
});

afterAll(async () => {
  await testEnv.stop();
});

test('backend feature', async () => {
  const backendUrl = testEnv.getBackendUrl();
  // Test against real backend
});
```

## Test Reports

After running tests, reports are available in:
- `test-results/html/` - HTML report with screenshots and videos
- `test-results/results.json` - JSON report for CI/CD integration

View HTML report:
```bash
npx playwright show-report test-results/html
```

## Debugging Tests

### Use Playwright Inspector
```bash
npm run test:e2e:debug
```

### Use VSCode Extension
Install the [Playwright Test for VSCode](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) extension for:
- Running tests from the editor
- Setting breakpoints
- Step-through debugging
- Test generation

### Console Logs
Tests run with console output. To see more verbose logging:

```typescript
test('my test', async ({ page }) => {
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  // ... rest of test
});
```

## Performance Considerations

### First Run
The first test run will be slow (2-5 minutes) because:
1. Docker needs to pull images (Dgraph, NATS, Node.js)
2. Backend Docker image needs to be built
3. Containers need to start and become healthy

### Subsequent Runs
After the first run, tests should start in ~30-60 seconds because:
- Docker images are cached
- Backend image is cached

### Parallel Tests
Tests run in parallel by default. Adjust concurrency in `playwright.config.ts`:
```typescript
workers: 4, // Number of parallel workers
```

## Troubleshooting

### "Cannot connect to Docker daemon"
- Ensure Docker Desktop is running
- Check Docker is accessible: `docker ps`

### Tests timeout on startup
- Check Docker has enough resources (4GB+ RAM recommended)
- Check container logs: `docker logs 2ly-backend-test`
- Increase timeout in `playwright.config.ts`

### Port conflicts
- Ensure ports 3000, 4222, 5080, 6080, 7080, 8080, 8222, 9080 are available
- Or configure different ports in `TestEnvironment` config

### Containers not cleaning up
- Manually stop: `docker ps | grep 2ly | awk '{print $1}' | xargs docker stop`
- Remove: `docker ps -a | grep 2ly | awk '{print $1}' | xargs docker rm`

## CI/CD Integration

The test setup works in CI/CD environments. Example GitHub Actions:

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: packages/frontend2/test-results/
```

## Best Practices

1. **Keep tests focused** - Test one thing per test
2. **Use data-testid** - Add `data-testid` attributes for stable selectors
3. **Avoid hard waits** - Use `waitFor` instead of `setTimeout`
4. **Clean up data** - Reset database state between tests if needed
5. **Mock external services** - Don't depend on third-party APIs
6. **Use fixtures** - Share common setup logic via Playwright fixtures

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Testcontainers Documentation](https://node.testcontainers.org)
- [2LY Project Documentation](../../README.md)
