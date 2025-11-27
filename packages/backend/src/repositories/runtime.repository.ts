import { injectable, inject } from 'inversify';
import { DGraphService } from '../services/dgraph.service';
import { dgraphResolversTypes, NatsService, LoggerService, ToolSetCallToolRequest, RuntimeCallToolResponse, ErrorResponse, apolloResolversTypes, RuntimeTestMCPServerRequest, RuntimeMCPLifecyclePublish, MCP_TEST_SESSION_TIMEOUT } from '@2ly/common';
import { ConnectionMetadata } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Observable, Subject, map } from 'rxjs';
import {
  QUERY_MCPSERVER_WITH_TOOL,
  SET_ROOTS,
  DELETE_RUNTIME,
  UPDATE_RUNTIME,
  ADD_RUNTIME,
  ADD_MCPSERVER_TO_RUNTIME,
  GET_RUNTIME,
  QUERY_ACTIVE_RUNTIMES,
  QUERY_RUNTIME_BY_NAME,
  SET_RUNTIME_INACTIVE,
  SET_RUNTIME_ACTIVE,
  UPDATE_MCP_TOOL,
  ADD_MCP_TOOL,
  GET_RUNTIME_EDGE_MCP_SERVERS,
  GET_RUNTIME_AGENT_MCP_SERVERS_BY_LINK,
  GET_RUNTIME_GLOBAL_MCP_SERVERS,
  GET_RUNTIME_ALL_TOOLS,
  UPDATE_RUNTIME_LAST_SEEN,
} from './runtime.operations';
import { createSubscriptionFromQuery, escapeValue } from '../helpers';
import { MCPToolRepository } from './mcp-tool.repository';
import pino from 'pino';
import { QUERY_WORKSPACE } from './workspace.operations';
import { WorkspaceRepository } from './workspace.repository';

@injectable()
export class RuntimeRepository {
  private logger: pino.Logger;
  private testProgressSubjects: Map<string, Subject<apolloResolversTypes.McpServerLifecycleEvent>> = new Map();
  private testSessionTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private testSessionSubscriptions: Map<string, { drain: () => Promise<void>; isClosed: () => boolean }> = new Map();

  constructor(
    @inject(DGraphService) private readonly dgraphService: DGraphService,
    @inject(MCPToolRepository) private readonly mcpToolRepository: MCPToolRepository,
    @inject(LoggerService) private readonly loggerService: LoggerService,
    @inject(NatsService) private readonly natsService: NatsService,
    @inject(WorkspaceRepository) private readonly workspaceRepository: WorkspaceRepository,
  ) {
    this.logger = this.loggerService.getLogger('runtime-repository');
  }

  async create(
    name: string,
    description: string,
    status: 'ACTIVE' | 'INACTIVE',
    workspaceId: string,
    type: 'EDGE' | 'MCP',
  ): Promise<dgraphResolversTypes.Runtime> {
    const now = new Date().toISOString();
    const res = await this.dgraphService.mutation<{
      addRuntime: { runtime: dgraphResolversTypes.Runtime[] };
    }>(ADD_RUNTIME, {
      name,
      description,
      status,
      type,
      createdAt: now,
      lastSeenAt: now,
      workspaceId,
    });

    const runtime = res.addRuntime.runtime[0];

    // Automatically set as global runtime if this is the first runtime in the workspace
    const runtimes = await this.workspaceRepository.getRuntimes(workspaceId);
    if (runtimes.length === 1) {
      this.logger.info(`Setting runtime ${runtime.id} as global runtime for workspace ${workspaceId} (first runtime)`);
      await this.workspaceRepository.setGlobalRuntime(runtime.id);
    }

    return runtime;
  }

  async update(id: string, name: string, description: string): Promise<dgraphResolversTypes.Runtime> {
    const res = await this.dgraphService.mutation<{
      updateRuntime: { runtime: dgraphResolversTypes.Runtime[] };
    }>(UPDATE_RUNTIME, {
      id,
      name,
      description,
    });
    return res.updateRuntime.runtime[0];
  }

