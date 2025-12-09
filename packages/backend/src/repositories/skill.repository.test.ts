import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Observable } from 'rxjs';
import { SkillRepository } from './skill.repository';
import { DGraphService } from '../services/dgraph.service';
import { LoggerService } from '@skilder-ai/common';
import type { WorkspaceRepository } from './workspace.repository';
import type { IdentityRepository } from './identity.repository';

describe('SkillRepository', () => {
  let skillRepository: SkillRepository;
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
      createKey: vi.fn().mockResolvedValue({ id: '0x1', key: 'SKL_test123' }),
    } as unknown as IdentityRepository;

    skillRepository = new SkillRepository(mockDGraphService, mockLoggerService, mockWorkspaceRepository, mockIdentityRepository);
  });

  describe('create', () => {
    it('should create a new skill successfully', async () => {
      const mockSkill = {
        id: '0x1',
        name: 'Test Skill',
        description: 'A test skill',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        workspace: { id: '0x2', name: 'Test Workspace' },
      };

      vi.mocked(mockDGraphService.mutation).mockResolvedValue({
        addSkill: { skill: [mockSkill] },
      });

      const result = await skillRepository.create('Test Skill', 'A test skill', '0x2');

      expect(result).toEqual(mockSkill);
      expect(mockDGraphService.mutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: 'Test Skill',
          description: 'A test skill',
          workspaceId: '0x2',
        }),
      );
    });

    it('should create a skill with empty description when undefined', async () => {
      const mockSkill = {
        id: '0x1',
        name: 'Test Skill',
        description: '',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        workspace: { id: '0x2', name: 'Test Workspace' },
      };

      vi.mocked(mockDGraphService.mutation).mockResolvedValue({
        addSkill: { skill: [mockSkill] },
      });

      const result = await skillRepository.create('Test Skill', undefined, '0x2');

      expect(result).toEqual(mockSkill);
      expect(mockDGraphService.mutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: 'Test Skill',
          description: '',
          workspaceId: '0x2',
        }),
      );
    });
  });

  describe('update', () => {
    it('should update a skill successfully', async () => {
      const mockSkill = {
        id: '0x1',
        name: 'Updated Skill',
        description: 'Updated description',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        workspace: { id: '0x2', name: 'Test Workspace' },
      };

      vi.mocked(mockDGraphService.mutation).mockResolvedValue({
        updateSkill: { skill: [mockSkill] },
      });

      const result = await skillRepository.update('0x1', 'Updated Skill', 'Updated description');

      expect(result).toEqual(mockSkill);
      expect(mockDGraphService.mutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          id: '0x1',
          name: 'Updated Skill',
          description: 'Updated description',
        }),
      );
    });
  });

  describe('delete', () => {
    it('should delete a skill successfully', async () => {
      const mockSkill = {
        id: '0x1',
        name: 'Test Skill',
        description: 'A test skill',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        workspace: { id: '0x2', name: 'Test Workspace' },
      };

      vi.mocked(mockDGraphService.mutation).mockResolvedValue({
        deleteSkill: { skill: [mockSkill] },
      });

      const result = await skillRepository.delete('0x1');

      expect(result).toEqual(mockSkill);
      expect(mockDGraphService.mutation).toHaveBeenCalledWith(expect.anything(), { id: '0x1' });
    });
  });

  describe('findById', () => {
    it('should find a skill by ID', async () => {
      const mockSkill = {
        id: '0x1',
        name: 'Test Skill',
        description: 'A test skill',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        mcpTools: [],
        workspace: { id: '0x2', name: 'Test Workspace' },
      };

      vi.mocked(mockDGraphService.query).mockResolvedValue({
        getSkill: mockSkill,
      });

      const result = await skillRepository.findById('0x1');

      expect(result).toEqual(mockSkill);
      expect(mockDGraphService.query).toHaveBeenCalledWith(expect.anything(), { id: '0x1' });
    });

    it('should return null when skill not found', async () => {
      vi.mocked(mockDGraphService.query).mockResolvedValue({
        getSkill: null,
      });

      const result = await skillRepository.findById('0x999');

      expect(result).toBeNull();
    });
  });

  describe('findByWorkspace', () => {
    it('should find all skills in a workspace', async () => {
      const mockSkills = [
        {
          id: '0x1',
          name: 'Skill 1',
          description: 'First skill',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          mcpTools: [],
        },
        {
          id: '0x2',
          name: 'Skill 2',
          description: 'Second skill',
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          mcpTools: [],
        },
      ];

      vi.mocked(mockDGraphService.query).mockResolvedValue({
        getWorkspace: { skills: mockSkills },
      });

      const result = await skillRepository.findByWorkspace('0x5');

      expect(result).toEqual(mockSkills);
      expect(mockDGraphService.query).toHaveBeenCalledWith(expect.anything(), { workspaceId: '0x5' });
    });

    it('should return empty array when workspace has no skills', async () => {
      vi.mocked(mockDGraphService.query).mockResolvedValue({
        getWorkspace: { skills: [] },
      });

      const result = await skillRepository.findByWorkspace('0x5');

      expect(result).toEqual([]);
    });

    it('should return empty array when workspace not found', async () => {
      vi.mocked(mockDGraphService.query).mockResolvedValue({
        getWorkspace: null,
      });

      const result = await skillRepository.findByWorkspace('0x999');

      expect(result).toEqual([]);
    });
  });

  describe('addMCPToolToSkill', () => {
    it('should add an MCP tool to a skill', async () => {
      const mockSkill = {
        id: '0x1',
        name: 'Test Skill',
        description: 'A test skill',
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
        updateSkill: { skill: [mockSkill] },
      });

      const result = await skillRepository.addMCPToolToSkill('0x10', '0x1');

      expect(result).toEqual(mockSkill);
      expect(mockDGraphService.mutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          skillId: '0x1',
          mcpToolId: '0x10',
        }),
      );
    });
  });

  describe('removeMCPToolFromSkill', () => {
    it('should remove an MCP tool from a skill', async () => {
      const mockSkill = {
        id: '0x1',
        name: 'Test Skill',
        description: 'A test skill',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
        mcpTools: [],
        workspace: { id: '0x2', name: 'Test Workspace' },
      };

      vi.mocked(mockDGraphService.mutation).mockResolvedValue({
        updateSkill: { skill: [mockSkill] },
      });

      const result = await skillRepository.removeMCPToolFromSkill('0x10', '0x1');

      expect(result).toEqual(mockSkill);
      expect(mockDGraphService.mutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          skillId: '0x1',
          mcpToolId: '0x10',
        }),
      );
    });
  });

  describe('observeSkills', () => {
    it('should return an observable for skills', () => {
      const mockObservable = {
        pipe: vi.fn(() => mockObservable),
      };

      vi.mocked(mockDGraphService.observe).mockReturnValue(mockObservable as unknown as Observable<unknown>);

      const result = skillRepository.observeSkills('0x5');

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
