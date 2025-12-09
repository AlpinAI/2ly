import { injectable } from 'inversify';
import pino from 'pino';
import {
  Service,
  dgraphResolversTypes,
  MCPTool,
  mcpRegistry,
  findUnsubstitutedVariables,
  buildStdioTransport,
  buildSseTransport,
  buildStreamTransport,
  safeParseConfig,
} from '@skilder-ai/common';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport, getDefaultEnvironment } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { Observable, BehaviorSubject } from 'rxjs';
import { ListRootsRequestSchema, ToolListChangedNotificationSchema } from '@modelcontextprotocol/sdk/types.js';

type ServerPackage = mcpRegistry.components['schemas']['Package'];
type ServerTransport = mcpRegistry.components['schemas']['Transport'];

@injectable()
export class ToolServerService extends Service {
  name = 'tool-server';
  private client: Client;
  private transport: Transport;
  private tools: BehaviorSubject<MCPTool[]> = new BehaviorSubject<MCPTool[]>([]);
  private onShutdownCallback: () => Promise<void> = async () => {};

  constructor(
    private logger: pino.Logger,
    private config: dgraphResolversTypes.McpServer,
    private roots: { name: string; uri: string }[] = [],
  ) {
    super();
    this.logger.info(`Initializing MCP server service for ${this.config.name}`);
    this.client = new Client(
      {
        name: this.config.name,
        version: '1.0.0',
      },
      {
        capabilities: {
          roots: {
            listChanged: true,
          },
        },
      },
    );

    this.client.setRequestHandler(ListRootsRequestSchema, async () => {
      this.logger.debug(
        `Handling ListRootsRequest for ${this.config.name}, returning roots: ${JSON.stringify(this.roots)}`,
      );
      return {
        roots: this.roots,
      };
    });

    // Parse and validate the config field which contains a single Package or Transport object
    let parsedConfig: ServerPackage | ServerTransport;
    try {
      const rawConfig = JSON.parse(this.config.config);
      const validationResult = safeParseConfig(rawConfig);

      if (!validationResult.success) {
        const errorDetails = validationResult.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join(', ');
        throw new Error(`Config validation failed: ${errorDetails}`);
      }

      parsedConfig = validationResult.data as ServerPackage | ServerTransport;
      this.logger.info(`Parsed and validated config: ${JSON.stringify(parsedConfig, null, 2)}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to parse config for ${this.config.name}: ${errorMessage}`);
    }

    // DEFENSIVE CHECK: Warn if config contains unsubstituted variables
    // Frontend should substitute all variables, but we check defensively
    const unsubstitutedVars = findUnsubstitutedVariables(parsedConfig);
    if (unsubstitutedVars.length > 0) {
      this.logger.warn(
        `Config for ${this.config.name} contains unsubstituted variables: ${unsubstitutedVars.join(', ')}. ` +
          `This may indicate a frontend configuration issue. The server may fail to start.`,
      );
    }

    // STDIO transport: config contains a Package object with packageArguments, environmentVariables, etc.
    if (this.config.transport === dgraphResolversTypes.McpTransportType.Stdio && 'identifier' in parsedConfig) {
      this.logger.info(`Setting STDIO transport for ${this.config.name}`);

      // Use common transport builder
      const defaultEnv = getDefaultEnvironment();
      const stdioConfig = buildStdioTransport(parsedConfig as ServerPackage, {...defaultEnv, LOG_LEVEL: 'silent'});
      this.logger.info(`STDIO config: ${stdioConfig}`);

      this.transport = new StdioClientTransport({
        command: stdioConfig.command,
        args: stdioConfig.args,
        env: stdioConfig.env,
      });
    }
    // SSE transport: config contains a Transport object with type="sse", url, headers
    else if (this.config.transport === dgraphResolversTypes.McpTransportType.Sse) {
      this.logger.info(`Setting SSE transport for ${this.config.name}`);

      // Use common transport builder
      const sseConfig = buildSseTransport(parsedConfig as ServerTransport);

      this.logger.info(`SSE URL: ${sseConfig.url}`);
      this.logger.info(`Headers: ${JSON.stringify(Object.entries(sseConfig.headers))}`);

      this.transport = new SSEClientTransport(new URL(sseConfig.url), {
        requestInit: {
          headers: sseConfig.headers,
        },
      });
    }
    // STREAM transport: config contains a Transport object with type="streamableHttp", url, headers
    else if (this.config.transport === dgraphResolversTypes.McpTransportType.Stream) {
      this.logger.info(`Setting STREAM transport for ${this.config.name}`);

      // Use common transport builder
      const streamConfig = buildStreamTransport(parsedConfig as ServerTransport);

      this.logger.info(`STREAM URL: ${streamConfig.url}`);
      this.logger.info(`Headers: ${JSON.stringify(Object.entries(streamConfig.headers))}`);

      this.transport = new StreamableHTTPClientTransport(new URL(streamConfig.url), {
        requestInit: {
          headers: streamConfig.headers,
        },
      });
    } else {
      throw new Error(`Unknown MCP server type: ${this.config.transport}, only STDIO, SSE and STREAM are supported`);
    }
  }

