# Changelog

All notable changes to the `@skilder-ai/runtime` package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.3] - 2025-09-02

### Added
- Initial release of @skilder-ai/runtime package
- Backend with NATS bus and Dgraph database
- NodeJS runtime to connect agents (via MCP) and to execute tool calls
- MCP (Model Context Protocol) server integration
- Dependency injection using Inversify
- Service-based architecture with clear boundaries
- TypeScript support with proper type definitions
- Runtime executable via `npx @skilder-ai/runtime`
- Docker support for containerized deployment

### Technical Details
- Built with esbuild for fast compilation
- Uses PSR-12 coding standards for maintainability
- Implements clean architecture principles
- Supports environment-based configuration
- Includes comprehensive logging and error handling

---

## Version Legend

- **MAJOR**: Breaking changes that require migration
- **MINOR**: New features that are backward compatible
- **PATCH**: Bug fixes and minor improvements

## Contributing

When adding entries to this changelog, please follow these guidelines:

1. **Use present tense** ("Add feature" not "Added feature")
2. **Reference issues and pull requests** when applicable
3. **Group changes by type**: Added, Changed, Deprecated, Removed, Fixed, Security
4. **Be descriptive** but concise
5. **Include breaking changes** prominently at the top of the version section

### Change Types

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Vulnerability fixes
