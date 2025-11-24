# Development Documentation

> **Note**: This document provides detailed development information. For a quick start guide, see the [README.md](../README.md).

## Overview

This project is a monorepo with the following packages:

- **/packages/common**: Shared code and schema
- **/packages/backend**: Orchestrator for tools and agent runtimes
- **/packages/runtime**: NodeJS process which execute call tools and provide 2ly MCP Server to agents
- **/packages/frontend**: Web application to configure, manage and observe tools and their respective agents
- **/packages/twoly**: Python package with helpers to quickly consume 2ly from langchain projects
- **/packages/doc**: Documentation of the project

## Tech Stack

- **Database**: Dgraph
- **Message Bus**: NATS with JetStream
- **Backend**: NodeJS connected to Dgraph via GraphQL HTTP endpoint
- **Runtimes**: NodeJS processes connected to backend orchestrator via NATS
- **Frontend**: React with Tailwind CSS
- **Dependency Injection**: Inversify (containers in `/di/container.ts` per project)

## Prerequisites

> **Note for production users**: If you just want to run 2LY (not develop it), see the [main README](../README.md) - you only need Docker.

**For development and contributions:**
- Node.js v22+ (required for local development)
- Docker
- Git

## Quick Start

### 1. Clone and Setup

```bash
# Clone the repository (HTTPS)
git clone https://github.com/AlpinAI/2ly.git
# Or with SSH (if you have SSH keys configured)
# git clone git@github.com:AlpinAI/2ly.git

# Enter the project
cd 2ly

# Install dependencies
npm install

# Generate cryptographic keys (first time only)
npm run setup-local

# Start all services (database, NATS, etc.)
npm run start:dev
```

**Note:** The `setup-local` command generates cryptographic keys to `dev/.docker-keys/` and only needs to be run once. Keys persist across sessions.

**Dependencies for the doc packags**

The `/packages/doc` package requires to install its dependencies manually:

```bash
cd packages/doc
npm install
```

This step is only required if you intend to work on the documentation

### 2. Start the services you work on locally

When developing 2ly, you can run the backend, frontend or runtime locally in order to test them while coding and benefit from file watching and fast reload. 

**Stop the docker service you want to launch locally**

```bash
docker compose -f docker/docker-compose.dev.yml down backend
docker compose -f docker/docker-compose.dev.yml down frontend
docker compose -f docker/docker-compose.dev.yml down tool-runtime
docker compose -f docker/docker-compose.dev.yml down doc
````

**Start services using `npm run ...` commands**

```bash
npm run dev:backend
npm run dev:frontend
npm run dev:tool-runtime # launch the equivalent of the tool-runtime from the docker compose, called "Remote Tool Runtime"
npm run dev:tool-edge    # launch another runtime, called "Local Edge"
npm run dev:doc          # launch the documentation in dev mode
```

## Exposed endpoints

| Service | Description | Endpoint |
|---------|-------------|----------|
| Dgraph Ratel | Web interface to query the graph database | http://localhost:8000 |
| NATS Dashboard | Web interface to monitor the NATS bus | http://localhost:8001 |
| Backend HTTP Apollo | Web client listening to GraphQL queries and mutations | http://localhost:3000/graphql |
| Backend WS Apollo | WebSocket listening to GraphQL subscriptions | ws://localhost:3000/graphql |
| Frontend | Frontend application | http://localhost:8888 |

## Build locally

Each package has its own `npm run build` script. You can also run them from the root folder:

```
npm run build # build all packages
npm run build -w @2ly/backend #build only the backend
npm run build -w @2ly/frontend #build only the frontend
npm run build -w @2ly/runtime #build only the runtime
```

## Contributing

- Follow the established coding standards
- Maintain small, focused files with clear responsibilities
- Use dependency injection with Inversify containers

## Tests

The test suite is executed with 

```sh
npm run test
```

**MacOS testcontainers issue**

If you encounter an issue with Docker credentials upon running the tests using testcontainers you might need to update [your Docker config as follow](https://github.com/testcontainers/testcontainers-node/issues/739#issuecomment-2609603347).