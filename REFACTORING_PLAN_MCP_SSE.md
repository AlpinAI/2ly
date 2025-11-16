# Refactoring Plan: mcp.sse.service.ts

**Goal**: Leverage shared helpers to align `mcp.sse.service.ts` with `mcp.streamable.service.ts` patterns and reduce code duplication.

**Total Impact**:
- Eliminates ~350 lines of duplicate code
- Adds missing security validations
- Improves consistency across MCP services

---

## Phase 1: Session Management & MCP Handlers (HIGH PRIORITY)

### Goal
Replace duplicate session/handler code with centralized helpers from `mcp-session.helper.ts` and `mcp-handlers.helper.ts`.

### Estimated Impact
Eliminates ~300 lines of duplicate code

### Changes

#### 1. Add imports
```typescript
import {
  SessionContext,
  authenticateSession,
  createToolsetService,
  completeSessionContext,
  cleanupSession,
  cleanupAllSessions,
} from '../helpers/mcp-session.helper';
import { registerMcpHandlers } from '../helpers/mcp-handlers.helper';
```

#### 2. Remove duplicate `SessionContext` interface
- **Location**: Lines 27-31
- **Action**: Delete (now imported from helper)

#### 3. Replace 7 private session methods with helpers

##### 3.1 `extractAuthHeaders()` → use helper
- **Location**: Lines 434-441
- **Action**: Remove method
- **Usage**: Import `extractAuthHeaders` from `mcp-session.helper.ts:23-30`
- **Update calls**: Change `this.extractAuthHeaders(request)` to `extractAuthHeaders(request)` in `authenticateSession`

##### 3.2 `authenticateSession()` → use helper
- **Location**: Lines 235-244
- **Action**: Remove method
- **Replacement**: `authenticateSession(request, this.loggerService, this.natsService)`
- **Update in**: `createNewSession` method (line 198)

##### 3.3 `createToolsetService()` → use helper
- **Location**: Lines 288-292
- **Action**: Remove method
- **Replacement**:
```typescript
await createToolsetService(
  identity,
  this.loggerService,
  this.natsService,
  this.healthService,
)
```
- **Update in**: `createNewSession` method (line 202)

##### 3.4 `completeSessionContext()` → use helper
- **Location**: Lines 298-318
- **Action**: Remove method
- **Replacement**: `completeSessionContext(transport, toolsetService, partialSession)`
- **Note**: Remove `sessionId` parameter (not needed by helper)
- **Update in**: `createNewSession` method (line 208)

##### 3.5 `cleanupSession()` → use helper
- **Location**: Lines 320-328
- **Action**: Remove method, create wrapper
- **Replacement**:
```typescript
private async handleSessionClosed(sessionId: string): Promise<void> {
  await cleanupSession(sessionId, this.sessions, this.healthService, this.logger);
}
```
- **Update calls**:
  - Line 259: `this.cleanupSession(sid!)` → `this.handleSessionClosed(sid!)`
  - Line 276: `this.cleanupSession(sessionId)` → `this.handleSessionClosed(sessionId)`

##### 3.6 `getSessionForRequest()` → use helper
- **Location**: Lines 333-339
- **Action**: Remove method (handled by `registerMcpHandlers`)

##### 3.7 `stopServer()` → use `cleanupAllSessions()` helper
- **Location**: Lines 444-450
- **Action**: Replace loop with helper
- **Before**:
```typescript
for (const [sessionId, session] of this.sessions) {
  this.logger.debug(`Closing session: ${sessionId}`);
  await session.transport.close();
  await this.stopService(session.toolsetService);
}
this.sessions.clear();
```
- **After**:
```typescript
await cleanupAllSessions(this.sessions, this.healthService, this.logger);
```

#### 4. Replace 4 MCP protocol handlers with `registerMcpHandlers`

##### 4.1 Replace `setServerHandlers()` method
- **Location**: Lines 341-357
- **Action**: Remove entire method
- **Update call**: Line 131: `await this.setServerHandlers()` →
```typescript
if (!this.server) {
  throw new Error('Server not initialized');
}
registerMcpHandlers(this.server, this.sessions, this.logger);
```

