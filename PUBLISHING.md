# Publishing Guide for @2ly/runtime on NPM

This document describes how to publish the `@2ly/runtime` package to npm.

## Prerequisites

1. **NPM Account**: Ensure you have an npm account and are logged in (`npm login`)
2. **Organization Access**: Make sure you have publish access to the `@2ly` organization on npm
3. **Clean Working Directory**: Ensure your working directory is clean (`git status`)

## Publishing Scripts

The following scripts are available in the root `package.json`:

### Pre-publish Checks
```bash
npm run publish:runtime:check
```
This script runs all necessary checks before publishing:
- ESLint validation
- Prettier formatting validation  
- Build compilation

### Version Bumping and Publishing

#### Patch Release (0.0.1 → 0.0.2)
For bug fixes and minor changes:
```bash
npm run publish:runtime:patch
```

#### Minor Release (0.0.1 → 0.1.0)
For new features (backward compatible):
```bash
npm run publish:runtime:minor
```

#### Major Release (0.0.1 → 1.0.0)
For breaking changes:
```bash
npm run publish:runtime:major
```

#### Preview Release
For beta/preview releases:
```bash
npm run publish:runtime:preview
```
This publishes with the `beta` tag, allowing users to install with `npm install @2ly/runtime@beta`

## Manual Publishing Steps

If you prefer to run the steps manually:

1. **Run checks**:
   ```bash
   npm run lint -w @2ly/runtime
   npm run format:check -w @2ly/runtime
   npm run build -w @2ly/runtime
   ```

2. **Bump version**:
   ```bash
   npm version [patch|minor|major] -w @2ly/runtime
   ```

3. **Publish**:
   ```bash
   npm publish -w @2ly/runtime
   ```

## Package Configuration

The runtime package is configured with:

- **Name**: `@2ly/runtime`
- **Access**: Public (via `publishConfig.access`)
- **Files**: Only `dist/`, `LICENSE.txt`, and `README.md` are included
- **Exports**: Proper ES modules and TypeScript types
- **Bin**: `runtime` command-line tool (executable via `npx @2ly/runtime`)

## Usage as Executable

After publishing, users can run the package directly:

```bash
# Execute the runtime
npx @2ly/runtime

# Or install globally and run
npm install -g @2ly/runtime
runtime
```

The executable will start the 2ly runtime process with the configured environment variables.

## Best Practices

1. **Always run checks before publishing**
2. **Use semantic versioning appropriately**
3. **Test the package locally before publishing**:
   ```bash
   npm pack -w @2ly/runtime
   ```
4. **Verify the published package**:
   ```bash
   npm view @2ly/runtime
   ```

## Troubleshooting

### Common Issues

1. **Authentication Error**: Run `npm login` and ensure you have access to `@2ly` organization
2. **Version Already Exists**: The version bump will fail if the version already exists on npm
3. **Build Errors**: Ensure all TypeScript compiles correctly before publishing
4. **Lint/Format Errors**: Fix all ESLint and Prettier issues before publishing

### Rollback

If you need to unpublish a version (only works within 72 hours):
```bash
npm unpublish @2ly/runtime@<version>
```

## CI/CD Integration

For automated publishing, consider adding these scripts to your CI pipeline:

```yaml
# Example GitHub Actions step
- name: Publish to npm
  run: |
    npm run publish:runtime:check
    npm run publish:runtime:patch
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Version Management

The package follows [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

Always update the changelog or release notes when publishing new versions.

# Publishing Guide for langchain_2ly on PyPI

## Prerequisites

1. Python 3.10+ and a clean virtualenv
2. Accounts and API tokens for both PyPI and TestPyPI
   - Create tokens in your PyPI/TestPyPI account settings
   - Configure your credentials in `~/.pypirc` so Twine can read them:
   ```ini
   [pypi]
   username = __token__
   password = pypi-<your-token>

   [testpypi]
   repository = https://test.pypi.org/legacy/
   username = __token__
   password = pypi-<your-test-token>
   ```
3. Required tools
   ```bash
   python -m pip install --upgrade build twine pytest
   ```
4. Clean working directory (`git status` shows no pending changes)

## Versioning (required)

PyPI requires a unique version for every upload.

- Manual: update `version` in `packages/langchain_2ly/pyproject.toml` under `[project]`
- Manual: update `__version__` in `packages/langchain_2ly/src/langchain_2ly/__init__.py`
- Optional (automated bump):
  - Install one-time: `python -m pip install bump-my-version`
  - Example bump commands (pick one):
  ```bash
  # Patch: 0.0.2 -> 0.0.3
  bump-my-version bump patch --files packages/langchain_2ly/pyproject.toml
  # Minor: 0.0.2 -> 0.1.0
  bump-my-version bump minor --files packages/langchain_2ly/pyproject.toml
  # Major: 0.0.2 -> 1.0.0
  bump-my-version bump major --files packages/langchain_2ly/pyproject.toml
  ```

## Build

```bash
cd packages/langchain_2ly
rm -rf dist build *.egg-info
python -m build
ls -1 dist
```

You should see a `.tar.gz` (sdist) and a `.whl` (wheel).

## Test locally

```bash
python -m pip install dist/langchain_2ly-<VERSION>-py3-none-any.whl
python -c "import langchain_2ly, sys; print('langchain_2ly', getattr(langchain_2ly, '__version__', 'unknown')); sys.exit(0)"
```

## Run tests

```bash
pytest
```

## Upload to TestPyPI

```bash
cd packages/langchain_2ly
twine upload --repository testpypi dist/*
```

Verify from TestPyPI in a clean env:

```bash
python -m pip install --no-cache-dir \
  --index-url https://test.pypi.org/simple/ \
  --extra-index-url https://pypi.org/simple \
  langchain_2ly==<VERSION>
python -c "import langchain_2ly; print(langchain_2ly.__version__)"
```

## Upload to PyPI

```bash
cd packages/langchain_2ly
twine upload dist/*
```

## Post-publish verification

```bash
python -m pip install --no-cache-dir langchain_2ly==<VERSION>
python -c "import langchain_2ly; print(langchain_2ly.__version__)"
```

## Troubleshooting

- Version already exists (409/400): bump the version and rebuild
- 403 Unauthorized: ensure `~/.pypirc` is correctly configured for `pypi`/`testpypi` with valid tokens
- Mixed old artifacts: always `rm -rf dist build *.egg-info` before building
- Missing files in distribution: ensure `pyproject.toml` has correct `include` settings or MANIFEST as needed

## Quick reference

```bash
# Bump version (optional) then build
cd packages/langchain_2ly
bump-my-version bump patch --files packages/langchain_2ly/pyproject.toml  # optional
rm -rf dist build *.egg-info && python -m build

# TestPyPI
twine upload --repository testpypi dist/*

# PyPI
twine upload dist/*

# Install
python -m pip install langchain_2ly==<VERSION>
```
