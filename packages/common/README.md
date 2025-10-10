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
import type { components } from '@2ly/common';

type ServerJSON = components['schemas']['ServerJSON'];
type ServerListResponse = components['schemas']['ServerListResponse'];
```
