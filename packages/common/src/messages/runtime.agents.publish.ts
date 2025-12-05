import { NatsMessage, NatsPublish } from '../services/nats.message';
import type { ProviderConfig } from '../services/ai/ai-provider.types';

const type = 'agents';

export interface RuntimeAgent {
  id: string;
  name: string;
  systemPrompt: string;
  model: string; // "provider/model-name" format
  temperature: number;
  maxTokens: number;
  providerConfig: ProviderConfig; // Decrypted apiKey + baseUrl
  workspaceId: string; // Agents are always workspace-scoped
}

export class RuntimeAgentsPublish extends NatsPublish<{
  workspaceId: string | null;
  runtimeId: string;
  agents: RuntimeAgent[];
}> {
  static type = type;
  type = type;

  validate(data: {
    workspaceId: string | null;
    runtimeId: string;
    agents: RuntimeAgent[];
  }): boolean {
    return (
      data.workspaceId !== undefined &&
      data.runtimeId !== undefined &&
      data.agents !== undefined
    );
  }

  getSubject(): string {
    return this.data.workspaceId
      ? `${this.data.workspaceId}.${this.data.runtimeId}.${type}`
      : `${this.data.runtimeId}.${type}`;
  }

  static subscribeToRuntime(
    workspaceId: string | null,
    runtimeId: string
  ): string {
    return workspaceId
      ? `${workspaceId}.${runtimeId}.${type}`
      : `${runtimeId}.${type}`;
  }
}

NatsMessage.register(RuntimeAgentsPublish);