##### 4.2 Remove `handleInitialize()` method
- **Location**: Lines 362-390
- **Action**: Delete entire method (handled by `registerMcpHandlers`)

##### 4.3 Remove `handleListTools()` method
- **Location**: Lines 395-408
- **Action**: Delete entire method (handled by `registerMcpHandlers`)

##### 4.4 Remove `handleCallTool()` method
- **Location**: Lines 413-432
- **Action**: Delete entire method (handled by `registerMcpHandlers`)

#### 5. Remove unused imports
```typescript
// Remove these:
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { SessionAuthService, AuthHeaders } from './session.auth.service';
import { ToolsetService, ToolsetIdentity } from './toolset.service';
import { tap } from 'rxjs';
```

### Testing Checklist
- [ ] Session creation with valid auth headers
- [ ] Session creation with invalid auth headers (should fail gracefully)
- [ ] MCP initialize request
- [ ] MCP list tools request
- [ ] MCP call tool request
- [ ] Session cleanup on disconnect
- [ ] Tool list change notifications

---

## Phase 2: Security Validation (SECURITY CRITICAL)

### Goal
Add missing security validations to prevent DNS rebinding attacks and ensure protocol compliance.

### Estimated Impact
Adds critical security protections currently missing from SSE service

### Changes

#### 1. Add security configuration properties

Add to class properties (after line 43):
```typescript
/**
 * Allowed origins for remote access (configurable via environment variable)
 */
private allowedOrigins: string[] = [];

/**
 * Whether to validate Origin header to prevent DNS rebinding attacks
 */
private preventDnsRebindingAttack = false;
```

#### 2. Load security configuration in `initialize()`

Add after line 51 (after logger initialization):
```typescript
// Load security configuration from environment
const securityConfig = loadSecurityConfig();
this.allowedOrigins = securityConfig.allowedOrigins;
this.preventDnsRebindingAttack = securityConfig.preventDnsRebindingAttack;
```

Add import:
```typescript
import {
  validateOriginHeaderForRequest,
  validateProtocolVersionHeaderForRequest,
  validateAcceptHeaderForRequest,
  loadSecurityConfig,
  logSecurityConfig,
} from '../helpers/validation.helper';
```

#### 3. Log security configuration

Add after `startServer()` completes (after line 129):
```typescript
// Log security configuration
logSecurityConfig(this.logger, this.preventDnsRebindingAttack, this.allowedOrigins);
```

#### 4. Add validation to GET `/sse` route

Add after line 139 (after debug log):
```typescript
try {
  // Validate Origin header (security requirement)
  if (
    !validateOriginHeaderForRequest(
      request,
      reply,
      this.logger,
      this.preventDnsRebindingAttack,
      this.allowedOrigins,
    )
  ) {
    return;
  }

  // Validate protocol version header
  if (!validateProtocolVersionHeaderForRequest(request, reply, this.logger)) {
    return;
  }

  // Validate Accept header for SSE
  if (
    !validateAcceptHeaderForRequest(
      request,
      reply,
      this.logger,
      'text/event-stream',
      'Accept header must include text/event-stream'
    )
  ) {
    return;
  }

  // Rest of GET /sse handler...
```

#### 5. Add validation to POST `/messages` route

Add after line 159 (after debug log):
```typescript
try {
  // Validate Origin header (security requirement)
  if (
    !validateOriginHeaderForRequest(
      request,
      reply,
      this.logger,
      this.preventDnsRebindingAttack,
      this.allowedOrigins,
    )
  ) {
    return;
  }

  // Validate protocol version header
  if (!validateProtocolVersionHeaderForRequest(request, reply, this.logger)) {
    return;
  }

  // Rest of POST /messages handler...
```

### Testing Checklist
- [ ] Valid Origin header accepted
- [ ] Invalid Origin header rejected (403)
- [ ] Missing Origin header rejected (403) when prevention enabled
- [ ] Valid protocol version accepted
- [ ] Invalid protocol version rejected (400)
- [ ] Missing protocol version accepted (backwards compatibility)
- [ ] Valid Accept header for SSE accepted
- [ ] Invalid Accept header rejected (406)

