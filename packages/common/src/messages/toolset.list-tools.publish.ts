import { NatsMessage, NatsPublish } from '../services/nats.message';
import { dgraphResolversTypes } from '../graphql';

const type = 'list-tools';

export class ToolsetListToolsPublish extends NatsPublish<{
  workspaceId: string;
  toolsetId: string;
  mcpTools: dgraphResolversTypes.McpTool[];
}> {
  static type = type;
  type = type;
  validate(data: { workspaceId: string; toolsetId: string; mcpTools: dgraphResolversTypes.McpTool[] }): boolean {
    return data.workspaceId !== undefined && data.toolsetId !== undefined && data.mcpTools !== undefined;
  }

  getSubject(): string {
    return `${this.data.workspaceId}.${this.data.toolsetId}.${type}`;
  }

  static subscribeToToolSet(workspaceId: string, toolsetId: string): string {
    return `${workspaceId}.${toolsetId}.${type}`;
  }
}

NatsMessage.register(ToolsetListToolsPublish);
