/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi } from 'vitest';
import { RuntimeService } from './runtime.service';
import { ControllableAsyncIterator } from '../../../common/src/test/utils';
import { NatsServiceMock } from '@2ly/common/test/vitest';
import {
    RuntimeDiscoveredToolsPublish,
    HandshakeRequest,
    ErrorResponse,
    type dgraphResolversTypes,
    NatsMessage,
} from '@2ly/common';

// Minimal fake repositories and runtime instance
interface FakeMCPServerRepository {
    getTools: (mcpServerId: string) => Promise<{ tools: { id: string; name: string }[] } | null>;
}
interface FakeRuntimeRepository {
    findActive: () => Promise<{ id: string }[]>;
    create: (name: string, _desc: string, status: string, workspaceId: string, type: dgraphResolversTypes.RuntimeType) => Promise<{ id: string }>
    setActive: (id: string, processId: string, hostIP: string, hostname: string) => Promise<{ id: string }>;
    setInactive: (id: string) => Promise<{ id: string }>;
    upserTool: (mcpServerId: string, name: string, description: string, inputSchema: string, annotations: string) => Promise<void>;
    findByName: (workspaceId: string, name: string) => Promise<dgraphResolversTypes.Runtime | null>;
    setRoots: (runtimeId: string, roots: { name: string; uri: string }[]) => Promise<void>;
    getRuntime?: (id: string) => Promise<dgraphResolversTypes.Runtime>;
    observeRoots?: (id: string) => unknown;
    observeMCPServersOnEdge?: (id: string) => unknown;
    observeMCPServersOnAgent?: (id: string) => unknown;
    observeMCPServersOnGlobal?: (workspaceId: string) => unknown;
    observeCapabilities?: (id: string) => unknown;
}
interface FakeWorkspaceRepository {
    findById: (id: string) => Promise<{ id: string } | null>;
    setGlobalRuntime: (id: string) => Promise<void>;
    setDefaultTestingRuntime: (id: string) => Promise<void>;
}
interface FakeSystemRepository {
    getDefaultWorkspace: () => Promise<{ id: string } | null>;
}

class FakeRuntimeInstance {
    constructor(public readonly instance: dgraphResolversTypes.Runtime) { }
    heartbeat = vi.fn((_p: string, _ip: string, _host: string) => { });
    stop = vi.fn(async () => { });
    onHealthyMessage = vi.fn(() => { });
}

function createService(deps?: Partial<{
    mcp: Partial<FakeMCPServerRepository>;
    runtime: Partial<FakeRuntimeRepository>;
    workspace: Partial<FakeWorkspaceRepository>;
    system: Partial<FakeSystemRepository>;
}>) {
    const iterator = new ControllableAsyncIterator<unknown>();
    const nats = new NatsServiceMock(iterator);
    const dgraph = { start: vi.fn(async () => { }), initSchema: vi.fn(async () => { }), stop: vi.fn(async () => { }), isConnected: vi.fn(() => true), mutation: vi.fn(async () => ({})) } as unknown as import('./dgraph.service').DGraphService;

    const runtimeRepo: FakeRuntimeRepository = {
        findActive: vi.fn(async () => []),
        create: vi.fn(async (name, _d, status, workspaceId, _c) => ({ id: `${workspaceId}:${name}:${status}` })),
        setActive: vi.fn(async (id) => ({ id })),
        setInactive: vi.fn(async (id) => ({ id })),
        upserTool: vi.fn(async () => { }),
        findByName: vi.fn(async () => null),
        setRoots: vi.fn(async () => { }),
    };
    const mcpRepo: FakeMCPServerRepository = {
        getTools: vi.fn(async () => ({ tools: [] })),
    };
    const workspaceRepo: FakeWorkspaceRepository = {
        findById: vi.fn(async () => ({ id: 'ws1' })),
        setGlobalRuntime: vi.fn(async () => { }),
        setDefaultTestingRuntime: vi.fn(async () => { }),
    };
    const systemRepo: FakeSystemRepository = {
        getDefaultWorkspace: vi.fn(async () => ({ id: 'ws-default' })),
    };

    Object.assign(runtimeRepo, deps?.runtime);
    Object.assign(mcpRepo, deps?.mcp);
    Object.assign(workspaceRepo, deps?.workspace);
    Object.assign(systemRepo, deps?.system);

    const factory = vi.fn((inst: dgraphResolversTypes.Runtime) => new FakeRuntimeInstance(inst) as unknown as import('./runtime.instance').RuntimeInstance);

    const logger = { getLogger: () => ({ info: vi.fn(), error: vi.fn(), debug: vi.fn() }) } as unknown as import('@2ly/common').LoggerService;

    const tokenService = { validateMasterKey: vi.fn(), generateNatsJwt: vi.fn(), generateAccessToken: vi.fn() } as unknown as import('./token.service').TokenService;

    const service = new RuntimeService(
        logger,
        dgraph,
        nats as unknown as import('@2ly/common').NatsService,
        factory as unknown as import('./runtime.instance').RuntimeInstanceFactory,
        mcpRepo as unknown as import('../repositories').MCPServerRepository,
        runtimeRepo as unknown as import('../repositories').RuntimeRepository,
        workspaceRepo as unknown as import('../repositories').WorkspaceRepository,
        systemRepo as unknown as import('../repositories').SystemRepository,
        tokenService,
    );
    return { service, iterator, nats, dgraph, runtimeRepo, mcpRepo, workspaceRepo, systemRepo, factory };
}

