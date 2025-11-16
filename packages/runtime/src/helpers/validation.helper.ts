import pino from 'pino';
import { FastifyRequest, FastifyReply } from 'fastify';
import { validateOrigin, validateProtocolVersion } from './security.helper';

/**
 * Validate the Origin header to prevent DNS rebinding attacks.
 * Returns false and sends error response if validation fails.
 * Skips validation if preventDnsRebindingAttack is false.
 */
export function validateOriginHeaderForRequest(
  request: FastifyRequest,
  reply: FastifyReply,
  logger: pino.Logger,
  preventDnsRebindingAttack: boolean,
  allowedOrigins: string[],
): boolean {
  // Skip validation if DNS rebinding attack prevention is disabled
  if (!preventDnsRebindingAttack) {
    return true;
  }

  const origin = request.headers['origin'] as string | undefined;

  if (!validateOrigin(origin, allowedOrigins)) {
    logger.warn(`Invalid or missing Origin header: ${origin || 'none'}`);
    reply.status(403).send({
      error: 'Forbidden',
      message: 'Invalid origin. Please check CORS configuration.',
    });
    return false;
  }

  return true;
}

/**
 * Validate the MCP protocol version header.
 * Returns false and sends error response if validation fails.
 *
 * Per spec: "For backwards compatibility, if the server does not receive an
 * MCP-Protocol-Version header, and has no other way to identify the version -
 * for example, by relying on the protocol version negotiated during initialization -
 * the server SHOULD assume protocol version 2025-03-26."
 */
export function validateProtocolVersionHeaderForRequest(
  request: FastifyRequest,
  reply: FastifyReply,
  logger: pino.Logger,
): boolean {
  const protocolVersion = request.headers['mcp-protocol-version'] as string | undefined;

  // If no protocol version header is present, assume backwards compatible version per spec
  if (!protocolVersion) {
    logger.debug('No mcp-protocol-version header provided, assuming backwards compatible version 2025-03-26');
    return true;
  }

  // Validate the provided protocol version
  if (!validateProtocolVersion(protocolVersion)) {
    logger.warn(`Unsupported protocol version: ${protocolVersion}. Supported versions: 2024-11-05`);

    reply.status(400).send({
      error: 'Bad Request',
      message: 'Unsupported mcp-protocol-version header. Supported versions: 2024-11-05',
    });
    return false;
  }

  // Log protocol version for debugging
  logger.debug(`Request using protocol version: ${protocolVersion}`);

  return true;
}

/**
 * Validate the Accept header for expected content types.
 * Returns false and sends error response if validation fails.
 */
export function validateAcceptHeaderForRequest(
  request: FastifyRequest,
  reply: FastifyReply,
  logger: pino.Logger,
  expected: string | string[],
  errorMessage?: string,
): boolean {
  const accept = request.headers['accept'];
  const expectedArray = Array.isArray(expected) ? expected : [expected];

  if (!accept || !expectedArray.some((e) => accept.includes(e))) {
    logger.warn(`Invalid Accept header: ${accept || 'none'}, expected: ${expectedArray.join(' or ')}`);
    reply.status(406).send({
      error: 'Not Acceptable',
      message: errorMessage || `Accept header must include ${expectedArray.join(' and/or ')}`,
    });
    return false;
  }

  return true;
}

/**
 * Load security configuration from environment variables
 */
export function loadSecurityConfig(): {
  allowedOrigins: string[];
  preventDnsRebindingAttack: boolean;
} {
  const originsEnv = process.env.MCP_ALLOWED_ORIGINS;
  const allowedOrigins = originsEnv ? originsEnv.split(',').map((o) => o.trim()) : [];

  const preventDnsRebinding = process.env.PREVENT_DNS_REBINDING_ATTACK;
  const preventDnsRebindingAttack = preventDnsRebinding === 'true' || preventDnsRebinding === '1';

  return { allowedOrigins, preventDnsRebindingAttack };
}

/**
 * Log security configuration
 */
export function logSecurityConfig(
  logger: pino.Logger,
  preventDnsRebindingAttack: boolean,
  allowedOrigins: string[],
): void {
  if (preventDnsRebindingAttack) {
    logger.info('DNS rebinding attack prevention ENABLED');
    if (allowedOrigins.length > 0) {
      logger.info(`Configured allowed origins: ${allowedOrigins.join(', ')}`);
    } else {
      logger.info('Only localhost origins will be allowed');
    }
  } else {
    logger.warn('DNS rebinding attack prevention DISABLED - Origin header validation skipped');
  }
}