---

## Phase 3: Session ID & Error Responses (CONSISTENCY)

### Goal
Standardize session ID handling and error response formats across all endpoints.

### Estimated Impact
Improves API consistency and developer experience

### Changes

#### 1. Session ID handling - Use header-based extraction

##### 1.1 Update GET `/sse` route
- **Location**: Line 166
- **Current**: `const sessionId = extractSessionIdFromQuery(request.query);`
- **Change to**: `const sessionId = extractSessionId(request);`
- **Import**: Already available in `session.helper.ts:9-12`

##### 1.2 Update POST `/messages` route
- **Location**: Line 166
- **Current**: `const sessionId = extractSessionIdFromQuery(request.query);`
- **Change to**: `const sessionId = extractSessionId(request);`

#### 2. Standardize error responses to structured JSON

##### 2.1 GET `/sse` - Missing session ID
- **Location**: Line 169
- **Current**: `return reply.status(400).send('Missing sessionId');`
- **Change to**:
```typescript
return reply.status(400).send({
  error: 'Bad Request',
  message: 'Session ID required for SSE streams. Initialize session first.',
});
```

##### 2.2 GET `/sse` - Session not found
- **Location**: Line 182
- **Current**: `return reply.status(400).send('No transport found for sessionId');`
- **Change to**:
```typescript
return reply.status(404).send({
  error: 'Not Found',
  message: 'Session not found or expired',
});
```

##### 2.3 GET `/sse` - Internal error
- **Location**: Line 153
- **Current**: `return reply.status(500).send('Internal error');`
- **Change to**:
```typescript
return reply.status(500).send({
  error: 'Internal Server Error',
  message: 'Failed to establish SSE connection',
});
```

##### 2.4 POST `/messages` - Missing session ID
- **Location**: Line 169
- **Current**: `return reply.status(400).send('Missing sessionId');`
- **Change to**:
```typescript
return reply.status(400).send({
  error: 'Bad Request',
  message: 'Missing or invalid session ID',
});
```

##### 2.5 POST `/messages` - Session not found
- **Location**: Line 182
- **Current**: `return reply.status(400).send('No transport found for sessionId');`
- **Change to**:
```typescript
return reply.status(404).send({
  error: 'Not Found',
  message: 'Session not found or expired',
});
```

##### 2.6 POST `/messages` - Internal error
- **Location**: Line 185
- **Current**: `return reply.status(500).send('Internal error');`
- **Change to**:
```typescript
return reply.status(500).send({
  error: 'Internal Server Error',
  message: 'Failed to handle SSE message',
});
```

### Testing Checklist
- [ ] Session ID extracted from header, not query
- [ ] All 400 errors return structured JSON
- [ ] All 404 errors return structured JSON
- [ ] All 500 errors return structured JSON
- [ ] Error messages are clear and helpful

---

## Phase 4: Authentication & Optional Improvements (POLISH)

### Goal
Simplify authentication error handling and add optional protocol improvements.

### Estimated Impact
Cleaner code, better maintainability, improved spec compliance

### Changes

#### 1. Simplify authentication error handling

##### 1.1 Update `createNewSession` catch block
- **Location**: Lines 215-226
- **Current**:
```typescript
catch (authError) {
  this.logger.error(`Authentication failed: ${authError}`);
  const errorMessage = `Authentication failed: ${authError instanceof Error ? authError.message : String(authError)}`;

  if (transportType === 'stream') {
    sendJsonRpcError(reply, JsonRpcErrorCode.SERVER_ERROR, errorMessage);
  } else {
    sendJsonRpcError(reply, JsonRpcErrorCode.SERVER_ERROR, errorMessage, 401);
  }

  return null;
}
```

- **Change to**:
```typescript
catch (authError) {
  this.logger.error(`Authentication failed: ${authError}`);
  const errorMessage = `Authentication failed: ${authError instanceof Error ? authError.message : String(authError)}`;

  return reply.status(401).send({
    error: 'Unauthorized',
    message: errorMessage,
  }) as never;
}
```

