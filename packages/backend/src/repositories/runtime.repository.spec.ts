import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RuntimeRepository } from './runtime.repository';
import type { DGraphService } from '../services/dgraph.service';
import { DgraphServiceMock } from '../services/dgraph.service.mock';
import { dgraphResolversTypes } from '@2ly/common';
import { MCPToolRepository } from './mcp-tool.repository';
import { LoggerService } from '@2ly/common';
import { Subject } from 'rxjs';
import type { NatsService } from '@2ly/common';
import type { WorkspaceRepository } from './workspace.repository';

describe('RuntimeRepository', () => {
    let dgraphService: DgraphServiceMock;
    let mcpToolRepository: MCPToolRepository;
    let loggerService: LoggerService;
    let natsService: NatsService;
    let workspaceRepository: WorkspaceRepository;
    let runtimeRepository: RuntimeRepository;

    beforeEach(() => {
        dgraphService = new DgraphServiceMock();
        mcpToolRepository = {
            setStatus: vi.fn(),
        } as unknown as MCPToolRepository;
        loggerService = {
            getLogger: vi.fn().mockReturnValue({
                debug: vi.fn(),
                warn: vi.fn(),
            }),
        } as unknown as LoggerService;
        natsService = {
            request: vi.fn(),
            publishEphemeral: vi.fn(),
        } as unknown as NatsService;
        workspaceRepository = {
            checkAndCompleteStep: vi.fn().mockResolvedValue(undefined),
        } as unknown as WorkspaceRepository;
        runtimeRepository = new RuntimeRepository(
            dgraphService as unknown as DGraphService,
            mcpToolRepository,
            loggerService,
            natsService,
            workspaceRepository,
        );
    });

    it('create creates runtime', async () => {
        const runtime = { id: 'r1', name: 'Test Runtime' } as unknown as dgraphResolversTypes.Runtime;

        dgraphService.mutation.mockResolvedValue({ addRuntime: { runtime: [runtime] } });

        const result = await runtimeRepository.create('Test Runtime', 'Description', 'ACTIVE', 'w1', ['tool']);

        expect(dgraphService.mutation).toHaveBeenCalledWith(
            expect.any(Object),
            expect.objectContaining({
                name: 'Test Runtime',
                description: 'Description',
                status: 'ACTIVE',
                workspaceId: 'w1',
                capabilities: ['tool'],
            })
        );
        expect(result.id).toBe('r1');
    });

    it('delete removes runtime', async () => {
        const runtime = { id: 'r1' } as unknown as dgraphResolversTypes.Runtime;
        dgraphService.mutation.mockResolvedValue({ deleteRuntime: { runtime: [runtime] } });

        const result = await runtimeRepository.delete('r1');

        expect(dgraphService.mutation).toHaveBeenCalledWith(expect.any(Object), { id: 'r1' });
        expect(result.id).toBe('r1');
    });

    it('upserTool creates new tool when none exists', async () => {
        const mcpServer = { id: 's1', workspace: { id: 'w1' }, tools: [] } as unknown as dgraphResolversTypes.McpServer;
        const tool = { id: 't1', name: 'test-tool' } as unknown as dgraphResolversTypes.McpTool;

        dgraphService.query.mockResolvedValue({ getMCPServer: mcpServer });
        dgraphService.mutation.mockResolvedValue({ addMCPTool: { mCPTool: [tool] } });

        const result = await runtimeRepository.upserTool('s1', 'test-tool', 'Description', '{}', '{}');

        expect(dgraphService.query).toHaveBeenCalledWith(expect.any(Object), { id: 's1', toolName: 'test-tool' });
        expect(dgraphService.mutation).toHaveBeenCalledWith(
            expect.any(Object),
            expect.objectContaining({
                toolName: 'test-tool',
                toolDescription: 'Description',
                workspaceId: 'w1',
                mcpServerId: 's1',
            })
        );
        expect(result.id).toBe('t1');
    });

    it('upserTool updates existing tool', async () => {
        const tool = { id: 't1', name: 'test-tool' } as unknown as dgraphResolversTypes.McpTool;
        const mcpServer = { id: 's1', workspace: { id: 'w1' }, tools: [tool] } as unknown as dgraphResolversTypes.McpServer;

        dgraphService.query.mockResolvedValue({ getMCPServer: mcpServer });
        dgraphService.mutation.mockResolvedValue({ updateMCPTool: { mCPTool: [tool] } });

        const result = await runtimeRepository.upserTool('s1', 'test-tool', 'Updated Description', '{}', '{}');

        expect(dgraphService.mutation).toHaveBeenCalledWith(
            expect.any(Object),
            expect.objectContaining({
                toolId: 't1',
                toolDescription: 'Updated Description',
                status: 'ACTIVE',
            })
        );
        expect(result.id).toBe('t1');
    });

    it('upserTool throws error when tool name is empty', async () => {
        await expect(runtimeRepository.upserTool('s1', '', 'Description', '{}', '{}'))
            .rejects.toThrow('Tool name is required');
    });

    it('upserTool throws error when MCP server not found', async () => {
        dgraphService.query.mockResolvedValue({ getMCPServer: null });

        await expect(runtimeRepository.upserTool('s1', 'test-tool', 'Description', '{}', '{}'))
            .rejects.toThrow('MCP Server s1 not found');
    });

    it('addMCPServer links MCP server to runtime', async () => {
        const runtime = { id: 'r1' } as unknown as dgraphResolversTypes.Runtime;
        dgraphService.mutation.mockResolvedValue({ updateRuntime: { runtime: [runtime] } });

        const result = await runtimeRepository.addMCPServer('r1', 's1');

        expect(dgraphService.mutation).toHaveBeenCalledWith(
            expect.any(Object),
            { runtimeId: 'r1', mcpServerId: 's1' }
        );
        expect(result.id).toBe('r1');
    });

    it('getRuntime returns runtime by id', async () => {
        const runtime = { id: 'r1', name: 'Test Runtime' } as unknown as dgraphResolversTypes.Runtime;
        dgraphService.query.mockResolvedValue({ getRuntime: runtime });

        const result = await runtimeRepository.getRuntime('r1');

        expect(dgraphService.query).toHaveBeenCalledWith(expect.any(Object), { id: 'r1' });
        expect(result.id).toBe('r1');
    });

    it('observeRoots returns roots array from runtime', async () => {
        const runtime = { id: 'r1', roots: JSON.stringify([{ name: 'root1', uri: 'file:///test' }]) } as unknown as dgraphResolversTypes.Runtime;
        const subject = new Subject<dgraphResolversTypes.Runtime>();
        dgraphService.observe.mockReturnValue(subject.asObservable());

        const results: { name: string; uri: string }[][] = [];
        const subscription = runtimeRepository.observeRoots('r1').subscribe((roots) => results.push(roots));

        subject.next(runtime);
        expect(results[0]).toEqual([{ name: 'root1', uri: 'file:///test' }]);
        subscription.unsubscribe();
    });

    it('observeRoots returns empty array when no roots', async () => {
        const runtime = { id: 'r1', roots: null } as unknown as dgraphResolversTypes.Runtime;
        const subject = new Subject<dgraphResolversTypes.Runtime>();
        dgraphService.observe.mockReturnValue(subject.asObservable());

        const results: { name: string; uri: string }[][] = [];
        const subscription = runtimeRepository.observeRoots('r1').subscribe((roots) => results.push(roots));

        subject.next(runtime);
        expect(results[0]).toEqual([]);
        subscription.unsubscribe();
    });

    it('observeMCPServersOnEdge returns MCP servers', async () => {
        const runtime = { id: 'r1', mcpServers: [{ id: 's1' }] } as unknown as dgraphResolversTypes.Runtime;
        const subject = new Subject<dgraphResolversTypes.Runtime>();
        dgraphService.observe.mockReturnValue(subject.asObservable());

        const results: dgraphResolversTypes.McpServer[][] = [];
        const subscription = runtimeRepository.observeMCPServersOnEdge('r1').subscribe((servers) => results.push(servers));

        subject.next(runtime);
        expect(results[0]).toEqual([{ id: 's1' }]);
        subscription.unsubscribe();
    });

    it('observeMCPServersOnAgent returns MCP servers for agent', async () => {
        const mcpServer = { id: 's1', runOn: 'AGENT' } as unknown as dgraphResolversTypes.McpServer;
        const runtime = {
            id: 'r1',
            mcpToolCapabilities: [{ mcpServer }]
        } as unknown as dgraphResolversTypes.Runtime;
        const subject = new Subject<dgraphResolversTypes.Runtime>();
        dgraphService.observe.mockReturnValue(subject.asObservable());

        const results: dgraphResolversTypes.McpServer[][] = [];
        const subscription = runtimeRepository.observeMCPServersOnAgent('r1').subscribe((servers) => results.push(servers));

        subject.next(runtime);
        expect(results[0]).toEqual([{ id: 's1', runOn: 'AGENT' }]);
        subscription.unsubscribe();
    });

    it('observeMCPServersOnGlobal returns global MCP servers', async () => {
        const runtime = { id: 'w1', mcpServers: [{ id: 's1' }] } as unknown as dgraphResolversTypes.Runtime;
        const subject = new Subject<dgraphResolversTypes.Runtime>();
        dgraphService.observe.mockReturnValue(subject.asObservable());

        const results: dgraphResolversTypes.McpServer[][] = [];
        const subscription = runtimeRepository.observeMCPServersOnGlobal('w1').subscribe((servers) => results.push(servers));

        subject.next(runtime);
        expect(results[0]).toEqual([{ id: 's1' }]);
        subscription.unsubscribe();
    });

    it('setInactive sets runtime inactive and tools inactive', async () => {
        const tool = { id: 't1' } as unknown as dgraphResolversTypes.McpTool;
        const mcpServer = { tools: [tool] } as unknown as dgraphResolversTypes.McpServer;
        const runtime = { id: 'r1', mcpServers: [mcpServer] } as unknown as dgraphResolversTypes.Runtime;

        dgraphService.mutation.mockResolvedValue({ updateRuntime: { runtime: [runtime] } });
        mcpToolRepository.setStatus = vi.fn().mockResolvedValue(undefined);

        const result = await runtimeRepository.setInactive('r1');

        expect(dgraphService.mutation).toHaveBeenCalledWith(expect.any(Object), { id: 'r1' });
        expect(mcpToolRepository.setStatus).toHaveBeenCalledWith('t1', 'INACTIVE');
        expect(result.id).toBe('r1');
    });

    it('setInactive handles runtime not found gracefully', async () => {
        dgraphService.mutation.mockResolvedValue({ updateRuntime: { runtime: [] } });

        const result = await runtimeRepository.setInactive('r1');

        expect(result).toBeUndefined();
    });

    it('findActive returns active runtimes', async () => {
        const runtimes = [{ id: 'r1' }, { id: 'r2' }] as unknown as dgraphResolversTypes.Runtime[];
        dgraphService.query.mockResolvedValue({ queryRuntime: runtimes });

        const result = await runtimeRepository.findActive();

        expect(dgraphService.query).toHaveBeenCalled();
        expect(result).toEqual(runtimes);
    });

    it('setActive sets runtime active with process info', async () => {
        const runtime = { id: 'r1', status: 'ACTIVE' } as unknown as dgraphResolversTypes.Runtime;
        dgraphService.mutation.mockResolvedValue({ updateRuntime: { runtime: [runtime] } });

        const result = await runtimeRepository.setActive('r1', 'pid123', '192.168.1.1', 'hostname');

        expect(dgraphService.mutation).toHaveBeenCalledWith(
            expect.any(Object),
            {
                id: 'r1',
                processId: 'pid123',
                hostIP: '192.168.1.1',
                hostname: 'hostname',
            }
        );
        expect(result.id).toBe('r1');
    });

    it('updateLastSeen updates runtime last seen timestamp', async () => {
        const runtime = { id: 'r1', lastSeenAt: '2021-01-01T00:00:00Z' } as unknown as dgraphResolversTypes.Runtime;
        dgraphService.mutation.mockResolvedValue({ updateRuntime: { runtime: [runtime] } });

        const result = await runtimeRepository.updateLastSeen('r1');

        expect(dgraphService.mutation).toHaveBeenCalledWith(expect.any(Object), { id: 'r1' });
        expect(result.id).toBe('r1');
    });

    it('setRoots validates and sets runtime roots', async () => {
        const runtime = { id: 'r1' } as unknown as dgraphResolversTypes.Runtime;
        const roots = [{ name: 'root1', uri: 'file:///test' }];
        dgraphService.mutation.mockResolvedValue({ updateRuntime: { runtime: [runtime] } });

        const result = await runtimeRepository.setRoots('r1', roots);

        expect(dgraphService.mutation).toHaveBeenCalledWith(
            expect.any(Object),
            { id: 'r1', roots: JSON.stringify(roots) }
        );
        expect(result.id).toBe('r1');
    });

    it('setRoots throws error for invalid root', async () => {
        const invalidRoots = [{ name: '', uri: 'file:///test' }];

        await expect(runtimeRepository.setRoots('r1', invalidRoots))
            .rejects.toThrow('Invalid root');
    });

    it('setCapabilities validates and sets runtime capabilities', async () => {
        const runtime = { id: 'r1', capabilities: ['tool', 'agent'] } as unknown as dgraphResolversTypes.Runtime;
        const capabilities = ['tool', 'agent'];
        dgraphService.mutation.mockResolvedValue({ updateRuntime: { runtime: [runtime] } });

        const result = await runtimeRepository.setCapabilities('r1', capabilities);

        expect(dgraphService.mutation).toHaveBeenCalledWith(
            expect.any(Object),
            { id: 'r1', capabilities }
        );
        expect(result.id).toBe('r1');
    });

    it('setCapabilities completes connect-agent when agent present', async () => {
        const runtime = { id: 'r1', capabilities: ['agent'] } as unknown as dgraphResolversTypes.Runtime;
        dgraphService.mutation.mockResolvedValue({ updateRuntime: { runtime: [runtime] } });
        dgraphService.query.mockResolvedValue({ getRuntime: { id: 'r1', workspace: { id: 'w1' } } });

        const result = await runtimeRepository.setCapabilities('r1', ['agent']);

        expect(result.id).toBe('r1');
        expect((workspaceRepository.checkAndCompleteStep as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('w1', 'connect-agent');
    });

    it('setCapabilities throws error for invalid capability', async () => {
        const invalidCapabilities = ['invalid'];

        await expect(runtimeRepository.setCapabilities('r1', invalidCapabilities))
            .rejects.toThrow('Invalid capability: invalid');
    });

    it('findByName returns runtime by name in workspace', async () => {
        const runtime = { id: 'r1', name: 'test-runtime' } as unknown as dgraphResolversTypes.Runtime;
        const workspace = { runtimes: [runtime] } as unknown as dgraphResolversTypes.Workspace;
        dgraphService.query.mockResolvedValue({ getWorkspace: workspace });

        const result = await runtimeRepository.findByName('w1', 'test-runtime');

        expect(dgraphService.query).toHaveBeenCalledWith(
            expect.any(Object),
            { workspaceId: 'w1', name: 'test-runtime' }
        );
        expect(result.id).toBe('r1');
    });

    it('findByName returns undefined when runtime not found', async () => {
        const workspace = { runtimes: [] } as unknown as dgraphResolversTypes.Workspace;
        dgraphService.query.mockResolvedValue({ getWorkspace: workspace });

        const result = await runtimeRepository.findByName('w1', 'nonexistent');

        expect(result).toBeUndefined();
    });

    it('linkMCPToolToRuntime links tool to runtime', async () => {
        const runtime = { id: 'r1' } as unknown as dgraphResolversTypes.Runtime;
        dgraphService.mutation.mockResolvedValue({ updateRuntime: { runtime: [runtime] } });

        const result = await runtimeRepository.linkMCPToolToRuntime('t1', 'r1');

        expect(dgraphService.mutation).toHaveBeenCalledWith(
            expect.any(Object),
            { mcpToolId: 't1', runtimeId: 'r1' }
        );
        expect(result.id).toBe('r1');
    });

    it('unlinkMCPToolFromRuntime unlinks tool from runtime', async () => {
        const runtime = { id: 'r1' } as unknown as dgraphResolversTypes.Runtime;
        dgraphService.mutation.mockResolvedValue({ updateRuntime: { runtime: [runtime] } });

        const result = await runtimeRepository.unlinkMCPToolFromRuntime('t1', 'r1');

        expect(dgraphService.mutation).toHaveBeenCalledWith(
            expect.any(Object),
            { mcpToolId: 't1', runtimeId: 'r1' }
        );
        expect(result.id).toBe('r1');
    });

    it('observeCapabilities returns runtime capabilities', async () => {
        const runtime = { id: 'r1', capabilities: ['tool'] } as unknown as dgraphResolversTypes.Runtime;
        const subject = new Subject<dgraphResolversTypes.Runtime>();
        dgraphService.observe.mockReturnValue(subject.asObservable());

        const results: dgraphResolversTypes.Runtime[] = [];
        const subscription = runtimeRepository.observeCapabilities('r1').subscribe((runtime) => results.push(runtime));

        subject.next(runtime);
        expect(results[0].id).toBe('r1');
        subscription.unsubscribe();
    });
});
