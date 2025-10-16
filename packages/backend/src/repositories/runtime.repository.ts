import { injectable, inject } from 'inversify';
import { DGraphService } from '../services/dgraph.service';
import { dgraphResolversTypes, NatsService, LoggerService, AgentCallMCPToolMessage, AgentCallResponseMessage, NatsErrorMessage, apolloResolversTypes } from '@2ly/common';
import {
  QUERY_MCPSERVER_WITH_TOOL,
  SET_ROOTS,
  SET_MCP_CLIENT_NAME,
  DELETE_RUNTIME,
  UPDATE_RUNTIME,
  ADD_RUNTIME,
  ADD_MCPSERVER_TO_RUNTIME,
  GET_RUNTIME,
  QUERY_ACTIVE_RUNTIMES,
  QUERY_RUNTIME_BY_NAME,
  SET_RUNTIME_INACTIVE,
  SET_RUNTIME_ACTIVE,
  LINK_MCP_TOOL,
  UNLINK_MCP_TOOL,
  QUERY_RUNTIME_MCP_TOOLS,
  UPDATE_MCP_TOOL,
  ADD_MCP_TOOL,
  SET_RUNTIME_CAPABILITIES,
  GET_RUNTIME_EDGE_MCP_SERVERS,
  GET_RUNTIME_AGENT_MCP_SERVERS,
  GET_RUNTIME_GLOBAL_MCP_SERVERS,
  UPDATE_RUNTIME_LAST_SEEN,
} from './runtime.operations';
import { map, Observable } from 'rxjs';
import { createSubscriptionFromQuery, escapeValue } from '../helpers';
import { MCPToolRepository } from './mcp-tool.repository';
import pino from 'pino';
import { QUERY_WORKSPACE } from './workspace.operations';
import { WorkspaceRepository } from './workspace.repository';

