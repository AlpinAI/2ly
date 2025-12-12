import { injectable, inject } from 'inversify';
import { DGraphService } from '../../services/dgraph.service';
import { dgraphResolversTypes, EXECUTION_TARGET } from '@skilder-ai/common';
import {
  AddMcpServerDocument,
  UpdateMcpServerDocument,
  UpdateExecutionTargetDocument,
  DeleteMcpToolsDocument,
  DeleteMcpServerDocument,
  QueryMcpServerCapabilitiesDocument,
  QueryMcpServersDocument,
  QueryMcpServersByWorkspaceDocument,
  LinkRuntimeDocument,
  UnlinkRuntimeDocument,
  GetMcpServerDocument,
  GetMcpServerWithWorkspaceDocument,
  McpTransportType,
  ExecutionTarget,
} from '../../generated/dgraph';
import { WorkspaceRepository } from '../workspace/workspace.repository';

@injectable()
export class MCPServerRepository {
  constructor(
    @inject(DGraphService) private readonly dgraphService: DGraphService,
    @inject(WorkspaceRepository) private readonly workspaceRepository: WorkspaceRepository,
  ) {}

  async findAll(): Promise<dgraphResolversTypes.McpServer[]> {
    const res = await this.dgraphService.query(QueryMcpServersDocument, {});
    return res.queryMCPServer as dgraphResolversTypes.McpServer[];
  }

  async findByWorkspace(workspaceId: string): Promise<dgraphResolversTypes.McpServer[]> {
    const res = await this.dgraphService.query(QueryMcpServersByWorkspaceDocument, { workspaceId });
    return (res.queryMCPServer ?? []) as dgraphResolversTypes.McpServer[];
  }

  async findById(id: string): Promise<dgraphResolversTypes.McpServer | null> {
    const res = await this.dgraphService.query(GetMcpServerWithWorkspaceDocument, { id });
    return res.getMCPServer as dgraphResolversTypes.McpServer | null;
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
    const res = await this.dgraphService.mutation(AddMcpServerDocument, {
      name,
      description,
      repositoryUrl,
      transport: transport as McpTransportType,
      config,
      workspaceId,
      registryServerId,
      executionTarget: executionTarget as ExecutionTarget | null,
    });
    const created = res.addMCPServer!.mCPServer![0]! as dgraphResolversTypes.McpServer;
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
    const res = await this.dgraphService.mutation(UpdateMcpServerDocument, {
      id,
      name,
      description,
      repositoryUrl,
      transport: transport as McpTransportType,
      config,
      executionTarget: executionTarget as ExecutionTarget | null,
    });
    return res.updateMCPServer!.mCPServer![0]! as dgraphResolversTypes.McpServer;
  }

  async updateExecutionTarget(id: string, executionTarget: EXECUTION_TARGET): Promise<dgraphResolversTypes.McpServer> {
    const res = await this.dgraphService.mutation(UpdateExecutionTargetDocument, {
      id,
      executionTarget: executionTarget as ExecutionTarget,
    });
    return res.updateMCPServer!.mCPServer![0]! as dgraphResolversTypes.McpServer;
  }

  async linkRuntime(mcpServerId: string, runtimeId: string): Promise<dgraphResolversTypes.McpServer> {
    const res = await this.dgraphService.mutation(LinkRuntimeDocument, {
      mcpServerId,
      runtimeId,
    });
    return res.updateMCPServer!.mCPServer![0]! as dgraphResolversTypes.McpServer;
  }

  async unlinkRuntime(mcpServerId: string): Promise<dgraphResolversTypes.McpServer> {
    // get the currently linked runtime
    const mcpServer = await this.dgraphService.query(GetMcpServerDocument, {
      id: mcpServerId,
    });
    const currentRuntime = mcpServer.getMCPServer!.runtime;
    if (!currentRuntime) {
      // no runtime linked to MCP server, early return the MCP server
      return mcpServer.getMCPServer! as dgraphResolversTypes.McpServer;
    }

    const res = await this.dgraphService.mutation(UnlinkRuntimeDocument, {
      mcpServerId,
      runtimeId: currentRuntime.id,
    });
    return res.updateMCPServer!.mCPServer![0]! as dgraphResolversTypes.McpServer;
  }

  async delete(id: string): Promise<dgraphResolversTypes.McpServer> {
    // get all tools id to delete
    const tools = await this.getTools(id);
    const toolsIds = tools.tools?.map((tool) => tool.id) ?? [];
    // delete all tools linked to the MCP server
    await this.dgraphService.mutation(DeleteMcpToolsDocument, {
      ids: toolsIds,
    });
    // delete the MCP server
    const res = await this.dgraphService.mutation(DeleteMcpServerDocument, {
      id,
    });
    return res.deleteMCPServer!.mCPServer![0]! as dgraphResolversTypes.McpServer;
  }

  async getTools(id: string): Promise<dgraphResolversTypes.McpServer> {
    const response = await this.dgraphService.query(QueryMcpServerCapabilitiesDocument, { id });
    return response.getMCPServer! as dgraphResolversTypes.McpServer;
  }
}
