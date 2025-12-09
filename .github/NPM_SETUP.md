# NPM Publishing Setup

This document explains how to configure NPM publishing for the `@skilder-ai/runtime` package.

## Prerequisites

1. **NPM Account**: You need an NPM account with publishing permissions for the `@skilder` scope
2. **GitHub Repository Access**: Admin access to configure repository secrets
3. **Personal Access Token**: A GitHub PAT to trigger workflows (see [PAT_SETUP.md](./PAT_SETUP.md))

## Setting up NPM Token

### 1. Create NPM Access Token

1. Log in to [npmjs.com](https://www.npmjs.com)
2. Go to your profile → **Access Tokens** → **Generate New Token**
3. Choose **Automation** token type (for CI/CD)
4. Set the token permissions:
   - **Read and write** permissions
   - **No IP restrictions** (unless you want to restrict to GitHub Actions IPs)
5. Copy the generated token (it will only be shown once)

### 2. Add Token to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Create a secret:
   - **Name**: `NPM_TOKEN`
   - **Value**: Paste your NPM access token
5. Click **Add secret**

## How It Works

### Automatic Publishing Flow

The workflows support two release channels:

#### **Stable Releases** (from `main` branch)

When you merge a PR with a version bump to `main`:

1. **Release Workflow** (`.github/workflows/release.yml`):
   - Extracts version from `packages/backend/package.json`
   - Creates git tag `v{version}` (e.g., `v0.1.0`)
   - Creates GitHub release
   - Pushes tag to repository

2. **NPM Publish Workflow** (`.github/workflows/npm-publish.yml`):
   - Triggered by the version tag push
   - Runs quality checks (lint, typecheck, test)
   - Builds the runtime package
   - Verifies package.json version matches git tag
   - Publishes `@skilder-ai/runtime@{version}` with tag `latest`

3. **Docker Build Workflow** (`.github/workflows/docker-build.yml`):
   - Also triggered by the version tag push
   - Builds and tags Docker images with the version

#### **Beta Releases** (from `develop` branch)

When you push to `develop`:

1. **NPM Publish Workflow** (`.github/workflows/npm-publish.yml`):
   - Triggered on every commit to develop
   - Runs quality checks (lint, typecheck, test)
   - Builds the runtime package
   - Creates version: `{package-version}-beta.{commit-sha}` (e.g., `0.1.0-beta.abc1234`)
   - Publishes to NPM with tag `beta`

2. **Docker Build Workflow** (`.github/workflows/docker-build.yml`):
   - Triggered on every commit to develop
   - Builds and tags Docker images with `develop` tag

This allows users to test pre-release versions:
```bash
npm install @skilder-ai/runtime@beta  # Latest beta
npm install @skilder-ai/runtime@0.1.0-beta.abc1234  # Specific beta
```

### Version Bump Workflow

To release a new version:

```bash
# Bump version (choose one)
npm run bump-version:patch  # 0.1.0 → 0.1.1
npm run bump-version:minor  # 0.1.0 → 0.2.0
npm run bump-version:major  # 0.1.0 → 1.0.0

# Review changes
git diff

# Commit and create PR
git add .
git commit -m "chore: bump version to 0.2.0"
git push origin your-branch

# Create PR to main
# After PR is approved and merged, the release automation kicks in
```

## Verification

### After a Stable Release (from main)

1. **GitHub Release**: Check [Releases](../../releases) page
2. **NPM Package**: Visit https://www.npmjs.com/package/@skilder-ai/runtime
   - Should show the new version under "latest" tag
3. **Docker Images**: Check [Packages](../../packages) page
   - Images should be tagged with the version number

### After a Beta Release (from develop)

1. **NPM Package**: Visit https://www.npmjs.com/package/@skilder-ai/runtime
   - Click on "Versions" tab
   - Look for `beta` tag to see the latest beta version
2. **Docker Images**: Check [Packages](../../packages) page
   - Images should be tagged with `develop`

## Troubleshooting

### NPM Publish Fails with 401 Unauthorized

- Verify `NPM_TOKEN` secret is correctly set in GitHub
- Check that the NPM token hasn't expired
- Ensure the token has write permissions

### Version Already Published

- NPM doesn't allow republishing the same version
- You must bump the version number to publish again
- Use `npm run bump-version:patch` to increment

### Build Fails

- The workflow runs `lint`, `typecheck`, and `test` before publishing
- Fix any errors and push updates to your PR
- All checks must pass before the package can be published

## Manual Publishing (Emergency)

If automated publishing fails, you can publish manually:

```bash
# Ensure you're on the correct commit/tag
git checkout v0.1.0

# Install dependencies
npm ci

# Build the runtime package
npm run build -w @skilder-ai/runtime

# Run quality checks
npm run lint -w @skilder-ai/runtime
npm run typecheck -w @skilder-ai/runtime
npm run test -- packages/runtime

# Publish to NPM (requires NPM login)
npm login
npm publish -w @skilder-ai/runtime
```

## Required GitHub Secrets

For the complete automation to work, you need **two secrets** configured:

| Secret Name | Purpose | Setup Guide |
|------------|---------|-------------|
| `PAT_TOKEN` | Allows release workflow to trigger other workflows | [PAT_SETUP.md](./PAT_SETUP.md) |
| `NPM_TOKEN` | Allows publishing to NPM registry | See "Setting up NPM Token" above |

Both must be configured in **Settings** → **Secrets and variables** → **Actions**.

## Package Information

- **Package Name**: `@skilder-ai/runtime`
- **Registry**: https://registry.npmjs.org
- **Repository**: https://github.com/skilder-ai/skilder
- **Access**: Public
- **License**: See LICENSE in packages/runtime/
