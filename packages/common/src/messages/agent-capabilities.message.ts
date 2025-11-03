import { NatsMessage, NatsPublish } from '../services/nats.message';
import { dgraphResolversTypes } from '../graphql';
import { TOOLSETS_SUBJECT } from './constants';

const type = 'agent-capabilities';

export class AgentCapabilitiesMessage extends NatsPublish<{
  name: string;
  capabilities: dgraphResolversTypes.McpTool[];
}> {
  static type = type;
  type = type;
  validate(data: { name: string; capabilities: dgraphResolversTypes.McpTool[] }): boolean {
    return data.name !== undefined && data.capabilities !== undefined;
  }

  getSubject(): string {
    return `${TOOLSETS_SUBJECT}.${this.data.name}`;
  }

  static subscribeToName(name: string): string {
    return `${TOOLSETS_SUBJECT}.${name}`;
  }
}

NatsMessage.register(AgentCapabilitiesMessage);
