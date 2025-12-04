import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AgentRepository } from './agent.repository';
import { DGraphService } from '../services/dgraph.service';
import { LoggerService, dgraphResolversTypes } from '@2ly/common';

// Mock dependencies
vi.mock('../services/dgraph.service');
vi.mock('@2ly/common', async () => {
  const actual = await vi.importActual('@2ly/common');
  return {
    ...actual,
    LoggerService: vi.fn(),
  };
});

describe('AgentRepository', () => {
  let repository: AgentRepository;
  let mockDgraphService: DGraphService;
  let mockLoggerService: LoggerService;
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
    } as unknown as DGraphService;

    repository = new AgentRepository(
      mockDgraphService,
      mockLoggerService,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('create', () => {
    it('should create agent with all fields', async () => {
      const mockAgent: dgraphResolversTypes.Agent = {
        id: 'agent-456',
        name: 'Test Agent',
        description: 'Test Description',
        systemPrompt: 'You are a helpful assistant',
        model: 'openai/gpt-4',
        temperature: 0.7,
        maxTokens: 2048,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        addAgent: { agent: [mockAgent] },
      });

      const result = await repository.create(
        'Test Agent',
        'Test Description',
        'You are a helpful assistant',
        'openai/gpt-4',
        0.7,
        2048,
        'workspace-123'
      );

      expect(mockDgraphService.mutation).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          name: 'Test Agent',
          description: 'Test Description',
          systemPrompt: 'You are a helpful assistant',
          model: 'openai/gpt-4',
          temperature: 0.7,
          maxTokens: 2048,
          workspaceId: 'workspace-123',
        })
      );

      expect(result).toEqual(mockAgent);
    });

    it('should create agent without description', async () => {
      const mockAgent: dgraphResolversTypes.Agent = {
        id: 'agent-456',
        name: 'Test Agent',
        description: '',
        systemPrompt: 'You are a helpful assistant',
        model: 'openai/gpt-4',
        temperature: 1.0,
        maxTokens: 4096,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        addAgent: { agent: [mockAgent] },
      });

      const result = await repository.create(
        'Test Agent',
        undefined,
        'You are a helpful assistant',
        'openai/gpt-4',
        1.0,
        4096,
        'workspace-123'
      );

      expect(mockDgraphService.mutation).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          description: '',
        })
      );

      expect(result.description).toBe('');
    });

    it('should create agent with default values', async () => {
      const mockAgent: dgraphResolversTypes.Agent = {
        id: 'agent-456',
        name: 'Default Agent',
        description: '',
        systemPrompt: 'Default system prompt',
        model: 'anthropic/claude-3-5-sonnet',
        temperature: 1.0,
        maxTokens: 4096,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        addAgent: { agent: [mockAgent] },
      });

      const result = await repository.create(
        'Default Agent',
        undefined,
        'Default system prompt',
        'anthropic/claude-3-5-sonnet',
        1.0,
        4096,
        'workspace-123'
      );

      expect(result.temperature).toBe(1.0);
      expect(result.maxTokens).toBe(4096);
    });
  });

  describe('update', () => {
    it('should update agent with all fields', async () => {
      const mockAgent: dgraphResolversTypes.Agent = {
        id: 'agent-456',
        name: 'Updated Agent',
        description: 'Updated Description',
        systemPrompt: 'Updated system prompt',
        model: 'openai/gpt-4o',
        temperature: 0.5,
        maxTokens: 8192,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        updateAgent: { agent: [mockAgent] },
      });

      const result = await repository.update(
        'agent-456',
        'Updated Agent',
        'Updated Description',
        'Updated system prompt',
        'openai/gpt-4o',
        0.5,
        8192
      );

      expect(mockDgraphService.mutation).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          id: 'agent-456',
          name: 'Updated Agent',
          description: 'Updated Description',
          systemPrompt: 'Updated system prompt',
          model: 'openai/gpt-4o',
          temperature: 0.5,
          maxTokens: 8192,
        })
      );

      expect(result).toEqual(mockAgent);
    });

    it('should update agent with partial fields', async () => {
      const mockAgent: dgraphResolversTypes.Agent = {
        id: 'agent-456',
        name: 'Updated Name Only',
        description: 'Original Description',
        systemPrompt: 'Original prompt',
        model: 'openai/gpt-4',
        temperature: 1.0,
        maxTokens: 4096,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        updateAgent: { agent: [mockAgent] },
      });

      await repository.update('agent-456', 'Updated Name Only');

      expect(mockDgraphService.mutation).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          id: 'agent-456',
          name: 'Updated Name Only',
        })
      );
    });

    it('should update only temperature and maxTokens', async () => {
      const mockAgent: dgraphResolversTypes.Agent = {
        id: 'agent-456',
        name: 'Test Agent',
        description: 'Test Description',
        systemPrompt: 'Original prompt',
        model: 'openai/gpt-4',
        temperature: 0.3,
        maxTokens: 1024,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        updateAgent: { agent: [mockAgent] },
      });

      await repository.update(
        'agent-456',
        undefined,
        undefined,
        undefined,
        undefined,
        0.3,
        1024
      );

      expect(mockDgraphService.mutation).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          id: 'agent-456',
          temperature: 0.3,
          maxTokens: 1024,
        })
      );
    });
  });

  describe('delete', () => {
    it('should delete agent by id', async () => {
      const mockAgent: dgraphResolversTypes.Agent = {
        id: 'agent-456',
        name: 'Test Agent',
        description: '',
        systemPrompt: 'Test prompt',
        model: 'openai/gpt-4',
        temperature: 1.0,
        maxTokens: 4096,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      vi.spyOn(mockDgraphService, 'mutation').mockResolvedValue({
        deleteAgent: { agent: [mockAgent] },
      });

      const result = await repository.delete('agent-456');

      expect(mockDgraphService.mutation).toHaveBeenCalledWith(
        expect.any(Object),
        { id: 'agent-456' }
      );

      expect(result).toEqual(mockAgent);
    });
  });

  describe('findById', () => {
    it('should return agent when found', async () => {
      const mockAgent: dgraphResolversTypes.Agent = {
        id: 'agent-456',
        name: 'Test Agent',
        description: 'Test Description',
        systemPrompt: 'Test prompt',
        model: 'openai/gpt-4',
        temperature: 1.0,
        maxTokens: 4096,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        getAgent: mockAgent,
      });

      const result = await repository.findById('agent-456');

      expect(mockDgraphService.query).toHaveBeenCalledWith(
        expect.any(Object),
        { id: 'agent-456' }
      );

      expect(result).toEqual(mockAgent);
    });

    it('should return null when agent not found', async () => {
      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        getAgent: null,
      });

      const result = await repository.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('findAllByWorkspaceId', () => {
    it('should return all agents for a workspace', async () => {
      const mockAgents: dgraphResolversTypes.Agent[] = [
        {
          id: 'agent-1',
          name: 'Agent 1',
          description: 'First agent',
          systemPrompt: 'Prompt 1',
          model: 'openai/gpt-4',
          temperature: 1.0,
          maxTokens: 4096,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          workspace: mockWorkspace,
        },
        {
          id: 'agent-2',
          name: 'Agent 2',
          description: 'Second agent',
          systemPrompt: 'Prompt 2',
          model: 'anthropic/claude-3-5-sonnet',
          temperature: 0.7,
          maxTokens: 2048,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          workspace: mockWorkspace,
        },
      ];

      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        getWorkspace: { agents: mockAgents },
      });

      const result = await repository.findAllByWorkspaceId('workspace-123');

      expect(mockDgraphService.query).toHaveBeenCalledWith(
        expect.any(Object),
        { workspaceId: 'workspace-123' }
      );

      expect(result).toEqual(mockAgents);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when workspace has no agents', async () => {
      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        getWorkspace: { agents: [] },
      });

      const result = await repository.findAllByWorkspaceId('workspace-123');

      expect(result).toEqual([]);
    });

    it('should return empty array when workspace not found', async () => {
      vi.spyOn(mockDgraphService, 'query').mockResolvedValue({
        getWorkspace: null,
      });

      const result = await repository.findAllByWorkspaceId('nonexistent-workspace');

      expect(result).toEqual([]);
    });
  });
});
