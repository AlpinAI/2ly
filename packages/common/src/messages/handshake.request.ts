import { NatsMessage, NatsRequest } from '../services/nats.message';
const type = 'handshake';

export class HandshakeRequest extends NatsRequest<{
    key: string;
    nature?: 'runtime' | 'skill';
    name?: string;
    pid: string;
    hostIP: string;
    hostname: string;
    roots?: { name: string; uri: string }[];
}> {
    static type = type;
    type = type;
    validate(data: { key: string; nature?: string; name?: string; pid: string; hostIP: string; hostname: string; roots?: { name: string; uri: string }[] }): boolean {
        if (data.name !== undefined && !data.nature) {
            // if name is provided, nature must be provided
            return false;
        }
        if (data.nature !== undefined && data.nature !== 'runtime' && data.nature !== 'skill') {
            // nature must be either runtime or skill
            return false;
        }
        if (data.roots !== undefined) {
            // validate roots format
            return data.roots.every(root => typeof root.name === 'string' && typeof root.uri === 'string');
        }
        return data.key !== undefined && data.pid !== undefined && data.hostIP !== undefined && data.hostname !== undefined;
    }

    getSubject(): string {
        return `handshake`;
    }

    static subscribe(): string {
        return `handshake`;
    }
}

NatsMessage.register(HandshakeRequest);
