import { NatsMessage, NatsPublish } from '../services/nats.message';
import { MCPTool } from '../types/mcp-tool';

const type = 'discovered-tools';

export class RuntimeDiscoveredToolsPublish extends NatsPublish<{ 
  workspaceId: string;
  mcpServerId: string;
  tools: MCPTool[];
}> {
  static type = type;
  type = type;
  validate(data: { workspaceId: string; mcpServerId: string; tools: MCPTool[] }): boolean {
    return data.workspaceId !== undefined && data.mcpServerId !== undefined && data.tools !== undefined;
  }

  getSubject(): string {
    return `${this.data.workspaceId}.${type}`;
  }

  static subscribeToAll() {
    return `*.${type}`;
  }
}

NatsMessage.register(RuntimeDiscoveredToolsPublish);
