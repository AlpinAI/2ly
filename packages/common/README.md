# 2ly - Common

Shared types, schemas, and utilities for the 2ly monorepo.

## Code Generation

### MCP Registry Types

The package includes auto-generated TypeScript types from the official MCP Registry OpenAPI schema.

**Generate types:**
```bash
npm run codegen:mcp-registry
```

This fetches the latest schema from `https://registry.modelcontextprotocol.io/openapi.yaml` and generates types in `src/types/mcp-registry.ts`.

**Usage:**
```typescript
import { mcpRegistry } from '@2ly/common';

// Access OpenAPI schema types through the mcpRegistry namespace
type ServerJSON = mcpRegistry.components['schemas']['ServerJSON'];
type ServerListResponse = mcpRegistry.components['schemas']['ServerListResponse'];
type ServerResponse = mcpRegistry.components['schemas']['ServerResponse'];

// Use in your code
async function fetchServers(): Promise<ServerListResponse> {
  const response = await fetch('https://registry.modelcontextprotocol.io/v0/servers');
  return response.json();
}
```
