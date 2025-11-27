import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { NatsMessage, NatsResponse } from '../services/nats.message';

const type = 'agent-call-response';

export class RuntimeCallToolResponse extends NatsResponse<{
  result: CallToolResult;
  executedByIdOrAgent: string | 'AGENT';
}> {
  static type = type;
  type = type;
  validate(data: { result: CallToolResult; executedByIdOrAgent: string | 'AGENT' }): boolean {
    return data.result !== undefined && data.executedByIdOrAgent !== undefined;
  }
}

NatsMessage.register(RuntimeCallToolResponse);