  async delete(id: string): Promise<dgraphResolversTypes.Runtime> {
    const res = await this.dgraphService.mutation<{
      deleteRuntime: { runtime: dgraphResolversTypes.Runtime[] };
    }>(DELETE_RUNTIME, {
      id,
    });
    return res.deleteRuntime.runtime[0];
  }

  /**
   * Upsert a tool based on its name in the given MCP Server.
   * Return the tool and its tool capabilities.
   */
  async upserTool(
    mcpServerId: string,
    toolName: string,
    toolDescription: string,
    toolInputSchema: string,
    toolAnnotations: string,
  ): Promise<dgraphResolversTypes.McpTool> {
    if (!toolName) {
      throw new Error('Tool name is required');
    }
    this.logger.debug(`Upserting tool ${toolName} for MCP Server ${mcpServerId}`);
    const res = await this.dgraphService.query<{ getMCPServer: dgraphResolversTypes.McpServer }>(
      QUERY_MCPSERVER_WITH_TOOL,
      { id: mcpServerId, toolName },
    );

    const mcpServer = res.getMCPServer;
    if (!mcpServer) {
      throw new Error(`MCP Server ${mcpServerId} not found`);
    }

    // get workspace
    const workspace = mcpServer.workspace;
    // if tool already exists, update it
    if ((mcpServer.tools?.length ?? 0) > 0) {
      const tool = mcpServer.tools![0];
      const response = (await this.dgraphService.mutation(UPDATE_MCP_TOOL, {
        toolId: tool.id,
        toolDescription: escapeValue(toolDescription),
        toolInputSchema: toolInputSchema,
        toolAnnotations: toolAnnotations,
        now: new Date().toISOString(),
        status: 'ACTIVE',
      })) as {
        updateMCPTool: { mCPTool: dgraphResolversTypes.McpTool[] };
      };
      return response.updateMCPTool.mCPTool[0];
    }

    // if tool does not exist, create it
    const response = (await this.dgraphService.mutation(ADD_MCP_TOOL, {
      toolName,
      toolDescription: escapeValue(toolDescription),
      toolInputSchema: toolInputSchema,
      toolAnnotations: toolAnnotations,
      now: new Date().toISOString(),
      workspaceId: workspace.id,
      mcpServerId,
    })) as {
      addMCPTool: {
        mCPTool: dgraphResolversTypes.McpTool[];
      };
    };

    return response.addMCPTool.mCPTool[0];
  }

  async addMCPServer(
    runtimeId: string,
    mcpServerId: string,
  ): Promise<dgraphResolversTypes.Runtime> {
    const res = await this.dgraphService.mutation<{
      updateRuntime: { runtime: dgraphResolversTypes.Runtime[] };
    }>(ADD_MCPSERVER_TO_RUNTIME, {
      runtimeId,
      mcpServerId,
    });
    return res.updateRuntime.runtime[0];
  }

  async getRuntime(id: string): Promise<dgraphResolversTypes.Runtime> {
    const response = await this.dgraphService.query(GET_RUNTIME, { id });
    return (response as { getRuntime: dgraphResolversTypes.Runtime }).getRuntime;
  }

  observeRoots(id: string): Observable<{ name: string; uri: string }[]> {
    const query = createSubscriptionFromQuery(GET_RUNTIME);
    return this.dgraphService.observe<dgraphResolversTypes.Runtime>(
      query,
      { id },
      'getRuntime',
      true,
    ).pipe(map((runtime) => runtime?.roots ? JSON.parse(runtime.roots) : []));
  }

  observeMCPServersOnEdge(id: string): Observable<dgraphResolversTypes.McpServer[]> {
    const query = createSubscriptionFromQuery(GET_RUNTIME_EDGE_MCP_SERVERS);
    return this.dgraphService.observe<dgraphResolversTypes.Runtime>(
      query,
      { id },
      'getRuntime',
      true,
    ).pipe(
      map((runtime) => runtime?.mcpServers ?? []),
    );
  }

