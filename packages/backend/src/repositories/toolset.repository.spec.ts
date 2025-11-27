import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ToolSetRepository } from './toolset.repository';
import { DGraphService } from '../services/dgraph.service';
import { LoggerService, dgraphResolversTypes } from '@2ly/common';
import { WorkspaceRepository } from './workspace.repository';
import { IdentityRepository } from './identity.repository';
import { Subject } from 'rxjs';

// Mock dependencies
vi.mock('../services/dgraph.service');
vi.mock('./workspace.repository');
vi.mock('./identity.repository');
vi.mock('@2ly/common', async () => {
  const actual = await vi.importActual('@2ly/common');
  return {
    ...actual,
    LoggerService: vi.fn(),
  };
});

describe('ToolSetRepository', () => {
  let repository: ToolSetRepository;
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

    repository = new ToolSetRepository(
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
    it('should create toolset with automatic identity key generation', async () => {
      const mockToolset: dgraphResolversTypes.ToolSet = {
        id: 'toolset-456',
        name: 'Test Toolset',
        description: 'Test Description',
        createdAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      const mockKey = {
        id: 'key-789',
        key: 'TSK_abc123',
      };

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        addToolSet: { toolSet: [mockToolset] },
      });

      vi.spyOn(mockIdentityRepository, 'createKey').mockResolvedValue(mockKey as dgraphResolversTypes.IdentityKey);

      const result = await repository.create('Test Toolset', 'Test Description', 'workspace-123');

      // Verify mutation was called
      expect(mockDgraphService.mutation).toHaveBeenCalled();

      // Verify identity key was created
      expect(mockIdentityRepository.createKey).toHaveBeenCalledWith(
        'toolset',
        'toolset-456',
        'Test Toolset Toolset Key',
        ''
      );

      expect(result).toEqual(mockToolset);
    });

    it('should create toolset without description', async () => {
      const mockToolset: dgraphResolversTypes.ToolSet = {
        id: 'toolset-456',
        name: 'Test Toolset',
        description: '',
        createdAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        addToolSet: { toolSet: [mockToolset] },
      });

      vi.spyOn(mockIdentityRepository, 'createKey').mockResolvedValue({
        id: 'key-789',
        key: 'TSK_abc123',
      } as dgraphResolversTypes.IdentityKey);

      const result = await repository.create('Test Toolset', undefined, 'workspace-123');

      expect(mockDgraphService.mutation).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          name: 'Test Toolset',
          description: '',
          workspaceId: 'workspace-123',
        })
      );

      expect(result.description).toBe('');
    });
  });

  describe('update', () => {
    it('should update toolset with new name and description', async () => {
      const mockToolset: dgraphResolversTypes.ToolSet = {
        id: 'toolset-456',
        name: 'Updated Toolset',
        description: 'Updated Description',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        updateToolSet: { toolSet: [mockToolset] },
      });

      const result = await repository.update('toolset-456', 'Updated Toolset', 'Updated Description');

      // Verify mutation was called
      expect(mockDgraphService.mutation).toHaveBeenCalled();
      expect(result).toEqual(mockToolset);
    });

    it('should update toolset with empty description when undefined', async () => {
      const mockToolset: dgraphResolversTypes.ToolSet = {
        id: 'toolset-456',
        name: 'Updated Toolset',
        description: '',
        createdAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        updateToolSet: { toolSet: [mockToolset] },
      });

      await repository.update('toolset-456', 'Updated Toolset', undefined);

      expect(mockDgraphService.mutation).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          description: '',
        })
      );
    });
  });

  describe('delete', () => {
    it('should delete toolset by id', async () => {
      const mockToolset: dgraphResolversTypes.ToolSet = {
        id: 'toolset-456',
        name: 'Test Toolset',
        createdAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        deleteToolSet: { toolSet: [mockToolset] },
      });

      const result = await repository.delete('toolset-456');

      expect(mockDgraphService.mutation).toHaveBeenCalledWith(
        expect.any(Object),
        { id: 'toolset-456' }
      );

      expect(result).toEqual(mockToolset);
    });
  });

  describe('findById', () => {
    it('should return toolset when found', async () => {
      const mockToolset: dgraphResolversTypes.ToolSet = {
        id: 'toolset-456',
        name: 'Test Toolset',
        createdAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        getToolSet: mockToolset,
      });

      const result = await repository.findById('toolset-456');

      expect(mockDgraphService.query).toHaveBeenCalledWith(
        expect.any(Object),
        { id: 'toolset-456' }
      );

      expect(result).toEqual(mockToolset);
    });

    it('should return null when toolset not found', async () => {
      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        getToolSet: null,
      });

      const result = await repository.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should return toolset when found by name in workspace', async () => {
      const mockToolset: dgraphResolversTypes.ToolSet = {
        id: 'toolset-456',
        name: 'Test Toolset',
        createdAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        getWorkspace: { toolSets: [mockToolset] },
      });

      const result = await repository.findByName('workspace-123', 'Test Toolset');

      expect(mockDgraphService.query).toHaveBeenCalledWith(
        expect.any(Object),
        { workspaceId: 'workspace-123', name: 'Test Toolset' }
      );

      expect(result).toEqual(mockToolset);
    });

    it('should return null when toolset not found by name', async () => {
      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        getWorkspace: { toolSets: [] },
      });

      const result = await repository.findByName('workspace-123', 'Nonexistent Toolset');

      expect(result).toBeNull();
    });

    it('should return null when workspace not found', async () => {
      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        getWorkspace: null,
      });

      const result = await repository.findByName('nonexistent-workspace', 'Test Toolset');

      expect(result).toBeNull();
    });
  });

  describe('findByWorkspace', () => {
    it('should return all toolsets for a workspace', async () => {
      const mockToolsets: dgraphResolversTypes.ToolSet[] = [
        {
          id: 'toolset-1',
          name: 'Toolset 1',
          createdAt: new Date().toISOString(),
          workspace: mockWorkspace,
        },
        {
          id: 'toolset-2',
          name: 'Toolset 2',
          createdAt: new Date().toISOString(),
          workspace: mockWorkspace,
        },
      ];

      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        getWorkspace: { toolSets: mockToolsets },
      });

      const result = await repository.findByWorkspace('workspace-123');

      expect(mockDgraphService.query).toHaveBeenCalledWith(
        expect.any(Object),
        { workspaceId: 'workspace-123' }
      );

      expect(result).toEqual(mockToolsets);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when workspace has no toolsets', async () => {
      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        getWorkspace: { toolSets: [] },
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

  describe('addMCPToolToToolSet', () => {
    it('should add MCP tool to toolset', async () => {
      const mockToolset: dgraphResolversTypes.ToolSet = {
        id: 'toolset-456',
        name: 'Test Toolset',
        createdAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        updateToolSet: { toolSet: [mockToolset] },
      });

      const result = await repository.addMCPToolToToolSet('mcp-tool-789', 'toolset-456');

      // Verify mutation was called
      expect(mockDgraphService.mutation).toHaveBeenCalled();
      expect(result).toEqual(mockToolset);
    });

    it('should trigger onboarding step completion when adding MCP tool', async () => {
      const mockToolset: dgraphResolversTypes.ToolSet = {
        id: 'toolset-456',
        name: 'Test Toolset',
        createdAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        updateToolSet: { toolSet: [mockToolset] },
      });

      vi.spyOn(mockWorkspaceRepository, 'checkAndCompleteStep').mockResolvedValue(undefined);

      await repository.addMCPToolToToolSet('mcp-tool-789', 'toolset-456');

      expect(mockWorkspaceRepository.checkAndCompleteStep).toHaveBeenCalledWith(
        'workspace-123',
        'create-tool-set'
      );
    });

    it('should not trigger onboarding step when workspace is missing', async () => {
      const mockToolsetWithoutWorkspace = {
        id: 'toolset-456',
        name: 'Test Toolset',
        createdAt: new Date().toISOString(),
        // Intentionally omit workspace to test the case where it's missing
      } as dgraphResolversTypes.ToolSet;

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        updateToolSet: { toolSet: [mockToolsetWithoutWorkspace] },
      });

      await repository.addMCPToolToToolSet('mcp-tool-789', 'toolset-456');

      expect(mockWorkspaceRepository.checkAndCompleteStep).not.toHaveBeenCalled();
    });
  });

  describe('removeMCPToolFromToolSet', () => {
    it('should remove MCP tool from toolset', async () => {
      const mockToolset: dgraphResolversTypes.ToolSet = {
        id: 'toolset-456',
        name: 'Test Toolset',
        createdAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        updateToolSet: { toolSet: [mockToolset] },
      });

      const result = await repository.removeMCPToolFromToolSet('mcp-tool-789', 'toolset-456');

      // Verify mutation was called
      expect(mockDgraphService.mutation).toHaveBeenCalled();
      expect(result).toEqual(mockToolset);
    });
  });

  describe('observeToolSets', () => {
    it('should return observable of toolsets for a workspace', () => {
      const mockToolsets: dgraphResolversTypes.ToolSet[] = [
        {
          id: 'toolset-1',
          name: 'Toolset 1',
          createdAt: new Date().toISOString(),
          workspace: mockWorkspace,
        },
      ];

      const subject = new Subject<{ toolSets: dgraphResolversTypes.ToolSet[] }>();
      vi.spyOn(mockDgraphService, 'observe').mockReturnValue(subject.asObservable());

      const results: dgraphResolversTypes.ToolSet[][] = [];
      const subscription = repository.observeToolSets('workspace-123').subscribe((toolsets) => {
        results.push(toolsets);
      });

      subject.next({ toolSets: mockToolsets });

      expect(results[0]).toEqual(mockToolsets);
      subscription.unsubscribe();
    });

    it('should return empty array when workspace has no toolsets', () => {
      const subject = new Subject<{ toolSets: dgraphResolversTypes.ToolSet[] } | null>();
      vi.spyOn(mockDgraphService, 'observe').mockReturnValue(subject.asObservable());

      const results: dgraphResolversTypes.ToolSet[][] = [];
      const subscription = repository.observeToolSets('workspace-123').subscribe((toolsets) => {
        results.push(toolsets);
      });

      subject.next(null);

      expect(results[0]).toEqual([]);
      subscription.unsubscribe();
    });
  });

  describe('observeAllToolSets', () => {
    it('should return observable of all toolsets', () => {
      const mockToolsets: dgraphResolversTypes.ToolSet[] = [
        {
          id: 'toolset-1',
          name: 'Toolset 1',
          createdAt: new Date().toISOString(),
          workspace: mockWorkspace,
        },
        {
          id: 'toolset-2',
          name: 'Toolset 2',
          createdAt: new Date().toISOString(),
          workspace: mockWorkspace,
        },
      ];

      const subject = new Subject<dgraphResolversTypes.ToolSet[]>();
      vi.spyOn(mockDgraphService, 'observe').mockReturnValue(subject.asObservable());

      const results: dgraphResolversTypes.ToolSet[][] = [];
      const subscription = repository.observeAllToolSets().subscribe((toolsets) => {
        results.push(toolsets);
      });

      subject.next(mockToolsets);

      expect(results[0]).toEqual(mockToolsets);
      expect(results[0]).toHaveLength(2);
      subscription.unsubscribe();
    });
  });

  describe('getMCPServersOnAgent', () => {
    it('should return MCP servers from toolset MCP tools', async () => {
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
        registryServer: mockRegistryServer2,
        workspace: mockWorkspace,
      };

      const mockToolset: dgraphResolversTypes.ToolSet = {
        id: 'toolset-456',
        name: 'Test Toolset',
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
        getToolSet: mockToolset,
      });

      const result = await repository.getMCPServersOnAgent('toolset-456');

      expect(result).toEqual([mockMCPServer1, mockMCPServer2]);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when toolset has no MCP tools', async () => {
      const mockToolset: dgraphResolversTypes.ToolSet = {
        id: 'toolset-456',
        name: 'Test Toolset',
        createdAt: new Date().toISOString(),
        workspace: mockWorkspace,
        mcpTools: [],
      };

      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        getToolSet: mockToolset,
      });

      const result = await repository.getMCPServersOnAgent('toolset-456');

      expect(result).toEqual([]);
    });

    it('should return empty array when toolset not found', async () => {
      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        getToolSet: null,
      });

      const result = await repository.getMCPServersOnAgent('nonexistent-id');

      expect(result).toEqual([]);
    });
  });

  describe('observeMCPServersOnAgent', () => {
    it('should return observable of MCP servers from toolset', () => {
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
        registryServer: mockRegistryServer,
        workspace: mockWorkspace,
      };

      const mockToolset: dgraphResolversTypes.ToolSet = {
        id: 'toolset-456',
        name: 'Test Toolset',
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

      const subject = new Subject<dgraphResolversTypes.ToolSet>();
      vi.spyOn(mockDgraphService, 'observe').mockReturnValue(subject.asObservable());

      const results: dgraphResolversTypes.McpServer[][] = [];
      const subscription = repository.observeMCPServersOnAgent('toolset-456').subscribe((servers) => {
        results.push(servers);
      });

      subject.next(mockToolset);

      expect(results[0]).toEqual([mockMCPServer]);
      subscription.unsubscribe();
    });

    it('should return empty array when toolset has no MCP tools', () => {
      const mockToolset: dgraphResolversTypes.ToolSet = {
        id: 'toolset-456',
        name: 'Test Toolset',
        createdAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      const subject = new Subject<dgraphResolversTypes.ToolSet | null>();
      vi.spyOn(mockDgraphService, 'observe').mockReturnValue(subject.asObservable());

      const results: dgraphResolversTypes.McpServer[][] = [];
      const subscription = repository.observeMCPServersOnAgent('toolset-456').subscribe((servers) => {
        results.push(servers);
      });

      subject.next(mockToolset);

      expect(results[0]).toEqual([]);
      subscription.unsubscribe();
    });
  });
});
