import { describe, it, expect, beforeEach } from 'vitest';
import { MCPToolRepository } from '../mcp-tool/mcp-tool.repository';
import type { DGraphService } from '../../services/dgraph.service';
import { DgraphServiceMock } from '../../services/dgraph.service.mock';
import { dgraphResolversTypes } from '@skilder-ai/common';

describe('MCPToolRepository', () => {
    let dgraphService: DgraphServiceMock;
    let mcpToolRepository: MCPToolRepository;

    beforeEach(() => {
        dgraphService = new DgraphServiceMock();
        mcpToolRepository = new MCPToolRepository(dgraphService as unknown as DGraphService);
    });

    it('setStatus sets tool status to ACTIVE', async () => {
        const tool = { id: 't1', status: 'ACTIVE' } as unknown as dgraphResolversTypes.McpTool;
        dgraphService.mutation.mockResolvedValue({ updateMCPTool: { mCPTool: [tool] } });

        const result = await mcpToolRepository.setStatus('t1', 'ACTIVE');

        expect(dgraphService.mutation).toHaveBeenCalledWith(
            expect.any(Object),
            { mcpToolId: 't1', status: 'ACTIVE' }
        );
        expect(result.id).toBe('t1');
        expect(result.status).toBe('ACTIVE');
    });

    it('setStatus sets tool status to INACTIVE', async () => {
        const tool = { id: 't1', status: 'INACTIVE' } as unknown as dgraphResolversTypes.McpTool;
        dgraphService.mutation.mockResolvedValue({ updateMCPTool: { mCPTool: [tool] } });

        const result = await mcpToolRepository.setStatus('t1', 'INACTIVE');

        expect(dgraphService.mutation).toHaveBeenCalledWith(
            expect.any(Object),
            { mcpToolId: 't1', status: 'INACTIVE' }
        );
        expect(result.id).toBe('t1');
        expect(result.status).toBe('INACTIVE');
    });

    it('setStatus returns first tool from mutation result', async () => {
        const tools = [
            { id: 't1', status: 'ACTIVE' },
            { id: 't2', status: 'ACTIVE' }
        ] as unknown as dgraphResolversTypes.McpTool[];
        dgraphService.mutation.mockResolvedValue({ updateMCPTool: { mCPTool: tools } });

        const result = await mcpToolRepository.setStatus('t1', 'ACTIVE');

        expect(result.id).toBe('t1');
    });
});
