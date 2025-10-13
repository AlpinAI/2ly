import { injectable } from 'inversify';
import pino from 'pino';
import { Service, dgraphResolversTypes, MCPTool, mcpRegistry } from '@2ly/common';
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

    // Parse the config field which contains a single Package or Transport object
    let parsedConfig: ServerPackage | ServerTransport;
    try {
      parsedConfig = JSON.parse(this.config.config);
      this.logger.debug(`Parsed config: ${JSON.stringify(parsedConfig, null, 2)}`);
    } catch (error) {
      throw new Error(`Failed to parse config for ${this.config.name}: ${error}`);
    }

    // STDIO transport: config contains a Package object with packageArguments, environmentVariables, etc.
    if (this.config.transport === dgraphResolversTypes.McpTransportType.Stdio && 'identifier' in parsedConfig) {
      this.logger.info(`Setting STDIO transport for ${this.config.name}`);

      // Extract command and args from Package config
      const identifier = parsedConfig.identifier || '';
      const packageArgs = parsedConfig.packageArguments || [];
      const runtimeArgs = parsedConfig.runtimeArguments || [];
      const envVars = parsedConfig.environmentVariables || [];
      const registryType = parsedConfig.registryType || '';
      console.log('identifier', identifier);
      console.log('registryType', registryType);

      // Validate identifier
      if (!identifier) {
        throw new Error(`Package identifier is required for ${this.config.name}`);
      }

      // Determine base command from registry type
      let command: string;
      const supportedTypes = ['npm', 'pypi', 'nuget', 'oci'];
      console.log('analyzing registry type:', registryType);
      switch (registryType) {
        case 'npm':
          command = 'npx';
          break;
        case 'pypi':
          command = 'uvx';
          break;
        case 'nuget':
          command = 'dnx';
          break;
        case 'oci':
          command = 'docker';
          break;
        default:
          throw new Error(`Unsupported registry type: ${registryType}. Supported types: ${supportedTypes.join(', ')}`);
      }
      console.log('command:', command);
      // Build args array: [runtimeArgs, identifier, packageArgs]
      const args: string[] = [];
      console.log('analyzing runtime arguments', runtimeArgs);
      // Process runtime arguments (before identifier)
      runtimeArgs.forEach((arg: any) => {
        if (arg.name) {
          // Named argument: --name value
          args.push(`--${arg.name}`);
          if (arg.value) {
            args.push(String(arg.value));
          }
        } else if (arg.value) {
          // Positional argument
          args.push(String(arg.value));
        }
      });

      // Add docker 'run' subcommand for OCI containers
      if (registryType === 'oci') {
        args.push('run');
      }

      // Add package identifier
      // - some package prefix the identifier with npm: -> which must be removed
      const normalizedIdentifier = identifier.replace(/^npm:/, '');
      args.push(normalizedIdentifier);
      console.log('analyzing package arguments', packageArgs);
      // Process package arguments (after identifier)
      packageArgs.forEach((arg: any) => {
        if (arg.type === 'named' && arg.name) {
          // Named argument: --name value
          args.push(`--${arg.name}`);
          if (arg.value) {
            args.push(String(arg.value));
          } else if (arg.valueHint) {
            this.logger.warn(`Missing value for named argument --${arg.name}, expected: ${arg.valueHint}`);
          }
        } else if (arg.value) {
          // Positional argument (default or explicit type="positional")
          args.push(String(arg.value));
        } else if (arg.isRequired && arg.valueHint) {
          this.logger.warn(`Missing required positional argument: ${arg.valueHint}`);
        }
      });
      console.log('args', args);
      // Build environment variables
      const defaultEnv = getDefaultEnvironment();
      const env = envVars.reduce(
        (acc: Record<string, string>, envVar: any) => {
          if (envVar.name && envVar.value) {
            acc[envVar.name] = envVar.value;
          }
          return acc;
        },
        { ...defaultEnv },
      );

      console.log(`STDIO command: ${command}, args: ${args.join(' ')}`);
      console.log(`Environment: ${JSON.stringify(env, null, 2)}`);

      this.logger.info(`STDIO command: ${command}, args: ${args.join(' ')}`);
      this.logger.debug(`Environment: ${JSON.stringify(env, null, 2)}`);

      this.transport = new StdioClientTransport({
        command,
        args,
        env,
      });
    }
    // SSE transport: config contains a Transport object with type="sse", url, headers
    else if (this.config.transport === dgraphResolversTypes.McpTransportType.Sse) {
      this.logger.info(`Setting SSE transport for ${this.config.name}`);

      const url = parsedConfig.url || '';
      const headers = parsedConfig.headers || [];

      // Build headers map
      const headerMap = new Map<string, string>();
      headers.forEach((header: any) => {
        if (header.name && header.value) {
          headerMap.set(header.name, header.value);
        }
      });

      this.logger.info(`SSE URL: ${url}`);
      this.logger.debug(`Headers: ${JSON.stringify(Array.from(headerMap.entries()))}`);

      // SSEClientTransport options
      const options = {
        requestInit: {
          headers: Object.fromEntries(headerMap),
        },
      };

      this.transport = new SSEClientTransport(new URL(url), options);
    }
    // STREAM transport: config contains a Transport object with type="streamableHttp", url, headers
    else if (this.config.transport === dgraphResolversTypes.McpTransportType.Stream) {
      this.logger.info(`Setting STREAM transport for ${this.config.name}`);

      const url = parsedConfig.url || '';
      const headers = parsedConfig.headers || [];

      // Build headers map
      const headerMap = new Map<string, string>();
      headers.forEach((header: any) => {
        if (header.name && header.value) {
          headerMap.set(header.name, header.value);
        }
      });

      this.logger.info(`STREAM URL: ${url}`);
      this.logger.debug(`Headers: ${JSON.stringify(Array.from(headerMap.entries()))}`);

      const requestInit: RequestInit = {
        headers: Object.fromEntries(headerMap),
      };

      this.transport = new StreamableHTTPClientTransport(new URL(url), {
        requestInit,
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

  callCapability(toolCall: { name: string; arguments: Record<string, unknown> }): Promise<unknown> {
    return this.client.callTool({
      name: toolCall.name,
      arguments: toolCall.arguments,
    });
  }

  getName(): string {
    return this.config.name;
  }

  getConfigSignature(): string {
    return `${this.config.transport} ${this.config.config}`;
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
