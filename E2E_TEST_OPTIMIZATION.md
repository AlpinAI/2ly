# E2E Test Optimization Guide

This document explains how to optimize E2E test setup time using published Docker images.

## Overview

E2E tests use testcontainers to spin up a complete test environment including Dgraph, NATS, Backend, and Runtime containers. By default, backend and runtime images are built locally on every test run.

This optimization feature provides two modes of operation:

1. **Default (Local Build)**: Build images locally (Docker's layer cache optimizes rebuilds)
2. **Published Mode**: Use official published images from Docker registry (fastest)

## Quick Start

### Default Mode

Run tests with locally-built images:

```bash
npm run test:e2e
```

Docker's layer cache automatically optimizes rebuilds - if source files haven't changed, the build will be fast (seconds instead of minutes).

### Use Published Images

Use official published images instead of building locally:

```bash
npm run test:e2e:published
```

This is fastest but requires published images to be available in your Docker registry.

## How It Works

### Docker Layer Caching

When building images locally, Docker automatically uses its layer cache:

- **If source files unchanged**: Build completes in seconds (cached layers)
- **If source files changed**: Only changed layers are rebuilt

This happens automatically - no configuration needed. Docker compares file content hashes to determine which layers can be reused.

### Published Images

When using published images, no build step occurs at all. Images are pulled from the Docker registry (if not already local), which is faster than building.

After a successful build, the system logs the built image names and tags. You can use these to manually reference the images later.

Example output:
```
✓ Backend image built: testcontainers/2ly-backend:abc123def
✓ Runtime image built: testcontainers/2ly-runtime:xyz789ghi

To reuse these images, use the E2E_USE_IMAGE flag with your registry images.
```

## Usage

### Command Line Scripts

#### Root Package Scripts

```bash
# Default - build locally (Docker layer cache optimizes)
npm run test:e2e

# Use published images
npm run test:e2e:published
```

#### Frontend Package Scripts

```bash
# Default - build locally
npm run test:e2e -w @2ly/frontend

# Use published images (latest tag)
npm run test:e2e:published -w @2ly/frontend
```

### Environment Variables

For more control, use environment variables directly:

```bash
# Default mode
npm run test:e2e

# Use published images with latest tag
E2E_USE_IMAGE=true npm run test:e2e

# Use published images with specific tag
E2E_USE_IMAGE=true E2E_IMAGE_TAG=v1.0.0 npm run test:e2e
```

### Environment Variable Reference

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `E2E_USE_IMAGE` | `true`, `1` | `false` | Use published images instead of building |
| `E2E_IMAGE_TAG` | any string | `latest` | Tag of published images to use |

## When to Use Each Mode

### Default Mode (Local Build)

**Use when:**
- You're actively developing backend or runtime code
- You want to test against latest local changes
- Running tests in CI/CD pipelines (for reproducibility)

**Pros:**
- Always reflects your latest code changes
- Docker layer cache makes rebuilds fast when code unchanged
- No dependency on external images

**Cons:**
- First build is slow (3-5 minutes)
- Rebuilds when dependencies change (even if unrelated to your changes)

**How fast is it?**
- First build: 3-5 minutes (builds all layers)
- Subsequent builds (no changes): 10-30 seconds (all layers cached)
- Subsequent builds (small changes): 1-2 minutes (only affected layers rebuild)

### Published Mode

**Use when:**
- Testing against stable releases
- You don't need latest local changes
- Fastest possible test iteration

**Pros:**
- Fastest (no build at all, just image pull)
- Consistent with production images
- Setup time: 5-15 seconds after initial pull

**Cons:**
- Requires published images to exist in registry
- Won't reflect local code changes
- May not have latest features

**Example:**
```bash
# Use latest published images
npm run test:e2e:published

# Use specific version
E2E_USE_IMAGE=true E2E_IMAGE_TAG=v1.2.3 npm run test:e2e
```

## CI/CD Integration

### Recommended CI Strategy

For pull request builds (always use local build):

```yaml
# .github/workflows/test.yml
- name: Run E2E Tests
  run: npm run test:e2e  # Docker layer cache will optimize
```

### Using Published Images in CI

For faster CI runs (if you publish images):

```yaml
- name: Run E2E Tests (Published Images)
  run: npm run test:e2e:published
  env:
    E2E_IMAGE_TAG: latest
```

## Troubleshooting

### Published Images Not Found

**Problem**: `Error: Image not found: 2ly/backend:latest`

**Solutions**:
1. Verify images are published to Docker registry
2. Check you have access to pull images
3. Use correct image tag: `E2E_IMAGE_TAG=v1.0.0`
4. Fall back to build mode: `npm run test:e2e`

### Build Is Slow Even Though Code Hasn't Changed

**Problem**: Docker layer cache isn't working as expected

**Solutions**:
1. Check if dependencies changed (package.json, package-lock.json)
2. Verify Dockerfiles aren't modified
3. Try cleaning Docker build cache: `docker builder prune`
4. Check Docker disk space: `docker system df`

### Want to Use Locally Built Images Later

**Problem**: How can I reuse the images I just built?

**Solution**: After building, the system logs the image names. You can tag and push them:
```bash
# Run tests (images are built)
npm run test:e2e

# Output shows:
# ✓ Backend image built: testcontainers/2ly-backend:abc123def
# ✓ Runtime image built: testcontainers/2ly-runtime:xyz789ghi

# Tag and push to your registry
docker tag testcontainers/2ly-backend:abc123def your-registry/2ly-backend:your-tag
docker push your-registry/2ly-backend:your-tag

# Then use published image mode
E2E_USE_IMAGE=true E2E_BACKEND_IMAGE=your-registry/2ly-backend:your-tag npm run test:e2e
```

## Technical Details

### TestEnvironment Configuration

The `TestEnvironment` class (in `@2ly/common`) supports image build strategies:

```typescript
const testEnv = new TestEnvironment({
  imageBuildStrategy: {
    backendImage: '2ly/backend:latest',  // Use published
    runtimeImage: '2ly/runtime:latest',
  }
});
```

If `imageBuildStrategy` is undefined or `backendImage`/`runtimeImage` are not set, images are built locally.

### Global Setup Integration

The Playwright global setup (`/packages/frontend/tests/global-setup.ts`):

1. Checks `E2E_USE_IMAGE` environment variable
2. If true, configures TestEnvironment to use published images
3. If false (default), images are built locally (Docker layer cache handles optimization)
4. Logs built image names/tags for reference

## Best Practices

1. **Default to Local Build**: Docker layer cache makes it fast enough for most use cases
2. **Use Published Images for Testing Releases**: Test against stable versions
3. **Publish Images Regularly**: If your team uses published mode frequently
4. **Don't Fight Docker's Layer Cache**: It's sophisticated and handles most optimization automatically

## Performance Comparison

Typical setup times on M1 Mac:

| Mode | First Run | Subsequent (No Changes) | Subsequent (Small Change) |
|------|-----------|-------------------------|---------------------------|
| Local Build | 3-5 min | 10-30 sec | 1-2 min |
| Published | 10-20 sec | 5-10 sec | 5-10 sec |

**Note**: "Subsequent (No Changes)" assumes Docker layer cache is valid.

## Examples

### Example 1: Frontend Development

You're working on a new UI component:

```bash
# First run - builds images
npm run test:e2e  # Takes 3-5 minutes

# Make UI changes (no backend changes)
# Edit src/components/my-component.tsx

# Run tests again - Docker layer cache reuses backend layers
npm run test:e2e  # Takes 10-30 seconds (layers cached)
```

### Example 2: Backend Development

You're adding a new API endpoint:

```bash
# Make backend changes
# Edit packages/backend/src/api/new-endpoint.ts

# Run tests - rebuilds backend image layers
npm run test:e2e  # Takes 1-2 minutes (only changed layers)
```

### Example 3: Testing Against Release

You want to verify tests work against production images:

```bash
# Use published v1.0.0 images
E2E_USE_IMAGE=true E2E_IMAGE_TAG=v1.0.0 npm run test:e2e

# Fast setup - just pulls images
# Takes 10-20 seconds
```

## Summary

The E2E test optimization provides two simple modes:

- **Default (Local Build)**: Docker's layer cache automatically optimizes - usually fast enough
- **Published Images**: Fastest option but requires pre-built images in registry

For most development, the default mode works great. Docker's layer cache is smart enough to make rebuilds fast when code hasn't changed. Use published images when you need maximum speed and don't need local changes.