  observeTools(): Observable<MCPTool[]> {
    return this.tools.asObservable();
  }

  protected async initialize() {
    this.logger.info(`Starting with transport: ${this.transport}`);
    await this.client.connect(this.transport);
    this.logger.debug('Connected to MCP server');
    const originalTools = await this.client.listTools();
    this.tools.next(originalTools.tools);

    this.client.setNotificationHandler(ToolListChangedNotificationSchema, async () => {
      const updatedTools = await this.client.listTools();
      this.tools.next(updatedTools.tools);
    });
  }

  protected async shutdown() {
    this.logger.info('Stopping');
    this.tools.complete();
    await this.onShutdownCallback();

    // For STDIO, try graceful shutdown first
    if (this.transport instanceof StdioClientTransport) {
      const pid = this.transport.pid;
      if (pid) {
        try {
          // Send SIGTERM for graceful shutdown
          process.kill(pid, 'SIGTERM');
          this.logger.debug(`Sent SIGTERM to process ${pid}`);

          // Wait up to 1 second for graceful exit
          const startTime = Date.now();
          while (Date.now() - startTime < 1000) {
            try {
              // Check if process still exists (throws if not)
              process.kill(pid, 0);
              await new Promise((resolve) => setTimeout(resolve, 50));
            } catch {
              // Process exited
              this.logger.debug(`Process ${pid} exited gracefully`);
              break;
            }
          }

          // Force kill if still running
          try {
            process.kill(pid, 0);
            this.logger.debug(`Process ${pid} still running, sending SIGKILL`);
            process.kill(pid, 'SIGKILL');
          } catch {
            // Already exited
          }
        } catch (error) {
          this.logger.debug(`Error during process cleanup: ${error}`);
        }
      }
    }

    await this.transport.close();
    await this.client.close();
    this.logger.debug('Disconnected');
  }

  onShutdown(callback: () => Promise<void>) {
    this.onShutdownCallback = callback;
  }

  callTool(toolCall: { name: string; arguments: Record<string, unknown> }): Promise<unknown> {
    return this.client.callTool({
      name: toolCall.name,
      arguments: toolCall.arguments,
    });
  }

  getName(): string {
    return this.config.name;
  }

  getConfigSignature(): string {
    // Don't include tools length - tools are discovered dynamically and shouldn't trigger respawn
    return `${this.config.transport}-${this.config.config}-${this.roots.length}`;
  }

  updateRoots(roots: { name: string; uri: string }[]) {
    this.logger.debug(`Updating ${this.config.name} roots: ${JSON.stringify(roots)}`);
    this.roots = roots;
    this.client.sendRootsListChanged();
  }
}

export type ToolServerServiceFactory = (
  config: dgraphResolversTypes.McpServer,
  roots: { name: string; uri: string }[],
) => ToolServerService;
