import { NatsMessage, NatsPublish } from '../services/nats.message';
import { dgraphResolversTypes } from '../graphql';

const type = 'mcp-servers';

export class RuntimeMCPServersPublish extends NatsPublish<{
  workspaceId: string | null;
  runtimeId: string;
  roots: { name: string; uri: string }[];
  mcpServers: dgraphResolversTypes.McpServer[];
}> {
  static type = type;
  type = type;
  validate(data: { workspaceId: string | null; runtimeId: string; roots: { name: string; uri: string }[]; mcpServers: dgraphResolversTypes.McpServer[] }): boolean {
    return data.workspaceId !== undefined && data.runtimeId !== undefined && data.mcpServers !== undefined && data.roots !== undefined;
  }

  getSubject(): string {
    return this.data.workspaceId ? `${this.data.workspaceId}.${this.data.runtimeId}.${type}` : `${this.data.runtimeId}.${type}`;
  }

  static subscribeToRuntime(workspaceId: string | null, runtimeId: string): string {
    return workspaceId ? `${workspaceId}.${runtimeId}.${type}` : `${runtimeId}.${type}`;
  }
}

NatsMessage.register(RuntimeMCPServersPublish);
