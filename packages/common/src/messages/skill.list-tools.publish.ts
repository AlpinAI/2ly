import { NatsMessage, NatsPublish } from '../services/nats.message';
import { dgraphResolversTypes } from '../graphql';

const type = 'list-tools';

export class SkillListToolsPublish extends NatsPublish<{
  workspaceId: string;
  skillId: string;
  mcpTools: dgraphResolversTypes.McpTool[];
}> {
  static type = type;
  type = type;
  validate(data: { workspaceId: string; skillId: string; mcpTools: dgraphResolversTypes.McpTool[] }): boolean {
    return data.workspaceId !== undefined && data.skillId !== undefined && data.mcpTools !== undefined;
  }

  getSubject(): string {
    return `${this.data.workspaceId}.${this.data.skillId}.${type}`;
  }

  static subscribeToSkill(workspaceId: string, skillId: string): string {
    return `${workspaceId}.${skillId}.${type}`;
  }
}

NatsMessage.register(SkillListToolsPublish);
