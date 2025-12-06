import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MCPServerRepository } from './mcp-server.repository';
import type { DGraphService } from '../services/dgraph.service';
import { DgraphServiceMock } from '../services/dgraph.service.mock';
import { dgraphResolversTypes } from '@2ly/common';
import type { WorkspaceRepository } from './workspace.repository';

describe('MCPServerRepository', () => {
  let dgraphService: DgraphServiceMock;
  let mcpServerRepository: MCPServerRepository;
  let workspaceRepository: WorkspaceRepository;

  beforeEach(() => {
    dgraphService = new DgraphServiceMock();
    workspaceRepository = { checkAndCompleteStep: vi.fn().mockResolvedValue(undefined) } as unknown as WorkspaceRepository;
    mcpServerRepository = new MCPServerRepository(
      dgraphService as unknown as DGraphService,
      workspaceRepository,
    );
  });

  it('findAll returns all MCP servers', async () => {
    const servers = [
      { id: 's1', name: 'Server 1' },
      { id: 's2', name: 'Server 2' },
    ] as unknown as dgraphResolversTypes.McpServer[];
    dgraphService.query.mockResolvedValue({ queryMCPServer: servers });

    const result = await mcpServerRepository.findAll();

    expect(dgraphService.query).toHaveBeenCalledWith(expect.any(Object), {});
    expect(result).toEqual(servers);
  });

  it('create creates new MCP server', async () => {
    const server = { id: 's1', name: 'Test Server' } as unknown as dgraphResolversTypes.McpServer;
    dgraphService.mutation.mockResolvedValue({ addMCPServer: { mCPServer: [server] } });

    const config = JSON.stringify({
      identifier: 'npm:@modelcontextprotocol/server-test',
      packageArguments: [
        {
          name: 'path',
          type: 'string',
          value: '/tmp',
          isRequired: true,
        },
      ],
      environmentVariables: [
        {
          name: 'NODE_ENV',
          value: 'production',
          isRequired: false,
        },
      ],
    });

    const result = await mcpServerRepository.create(
      'Test Server',
      'Description',
      'https://github.com/test',
      'STDIO',
      config,
      'EDGE',
      'w1',
      'reg1',
    );

    expect(dgraphService.mutation).toHaveBeenCalledWith(expect.any(Object), {
      name: 'Test Server',
      description: 'Description',
      repositoryUrl: 'https://github.com/test',
      transport: 'STDIO',
      config,
      workspaceId: 'w1',
      registryServerId: 'reg1',
      executionTarget: 'EDGE',
    });
    expect(result.id).toBe('s1');
    expect((workspaceRepository.checkAndCompleteStep as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('w1', 'install-mcp-server');
  });

  it('update updates existing MCP server', async () => {
    const server = { id: 's1', name: 'Updated Server' } as unknown as dgraphResolversTypes.McpServer;
    dgraphService.mutation.mockResolvedValue({ updateMCPServer: { mCPServer: [server] } });

    const config = JSON.stringify({
      type: 'streamableHttp',
      url: 'http://localhost:3000',
      headers: [
        {
          name: 'Authorization',
          value: 'Bearer token',
          isRequired: true,
          isSecret: true,
        },
      ],
    });

    const result = await mcpServerRepository.update(
      's1',
      'Updated Server',
      'Updated Description',
      'https://github.com/updated',
      'STREAM',
      config,
      'AGENT',
    );

    expect(dgraphService.mutation).toHaveBeenCalledWith(expect.any(Object), {
      id: 's1',
      name: 'Updated Server',
      description: 'Updated Description',
      repositoryUrl: 'https://github.com/updated',
      transport: 'STREAM',
      config,
      executionTarget: 'AGENT',
    });
    expect(result.id).toBe('s1');
  });

  it('updateExecutionTarget updates only executionTarget field', async () => {
    const server = { id: 's1', executionTarget: 'EDGE' } as unknown as dgraphResolversTypes.McpServer;
    dgraphService.mutation.mockResolvedValue({ updateMCPServer: { mCPServer: [server] } });

    const result = await mcpServerRepository.updateExecutionTarget('s1', 'EDGE');

    expect(dgraphService.mutation).toHaveBeenCalledWith(expect.any(Object), { id: 's1', executionTarget: 'EDGE' });
    expect(result.id).toBe('s1');
  });

  it('linkRuntime links runtime to MCP server', async () => {
    const server = { id: 's1', runtime: { id: 'r1' } } as unknown as dgraphResolversTypes.McpServer;
    dgraphService.mutation.mockResolvedValue({ updateMCPServer: { mCPServer: [server] } });

    const result = await mcpServerRepository.linkRuntime('s1', 'r1');

    expect(dgraphService.mutation).toHaveBeenCalledWith(expect.any(Object), { mcpServerId: 's1', runtimeId: 'r1' });
    expect(result.id).toBe('s1');
  });

  it('unlinkRuntime unlinks runtime from MCP server when runtime exists', async () => {
    const server = { id: 's1', runtime: { id: 'r1' } } as unknown as dgraphResolversTypes.McpServer;
    const updatedServer = { id: 's1', runtime: null } as unknown as dgraphResolversTypes.McpServer;

    dgraphService.query.mockResolvedValue({ getMCPServer: server });
    dgraphService.mutation.mockResolvedValue({ updateMCPServer: { mCPServer: [updatedServer] } });

    const result = await mcpServerRepository.unlinkRuntime('s1');

    expect(dgraphService.query).toHaveBeenCalledWith(expect.any(Object), { id: 's1' });
    expect(dgraphService.mutation).toHaveBeenCalledWith(expect.any(Object), { mcpServerId: 's1', runtimeId: 'r1' });
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
    const tools = [{ id: 't1' }, { id: 't2' }] as unknown as dgraphResolversTypes.McpTool[];
    const server = { id: 's1', tools } as unknown as dgraphResolversTypes.McpServer;
    const deletedServer = { id: 's1' } as unknown as dgraphResolversTypes.McpServer;

    dgraphService.query.mockResolvedValue({ getMCPServer: server });
    dgraphService.mutation
      .mockResolvedValueOnce({}) // delete tools
      .mockResolvedValueOnce({ deleteMCPServer: { mCPServer: [deletedServer] } }); // delete server

    const result = await mcpServerRepository.delete('s1');

    expect(dgraphService.query).toHaveBeenCalledWith(expect.any(Object), { id: 's1' });
    expect(dgraphService.mutation).toHaveBeenCalledWith(expect.any(Object), { ids: ['t1', 't2'] });
    expect(dgraphService.mutation).toHaveBeenCalledWith(expect.any(Object), { id: 's1' });
    expect(result.id).toBe('s1');
  });

  it('delete handles server with no tools', async () => {
    const server = { id: 's1', tools: [] } as unknown as dgraphResolversTypes.McpServer;
    const deletedServer = { id: 's1' } as unknown as dgraphResolversTypes.McpServer;

    dgraphService.query.mockResolvedValue({ getMCPServer: server });
    dgraphService.mutation.mockResolvedValue({ deleteMCPServer: { mCPServer: [deletedServer] } });

    const result = await mcpServerRepository.delete('s1');

    expect(dgraphService.mutation).toHaveBeenCalledWith(expect.any(Object), { ids: [] });
    expect(result.id).toBe('s1');
  });

  it('getTools returns MCP server with tools', async () => {
    const server = {
      id: 's1',
      tools: [{ id: 't1', name: 'tool1' }],
    } as unknown as dgraphResolversTypes.McpServer;
    dgraphService.query.mockResolvedValue({ getMCPServer: server });

    const result = await mcpServerRepository.getTools('s1');

    expect(dgraphService.query).toHaveBeenCalledWith(expect.any(Object), { id: 's1' });
    expect(result.id).toBe('s1');
    expect(result.tools).toHaveLength(1);
  });
});