  observeMCPServersOnAgent(id: string): Observable<dgraphResolversTypes.McpServer[]> {
    const query = createSubscriptionFromQuery(GET_RUNTIME_AGENT_MCP_SERVERS_BY_LINK);
    return this.dgraphService.observe<dgraphResolversTypes.Runtime>(
      query,
      { id },
      'getRuntime',
      true,
    ).pipe(
      map((runtime) => runtime?.mcpServers ?? []),
    );
  }

  observeMCPServersOnGlobal(workspaceId: string): Observable<dgraphResolversTypes.McpServer[]> {
    const query = createSubscriptionFromQuery(GET_RUNTIME_GLOBAL_MCP_SERVERS);
    return this.dgraphService.observe<dgraphResolversTypes.Runtime>(
      query,
      { id: workspaceId },
      'getWorkspace',
      true,
    ).pipe(
      map((runtime) => runtime?.mcpServers ?? []),
    );
  }

  async setInactive(id: string) {
    const res = await this.dgraphService.mutation<{
      updateRuntime: { runtime: dgraphResolversTypes.Runtime[] };
    }>(SET_RUNTIME_INACTIVE, {
      id,
    });
    const runtime = res.updateRuntime.runtime[0];
    if (!runtime) {
      this.logger.warn(`Runtime ${id} not found, skipping setInactive`);
      return;
    }
    const MCPTools = runtime.mcpServers?.map((mcpServer) => mcpServer.tools).flat() ?? [];
    for (const MCPTool of MCPTools) {
      if (MCPTool) {
        await this.mcpToolRepository.setStatus(MCPTool.id, 'INACTIVE');
      }
    }
    return res.updateRuntime.runtime[0];
  }

  async findActive(): Promise<dgraphResolversTypes.Runtime[]> {
    const res = await this.dgraphService.query<{ queryRuntime: dgraphResolversTypes.Runtime[] }>(
      QUERY_ACTIVE_RUNTIMES,
      {},
    );
    return res.queryRuntime;
  }

  async setActive(
    id: string,
    metadata: ConnectionMetadata,
  ): Promise<dgraphResolversTypes.Runtime> {
    const res = await this.dgraphService.mutation<{
      updateRuntime: { runtime: dgraphResolversTypes.Runtime[] };
    }>(SET_RUNTIME_ACTIVE, {
      id,
      processId: metadata.pid,
      hostIP: metadata.hostIP,
      hostname: metadata.hostname,
    });
    return res.updateRuntime.runtime[0];
  }

  async updateLastSeen(id: string): Promise<dgraphResolversTypes.Runtime> {
    const res = await this.dgraphService.mutation<{
      updateRuntime: { runtime: dgraphResolversTypes.Runtime[] };
    }>(UPDATE_RUNTIME_LAST_SEEN, {
      id,
      now: new Date().toISOString(),
    });
    return res.updateRuntime.runtime[0];
  }

  async setRoots(id: string, roots: { name: string; uri: string }[]): Promise<dgraphResolversTypes.Runtime> {
    // validate roots
    for (const root of roots) {
      if (!root.name || !root.uri) {
        throw new Error('Invalid root');
      }
    }
    const res = await this.dgraphService.mutation<{
      updateRuntime: { runtime: dgraphResolversTypes.Runtime[] };
    }>(SET_ROOTS, {
      id,
      roots: JSON.stringify(roots),
    });
    return res.updateRuntime.runtime[0];
  }

  async findById(id: string): Promise<dgraphResolversTypes.Runtime | null> {
    const response = await this.dgraphService.query<{ getRuntime: dgraphResolversTypes.Runtime | null }>(
      GET_RUNTIME,
      { id },
    );
    return response.getRuntime;
  }

  async findByName(workspaceId: string, name: string): Promise<dgraphResolversTypes.Runtime | undefined> {
    const res = await this.dgraphService.query<{ getWorkspace: { runtimes: dgraphResolversTypes.Runtime[] } }>(
      QUERY_RUNTIME_BY_NAME,
      { workspaceId, name },
    );
    return res.getWorkspace?.runtimes?.[0];
  }

