import { injectable, inject } from 'inversify';
import { DGraphService } from '../services/dgraph.service';
import { dgraphResolversTypes, EXECUTION_TARGET } from '@skilder-ai/common';
import {
  ADD_MCPSERVER,
  UPDATE_MCPSERVER,
  UPDATE_MCPSERVER_EXECUTION_TARGET,
  DELETE_MCP_TOOLS,
  DELETE_MCPSERVER,
  QUERY_MCP_SERVER_CAPABILITIES,
  QUERY_MCPSERVERS,
  QUERY_MCPSERVERS_BY_WORKSPACE,
  LINK_RUNTIME,
  UNLINK_RUNTIME,
  GET_MCPSERVER,
  GET_MCPSERVER_WITH_WORKSPACE,
} from './mcp-server.operations';
import { WorkspaceRepository } from './workspace.repository';

@injectable()
export class MCPServerRepository {
  constructor(
    @inject(DGraphService) private readonly dgraphService: DGraphService,
    @inject(WorkspaceRepository) private readonly workspaceRepository: WorkspaceRepository,
  ) {}

  async findAll(): Promise<dgraphResolversTypes.McpServer[]> {
    const res = await this.dgraphService.query<{
      queryMCPServer: dgraphResolversTypes.McpServer[];
    }>(QUERY_MCPSERVERS, {});
    return res.queryMCPServer;
  }

  async findByWorkspace(workspaceId: string): Promise<dgraphResolversTypes.McpServer[]> {
    const res = await this.dgraphService.query<{
      queryMCPServer: dgraphResolversTypes.McpServer[];
    }>(QUERY_MCPSERVERS_BY_WORKSPACE, { workspaceId });
    return res.queryMCPServer ?? [];
  }

  async findById(id: string): Promise<dgraphResolversTypes.McpServer | null> {
    const res = await this.dgraphService.query<{
      getMCPServer: dgraphResolversTypes.McpServer | null;
    }>(GET_MCPSERVER_WITH_WORKSPACE, { id });
    return res.getMCPServer;
  }

  async create(
    name: string,
    description: string,
    repositoryUrl: string,
    transport: 'STREAM' | 'STDIO' | 'SSE',
    config: string,
    executionTarget: EXECUTION_TARGET | null,
    workspaceId: string,
    registryServerId: string,
  ): Promise<dgraphResolversTypes.McpServer> {
    const res = await this.dgraphService.mutation<{
      addMCPServer: { mCPServer: dgraphResolversTypes.McpServer[] };
    }>(ADD_MCPSERVER, {
      name,
      description,
      repositoryUrl,
      transport,
      config,
      workspaceId,
      registryServerId,
      executionTarget,
    });
    const created = res.addMCPServer.mCPServer[0];
    await this.workspaceRepository.checkAndCompleteStep(workspaceId, 'install-mcp-server');
    return created;
  }

  async update(
    id: string,
    name: string,
    description: string,
    repositoryUrl: string,
    transport: 'STREAM' | 'STDIO' | 'SSE',
    config: string,
    executionTarget: EXECUTION_TARGET | null,
  ): Promise<dgraphResolversTypes.McpServer> {
    const res = await this.dgraphService.mutation<{
      updateMCPServer: { mCPServer: dgraphResolversTypes.McpServer[] };
    }>(UPDATE_MCPSERVER, {
      id,
      name,
      description,
      repositoryUrl,
      transport,
      config,
      executionTarget,
    });
    return res.updateMCPServer.mCPServer[0];
  }

  async updateExecutionTarget(id: string, executionTarget: EXECUTION_TARGET): Promise<dgraphResolversTypes.McpServer> {
    const res = await this.dgraphService.mutation<{
      updateMCPServer: { mCPServer: dgraphResolversTypes.McpServer[] };
    }>(UPDATE_MCPSERVER_EXECUTION_TARGET, {
      id,
      executionTarget,
    });
    return res.updateMCPServer.mCPServer[0];
  }

  async linkRuntime(mcpServerId: string, runtimeId: string): Promise<dgraphResolversTypes.McpServer> {
    const res = await this.dgraphService.mutation<{
      updateMCPServer: { mCPServer: dgraphResolversTypes.McpServer[] };
    }>(LINK_RUNTIME, {
      mcpServerId,
      runtimeId,
    });
    return res.updateMCPServer.mCPServer[0];
  }

  async unlinkRuntime(mcpServerId: string): Promise<dgraphResolversTypes.McpServer> {
    // get the currently linked runtime
    const mcpServer = await this.dgraphService.query<{
      getMCPServer: dgraphResolversTypes.McpServer;
    }>(GET_MCPSERVER, {
      id: mcpServerId,
    });
    const currentRuntime = mcpServer.getMCPServer.runtime;
    if (!currentRuntime) {
      // no runtime linked to MCP server, early return the MCP server
      return mcpServer.getMCPServer;
    }

    const res = await this.dgraphService.mutation<{
      updateMCPServer: { mCPServer: dgraphResolversTypes.McpServer[] };
    }>(UNLINK_RUNTIME, {
      mcpServerId,
      runtimeId: currentRuntime.id,
    });
    return res.updateMCPServer.mCPServer[0];
  }

  async delete(id: string): Promise<dgraphResolversTypes.McpServer> {
    // get all tools id to delete
    const tools = await this.getTools(id);
    const toolsIds = tools.tools?.map((tool) => tool.id) ?? [];
    // delete all tools linked to the MCP server
    await this.dgraphService.mutation(DELETE_MCP_TOOLS, {
      ids: toolsIds,
    });
    // delete the MCP server
    const res = await this.dgraphService.mutation<{
      deleteMCPServer: { mCPServer: dgraphResolversTypes.McpServer[] };
    }>(DELETE_MCPSERVER, {
      id,
    });
    return res.deleteMCPServer.mCPServer[0];
  }

  async getTools(id: string): Promise<dgraphResolversTypes.McpServer> {
    const response = await this.dgraphService.query(QUERY_MCP_SERVER_CAPABILITIES('query'), { id });
    return (response as { getMCPServer: dgraphResolversTypes.McpServer }).getMCPServer;
  }
}
