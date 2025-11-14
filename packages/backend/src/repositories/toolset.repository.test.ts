import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Observable } from 'rxjs';
import { ToolSetRepository } from './toolset.repository';
import { DGraphService } from '../services/dgraph.service';
import { LoggerService } from '@2ly/common';
import type { WorkspaceRepository } from './workspace.repository';
import type { IdentityRepository } from './identity.repository';

describe('ToolSetRepository', () => {
  let toolSetRepository: ToolSetRepository;
  let mockDGraphService: DGraphService;
  let mockLoggerService: LoggerService;
  let mockWorkspaceRepository: WorkspaceRepository;

  beforeEach(() => {
    // Mock DGraphService
    mockDGraphService = {
      mutation: vi.fn(),
      query: vi.fn(),
      observe: vi.fn(),
    } as unknown as DGraphService;

    // Mock LoggerService
    mockLoggerService = {
      getLogger: vi.fn(() => ({
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      })),
    } as unknown as LoggerService;

    // Mock WorkspaceRepository
    mockWorkspaceRepository = {
      checkAndCompleteStep: vi.fn().mockResolvedValue(undefined),
    } as unknown as WorkspaceRepository;

    // Mock IdentityRepository
    const mockIdentityRepository = {
      createKey: vi.fn().mockResolvedValue({ id: '0x1', key: 'TSK_test123' }),
    } as unknown as IdentityRepository;

    toolSetRepository = new ToolSetRepository(mockDGraphService, mockLoggerService, mockWorkspaceRepository, mockIdentityRepository);
  });

  describe('create', () => {
    it('should create a new toolset successfully', async () => {
      const mockToolSet = {
        id: '0x1',
        name: 'Test ToolSet',
        description: 'A test toolset',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        workspace: { id: '0x2', name: 'Test Workspace' },
      };

      vi.mocked(mockDGraphService.mutation).mockResolvedValue({
        addToolSet: { toolSet: [mockToolSet] },
      });

      const result = await toolSetRepository.create('Test ToolSet', 'A test toolset', '0x2');

      expect(result).toEqual(mockToolSet);
      expect(mockDGraphService.mutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: 'Test ToolSet',
          description: 'A test toolset',
          workspaceId: '0x2',
        }),
      );
    });

    it('should create a toolset with empty description when undefined', async () => {
      const mockToolSet = {
        id: '0x1',
        name: 'Test ToolSet',
        description: '',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        workspace: { id: '0x2', name: 'Test Workspace' },
      };

      vi.mocked(mockDGraphService.mutation).mockResolvedValue({
        addToolSet: { toolSet: [mockToolSet] },
      });

      const result = await toolSetRepository.create('Test ToolSet', undefined, '0x2');

      expect(result).toEqual(mockToolSet);
      expect(mockDGraphService.mutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: 'Test ToolSet',
          description: '',
          workspaceId: '0x2',
        }),
      );
    });
  });

  describe('update', () => {
    it('should update a toolset successfully', async () => {
      const mockToolSet = {
        id: '0x1',
        name: 'Updated ToolSet',
        description: 'Updated description',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        workspace: { id: '0x2', name: 'Test Workspace' },
      };

      vi.mocked(mockDGraphService.mutation).mockResolvedValue({
        updateToolSet: { toolSet: [mockToolSet] },
      });

      const result = await toolSetRepository.update('0x1', 'Updated ToolSet', 'Updated description');

      expect(result).toEqual(mockToolSet);
      expect(mockDGraphService.mutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          id: '0x1',
          name: 'Updated ToolSet',
          description: 'Updated description',
        }),
      );
    });
  });

  describe('delete', () => {
    it('should delete a toolset successfully', async () => {
      const mockToolSet = {
        id: '0x1',
        name: 'Test ToolSet',
        description: 'A test toolset',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        workspace: { id: '0x2', name: 'Test Workspace' },
      };

      vi.mocked(mockDGraphService.mutation).mockResolvedValue({
        deleteToolSet: { toolSet: [mockToolSet] },
      });

      const result = await toolSetRepository.delete('0x1');

      expect(result).toEqual(mockToolSet);
      expect(mockDGraphService.mutation).toHaveBeenCalledWith(expect.anything(), { id: '0x1' });
    });
  });

  describe('findById', () => {
    it('should find a toolset by ID', async () => {
      const mockToolSet = {
        id: '0x1',
        name: 'Test ToolSet',
        description: 'A test toolset',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        mcpTools: [],
        workspace: { id: '0x2', name: 'Test Workspace' },
      };

      vi.mocked(mockDGraphService.query).mockResolvedValue({
        getToolSet: mockToolSet,
      });

      const result = await toolSetRepository.findById('0x1');

      expect(result).toEqual(mockToolSet);
      expect(mockDGraphService.query).toHaveBeenCalledWith(expect.anything(), { id: '0x1' });
    });

    it('should return null when toolset not found', async () => {
      vi.mocked(mockDGraphService.query).mockResolvedValue({
        getToolSet: null,
      });

      const result = await toolSetRepository.findById('0x999');

      expect(result).toBeNull();
    });
  });

  describe('findByWorkspace', () => {
    it('should find all toolsets in a workspace', async () => {
      const mockToolSets = [
        {
          id: '0x1',
          name: 'ToolSet 1',
          description: 'First toolset',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          mcpTools: [],
        },
        {
          id: '0x2',
          name: 'ToolSet 2',
          description: 'Second toolset',
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          mcpTools: [],
        },
      ];

      vi.mocked(mockDGraphService.query).mockResolvedValue({
        getWorkspace: { toolSets: mockToolSets },
      });

      const result = await toolSetRepository.findByWorkspace('0x5');

      expect(result).toEqual(mockToolSets);
      expect(mockDGraphService.query).toHaveBeenCalledWith(expect.anything(), { workspaceId: '0x5' });
    });

    it('should return empty array when workspace has no toolsets', async () => {
      vi.mocked(mockDGraphService.query).mockResolvedValue({
        getWorkspace: { toolSets: [] },
      });

      const result = await toolSetRepository.findByWorkspace('0x5');

      expect(result).toEqual([]);
    });

    it('should return empty array when workspace not found', async () => {
      vi.mocked(mockDGraphService.query).mockResolvedValue({
        getWorkspace: null,
      });

      const result = await toolSetRepository.findByWorkspace('0x999');

      expect(result).toEqual([]);
    });
  });

  describe('addMCPToolToToolSet', () => {
    it('should add an MCP tool to a toolset', async () => {
      const mockToolSet = {
        id: '0x1',
        name: 'Test ToolSet',
        description: 'A test toolset',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
        mcpTools: [
          {
            id: '0x10',
            name: 'Test Tool',
            description: 'A test tool',
            status: 'ACTIVE',
          },
        ],
        workspace: { id: '0x2', name: 'Test Workspace' },
      };

      vi.mocked(mockDGraphService.mutation).mockResolvedValue({
        updateToolSet: { toolSet: [mockToolSet] },
      });

      const result = await toolSetRepository.addMCPToolToToolSet('0x10', '0x1');

      expect(result).toEqual(mockToolSet);
      expect(mockDGraphService.mutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          toolSetId: '0x1',
          mcpToolId: '0x10',
        }),
      );
    });
  });

  describe('removeMCPToolFromToolSet', () => {
    it('should remove an MCP tool from a toolset', async () => {
      const mockToolSet = {
        id: '0x1',
        name: 'Test ToolSet',
        description: 'A test toolset',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
        mcpTools: [],
        workspace: { id: '0x2', name: 'Test Workspace' },
      };

      vi.mocked(mockDGraphService.mutation).mockResolvedValue({
        updateToolSet: { toolSet: [mockToolSet] },
      });

      const result = await toolSetRepository.removeMCPToolFromToolSet('0x10', '0x1');

      expect(result).toEqual(mockToolSet);
      expect(mockDGraphService.mutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          toolSetId: '0x1',
          mcpToolId: '0x10',
        }),
      );
    });
  });

  describe('observeToolSets', () => {
    it('should return an observable for toolsets', () => {
      const mockObservable = {
        pipe: vi.fn(() => mockObservable),
      };

      vi.mocked(mockDGraphService.observe).mockReturnValue(mockObservable as unknown as Observable<unknown>);

      const result = toolSetRepository.observeToolSets('0x5');

      expect(result).toBeDefined();
      expect(mockDGraphService.observe).toHaveBeenCalledWith(
        expect.anything(),
        { workspaceId: '0x5' },
        'getWorkspace',
        true,
      );
    });
  });
});
