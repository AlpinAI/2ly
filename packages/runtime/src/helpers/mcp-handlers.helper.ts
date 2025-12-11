import pino from 'pino';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { SessionContext, getSessionForRequest } from './mcp-session.helper';

/**
 * MCP request handlers utility class.
 * Provides static methods for handling MCP protocol requests.
 */
export class McpRequestHandlers {
  /**
   * Handle initialize request
   */
  static async handleInitialize(
    request: unknown,
    extra: { sessionId?: string },
    sessions: Map<string, SessionContext>,
    logger: pino.Logger,
  ) {
    logger.info('Initialize handler');
    const initRequest = request as { params: { clientInfo: unknown; protocolVersion: string } };
    logger.debug(
      `Initializing client: ${JSON.stringify(initRequest.params.clientInfo)}, protocol version: ${initRequest.params.protocolVersion}`,
    );

    const session = getSessionForRequest(extra.sessionId!, sessions);
    const identity = session.skillService.getIdentity();

    const response = {
      serverInfo: {
        name: identity.skillName,
        version: '1.0.0',
      },
      protocolVersion: '2024-11-05',
      capabilities: {
        experimental: {},
        tools: {
          listChanged: true,
        },
      },
    };

    // Wait for tools to be available before responding
    await session.skillService.waitForTools();

    return response;
  }

  /**
   * Handle list tools request
   */
  static async handleListTools(
    request: unknown,
    extra: { sessionId?: string },
    sessions: Map<string, SessionContext>,
    logger: pino.Logger,
  ) {
    logger.debug('Listing tools');

    const session = getSessionForRequest(extra.sessionId!, sessions);

    try {
      const tools = await session.skillService.getToolsForMCP();
      logger.debug(`List tools, responding with ${tools.length} tools`);
      logger.debug(`Tools: ${JSON.stringify(tools, null, 2)}`);
      return { tools };
    } catch (error) {
      logger.error(`Error listing tools: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Error listing tools: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handle call tool request
   */
  static async handleCallTool(
    request: unknown,
    extra: { sessionId?: string },
    sessions: Map<string, SessionContext>,
    logger: pino.Logger,
  ) {
    const callRequest = request as { params: { name: string; arguments?: unknown } };

    if (!callRequest.params.arguments) {
      throw new Error('Arguments are required');
    }

    const session = getSessionForRequest(extra.sessionId!, sessions);

    try {
      const result = await session.skillService.callTool(
        callRequest.params.name,
        callRequest.params.arguments as Record<string, unknown>,
      );
      return result;
    } catch (error) {
      logger.error(`Error calling tool: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Error calling tool: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Register MCP request handlers on the shared MCP Server
 */
export function registerMcpHandlers(
  server: Server,
  sessions: Map<string, SessionContext>,
  logger: pino.Logger,
): void {
  server.setRequestHandler(InitializeRequestSchema, async (request, extra) => {
    return McpRequestHandlers.handleInitialize(request, extra, sessions, logger);
  });

  server.setRequestHandler(ListToolsRequestSchema, async (request, extra) => {
    return McpRequestHandlers.handleListTools(request, extra, sessions, logger);
  });

  server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
    return McpRequestHandlers.handleCallTool(request, extra, sessions, logger);
  });
}
