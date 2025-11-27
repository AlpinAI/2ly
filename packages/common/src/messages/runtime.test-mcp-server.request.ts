import { NatsMessage, NatsRequest } from '../services/nats.message';

const type = 'test-mcp-server';

export interface TestMCPServerRequestData {
  testSessionId: string;
  name: string;
  repositoryUrl: string;
  transport: 'STDIO' | 'SSE' | 'STREAM';
  config: string;
  workspaceId: string;
}

export class RuntimeTestMCPServerRequest extends NatsRequest<TestMCPServerRequestData> {
  static type = type;
  type = type;

  validate(data: TestMCPServerRequestData): boolean {
    return (
      data.testSessionId !== undefined &&
      data.name !== undefined &&
      data.repositoryUrl !== undefined &&
      data.transport !== undefined &&
      data.config !== undefined &&
      data.workspaceId !== undefined
    );
  }

  getSubject(): string {
    // Send to a specific runtime (global runtime) for the workspace
    return `runtime.test-mcp-server.${this.data.workspaceId}`;
  }

  static subscribeToWorkspace(workspaceId: string) {
    return `runtime.test-mcp-server.${workspaceId}`;
  }
}

NatsMessage.register(RuntimeTestMCPServerRequest);
