import pino from 'pino';
import { FastifyRequest } from 'fastify';
import { NatsService, LoggerService } from '@2ly/common';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { tap } from 'rxjs';
import { SessionAuthService, AuthHeaders } from '../services/session.auth.service';
import { ToolsetService, ToolsetIdentity } from '../services/toolset.service';
import { HealthService } from '../services/runtime.health.service';

/**
 * Session context for MCP transports
 */
export interface SessionContext {
  transport: StreamableHTTPServerTransport | SSEServerTransport;
  toolsetService: ToolsetService;
  drain: () => void;
}

/**
 * Extract authentication headers from a Fastify request
 */
export function extractAuthHeaders(request: FastifyRequest): AuthHeaders {
  const headers = request.headers;
  return {
    masterKey: typeof headers['master_key'] === 'string' ? headers['master_key'] : undefined,
    toolsetKey: typeof headers['toolset_key'] === 'string' ? headers['toolset_key'] : undefined,
    toolsetName: typeof headers['toolset_name'] === 'string' ? headers['toolset_name'] : undefined,
  };
}

/**
 * Authenticate a session by extracting and validating auth headers
 */
export async function authenticateSession(
  request: FastifyRequest,
  loggerService: LoggerService,
  natsService: NatsService,
): Promise<ToolsetIdentity> {
  const authHeaders = extractAuthHeaders(request);
  const sessionAuthService = new SessionAuthService(loggerService, natsService);

  sessionAuthService.validateAuthHeaders(authHeaders);
  return await sessionAuthService.authenticateViaHandshake(authHeaders);
}

/**
 * Create and start a toolset service for a session
 */
export async function createToolsetService(
  identity: ToolsetIdentity,
  loggerService: LoggerService,
  natsService: NatsService,
  healthService: HealthService,
): Promise<ToolsetService> {
  const toolsetService = new ToolsetService(loggerService, natsService, identity);
  await healthService.startService(toolsetService);
  return toolsetService;
}

/**
 * Complete a partial session context by adding all required components.
 * This mutates the partial session object to ensure any stored references remain valid.
 */
export function completeSessionContext(
  transport: StreamableHTTPServerTransport | SSEServerTransport,
  toolsetService: ToolsetService,
  partialSession: Partial<SessionContext>,
): void {
  // Listen for tool changes and notify clients
  const subscription = toolsetService
    .observeTools()
    .pipe(
      tap(() => {
        transport.send({
          jsonrpc: '2.0',
          method: 'notifications/tools/list_changed',
        });
      }),
    )
    .subscribe();

  // Mutate the partial session to complete it
  // This is important because the partial session may already be stored in the sessions map
  // and accessed by other code paths (e.g., from onsessioninitialized callback)
  partialSession.transport = transport;
  partialSession.toolsetService = toolsetService;
  partialSession.drain = () => subscription?.unsubscribe();
}

/**
 * Cleanup a session by unsubscribing from observables, stopping the toolset service,
 * and removing from the sessions map
 */
export async function cleanupSession(
  sessionId: string,
  sessions: Map<string, SessionContext>,
  healthService: HealthService,
  logger: pino.Logger,
): Promise<void> {
  const session = sessions.get(sessionId);
  if (session) {
    logger.info(`Cleaning up session ${sessionId}`);
    session.drain();
    await healthService.stopService(session.toolsetService);
    sessions.delete(sessionId);
  }
}

/**
 * Cleanup all sessions for a transport
 */
export async function cleanupAllSessions(
  sessions: Map<string, SessionContext>,
  healthService: HealthService,
  logger: pino.Logger,
): Promise<void> {
  for (const [sessionId, session] of sessions) {
    logger.debug(`Closing session: ${sessionId}`);
    await session.transport.close();
    await healthService.stopService(session.toolsetService);
  }
  sessions.clear();
}

/**
 * Retrieve a session for a request handler, throwing if not found
 */
export function getSessionForRequest(
  sessionId: string,
  sessions: Map<string, SessionContext>,
): SessionContext {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  return session;
}