@injectable()
export class RuntimeRepository {
  private logger: pino.Logger;
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
    capabilities: string[],
  ): Promise<dgraphResolversTypes.Runtime> {
    const now = new Date().toISOString();
    const res = await this.dgraphService.mutation<{
      addRuntime: { runtime: dgraphResolversTypes.Runtime[] };
    }>(ADD_RUNTIME, {
      name,
      description,
      status,
      createdAt: now,
      lastSeenAt: now,
      workspaceId,
      capabilities,
    });


    return res.addRuntime.runtime[0];
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
    ).pipe(map((runtime) => runtime.roots ? JSON.parse(runtime.roots) : []));
  }

  observeMCPServersOnEdge(id: string): Observable<dgraphResolversTypes.McpServer[]> {
    const query = createSubscriptionFromQuery(GET_RUNTIME_EDGE_MCP_SERVERS);
    return this.dgraphService.observe<dgraphResolversTypes.Runtime>(
      query,
      { id },
      'getRuntime',
      true,
    ).pipe(
      map((runtime) => runtime.mcpServers ?? []),
    );
  }

  observeMCPServersOnAgent(id: string): Observable<dgraphResolversTypes.McpServer[]> {
    const query = createSubscriptionFromQuery(GET_RUNTIME_AGENT_MCP_SERVERS);
    return this.dgraphService.observe<dgraphResolversTypes.Runtime>(
      query,
      { id },
      'getRuntime',
      true,
    ).pipe(
      map((runtime) => runtime?.mcpToolCapabilities?.filter((mcpTool) => mcpTool.mcpServer.runOn === 'AGENT').map((mcpTool) => mcpTool.mcpServer) ?? []),
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
      map((runtime) => runtime.mcpServers ?? []),
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
    processId: string,
    hostIP: string,
    hostname: string,
  ): Promise<dgraphResolversTypes.Runtime> {
    const res = await this.dgraphService.mutation<{
      updateRuntime: { runtime: dgraphResolversTypes.Runtime[] };
    }>(SET_RUNTIME_ACTIVE, {
      id,
      processId,
      hostIP,
      hostname,
    });
    return res.updateRuntime.runtime[0];
  }

  async updateLastSeen(id: string): Promise<dgraphResolversTypes.Runtime> {
    const res = await this.dgraphService.mutation<{
      updateRuntime: { runtime: dgraphResolversTypes.Runtime[] };
    }>(UPDATE_RUNTIME_LAST_SEEN, {
      id,
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

  async setMcpClientName(id: string, mcpClientName: string): Promise<dgraphResolversTypes.Runtime> {
    const res = await this.dgraphService.mutation<{
      updateRuntime: { runtime: dgraphResolversTypes.Runtime[] };
    }>(SET_MCP_CLIENT_NAME, {
      id,
      mcpClientName,
    });
    return res.updateRuntime.runtime[0];
  }

  async setCapabilities(id: string, capabilities: string[]): Promise<dgraphResolversTypes.Runtime> {
    // validate capabilities
    for (const capability of capabilities) {
      if (capability !== 'agent' && capability !== 'tool') {
        throw new Error(`Invalid capability: ${capability}`);
      }
    }
    const res = await this.dgraphService.mutation<{
      updateRuntime: { runtime: dgraphResolversTypes.Runtime[] };
    }>(SET_RUNTIME_CAPABILITIES, {
      id,
      capabilities,
    });
    const updated = res.updateRuntime.runtime[0];
    const hasAgent = capabilities.some((c) => c.toLowerCase() === 'agent');
    if (hasAgent) {
      const runtime = await this.getRuntime(id);
      const workspaceId = runtime.workspace?.id;
      if (workspaceId) {
        await this.workspaceRepository.checkAndCompleteStep(workspaceId, 'connect-agent');
      }
    }
    return updated;
  }

  async findByName(workspaceId: string, name: string): Promise<dgraphResolversTypes.Runtime | undefined> {
    const res = await this.dgraphService.query<{ getWorkspace: { runtimes: dgraphResolversTypes.Runtime[] } }>(
      QUERY_RUNTIME_BY_NAME,
      { workspaceId, name },
    );
    return res.getWorkspace?.runtimes?.[0];
  }

  async linkMCPToolToRuntime(mcpToolId: string, runtimeId: string): Promise<dgraphResolversTypes.Runtime> {
    const res = await this.dgraphService.mutation<{
      updateRuntime: { runtime: dgraphResolversTypes.Runtime[] };
    }>(LINK_MCP_TOOL, {
      mcpToolId,
      runtimeId,
    });
    return res.updateRuntime.runtime[0];
  }

  async unlinkMCPToolFromRuntime(mcpToolId: string, runtimeId: string): Promise<dgraphResolversTypes.Runtime> {
    const res = await this.dgraphService.mutation<{
      updateRuntime: { runtime: dgraphResolversTypes.Runtime[] };
    }>(UNLINK_MCP_TOOL, {
      mcpToolId,
      runtimeId,
    });
    return res.updateRuntime.runtime[0];
  }

  observeCapabilities(runtimeId: string): Observable<dgraphResolversTypes.Runtime> {
    const query = createSubscriptionFromQuery(QUERY_RUNTIME_MCP_TOOLS);
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

    this.logger.info(
      `Calling tool ${tool.name} using global runtime ${globalRuntime.name} (${globalRuntime.id})`
    );

    // Arguments as JSON
    let args: Record<string, unknown>;
    try {
      args = JSON.parse(input);
    } catch {
      throw new Error(`Invalid input: ${input}`);
    }

    const message = new AgentCallMCPToolMessage({
      toolId,
      arguments: args,
      from: globalRuntime.id,
    });

    const response = await this.natsService.request(message);
    if (response instanceof AgentCallResponseMessage) {
      return {
        success: !response.data.result.isError,
        result: JSON.stringify(response.data.result.content, null, 2),
      };
    } else if (response instanceof NatsErrorMessage) {
      throw new Error(`Error calling tool: ${response.data.error}`);
    } else {
      throw new Error(`Invalid response: ${JSON.stringify(response)}`);
    }
  }
}
