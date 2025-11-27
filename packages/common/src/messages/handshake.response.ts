import { NatsMessage, NatsResponse } from '../services/nats.message';

const type = 'handshake-response';

export class HandshakeResponse extends NatsResponse<{
  workspaceId: string | null;
  nature: 'toolset' | 'runtime';
  id: string;
  name: string;
}> {
  static type = type;
  type = type;
  validate(data: { workspaceId: string | null; nature: 'toolset' | 'runtime'; id: string; name: string }): boolean {
    return data.workspaceId !== undefined && data.nature !== undefined && data.id !== undefined && data.name !== undefined;
  }
}

NatsMessage.register(HandshakeResponse);
