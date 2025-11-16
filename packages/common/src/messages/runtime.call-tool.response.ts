import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { NatsMessage, NatsResponse } from '../services/nats.message';

const type = 'agent-call-response';

export class RuntimeCallToolResponse extends NatsResponse<{
  result: CallToolResult;
  executedById: string;
}> {
  static type = type;
  type = type;
  validate(data: { result: CallToolResult; executedById: string }): boolean {
    return data.result !== undefined && data.executedById !== undefined;
  }
}

NatsMessage.register(RuntimeCallToolResponse);
