import { describe, it, expect, beforeEach } from 'vitest';
import { MCPServerRepository } from './mcp-server.repository';
import type { DGraphService } from '../services/dgraph.service';
import { DgraphServiceMock } from '../services/dgraph.service.mock';
import { dgraphResolversTypes } from '@2ly/common';

describe('MCPServerRepository', () => {
    let dgraphService: DgraphServiceMock;
    let mcpServerRepository: MCPServerRepository;

    beforeEach(() => {
        dgraphService = new DgraphServiceMock();
        mcpServerRepository = new MCPServerRepository(dgraphService as unknown as DGraphService);
    });

    it('findAll returns all MCP servers', async () => {
        const servers = [
            { id: 's1', name: 'Server 1' },
            { id: 's2', name: 'Server 2' }
        ] as unknown as dgraphResolversTypes.McpServer[];
        dgraphService.query.mockResolvedValue({ queryMCPServer: servers });

        const result = await mcpServerRepository.findAll();

        expect(dgraphService.query).toHaveBeenCalledWith(expect.any(Object), {});
        expect(result).toEqual(servers);
    });

    it('create creates new MCP server', async () => {
        const server = { id: 's1', name: 'Test Server' } as unknown as dgraphResolversTypes.McpServer;
        dgraphService.mutation.mockResolvedValue({ addMCPServer: { mCPServer: [server] } });

        const result = await mcpServerRepository.create(
            'Test Server',
            'Description',
            'https://github.com/test',
            'STDIO',
            'node',
            'index.js',
            'NODE_ENV=production',
            '',
            null,
            'EDGE',
            'w1'
        );

        expect(dgraphService.mutation).toHaveBeenCalledWith(
            expect.any(Object),
            {
                name: 'Test Server',
                description: 'Description',
                repositoryUrl: 'https://github.com/test',
                transport: 'STDIO',
                command: 'node',
                args: 'index.js',
                ENV: 'NODE_ENV=production',
                serverUrl: '',
                headers: null,
                workspaceId: 'w1',
                runOn: 'EDGE',
            }
        );
        expect(result.id).toBe('s1');
    });

    it('update updates existing MCP server', async () => {
        const server = { id: 's1', name: 'Updated Server' } as unknown as dgraphResolversTypes.McpServer;
        dgraphService.mutation.mockResolvedValue({ updateMCPServer: { mCPServer: [server] } });

        const result = await mcpServerRepository.update(
            's1',
            'Updated Server',
            'Updated Description',
            'https://github.com/updated',
            'STREAM',
            'python',
            'main.py',
            'PYTHONPATH=/app',
            'http://localhost:3000',
            '{"Authorization": "Bearer token"}',
            'AGENT'
        );

        expect(dgraphService.mutation).toHaveBeenCalledWith(
            expect.any(Object),
            {
                id: 's1',
                name: 'Updated Server',
                description: 'Updated Description',
                repositoryUrl: 'https://github.com/updated',
                transport: 'STREAM',
                command: 'python',
                args: 'main.py',
                ENV: 'PYTHONPATH=/app',
                serverUrl: 'http://localhost:3000',
                headers: '{"Authorization": "Bearer token"}',
                runOn: 'AGENT',
            }
        );
        expect(result.id).toBe('s1');
    });

    it('updateRunOn updates only runOn field', async () => {
        const server = { id: 's1', runOn: 'GLOBAL' } as unknown as dgraphResolversTypes.McpServer;
        dgraphService.mutation.mockResolvedValue({ updateMCPServer: { mCPServer: [server] } });

        const result = await mcpServerRepository.updateRunOn('s1', 'GLOBAL');

        expect(dgraphService.mutation).toHaveBeenCalledWith(
            expect.any(Object),
            { id: 's1', runOn: 'GLOBAL' }
        );
        expect(result.id).toBe('s1');
    });

    it('linkRuntime links runtime to MCP server', async () => {
        const server = { id: 's1', runtime: { id: 'r1' } } as unknown as dgraphResolversTypes.McpServer;
        dgraphService.mutation.mockResolvedValue({ updateMCPServer: { mCPServer: [server] } });

        const result = await mcpServerRepository.linkRuntime('s1', 'r1');

        expect(dgraphService.mutation).toHaveBeenCalledWith(
            expect.any(Object),
            { mcpServerId: 's1', runtimeId: 'r1' }
        );
        expect(result.id).toBe('s1');
    });

    it('unlinkRuntime unlinks runtime from MCP server when runtime exists', async () => {
        const server = { id: 's1', runtime: { id: 'r1' } } as unknown as dgraphResolversTypes.McpServer;
        const updatedServer = { id: 's1', runtime: null } as unknown as dgraphResolversTypes.McpServer;

        dgraphService.query.mockResolvedValue({ getMCPServer: server });
        dgraphService.mutation.mockResolvedValue({ updateMCPServer: { mCPServer: [updatedServer] } });

        const result = await mcpServerRepository.unlinkRuntime('s1');

        expect(dgraphService.query).toHaveBeenCalledWith(expect.any(Object), { id: 's1' });
        expect(dgraphService.mutation).toHaveBeenCalledWith(
            expect.any(Object),
            { mcpServerId: 's1', runtimeId: 'r1' }
        );
        expect(result.id).toBe('s1');
    });

    it('unlinkRuntime returns server when no runtime linked', async () => {
        const server = { id: 's1', runtime: null } as unknown as dgraphResolversTypes.McpServer;
        dgraphService.query.mockResolvedValue({ getMCPServer: server });

        const result = await mcpServerRepository.unlinkRuntime('s1');

        expect(dgraphService.query).toHaveBeenCalledWith(expect.any(Object), { id: 's1' });
        expect(dgraphService.mutation).not.toHaveBeenCalled();
        expect(result.id).toBe('s1');
    });

    it('delete deletes MCP server and its tools', async () => {
        const tools = [
            { id: 't1' },
            { id: 't2' }
        ] as unknown as dgraphResolversTypes.McpTool[];
        const server = { id: 's1', tools } as unknown as dgraphResolversTypes.McpServer;
        const deletedServer = { id: 's1' } as unknown as dgraphResolversTypes.McpServer;

        dgraphService.query.mockResolvedValue({ getMCPServer: server });
        dgraphService.mutation
            .mockResolvedValueOnce({}) // delete tools
            .mockResolvedValueOnce({ deleteMCPServer: { mCPServer: [deletedServer] } }); // delete server

        const result = await mcpServerRepository.delete('s1');

        expect(dgraphService.query).toHaveBeenCalledWith(expect.any(Object), { id: 's1' });
        expect(dgraphService.mutation).toHaveBeenCalledWith(
            expect.any(Object),
            { ids: ['t1', 't2'] }
        );
        expect(dgraphService.mutation).toHaveBeenCalledWith(
            expect.any(Object),
            { id: 's1' }
        );
        expect(result.id).toBe('s1');
    });

    it('delete handles server with no tools', async () => {
        const server = { id: 's1', tools: [] } as unknown as dgraphResolversTypes.McpServer;
        const deletedServer = { id: 's1' } as unknown as dgraphResolversTypes.McpServer;

        dgraphService.query.mockResolvedValue({ getMCPServer: server });
        dgraphService.mutation.mockResolvedValue({ deleteMCPServer: { mCPServer: [deletedServer] } });

        const result = await mcpServerRepository.delete('s1');

        expect(dgraphService.mutation).toHaveBeenCalledWith(
            expect.any(Object),
            { ids: [] }
        );
        expect(result.id).toBe('s1');
    });

    it('getTools returns MCP server with tools', async () => {
        const server = {
            id: 's1',
            tools: [{ id: 't1', name: 'tool1' }]
        } as unknown as dgraphResolversTypes.McpServer;
        dgraphService.query.mockResolvedValue({ getMCPServer: server });

        const result = await mcpServerRepository.getTools('s1');

        expect(dgraphService.query).toHaveBeenCalledWith(
            expect.any(Object),
            { id: 's1' }
        );
        expect(result.id).toBe('s1');
        expect(result.tools).toHaveLength(1);
    });
});