// RuntimeService message handling coverage

describe('RuntimeService', () => {
    it('initialize starts services and subscribes', async () => {
        const { service, dgraph, nats } = createService();
        await service.start('test');
        expect(dgraph.start).toHaveBeenCalled();
        expect(nats.start).toHaveBeenCalled();
        await service.stop('test');
    });

    it('handles RuntimeConnect for existing runtime by creating instance', async () => {
        const { service, iterator, factory } = createService({
            runtime: {
                findByName: vi.fn(async () => ({ id: 'r1', name: 'node', status: 'ACTIVE' } as unknown as dgraphResolversTypes.Runtime)),
            },
            system: { getDefaultWorkspace: vi.fn(async () => ({ id: 'ws1' })) },
        });
        await service.start('test');
        const msg = new HandshakeRequest({ name: 'node', pid: 'p', hostIP: 'ip', hostname: 'host', workspaceId: 'DEFAULT', type: 'EDGE' });
        iterator.push(msg);
        // allow message loop
        await new Promise((r) => setTimeout(r, 10));
        expect(factory).toHaveBeenCalledTimes(1);
        await service.stop('test');
    });

    it('handles RuntimeConnect for new runtime by creating record and instance', async () => {
        const { service, iterator, runtimeRepo } = createService({
            runtime: { findByName: vi.fn(async () => null) },
            workspace: { findById: vi.fn(async () => ({ id: 'wsX' })) },
        });
        await service.start('test');
        const msg = new HandshakeRequest({ name: 'new-node', pid: 'p', hostIP: 'ip', hostname: 'host', workspaceId: 'wsX', type: 'MCP' });
        iterator.push(msg);
        await new Promise((r) => setTimeout(r, 10));
        expect(runtimeRepo.create).toHaveBeenCalled();
        await service.stop('test');
    });

    it('handles UpdateMcpToolsMessage by disconnecting removed and upserting new', async () => {
        const { service, iterator } = createService({
            mcp: { getTools: vi.fn(async () => ({ tools: [{ id: 't1', name: 'old' }] })) },
        });
        // spy on disconnectTool/upsertTool
        const disconnectToolSpy = vi.spyOn(service, 'disconnectTool');
        const upsertToolSpy = vi.spyOn(service, 'upsertTool');
        await service.start('test');
        const msg = new RuntimeDiscoveredToolsPublish({ mcpServerId: 'm1', tools: [{ name: 'new', description: '', inputSchema: { type: 'object' as const }, annotations: {} }] });
        iterator.push(msg);
        await new Promise((r) => setTimeout(r, 10));
        expect(disconnectToolSpy).toHaveBeenCalledWith('t1');
        expect(upsertToolSpy).toHaveBeenCalledTimes(1);
        await service.stop('test');
    });

    it('does not handle SetRoots/SetGlobalRuntime/SetRuntimeCapabilities anymore');

    it('logs error messages and ignores unknown', async () => {
        const { service, iterator } = createService();
        await service.start('test');
        iterator.push(new ErrorResponse({ error: 'boom' }));
        // Unknown message: push a NatsMessage-like object with shouldRespond()
        iterator.push({ type: 'unknown', data: {}, shouldRespond: () => false } as unknown as NatsMessage);
        await new Promise((r) => setTimeout(r, 10));
        await service.stop('test');
    });
});