  observeCapabilities(runtimeId: string): Observable<dgraphResolversTypes.Runtime> {
    const query = createSubscriptionFromQuery(GET_RUNTIME_ALL_TOOLS);
    return this.dgraphService.observe<dgraphResolversTypes.Runtime>(
      query,
      { id: runtimeId },
      'getRuntime',
      true,
    );
  }

  /**
   * Method to simulate a tool call to a MCP Tool
   * Uses the workspace's global runtime to execute the tool
   * 
   * TODO: Allow to specify the runtime on which the tool should be executed, particulary necessary for tool belonging to MCP server set to run on agent side
   */
  async callMCPTool(toolId: string, input: string): Promise<apolloResolversTypes.CallToolResult> {
    // Get the tool with its workspace to determine which runtime to use
    const tool = await this.mcpToolRepository.getToolWithWorkspace(toolId);

    if (!tool) {
      throw new Error(`Tool ${toolId} not found`);
    }

    if (!tool.workspace) {
      throw new Error(`Tool ${toolId} has no workspace`);
    }

    // Get the global runtime from the workspace
    const workspace = await this.dgraphService.query<{ getWorkspace: { globalRuntime: { id: string; name: string } | null } }>(QUERY_WORKSPACE, { workspaceId: tool.workspace.id });
    const globalRuntime = workspace.getWorkspace.globalRuntime;

    if (!globalRuntime) {
      throw new Error(
        `No global runtime configured for workspace ${tool.workspace.name}. ` +
        `Please set a global runtime to test tools.`
      );
    }

    this.logger.info(`Calling tool ${tool.name}`);

    // Arguments as JSON
    let args: Record<string, unknown>;
    try {
      args = JSON.parse(input);
    } catch {
      throw new Error(`Invalid input: ${input}`);
    }

    const message = new ToolSetCallToolRequest({
      workspaceId: tool.workspace.id,
      isTest: true,
      toolId,
      arguments: args,
    });

    const response = await this.natsService.request(message);
    if (response instanceof RuntimeCallToolResponse) {
      return {
        success: !response.data.result.isError,
        result: JSON.stringify(response.data.result.content, null, 2),
      };
    } else if (response instanceof ErrorResponse) {
      throw new Error(`Error calling tool: ${response.data.error}`);
    } else {
      throw new Error(`Invalid response: ${JSON.stringify(response)}`);
    }
  }

  /**
   * Clean up resources for a test session (subject, timeout, and NATS subscription)
   */
  private async cleanupTestSession(testSessionId: string): Promise<void> {
    // Clear timeout
    const timeoutId = this.testSessionTimeouts.get(testSessionId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.testSessionTimeouts.delete(testSessionId);
    }

    // Complete subject (silent - no error event)
    const subject = this.testProgressSubjects.get(testSessionId);
    if (subject) {
      subject.complete();
      this.testProgressSubjects.delete(testSessionId);
    }

    // Drain NATS subscription
    const subscription = this.testSessionSubscriptions.get(testSessionId);
    if (subscription && !subscription.isClosed()) {
      try {
        await subscription.drain();
      } catch (error) {
        this.logger.warn(`Failed to drain subscription for test ${testSessionId}: ${error}`);
      }
    }
    this.testSessionSubscriptions.delete(testSessionId);
  }

