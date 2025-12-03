import pino from 'pino';
import { FastifyRequest } from 'fastify';
import { NatsService, LoggerService } from '@2ly/common';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { tap } from 'rxjs';
import { SessionAuthService, AuthHeaders } from '../services/session.auth.service';
import { SkillService, SkillIdentity } from '../services/skill.service';
import { HealthService } from '../services/runtime.health.service';

/**
 * Session context for MCP transports
 */
export interface SessionContext {
  transport: StreamableHTTPServerTransport | SSEServerTransport;
  skillService: SkillService;
  drain: () => void;
}

/**
 * Extract authentication headers from a Fastify request.
 * Supports query string auth via ?key=<skill_key> as a simplified alternative.
 */
export function extractAuthHeaders(request: FastifyRequest): AuthHeaders {
  const headers = request.headers;
  const query = request.query as Record<string, string>;

  // Check query string first for simplified auth
  const queryKey = query?.key;
  if (queryKey) {
    return { skillKey: queryKey };
  }

  // Fall back to header-based auth
  return {
    workspaceKey: typeof headers['workspace_key'] === 'string' ? headers['workspace_key'] : undefined,
    skillKey: typeof headers['skill_key'] === 'string' ? headers['skill_key'] : undefined,
    skillName: typeof headers['skill_name'] === 'string' ? headers['skill_name'] : undefined,
  };
}

/**
 * Authenticate a session by extracting and validating auth headers
 */
export async function authenticateSession(
  request: FastifyRequest,
  loggerService: LoggerService,
  natsService: NatsService,
): Promise<SkillIdentity> {
  const authHeaders = extractAuthHeaders(request);
  const sessionAuthService = new SessionAuthService(loggerService, natsService);

  sessionAuthService.validateAuthHeaders(authHeaders);
  return await sessionAuthService.authenticateViaHandshake(authHeaders);
}

/**
 * Create and start a skill service for a session
 */
export async function createSkillService(
  identity: SkillIdentity,
  loggerService: LoggerService,
  natsService: NatsService,
  healthService: HealthService,
): Promise<SkillService> {
  const skillService = new SkillService(loggerService, natsService, identity);
  await healthService.startService(skillService);
  return skillService;
}

/**
 * Complete a partial session context by adding all required components.
 * This mutates the partial session object to ensure any stored references remain valid.
 */
export function completeSessionContext(
  transport: StreamableHTTPServerTransport | SSEServerTransport,
  skillService: SkillService,
  partialSession: Partial<SessionContext>,
): void {
  // Listen for tool changes and notify clients
  const subscription = skillService
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
  partialSession.skillService = skillService;
  partialSession.drain = () => subscription?.unsubscribe();
}

/**
 * Cleanup a session by unsubscribing from observables, stopping the skill service,
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
    await healthService.stopService(session.skillService);
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
    await healthService.stopService(session.skillService);
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
