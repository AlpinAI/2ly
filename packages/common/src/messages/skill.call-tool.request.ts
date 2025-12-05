import { NatsMessage, NatsRequest } from '../services/nats.message';

const type = 'call-tool';

/**
 * Request data for calling an MCP tool
 */
export interface MCPToolCallData {
  type?: 'mcp-tool';  // Optional for backwards compatibility
  workspaceId: string;
  isTest?: boolean;
  from?: string; // the identity of the skill calling for this tool execution
  toolId: string;
  arguments: Record<string, unknown>;
}

/**
 * Request data for calling a smart skill
 */
export interface SmartSkillCallData {
  type: 'smart-skill';
  workspaceId: string;
  isTest?: boolean;
  from?: string; // the identity of the skill calling for this tool execution
  skillId: string;
  arguments: Record<string, unknown>;
}

/**
 * Union type for tool call request data
 */
export type SkillCallToolRequestData = MCPToolCallData | SmartSkillCallData;

/**
 * Type guard for smart skill call data
 */
export function isSmartSkillCall(data: SkillCallToolRequestData): data is SmartSkillCallData {
  return data.type === 'smart-skill';
}

/**
 * Type guard for MCP tool call data
 */
export function isMCPToolCall(data: SkillCallToolRequestData): data is MCPToolCallData {
  return data.type === 'mcp-tool' || data.type === undefined;
}

export class SkillCallToolRequest extends NatsRequest<SkillCallToolRequestData> {
  static type = type;
  type = type;

  validate(data: SkillCallToolRequestData): boolean {
    data.isTest ??= false;

    if (data.workspaceId === undefined || data.arguments === undefined) {
      return false;
    }

    if (isSmartSkillCall(data)) {
      return data.skillId !== undefined;
    }

    if (isMCPToolCall(data)) {
      return data.toolId !== undefined;
    }

    return false;
  }

  getSubject(): string {
    const id = isSmartSkillCall(this.data)
      ? this.data.skillId
      : (this.data as MCPToolCallData).toolId;
    return `${this.data.workspaceId}.${type}.${id}.${this.data.from}`;
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

  /**
   * Subscribe to a specific skill (for smart skill routing)
   */
  static subscribeToSkill(skillId: string): string {
    return `*.${type}.${skillId}.*`;
  }

  /**
   * Subscribe to a specific skill on one runtime
   */
  static subscribeToSkillOnOneRuntime(skillId: string, workspaceId: string, runtimeId: string): string {
    return `${workspaceId}.${type}.${skillId}.${runtimeId}`;
  }
}

NatsMessage.register(SkillCallToolRequest);
