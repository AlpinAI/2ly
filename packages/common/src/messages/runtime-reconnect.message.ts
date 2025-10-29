import { NatsMessage, NatsPublish } from '../services/nats.message';

const type = 'reconnect-runtimes';

export class RuntimeReconnectMessage extends NatsPublish<{
  reason?: string;
}> {
  static type = type;
  type = type;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validate(data: { reason?: string }): boolean {
    return true; // No required fields
  }

  getSubject(): string {
    return `${type}`;
  }

  static subscribe(): string {
    return `${type}`;
  }
}

NatsMessage.register(RuntimeReconnectMessage);
