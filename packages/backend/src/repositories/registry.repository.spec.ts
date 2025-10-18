import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RegistryRepository } from './registry.repository';
import type { DGraphService } from '../services/dgraph.service';
import { DgraphServiceMock } from '../services/dgraph.service.mock';
import { dgraphResolversTypes } from '@2ly/common';
import type { WorkspaceRepository } from './workspace.repository';

describe('RegistryRepository', () => {
  let dgraphService: DgraphServiceMock;
  let registryRepository: RegistryRepository;
  let workspaceRepository: WorkspaceRepository;

  beforeEach(() => {
    dgraphService = new DgraphServiceMock();
    workspaceRepository = { checkAndCompleteStep: vi.fn().mockResolvedValue(undefined) } as unknown as WorkspaceRepository;
    registryRepository = new RegistryRepository(
      dgraphService as unknown as DGraphService,
      workspaceRepository,
    );
  });

  it('createRegistry does not complete onboarding step immediately', async () => {
    const registry = { id: 'reg1', name: 'Test Registry' } as unknown as dgraphResolversTypes.McpRegistry;
    dgraphService.mutation.mockResolvedValue({ addMCPRegistry: { mCPRegistry: [registry] } });

    const result = await registryRepository.createRegistry('w1', 'Test Registry', 'https://example.com');

    expect(result.id).toBe('reg1');
    expect((workspaceRepository.checkAndCompleteStep as unknown as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });

  it('syncUpstream completes choose-mcp-registry onboarding step after sync', async () => {
    const registryData = {
      id: 'reg1',
      name: 'Test Registry',
      upstreamUrl: 'https://example.com',
      workspace: { id: 'w1' }
    } as unknown as dgraphResolversTypes.McpRegistry;
    
    dgraphService.query.mockResolvedValue({ getMCPRegistry: registryData });
    dgraphService.mutation
      .mockResolvedValueOnce({ updateMCPRegistry: { mCPRegistry: [registryData] } }); // For lastSyncAt update

    // Mock fetch for upstream API
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ servers: [], metadata: { nextCursor: null } })
    });

    await registryRepository.syncUpstream('reg1');

    expect((workspaceRepository.checkAndCompleteStep as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('w1', 'choose-mcp-registry');
  });
});


