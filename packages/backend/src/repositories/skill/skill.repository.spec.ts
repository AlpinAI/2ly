import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SkillRepository } from '../skill/skill.repository';
import { DGraphService } from '../../services/dgraph.service';
import { LoggerService, dgraphResolversTypes } from '@skilder-ai/common';
import { WorkspaceRepository } from '../workspace/workspace.repository';
import { IdentityRepository } from '../identity/identity.repository';
import { Subject } from 'rxjs';

// Mock dependencies
vi.mock('../services/dgraph.service');
vi.mock('./workspace.repository');
vi.mock('./identity.repository');
vi.mock('@skilder-ai/common', async () => {
  const actual = await vi.importActual('@skilder-ai/common');
  return {
    ...actual,
    LoggerService: vi.fn(),
  };
});

describe('SkillRepository', () => {
  let repository: SkillRepository;
  let mockDgraphService: DGraphService;
  let mockLoggerService: LoggerService;
  let mockWorkspaceRepository: WorkspaceRepository;
  let mockIdentityRepository: IdentityRepository;
  let mockLogger: ReturnType<LoggerService['getLogger']>;

  // Shared mock objects for type consistency
  const mockSystem: dgraphResolversTypes.System = {
    id: 'system-123',
    initialized: true,
    instanceId: 'instance-123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockWorkspace: dgraphResolversTypes.Workspace = {
    id: 'workspace-123',
    name: 'test-workspace',
    createdAt: new Date().toISOString(),
    system: mockSystem,
  };

  beforeEach(() => {
    // Silence console errors in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    } as unknown as ReturnType<LoggerService['getLogger']>;

    mockLoggerService = {
      getLogger: vi.fn().mockReturnValue(mockLogger),
    } as unknown as LoggerService;

    mockDgraphService = {
      query: vi.fn(),
      mutation: vi.fn(),
      observe: vi.fn(),
    } as unknown as DGraphService;

    mockWorkspaceRepository = {
      checkAndCompleteStep: vi.fn(),
    } as unknown as WorkspaceRepository;

    mockIdentityRepository = {
      createKey: vi.fn(),
    } as unknown as IdentityRepository;

    repository = new SkillRepository(
      mockDgraphService,
      mockLoggerService,
      mockWorkspaceRepository,
      mockIdentityRepository
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('create', () => {
    it('should create skill with automatic identity key generation', async () => {
      const mockSkill: dgraphResolversTypes.Skill = {
        id: 'skill-456',
        name: 'Test Skill',
        description: 'Test Description',
        createdAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      const mockKey = {
        id: 'key-789',
        key: 'SKL_abc123',
      };

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        addSkill: { skill: [mockSkill] },
      });

      vi.spyOn(mockIdentityRepository, 'createKey').mockResolvedValue(mockKey as dgraphResolversTypes.IdentityKey);

      const result = await repository.create('Test Skill', 'Test Description', 'workspace-123');

      // Verify mutation was called
      expect(mockDgraphService.mutation).toHaveBeenCalled();

      // Verify identity key was created
      expect(mockIdentityRepository.createKey).toHaveBeenCalledWith(
        'skill',
        'skill-456',
        'Test Skill Skill Key',
        ''
      );

      expect(result).toEqual(mockSkill);
    });

    it('should create skill without description', async () => {
      const mockSkill: dgraphResolversTypes.Skill = {
        id: 'skill-456',
        name: 'Test Skill',
        description: '',
        createdAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        addSkill: { skill: [mockSkill] },
      });

      vi.spyOn(mockIdentityRepository, 'createKey').mockResolvedValue({
        id: 'key-789',
        key: 'SKL_abc123',
      } as dgraphResolversTypes.IdentityKey);

      const result = await repository.create('Test Skill', undefined, 'workspace-123');

      expect(mockDgraphService.mutation).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          name: 'Test Skill',
          description: '',
          workspaceId: 'workspace-123',
        })
      );

      expect(result.description).toBe('');
    });
  });

  describe('update', () => {
    it('should update skill with new name and description', async () => {
      const mockSkill: dgraphResolversTypes.Skill = {
        id: 'skill-456',
        name: 'Updated Skill',
        description: 'Updated Description',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        updateSkill: { skill: [mockSkill] },
      });

      const result = await repository.update('skill-456', 'Updated Skill', 'Updated Description');

      // Verify mutation was called
      expect(mockDgraphService.mutation).toHaveBeenCalled();
      expect(result).toEqual(mockSkill);
    });

    it('should update skill with empty description when undefined', async () => {
      const mockSkill: dgraphResolversTypes.Skill = {
        id: 'skill-456',
        name: 'Updated Skill',
        description: '',
        createdAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        updateSkill: { skill: [mockSkill] },
      });

      await repository.update('skill-456', 'Updated Skill', undefined);

      expect(mockDgraphService.mutation).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          description: '',
        })
      );
    });
  });

  describe('delete', () => {
    it('should delete skill by id', async () => {
      const mockSkill: dgraphResolversTypes.Skill = {
        id: 'skill-456',
        name: 'Test Skill',
        createdAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        deleteSkill: { skill: [mockSkill] },
      });

      const result = await repository.delete('skill-456');

      expect(mockDgraphService.mutation).toHaveBeenCalledWith(
        expect.any(Object),
        { id: 'skill-456' }
      );

      expect(result).toEqual(mockSkill);
    });
  });

  describe('findById', () => {
    it('should return skill when found', async () => {
      const mockSkill: dgraphResolversTypes.Skill = {
        id: 'skill-456',
        name: 'Test Skill',
        createdAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        getSkill: mockSkill,
      });

      const result = await repository.findById('skill-456');

      expect(mockDgraphService.query).toHaveBeenCalledWith(
        expect.any(Object),
        { id: 'skill-456' }
      );

      expect(result).toEqual(mockSkill);
    });

    it('should return null when skill not found', async () => {
      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        getSkill: null,
      });

      const result = await repository.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should return skill when found by name in workspace', async () => {
      const mockSkill: dgraphResolversTypes.Skill = {
        id: 'skill-456',
        name: 'Test Skill',
        createdAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        getWorkspace: { skills: [mockSkill] },
      });

      const result = await repository.findByName('workspace-123', 'Test Skill');

      expect(mockDgraphService.query).toHaveBeenCalledWith(
        expect.any(Object),
        { workspaceId: 'workspace-123', name: 'Test Skill' }
      );

      expect(result).toEqual(mockSkill);
    });

    it('should return null when skill not found by name', async () => {
      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        getWorkspace: { skills: [] },
      });

      const result = await repository.findByName('workspace-123', 'Nonexistent Skill');

      expect(result).toBeNull();
    });

    it('should return null when workspace not found', async () => {
      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        getWorkspace: null,
      });

      const result = await repository.findByName('nonexistent-workspace', 'Test Skill');

      expect(result).toBeNull();
    });
  });

  describe('findByWorkspace', () => {
    it('should return all skills for a workspace', async () => {
      const mockSkills: dgraphResolversTypes.Skill[] = [
        {
          id: 'skill-1',
          name: 'Skill 1',
          createdAt: new Date().toISOString(),
          workspace: mockWorkspace,
        },
        {
          id: 'skill-2',
          name: 'Skill 2',
          createdAt: new Date().toISOString(),
          workspace: mockWorkspace,
        },
      ];

      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        getWorkspace: { skills: mockSkills },
      });

      const result = await repository.findByWorkspace('workspace-123');

      expect(mockDgraphService.query).toHaveBeenCalledWith(
        expect.any(Object),
        { workspaceId: 'workspace-123' }
      );

      expect(result).toEqual(mockSkills);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when workspace has no skills', async () => {
      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        getWorkspace: { skills: [] },
      });

      const result = await repository.findByWorkspace('workspace-123');

      expect(result).toEqual([]);
    });

    it('should return empty array when workspace not found', async () => {
      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        getWorkspace: null,
      });

      const result = await repository.findByWorkspace('nonexistent-workspace');

      expect(result).toEqual([]);
    });
  });

  describe('addMCPToolToSkill', () => {
    it('should add MCP tool to skill', async () => {
      const mockSkill: dgraphResolversTypes.Skill = {
        id: 'skill-456',
        name: 'Test Skill',
        createdAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        updateSkill: { skill: [mockSkill] },
      });

      const result = await repository.addMCPToolToSkill('mcp-tool-789', 'skill-456');

      // Verify mutation was called
      expect(mockDgraphService.mutation).toHaveBeenCalled();
      expect(result).toEqual(mockSkill);
    });

    it('should trigger onboarding step completion when adding MCP tool', async () => {
      const mockSkill: dgraphResolversTypes.Skill = {
        id: 'skill-456',
        name: 'Test Skill',
        createdAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        updateSkill: { skill: [mockSkill] },
      });

      vi.spyOn(mockWorkspaceRepository, 'checkAndCompleteStep').mockResolvedValue(undefined);

      await repository.addMCPToolToSkill('mcp-tool-789', 'skill-456');

      expect(mockWorkspaceRepository.checkAndCompleteStep).toHaveBeenCalledWith(
        'workspace-123',
        'create-skill'
      );
    });

    it('should not trigger onboarding step when workspace is missing', async () => {
      const mockSkillWithoutWorkspace = {
        id: 'skill-456',
        name: 'Test Skill',
        createdAt: new Date().toISOString(),
        // Intentionally omit workspace to test the case where it's missing
      } as dgraphResolversTypes.Skill;

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        updateSkill: { skill: [mockSkillWithoutWorkspace] },
      });

      await repository.addMCPToolToSkill('mcp-tool-789', 'skill-456');

      expect(mockWorkspaceRepository.checkAndCompleteStep).not.toHaveBeenCalled();
    });
  });

  describe('removeMCPToolFromSkill', () => {
    it('should remove MCP tool from skill', async () => {
      const mockSkill: dgraphResolversTypes.Skill = {
        id: 'skill-456',
        name: 'Test Skill',
        createdAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        updateSkill: { skill: [mockSkill] },
      });

      const result = await repository.removeMCPToolFromSkill('mcp-tool-789', 'skill-456');

      // Verify mutation was called
      expect(mockDgraphService.mutation).toHaveBeenCalled();
      expect(result).toEqual(mockSkill);
    });
  });

  describe('observeSkills', () => {
    it('should return observable of skills for a workspace', () => {
      const mockSkills: dgraphResolversTypes.Skill[] = [
        {
          id: 'skill-1',
          name: 'Skill 1',
          createdAt: new Date().toISOString(),
          workspace: mockWorkspace,
        },
      ];

      const subject = new Subject<{ skills: dgraphResolversTypes.Skill[] }>();
      vi.spyOn(mockDgraphService, 'observe').mockReturnValue(subject.asObservable());

      const results: dgraphResolversTypes.Skill[][] = [];
      const subscription = repository.observeSkills('workspace-123').subscribe((skills) => {
        results.push(skills);
      });

      subject.next({ skills: mockSkills });

      expect(results[0]).toEqual(mockSkills);
      subscription.unsubscribe();
    });

    it('should return empty array when workspace has no skills', () => {
      const subject = new Subject<{ skills: dgraphResolversTypes.Skill[] } | null>();
      vi.spyOn(mockDgraphService, 'observe').mockReturnValue(subject.asObservable());

      const results: dgraphResolversTypes.Skill[][] = [];
      const subscription = repository.observeSkills('workspace-123').subscribe((skills) => {
        results.push(skills);
      });

      subject.next(null);

      expect(results[0]).toEqual([]);
      subscription.unsubscribe();
    });
  });

  describe('observeAllSkills', () => {
    it('should return observable of all skills', () => {
      const mockSkills: dgraphResolversTypes.Skill[] = [
        {
          id: 'skill-1',
          name: 'Skill 1',
          createdAt: new Date().toISOString(),
          workspace: mockWorkspace,
        },
        {
          id: 'skill-2',
          name: 'Skill 2',
          createdAt: new Date().toISOString(),
          workspace: mockWorkspace,
        },
      ];

      const subject = new Subject<dgraphResolversTypes.Skill[]>();
      vi.spyOn(mockDgraphService, 'observe').mockReturnValue(subject.asObservable());

      const results: dgraphResolversTypes.Skill[][] = [];
      const subscription = repository.observeAllSkills().subscribe((skills) => {
        results.push(skills);
      });

      subject.next(mockSkills);

      expect(results[0]).toEqual(mockSkills);
      expect(results[0]).toHaveLength(2);
      subscription.unsubscribe();
    });
  });

  describe('getMCPServersOnAgent', () => {
    it('should return MCP servers from skill MCP tools', async () => {
      const mockRegistryServer1: dgraphResolversTypes.McpRegistryServer = {
        id: 'registry-1',
        name: 'Registry 1',
        description: '',
        repositoryUrl: '',
        title: 'Registry 1',
        version: '1.0.0',
        packages: '',
        createdAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      const mockRegistryServer2: dgraphResolversTypes.McpRegistryServer = {
        id: 'registry-2',
        name: 'Registry 2',
        description: '',
        repositoryUrl: '',
        title: 'Registry 2',
        version: '1.0.0',
        packages: '',
        createdAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      const mockMCPServer1: dgraphResolversTypes.McpServer = {
        id: 'server-1',
        name: 'Server 1',
        config: '{}',
        description: '',
        repositoryUrl: '',
        transport: dgraphResolversTypes.McpTransportType.Stdio,
        executionTarget: dgraphResolversTypes.ExecutionTarget.Agent,
        registryServer: mockRegistryServer1,
        workspace: mockWorkspace,
      };

      const mockMCPServer2: dgraphResolversTypes.McpServer = {
        id: 'server-2',
        name: 'Server 2',
        config: '{}',
        description: '',
        repositoryUrl: '',
        transport: dgraphResolversTypes.McpTransportType.Stdio,
        executionTarget: dgraphResolversTypes.ExecutionTarget.Agent,
        registryServer: mockRegistryServer2,
        workspace: mockWorkspace,
      };

      const mockSkill: dgraphResolversTypes.Skill = {
        id: 'skill-456',
        name: 'Test Skill',
        createdAt: new Date().toISOString(),
        workspace: mockWorkspace,
        mcpTools: [
          {
            id: 'tool-1',
            name: 'Tool 1',
            mcpServer: mockMCPServer1,
            createdAt: new Date().toISOString(),
            annotations: '',
            description: '',
            inputSchema: '{}',
            lastSeenAt: new Date().toISOString(),
            status: dgraphResolversTypes.ActiveStatus.Active,
            workspace: mockWorkspace,
          },
          {
            id: 'tool-2',
            name: 'Tool 2',
            mcpServer: mockMCPServer2,
            createdAt: new Date().toISOString(),
            annotations: '',
            description: '',
            inputSchema: '{}',
            lastSeenAt: new Date().toISOString(),
            status: dgraphResolversTypes.ActiveStatus.Active,
            workspace: mockWorkspace,
          },
        ],
      };

      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        getSkill: mockSkill,
      });

      const result = await repository.getMCPServersOnAgent('skill-456');

      expect(result).toEqual([mockMCPServer1, mockMCPServer2]);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when skill has no MCP tools', async () => {
      const mockSkill: dgraphResolversTypes.Skill = {
        id: 'skill-456',
        name: 'Test Skill',
        createdAt: new Date().toISOString(),
        workspace: mockWorkspace,
        mcpTools: [],
      };

      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        getSkill: mockSkill,
      });

      const result = await repository.getMCPServersOnAgent('skill-456');

      expect(result).toEqual([]);
    });

    it('should return empty array when skill not found', async () => {
      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        getSkill: null,
      });

      const result = await repository.getMCPServersOnAgent('nonexistent-id');

      expect(result).toEqual([]);
    });
  });

  describe('observeMCPServersOnAgent', () => {
    it('should return observable of MCP servers from skill', () => {
      const mockRegistryServer: dgraphResolversTypes.McpRegistryServer = {
        id: 'registry-1',
        name: 'Registry 1',
        description: '',
        repositoryUrl: '',
        title: 'Registry 1',
        version: '1.0.0',
        packages: '',
        createdAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      const mockMCPServer: dgraphResolversTypes.McpServer = {
        id: 'server-1',
        name: 'Server 1',
        config: '{}',
        description: '',
        repositoryUrl: '',
        transport: dgraphResolversTypes.McpTransportType.Stdio,
        executionTarget: dgraphResolversTypes.ExecutionTarget.Agent,
        registryServer: mockRegistryServer,
        workspace: mockWorkspace,
      };

      const mockSkill: dgraphResolversTypes.Skill = {
        id: 'skill-456',
        name: 'Test Skill',
        createdAt: new Date().toISOString(),
        workspace: mockWorkspace,
        mcpTools: [
          {
            id: 'tool-1',
            name: 'Tool 1',
            mcpServer: mockMCPServer,
            createdAt: new Date().toISOString(),
            annotations: '',
            description: '',
            inputSchema: '{}',
            lastSeenAt: new Date().toISOString(),
            status: dgraphResolversTypes.ActiveStatus.Active,
            workspace: mockWorkspace,
          },
        ],
      };

      const subject = new Subject<dgraphResolversTypes.Skill>();
      vi.spyOn(mockDgraphService, 'observe').mockReturnValue(subject.asObservable());

      const results: dgraphResolversTypes.McpServer[][] = [];
      const subscription = repository.observeMCPServersOnAgent('skill-456').subscribe((servers) => {
        results.push(servers);
      });

      subject.next(mockSkill);

      expect(results[0]).toEqual([mockMCPServer]);
      subscription.unsubscribe();
    });

    it('should return empty array when skill has no MCP tools', () => {
      const mockSkill: dgraphResolversTypes.Skill = {
        id: 'skill-456',
        name: 'Test Skill',
        createdAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      const subject = new Subject<dgraphResolversTypes.Skill | null>();
      vi.spyOn(mockDgraphService, 'observe').mockReturnValue(subject.asObservable());

      const results: dgraphResolversTypes.McpServer[][] = [];
      const subscription = repository.observeMCPServersOnAgent('skill-456').subscribe((servers) => {
        results.push(servers);
      });

      subject.next(mockSkill);

      expect(results[0]).toEqual([]);
      subscription.unsubscribe();
    });
  });
});
