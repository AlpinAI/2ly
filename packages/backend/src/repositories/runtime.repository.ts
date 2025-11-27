import { injectable, inject } from 'inversify';
import { DGraphService } from '../services/dgraph.service';
import { dgraphResolversTypes, NatsService, LoggerService, ToolSetCallToolRequest, RuntimeCallToolResponse, ErrorResponse, apolloResolversTypes } from '@2ly/common';
import { ConnectionMetadata } from '../types';
import {
  QUERY_MCPSERVER_WITH_TOOL,
  SET_ROOTS,
  DELETE_RUNTIME,
  UPDATE_RUNTIME,
  ADD_SYSTEM_RUNTIME,
  ADD_WORKSPACE_RUNTIME,
  ADD_MCPSERVER_TO_RUNTIME,
  GET_RUNTIME,
  QUERY_ACTIVE_RUNTIMES,
  QUERY_SYSTEM_RUNTIME_BY_NAME,
  QUERY_WORKSPACE_RUNTIME_BY_NAME,
  SET_RUNTIME_INACTIVE,
  SET_RUNTIME_ACTIVE,
  UPDATE_MCP_TOOL,
  ADD_MCP_TOOL,
  GET_RUNTIME_EDGE_MCP_SERVERS,
  GET_RUNTIME_ALL_TOOLS,
  UPDATE_RUNTIME_LAST_SEEN,
} from './runtime.operations';
import { map, Observable } from 'rxjs';
import { createSubscriptionFromQuery, escapeValue } from '../helpers';
import { MCPToolRepository } from './mcp-tool.repository';
import pino from 'pino';
import { IdentityRepository } from './identity.repository';

@injectable()
export class RuntimeRepository {
  private logger: pino.Logger;
  constructor(
    @inject(DGraphService) private readonly dgraphService: DGraphService,
    @inject(MCPToolRepository) private readonly mcpToolRepository: MCPToolRepository,
    @inject(LoggerService) private readonly loggerService: LoggerService,
    @inject(NatsService) private readonly natsService: NatsService,
    @inject(IdentityRepository) private readonly identityRepository: IdentityRepository,
  ) {
    this.logger = this.loggerService.getLogger('runtime-repository');
  }

  async create(
    connectedTo: 'workspace' | 'system',
    relatedId: string,
    name: string,
    description: string,
    status: 'ACTIVE' | 'INACTIVE',
    type: 'EDGE' | 'MCP',
  ): Promise<dgraphResolversTypes.Runtime> {
    const now = new Date().toISOString();

    // 1. Create the runtime
    let runtime: dgraphResolversTypes.Runtime | undefined;
    if (connectedTo === 'system') {
      const res = await this.dgraphService.mutation<{
        addRuntime: { runtime: dgraphResolversTypes.Runtime[] };
      }>(ADD_SYSTEM_RUNTIME, {
        name,
        description,
        status,
        type,
        createdAt: now,
        lastSeenAt: now,
        systemId: relatedId,
      });
      runtime = res.addRuntime.runtime[0];
    } else if (connectedTo === 'workspace') {
      const res = await this.dgraphService.mutation<{
        addRuntime: { runtime: dgraphResolversTypes.Runtime[] };
      }>(ADD_WORKSPACE_RUNTIME, {
        name,
        description,
        status,
        type,
        createdAt: now,
        lastSeenAt: now,
        workspaceId: relatedId,
      });

      runtime = res.addRuntime.runtime[0];
    } else {
      throw new Error(`Invalid connectedTo: ${connectedTo}`);
    }

    if (!runtime) {
      throw new Error(`Failed to create runtime for ${connectedTo} ${relatedId} ${name}`);
    }

    // 2. Create the toolset key
    await this.identityRepository.createKey('runtime', runtime.id, `${name} Runtime Key`, '');

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

  async findByName(connectedTo: 'workspace' | 'system', relatedId: string, name: string): Promise<dgraphResolversTypes.Runtime | undefined> {
    if (connectedTo === 'workspace') {
      const res = await this.dgraphService.query<{ getWorkspace: { runtimes: dgraphResolversTypes.Runtime[] } }>(
        QUERY_WORKSPACE_RUNTIME_BY_NAME,
        { workspaceId: relatedId, name },
      );
      return res.getWorkspace?.runtimes?.[0];
    } else if (connectedTo === 'system') {
      const res = await this.dgraphService.query<{ getSystem: { runtimes: dgraphResolversTypes.Runtime[] } }>(
        QUERY_SYSTEM_RUNTIME_BY_NAME,
        { systemId: relatedId, name },
      );
      return res.getSystem?.runtimes?.[0];
    }
    throw new Error(`Invalid connectedTo: ${connectedTo}`);
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
   * Can only call tools that run on a specific runtime (EDGE mode);
   */
  async callMCPTool(toolId: string, input: string): Promise<apolloResolversTypes.CallToolResult> {
    // Get the tool with its workspace and MCP server to determine routing
    const tool = await this.mcpToolRepository.getToolWithWorkspace(toolId);

    if (!tool) {
      throw new Error(`Tool ${toolId} not found`);
    }

    if (!tool.workspace) {
      throw new Error(`Tool ${toolId} has no workspace`);
    }

    // Validate runtime selection for AGENT tools
    const runOn = tool.mcpServer?.runOn || 'AGENT';
    if (runOn === 'AGENT') {
      throw new Error(`Testing call tool is currently not supported for tools that run on AGENT mode.`);
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
}
