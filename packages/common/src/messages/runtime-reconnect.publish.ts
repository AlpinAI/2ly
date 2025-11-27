import { NatsMessage, NatsPublish } from '../services/nats.message';

const type = 'reconnect-runtimes';

export class RuntimeReconnectPublish extends NatsPublish<{
  reason?: string;
}> {
  static type = type;
  type = type;
  validate(): boolean {
    return true; // No required fields
  }

  getSubject(): string {
    return `${type}`;
  }

  static subscribe(): string {
    return `${type}`;
  }
}

NatsMessage.register(RuntimeReconnectPublish);
