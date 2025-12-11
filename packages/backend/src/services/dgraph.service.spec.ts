import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Container } from 'inversify';

import '../../mocks/subscriptions-transport-ws.mock';
import '../../mocks/urql.mock';

import { LoggerService, LOG_LEVEL, LOG_LEVELS, MAIN_LOGGER_NAME, FORWARD_STDERR } from '../../../common/src/services/logger.service';
import { DGRAPH_URL, DGraphService } from './dgraph.service';

type AnyRecord = Record<string, unknown>;

describe('DGraphService', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const createService = async () => {
        const container = new Container();
        container.bind(MAIN_LOGGER_NAME).toConstantValue('test');
        container.bind(FORWARD_STDERR).toConstantValue(false);
        container.bind(LOG_LEVEL).toConstantValue('silent');
        container.bind(LOG_LEVELS).toConstantValue(undefined);
        container.bind(LoggerService).toSelf().inSingletonScope();
        container.bind(DGRAPH_URL).toConstantValue('dgraph:8080');
        container.bind(DGraphService).toSelf().inSingletonScope();
        const service = container.get(DGraphService);
        await service.start('test');
        return service;
    };

    it('throws on query error', async () => {
        const svc = await createService();
        // Simulate urql error from query
        ((svc as unknown as AnyRecord).urqlClient as unknown as AnyRecord).query = vi.fn(async () => ({ data: null, error: new Error('boom') }));
        await expect(svc.query<unknown, AnyRecord>('query', {} as AnyRecord)).rejects.toThrow('boom');
    });

    it('throws on mutation error', async () => {
        const svc = await createService();
        // Simulate urql error from mutation
        ((svc as unknown as AnyRecord).urqlClient as unknown as AnyRecord).mutation = vi.fn(async () => ({ data: null, error: new Error('bad') }));
        await expect(svc.mutation<unknown, AnyRecord>('mutation', {} as AnyRecord)).rejects.toThrow('bad');
    });

    it('observe errors when key missing', async () => {
        const svc = await createService();
        // Simulate a subscription that returns an object without the expected key
        ((svc as unknown as AnyRecord).urqlClient as unknown as AnyRecord).subscription = vi.fn(() => ({
            subscribe: (cb: (r: { data: unknown; error?: unknown }) => void) => {
                setTimeout(() => cb({ data: {} }), 0);
                return { unsubscribe: vi.fn() };
            },
        }));
        const obs = svc.observe<unknown>('subscription test', {} as AnyRecord, 'missing');
        const result = await new Promise<string>((resolve) => {
            const sub = obs.subscribe({ next: () => { }, error: () => { resolve('ok'); }, complete: () => { } });
            setTimeout(() => sub.unsubscribe(), 10);
        });
        expect(result).toBe('ok');
    });
});