  /**
   * Test an MCP server by sending a request to the runtime and returning a testSessionId immediately
   */
  async testMCPServer(
    name: string,
    repositoryUrl: string,
    transport: 'STREAM' | 'STDIO' | 'SSE',
    config: string,
    workspaceId: string,
  ): Promise<apolloResolversTypes.TestMcpServerResult> {
    // Generate testSessionId immediately
    const testSessionId = uuidv4();

    this.logger.info(`Starting test for MCP server ${name} with testSessionId ${testSessionId}`);

    // Create a subject for this test session
    const subject = new Subject<apolloResolversTypes.McpServerLifecycleEvent>();
    this.testProgressSubjects.set(testSessionId, subject);

    // Subscribe to NATS lifecycle events for this test session
    const natsSubject = RuntimeMCPLifecyclePublish.subscribeToTestSession(testSessionId);
    const subscription = this.natsService.subscribe(natsSubject);

    // Track subscription for cleanup
    this.testSessionSubscriptions.set(testSessionId, subscription);

    // Set timeout for cleanup (5 minutes)
    const timeoutId = setTimeout(() => {
      this.logger.warn(`Test session ${testSessionId} timed out after 5 minutes`);
      this.cleanupTestSession(testSessionId);
    }, MCP_TEST_SESSION_TIMEOUT);
    this.testSessionTimeouts.set(testSessionId, timeoutId);

    // Handle lifecycle events in the background
    (async () => {
      try {
        for await (const msg of subscription) {
          if (msg instanceof RuntimeMCPLifecyclePublish) {
            this.logger.debug(`Received lifecycle event for test ${testSessionId}: ${msg.data.stage}`);

            const event: apolloResolversTypes.McpServerLifecycleEvent = {
              stage: msg.data.stage as apolloResolversTypes.McpLifecycleStage,
              message: msg.data.message,
              timestamp: new Date(msg.data.timestamp),
              error: msg.data.error
                ? {
                    code: msg.data.error.code,
                    message: msg.data.error.message,
                    details: msg.data.error.details ?? null,
                  }
                : null,
              tools: msg.data.tools
                ? msg.data.tools.map(
                    (tool): apolloResolversTypes.McpTool => ({
                      id: '',
                      name: tool.name,
                      description: tool.description ?? '',
                      inputSchema: JSON.stringify(tool.inputSchema),
                      annotations: JSON.stringify(tool.annotations ?? {}),
                      status: apolloResolversTypes.ActiveStatus.Active,
                      createdAt: new Date(),
                      lastSeenAt: new Date(),
                      mcpServer: {} as apolloResolversTypes.McpServer,
                      workspace: {} as apolloResolversTypes.Workspace,
                    }),
                  )
                : null,
            };

            // Emit the event to subscribers
            const eventSubject = this.testProgressSubjects.get(testSessionId);
            if (eventSubject) {
              eventSubject.next(event);
            }

            // Clean up on COMPLETED or FAILED
            if (msg.data.stage === 'COMPLETED' || msg.data.stage === 'FAILED') {
              await this.cleanupTestSession(testSessionId);
              break;
            }
          }
        }
      } catch (error) {
        this.logger.error(`Error handling lifecycle events for test ${testSessionId}: ${error}`);
        const eventSubject = this.testProgressSubjects.get(testSessionId);
        if (eventSubject) {
          eventSubject.error(error);
        }
        await this.cleanupTestSession(testSessionId);
      }
    })();

    // Send test request to runtime (non-blocking)
    const testRequest = new RuntimeTestMCPServerRequest({
      testSessionId,
      name,
      repositoryUrl,
      transport,
      config,
      workspaceId,
    });

    // Publish request asynchronously - don't wait for response
    this.natsService.publish(testRequest);

    // Return immediately with testSessionId
    return {
      success: false, // Will be updated via subscription
      tools: null,
      error: null,
      testSessionId,
    };
  }

  /**
   * Subscribe to lifecycle events for a specific test session
   */
  observeMCPServerTestProgress(testSessionId: string): Observable<apolloResolversTypes.McpServerLifecycleEvent> {
    // Get or create subject for this test session
    let subject = this.testProgressSubjects.get(testSessionId);
    if (!subject) {
      // If subject doesn't exist, it might have already completed or hasn't started yet
      // Create a new subject that will receive events when they arrive
      subject = new Subject<apolloResolversTypes.McpServerLifecycleEvent>();
      this.testProgressSubjects.set(testSessionId, subject);
    }
    return subject.asObservable();
  }
}
