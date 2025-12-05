import { NatsMessage, NatsPublish } from '../services/nats.message';
import { dgraphResolversTypes } from '../graphql';

const type = 'list-tools';

/**
 * Represents a smart skill exposed as a single tool.
 * When a skill is in SMART mode, it exposes itself as one tool
 * with the skill's name and description.
 */
export interface SmartSkillTool {
  id: string;           // = skill.id (used for routing)
  name: string;         // = skill.name (tool name)
  description: string;  // = skill.description (tool description)
}

export class SkillListToolsPublish extends NatsPublish<{
  workspaceId: string;
  skillId: string;
  mcpTools: dgraphResolversTypes.McpTool[];
  smartSkillTool?: SmartSkillTool;  // For SMART mode skills
  description?: string;
}> {
  static type = type;
  type = type;
  validate(data: { workspaceId: string; skillId: string; mcpTools: dgraphResolversTypes.McpTool[]; smartSkillTool?: SmartSkillTool }): boolean {
    return data.workspaceId !== undefined && data.skillId !== undefined && (data.mcpTools !== undefined || data.smartSkillTool !== undefined);
  }

  getSubject(): string {
    return `${this.data.workspaceId}.${this.data.skillId}.${type}`;
  }

  static subscribeToSkill(workspaceId: string, skillId: string): string {
    return `${workspaceId}.${skillId}.${type}`;
  }
}

NatsMessage.register(SkillListToolsPublish);
