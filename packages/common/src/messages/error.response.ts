import { NatsMessage, NatsResponse } from '../services/nats.message';

const type = 'error';

export class ErrorResponse extends NatsResponse<{ error: string }> {
  static type = type;
  type = type;
  validate(data: { error: string }): boolean {
    return data.error !== undefined;
  }
}

NatsMessage.register(ErrorResponse);
