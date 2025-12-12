import { injectable, inject } from 'inversify';
import { DGraphService } from '../../services/dgraph.service';
import { dgraphResolversTypes } from '@skilder-ai/common';
import { GetMcpToolWithWorkspaceDocument, SetMcpToolStatusDocument, ActiveStatus } from '../../generated/dgraph';

@injectable()
export class MCPToolRepository {
  constructor(@inject(DGraphService) private readonly dgraphService: DGraphService) {}

  async getToolWithWorkspace(toolId: string): Promise<dgraphResolversTypes.McpTool> {
    const res = await this.dgraphService.query(GetMcpToolWithWorkspaceDocument, { toolId });
    return res.getMCPTool! as dgraphResolversTypes.McpTool;
  }

  async setStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<dgraphResolversTypes.McpTool> {
    const res = await this.dgraphService.mutation(SetMcpToolStatusDocument, {
      mcpToolId: id,
      status: status as ActiveStatus,
    });
    return res.updateMCPTool!.mCPTool![0]! as dgraphResolversTypes.McpTool;
  }
}
