import { vi } from 'vitest';
import '../../mocks/urql.mock';
import '../../mocks/subscriptions-transport-ws.mock';

import {
    Client,
} from 'urql';

export class DgraphServiceMock {
    urqlClient = new Client({ url: '', exchanges: [] });
    start = vi.fn(async () => { });
    stop = vi.fn(async () => { });
    isConnected = vi.fn(() => true);
    initSchema = vi.fn(async () => { });
    dropAll = vi.fn(async () => ({ ok: true }));
    query = vi.fn(async (_q: unknown, _v: unknown) => ({}));
    mutation = vi.fn(async (_m: unknown, _v: unknown) => ({}));
    observe = vi.fn();
}