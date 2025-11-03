import { NatsMessage, NatsRequest } from '../services/nats.message';
import { TOOLSETS_SUBJECT } from './constants';

const type = 'request-toolset-capabilities';

export class RequestToolSetCapabilitiesMessage extends NatsRequest<{
  toolSetName: string;
}> {
  static type = type;
  type = type;

  validate(data: { toolSetName: string }): boolean {
    return data.toolSetName !== undefined && typeof data.toolSetName === 'string';
  }

  getSubject(): string {
    return `${TOOLSETS_SUBJECT}.${type}.${this.data.toolSetName}`;
  }

  static subscribe(): string {
    return `${TOOLSETS_SUBJECT}.${type}.*`;
  }
}

NatsMessage.register(RequestToolSetCapabilitiesMessage);
