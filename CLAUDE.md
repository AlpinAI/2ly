# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**2ly** is an AI tool management application built as a TypeScript monorepo with microservices architecture. It connects MCP (Model Context Protocol) Tools to Agent runtimes in a distributed way using:

- **Database**: Dgraph (graph database) via GraphQL
- **Message Bus**: NATS with JetStream
- **Backend**: Node.js with Fastify + Apollo GraphQL
- **Frontend**: React + Vite + Tailwind CSS
- **Runtime**: Distributed NodeJS processes for edge execution

## Development Commands

### Primary Commands
- `npm run start:dev` - Start development environment (Docker Compose with NATS, Dgraph)
- `npm run dev:backend` - Start backend development server (localhost:3000)
- `npm run dev:frontend` - Start frontend development server (localhost:8888)
- `npm run dev:tool-runtime` - Start runtime processes locally

### Build & Test
- `npm run build` - Build all packages
- `npm run test` - Run all tests with Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage
- `npm run lint` - Lint all packages
- `npm run format` - Format with Prettier
- `npm run typecheck` - Check typescript types

### Code Generation
- `npm run codegen` - Generate GraphQL types from schema

## Development Workflow

**IMPORTANT: Assume Running Services**

- **NEVER** start the frontend or backend processes yourself unless explicitly asked by the user
- **ALWAYS** assume that frontend (port 8888) and backend (port 3000) are already running with hot reload enabled
- Changes to code will automatically reload - you can directly test against the running services
- You may consume http://localhost:3000 (backend) and http://localhost:8888 (frontend) for any tests or verification

**Exception Cases:**
- If you want to start a backend yourself to analyze logs, you MUST ask the user for permission first
- With user permission, you CAN kill any process on port 3000 before launching your backend process
- Only start services if the user explicitly requests it

### Local Development with Key Sharing

The project supports running backend/runtime locally (outside Docker) while sharing cryptographic keys with Docker services.

**Setup (first time):**
```bash
npm run setup-local       # Generate cryptographic keys to dev/.docker-keys/
npm run start:dev         # Start infrastructure (NATS, Dgraph) in Docker
```

**Daily workflow:**
```bash
npm run start:dev         # Start infrastructure (NATS, Dgraph) in Docker
npm run dev:backend       # Run backend locally with hot reload
npm run dev:frontend      # Run frontend locally with hot reload
npm run build -w @2ly/runtime && npm run dev:main-runtime  # Run runtime locally without hot reload
```

**Note:** The `setup-local` command only needs to be run once to generate keys. Keys persist in `dev/.docker-keys/` across sessions.

**Key Management Architecture:**
- **Backend generates keys** → **Runtime consumes keys**
- Backend has auto-generation capability (`AUTOGEN_KEYS=true` in Docker)
- Runtime always requires pre-existing keys (no auto-generation)
- Keys stored at `dev/.docker-keys/` shared between Docker and local processes
- Each service has its own entrypoint script co-located with its Dockerfile:
  - `packages/backend/entrypoint.sh` - Auto-generates keys if needed
  - `packages/runtime/runtime-entrypoint.sh` - Loads existing keys only

**Key Generation Flow:**
1. **Local development**: Run `npm run setup-local` to generate keys once
2. **Docker development**: Backend auto-generates keys on first start
3. **Runtime**: Always consumes keys from `dev/.docker-keys/` or ENV vars
4. **Custom keys**: Set `MASTER_KEY` and `ENCRYPTION_KEY` ENV vars

**Key locations:**
- Docker (dev): `dev/.docker-keys/` via bind mount
- Docker (prod): `2ly-internal` volume (isolated, no host access)
- Local dev: Loads `dev/.docker-keys/.env.generated` automatically
- Generation script: `npm run setup-local` or `sh ./generate-keys.sh`

## Monorepo Architecture

### Package Structure
- `packages/backend/` - Fastify + Apollo GraphQL server
- `packages/frontend/` - React application with Vite
- `packages/runtime/` - Distributed runtime processes (published to npm)
- `packages/common/` - Shared GraphQL schemas, types, and utilities
- `packages/doc/` - Documentation (Next.js)
- `packages/twoly/` - Python package for LangChain integration

### Dependency Injection
Each package uses Inversify containers in `/di/container.ts` for dependency injection.

### Backend Patterns
```
packages/backend/src/
├── database/         # Database operations and migrations
├── repositories/     # Data access layer
├── services/        # Business logic
├── middleware/      # Fastify middleware
└── helpers/         # Utility functions
```