##### 1.2 Remove `transportType` parameter (optional)
If authentication always returns the same error format, consider removing the `transportType` parameter from `createNewSession` method signature.

#### 2. Add JSON-RPC message type detection (OPTIONAL)

Add to POST `/messages` route to properly handle responses/notifications vs requests per MCP spec.

After extracting sessionId and before checking session existence:
```typescript
// Determine message type to handle responses/notifications correctly
const messageType = getJsonRpcMessageType(request.body);
```

Add import:
```typescript
import { getJsonRpcMessageType, JsonRpcMessageType } from '../helpers/security.helper';
```

Then handle differently based on type:
```typescript
if (session && isValidSessionId(sessionId)) {
  // For responses and notifications, return HTTP 202 Accepted (per spec)
  if (messageType === JsonRpcMessageType.RESPONSE || messageType === JsonRpcMessageType.NOTIFICATION) {
    this.logger.debug(`Received ${messageType} message for session ${sessionId}`);

    // Inject CORS headers
    injectCorsHeaders(request, reply);

    // Delegate to transport to handle the message
    await session.transport.handlePostMessage(request.raw, reply.raw, request.body as unknown);

    // Transport should set 202 status
    return;
  }

  // For requests, continue with normal handling
  this.logger.debug(`Processing request message for session ${sessionId}`);
}
```

**Reference**: See `mcp.streamable.service.ts:251-274` for implementation example.

### Testing Checklist
- [ ] Authentication failures return 401 with structured JSON
- [ ] Response messages handled correctly (if implemented)
- [ ] Notification messages handled correctly (if implemented)
- [ ] Request messages continue to work normally

---

## Summary of Key Benefits

### Security
- ✅ DNS rebinding attack prevention via Origin validation
- ✅ Protocol version validation ensures compatibility
- ✅ Accept header validation prevents misconfiguration

### Maintainability
- ✅ ~350 lines of duplicate code eliminated
- ✅ Session management logic centralized in helpers
- ✅ MCP handler logic centralized in helpers
- ✅ Easier to test with shared, well-tested helpers

### Consistency
- ✅ Aligns with `mcp.streamable.service.ts` patterns
- ✅ Standardized error response format
- ✅ Consistent session ID extraction (header-based)
- ✅ Shared security configuration

### Developer Experience
- ✅ Clear, structured error messages
- ✅ Proper HTTP status codes
- ✅ Better debugging with centralized logging

---

## Files Requiring Changes

**Primary file**:
- `packages/runtime/src/services/mcp.sse.service.ts`

**Helper files used**:
- `packages/runtime/src/helpers/mcp-session.helper.ts`
- `packages/runtime/src/helpers/mcp-handlers.helper.ts`
- `packages/runtime/src/helpers/validation.helper.ts`
- `packages/runtime/src/helpers/session.helper.ts`
- `packages/runtime/src/helpers/security.helper.ts`
- `packages/runtime/src/helpers/jsonrpc.helper.ts` (already imported)
- `packages/runtime/src/helpers/cors.helper.ts` (already imported)

---

## Implementation Notes

1. **Work incrementally**: Complete and test each phase before moving to the next
2. **No changes to mcp.streamable.service.ts**: That file serves as reference only
3. **Test after each phase**: Use the testing checklists provided
4. **Reference implementation**: See `mcp.streamable.service.ts` for patterns

---

## Line Number References (Original File)

**Note**: Line numbers refer to the original `mcp.sse.service.ts` file (471 lines). After Phase 1, line numbers will shift significantly (~170 lines removed).

### Key locations:
- Class definition: Line 38
- `initialize()`: Line 54
- `startServer()`: Line 68
- `setupStreamableHttpTransport()`: Line 94
- `registerSseRoute()`: Line 142
- `registerMessagesRoute()`: Line 161
- `createNewSession()`: Line 193
- Session management methods: Lines 232-350
- MCP handler methods: Lines 352-443
- `stopServer()`: Line 454
