import { injectable, inject } from 'inversify';
import { DGraphService } from '../../services/dgraph.service';
import { dgraphResolversTypes } from '@skilder-ai/common';
import { GET_MCP_TOOL_WITH_WORKSPACE, SET_MCP_TOOL_STATUS } from './mcp-tool.operations';

@injectable()
export class MCPToolRepository {
  constructor(@inject(DGraphService) private readonly dgraphService: DGraphService) { }

  async getToolWithWorkspace(toolId: string): Promise<dgraphResolversTypes.McpTool> {
    const res = await this.dgraphService.query<{
      getMCPTool: dgraphResolversTypes.McpTool;
    }>(GET_MCP_TOOL_WITH_WORKSPACE, {
      toolId,
    });
    return res.getMCPTool;
  }

  async setStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<dgraphResolversTypes.McpTool> {
    const res = await this.dgraphService.mutation<{
      updateMCPTool: { mCPTool: dgraphResolversTypes.McpTool[] };
    }>(SET_MCP_TOOL_STATUS, {
      mcpToolId: id,
      status,
    });
    return res.updateMCPTool.mCPTool[0];
  }
}
