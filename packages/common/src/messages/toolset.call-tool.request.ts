import { NatsMessage, NatsRequest } from '../services/nats.message';

const type = 'call-tool';

export class ToolSetCallToolRequest extends NatsRequest<{
  workspaceId: string;
  isTest?: boolean;
  from?: string; // the identity of the toolset calling for this tool execution
  toolId: string;
  arguments: Record<string, unknown>;
}> {
  static type = type;
  type = type;
  validate(data: { workspaceId: string; isTest?: boolean; from?: string; toolId: string; arguments: Record<string, unknown> }): boolean {
    data.isTest ??= false;
    return data.workspaceId !== undefined && data.toolId !== undefined && data.arguments !== undefined;
  }

  getSubject(): string {
    return `${this.data.workspaceId}.${type}.${this.data.toolId}.${this.data.from}`;
  }

  static subscribeToAll(): string {
    return `*.${type}.*.*`;
  }

  static subscribeToTool(toolId: string): string {
    return `*.${type}.${toolId}.*`;
  }

  static subscribeToToolOnOneRuntime(toolId: string, workspaceId: string, runtimeId: string): string {
    return `${workspaceId}.${type}.${toolId}.${runtimeId}`;
  }
}

NatsMessage.register(ToolSetCallToolRequest);
