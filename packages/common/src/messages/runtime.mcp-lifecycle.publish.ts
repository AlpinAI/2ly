import { NatsMessage, NatsPublish } from '../services/nats.message';
import { MCPTool } from '../types/mcp-tool';

const type = 'mcp-lifecycle';

export type MCPLifecycleStage = 'INSTALLING' | 'STARTING' | 'LISTING_TOOLS' | 'COMPLETED' | 'FAILED';

export interface MCPLifecycleError {
  code: string;
  message: string;
  details?: string;
}

export interface MCPLifecycleEventData {
  serverId: string;
  testSessionId: string;
  stage: MCPLifecycleStage;
  message: string;
  timestamp: string;
  tools?: MCPTool[];
  error?: MCPLifecycleError;
}

export class RuntimeMCPLifecyclePublish extends NatsPublish<MCPLifecycleEventData> {
  static type = type;
  type = type;

  validate(data: MCPLifecycleEventData): boolean {
    return (
      data.serverId !== undefined &&
      data.testSessionId !== undefined &&
      data.stage !== undefined &&
      data.message !== undefined &&
      data.timestamp !== undefined
    );
  }

  getSubject(): string {
    return `runtime.mcp.lifecycle.${this.data.serverId}.${this.data.testSessionId}`;
  }

  static subscribeToTestSession(testSessionId: string) {
    return `runtime.mcp.lifecycle.*.${testSessionId}`;
  }

  static subscribeToAll() {
    return `runtime.mcp.lifecycle.*.*`;
  }
}

NatsMessage.register(RuntimeMCPLifecyclePublish);