### Frontend Patterns
```
packages/frontend/src/
├── components/      # Reusable UI components
│   ├── ui/         # Radix UI primitives (button, select, dropdown, etc.)
│   ├── monitoring/ # Domain-specific components
│   ├── layout/     # Layout components (header, navigation)
│   ├── toolsets/   # Tool set management components
│   ├── agents/     # Agent-related components
│   └── sources/    # Source management components
├── hooks/          # Custom hooks (useToolCalls, useMCPServers, etc.)
├── stores/         # Zustand state management
├── contexts/       # React contexts (Theme, Auth, Notification)
└── graphql/        # GraphQL queries/mutations
```

## Testing Framework

The project uses three types of tests with different tools and purposes:

### 1. Unit Tests
- **Tool**: Vitest + React Testing Library
- **Location**: `*.test.ts` / `*.test.tsx` files alongside source code in `src/` directories
- **Purpose**: Test individual components and functions in isolation
- **Pattern**: Mock external dependencies (Apollo hooks, stores, etc.) to keep tests focused
- **Example**: `src/components/ui/button.test.tsx`
- **Run**: `npm run test` (all unit tests) or `npm run test:watch` (watch mode)

### 2. Integration Tests
- **Tool**: Vitest + Testcontainers
- **Location**:
  - `*.integration.spec.ts` files in `packages/**/src/`
  - `packages/backend/tests/**/*.spec.ts`
- **Purpose**: Test interactions between multiple components/services with real infrastructure (Dgraph, NATS)
- **Setup**: Uses testcontainers to spin up Docker containers
- **Run**: `npm run test:integration`
- **Config**: `vitest.integration.config.ts`

### 3. End-to-End (E2E) Tests
- **Tool**: Playwright
- **Location**: `packages/frontend/tests/e2e/`
- **Purpose**: Test complete user workflows in a real browser
- **Setup**: Uses testcontainers for full stack (Dgraph, NATS, Backend, Frontend)
- **Run**: `npm run test:e2e`

#### E2E Test Organization
Tests are organized into two strategies:

**serial/** - Sequential execution
- Tests that need specific database states and must run sequentially
- Run sequentially (workers: 1) to prevent database race conditions
- Each test chooses its own reset/seed strategy (beforeEach vs beforeAll)
- Example: `init.spec.ts`, `login.spec.ts`, `routing.spec.ts`, `onboarding.spec.ts`

**parallel/** - Parallel execution
- UI-focused tests that can run with multiple workers
- Tests don't depend on specific database state
- Can run in any order for speed
- Example: `password-validation.spec.ts`

### Test Mocking Patterns
- **Apollo Mocks**: Mock components using Apollo hooks instead of wrapping in providers
  - Example: `vi.mock('@/components/command-palette/command-palette', () => ({ CommandPalette: () => null }))`
- **Store Mocks**: Mock Zustand stores and return test data
- **Silence Expected Errors**: Always silence expected console.error/console.warn in tests to avoid noise
  - Pattern: `const spy = vi.spyOn(console, 'error').mockImplementation(() => {});` then `spy.mockRestore()` after
  - Example: `tool-tester.test.tsx` - "handles mutation errors gracefully" test
  - **IMPORTANT**: This prevents bloating test output and agent context with expected error logs
- **See**: `app-layout.test.tsx` for comprehensive mocking example

## Technology Stack

### Backend
- **Fastify** with Apollo Server integration
- **JWT + Argon2** for authentication (in development)
- **Pino** for structured logging
- **TypeScript** with strict configuration

### Frontend
- **React 19** with TypeScript
- **React Router 7** for routing
- **Vite 7** for build tooling
- **Radix UI** primitives for accessible components
- **Tailwind CSS** v3.4 with custom design system
- **Apollo Client** for GraphQL state management
- **Zustand** for client-side state management

### Runtime
- **MCP SDK** (`@modelcontextprotocol/sdk`) for tool integration
- **NATS** messaging with backend
- **Multiple transports**: STREAM, STDIO, SSE

## Development Environment

### Local Services (via Docker Compose)
- **Dgraph Ratel**: http://localhost:8000 (Database UI)
- **NATS Dashboard**: http://localhost:8001 (Message bus monitoring)
- **Backend GraphQL**: http://localhost:3000/graphql
- **Frontend**: http://localhost:8888

### GraphQL Schema
- **Location**: `packages/common/schema/apollo.schema.graphql` (Apollo) and `dgraph.schema.graphql` (Dgraph)
- **Key Features**:
  - Workspace-based multi-tenancy
  - MCP server and tool management
  - Runtime registration and monitoring
  - Tool call tracking with filtering and pagination
- **Code Generation**: Run `npm run codegen` to generate TypeScript types from schema

## Code Quality Standards

- **ESLint**: TypeScript strict mode, no `any` types
- **Prettier**: Single quotes, trailing commas, 120 char width
- **Type Safety**: Strict TypeScript configuration across all packages
- **Path Mapping**: `@2ly/common`, `@2ly/backend`, etc. for cross-package imports

## Current Branch

The `design-radix-tailwind` branch contains the active frontend development with Radix UI components and improved UX patterns.