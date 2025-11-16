import { NatsMessage, NatsResponse } from '../services/nats.message';

const type = 'ack';

/**
 * Generic Acknoledge Message to send back to a request
 */
export class AckResponse extends NatsResponse<{ metadata?: Record<string, unknown> }> {
  static type = type;
  type = type;
  validate(data: { metadata?: Record<string, string> }): boolean {
    return typeof data.metadata === 'object' || data.metadata === undefined;
  }
}

NatsMessage.register(AckResponse);
