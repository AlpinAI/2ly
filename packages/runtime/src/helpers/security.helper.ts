/**
 * Security helper for MCP transport validation
 */

/**
 * Validates the Origin header to prevent DNS rebinding attacks.
 *
 * For local servers (binding to localhost/127.0.0.1), only localhost origins are allowed.
 * For remote servers, configurable allowed origins can be specified.
 *
 * @param origin - The Origin header value from the request
 * @param allowedOrigins - Optional array of allowed origins for remote servers (e.g., ['https://example.com'])
 * @returns true if the origin is valid, false otherwise
 */
export function validateOrigin(origin: string | undefined, allowedOrigins?: string[]): boolean {
  console.log('validating origin', origin, allowedOrigins);
  // If no origin header, reject (browsers always send Origin for cross-origin requests)
  if (!origin) {
    return false;
  }

  try {
    const originUrl = new URL(origin);

    // For local development, allow localhost origins
    const isLocalhost =
      originUrl.hostname === 'localhost' ||
      originUrl.hostname === '127.0.0.1' ||
      originUrl.hostname === '::1' ||
      originUrl.hostname === '[::1]';

    if (isLocalhost) {
      return true;
    }

    // If allowedOrigins is provided, check against it
    if (allowedOrigins && allowedOrigins.length > 0) {
      return allowedOrigins.includes(origin);
    }

    // If no allowedOrigins configured for a non-localhost origin, reject
    // This is a security-first approach: explicitly allow origins rather than defaulting to allow
    return false;
  } catch (_error) {
    // Invalid URL format
    return false;
  }
}

/**
 * Validates the MCP protocol version header.
 *
 * @param protocolVersion - The mcp-protocol-version header value
 * @param supportedVersions - Array of supported protocol versions (default: ['2024-11-05'])
 * @returns true if the protocol version is supported, false otherwise
 */
export function validateProtocolVersion(
  protocolVersion: string | undefined,
  supportedVersions: string[] = ['2024-11-05']
): boolean {
  if (!protocolVersion) {
    return false;
  }

  return supportedVersions.includes(protocolVersion);
}

/**
 * Validates that a session ID is present and valid format.
 * Session IDs must contain only visible ASCII characters (0x21 to 0x7E).
 *
 * @param sessionId - The session ID to validate
 * @returns true if valid, false otherwise
 */
export function validateSessionId(sessionId: string | undefined): boolean {
  if (!sessionId || sessionId.length === 0) {
    return false;
  }

  // Check all characters are visible ASCII (0x21 to 0x7E)
  for (let i = 0; i < sessionId.length; i++) {
    const code = sessionId.charCodeAt(i);
    if (code < 0x21 || code > 0x7e) {
      return false;
    }
  }

  return true;
}

/**
 * JSON-RPC message types
 */
export enum JsonRpcMessageType {
  REQUEST = 'request',
  RESPONSE = 'response',
  NOTIFICATION = 'notification',
}

/**
 * Determines the type of JSON-RPC message.
 *
 * - Request: has 'method' and 'id' fields
 * - Notification: has 'method' but no 'id' field
 * - Response: has 'result' or 'error' with 'id' field
 *
 * @param message - The JSON-RPC message object
 * @returns The message type
 */
export function getJsonRpcMessageType(message: unknown): JsonRpcMessageType {
  if (!message || typeof message !== 'object') {
    return JsonRpcMessageType.REQUEST; // Default to request for safety
  }

  const msg = message as Record<string, unknown>;

  // Response: has result or error with id
  if (('result' in msg || 'error' in msg) && 'id' in msg) {
    return JsonRpcMessageType.RESPONSE;
  }

  // Notification: has method but no id
  if ('method' in msg && !('id' in msg)) {
    return JsonRpcMessageType.NOTIFICATION;
  }

  // Request: has method and id
  if ('method' in msg && 'id' in msg) {
    return JsonRpcMessageType.REQUEST;
  }

  // Default to request
  return JsonRpcMessageType.REQUEST;
}
