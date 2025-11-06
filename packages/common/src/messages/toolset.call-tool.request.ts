import { NatsMessage, NatsRequest } from '../services/nats.message';

const type = 'call-tool';

export class ToolSetCallToolRequest extends NatsRequest<{
  workspaceId: string;
  from: string; // the identity of the runtime calling for this tool execution
  toolId: string;
  arguments: Record<string, unknown>;
}> {
  static type = type;
  type = type;
  validate(data: { workspaceId: string; from: string; toolId: string; arguments: Record<string, unknown> }): boolean {
    return data.workspaceId !== undefined && data.from !== undefined && data.toolId !== undefined && data.arguments !== undefined;
  }

  getSubject(): string {
    return `${this.data.workspaceId}.${type}.${this.data.toolId}.${this.data.from}`;
  }

  static subscribeToAll(toolId: string): string {
    return `*.${type}.${toolId}.*`;
  }

  static subscribeToOneRuntime(toolId: string, workspaceId: string, runtimeId: string): string {
    return `${workspaceId}.${type}.${toolId}.${runtimeId}`;
  }
}

NatsMessage.register(ToolSetCallToolRequest);
