import { NatsMessage, NatsPublish } from '../services/nats.message';
import type { ProviderConfig } from '../services/ai/ai-provider.types';

const type = 'smart-skills';

export interface RuntimeSmartSkill {
  id: string;
  name: string;
  systemPrompt: string;
  model: string; // "provider/model-name" format
  temperature: number;
  maxTokens: number;
  providerConfig: ProviderConfig; // Decrypted apiKey + baseUrl
  workspaceId: string; // Skills are always workspace-scoped
}

export class RuntimeSmartSkillsPublish extends NatsPublish<{
  workspaceId: string | null;
  runtimeId: string;
  smartSkills: RuntimeSmartSkill[];
}> {
  static type = type;
  type = type;

  validate(data: {
    workspaceId: string | null;
    runtimeId: string;
    smartSkills: RuntimeSmartSkill[];
  }): boolean {
    return (
      data.workspaceId !== undefined &&
      data.runtimeId !== undefined &&
      data.smartSkills !== undefined
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

NatsMessage.register(RuntimeSmartSkillsPublish);
