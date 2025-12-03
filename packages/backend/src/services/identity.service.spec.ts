import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { IdentityService } from './identity.service';
import { IdentityRepository } from '../repositories/identity.repository';
import { KeyRateLimiterService } from './key-rate-limiter.service';
import { SystemRepository } from '../repositories/system.repository';
import { WorkspaceRepository } from '../repositories/workspace.repository';
import { RuntimeRepository } from '../repositories/runtime.repository';
import { SkillRepository } from '../repositories/skill.repository';
import { LoggerService, NatsService, dgraphResolversTypes } from '@2ly/common';

type Workspace = dgraphResolversTypes.Workspace;

// Mock dependencies
vi.mock('../repositories/identity.repository');
vi.mock('./key-rate-limiter.service');
vi.mock('../repositories/system.repository');
vi.mock('../repositories/workspace.repository');
vi.mock('../repositories/runtime.repository');
vi.mock('../repositories/skill.repository');
vi.mock('@2ly/common', async () => {
  const actual = await vi.importActual('@2ly/common');
  return {
    ...actual,
    LoggerService: vi.fn(),
    NatsService: vi.fn(),
  };
});

describe('IdentityService', () => {
  let service: IdentityService;
  let mockLoggerService: LoggerService;
  let mockNatsService: NatsService;
  let mockIdentityRepository: IdentityRepository;
  let mockKeyRateLimiter: KeyRateLimiterService;
  let mockSystemRepository: SystemRepository;
  let mockWorkspaceRepository: WorkspaceRepository;
  let mockRuntimeRepository: RuntimeRepository;
  let mockToolsetRepository: SkillRepository;
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
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    } as unknown as ReturnType<LoggerService['getLogger']>;

    mockLoggerService = {
      getLogger: vi.fn().mockReturnValue(mockLogger),
    } as unknown as LoggerService;

    mockNatsService = {
      subscribe: vi.fn(),
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
      isHealthy: vi.fn().mockReturnValue(true),
    } as unknown as NatsService;

    mockIdentityRepository = {
      findKey: vi.fn(),
    } as unknown as IdentityRepository;

    mockKeyRateLimiter = {
      checkKeyAttempt: vi.fn(),
      recordSuccessfulAttempt: vi.fn(),
      recordFailedAttempt: vi.fn(),
    } as unknown as KeyRateLimiterService;

    mockSystemRepository = {
      getSystem: vi.fn(),
    } as unknown as SystemRepository;

    mockWorkspaceRepository = {
      findById: vi.fn(),
    } as unknown as WorkspaceRepository;

    mockRuntimeRepository = {
      findByName: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      setRoots: vi.fn(),
    } as unknown as RuntimeRepository;

    mockToolsetRepository = {
      findByName: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
    } as unknown as SkillRepository;

    service = new IdentityService(
      mockLoggerService,
      mockNatsService,
      mockIdentityRepository,
      mockKeyRateLimiter,
      mockSystemRepository,
      mockWorkspaceRepository,
      mockRuntimeRepository,
      mockToolsetRepository
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleHandshake - System Identity', () => {
    it('should create runtime for system identity when runtime does not exist', async () => {
      const mockRuntime: dgraphResolversTypes.Runtime = {
        id: 'runtime-456',
        name: 'test-runtime',
        status: dgraphResolversTypes.ActiveStatus.Active,
        type: dgraphResolversTypes.RuntimeType.Edge,
        createdAt: new Date().toISOString(),
      };

      const handshakeRequest = {
        data: {
          key: 'SYSK1234567890',
          nature: 'runtime' as const,
          name: 'test-runtime',
          hostIP: '192.168.1.1',
          pid: 1234,
          hostname: 'test-host',
        },
        respond: vi.fn(),
      };

      vi.spyOn(mockKeyRateLimiter, 'checkKeyAttempt').mockReturnValue(true);
      vi.spyOn(mockIdentityRepository, 'findKey').mockResolvedValue({
        nature: 'system',
        relatedId: 'system-123',
      });
      vi.spyOn(mockSystemRepository, 'getSystem').mockResolvedValue(mockSystem);
      vi.spyOn(mockRuntimeRepository, 'findByName').mockResolvedValue(undefined);
      vi.spyOn(mockRuntimeRepository, 'create').mockResolvedValue(mockRuntime);

      // Call private method via any cast
      await (service as unknown as { handleHandshake: (msg: unknown) => Promise<void> }).handleHandshake(handshakeRequest);

      expect(mockRuntimeRepository.create).toHaveBeenCalledWith(
        'system',
        'system-123',
        'test-runtime',
        '',
        'ACTIVE',
        'EDGE'
      );
      expect(handshakeRequest.respond).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nature: 'runtime',
            id: 'runtime-456',
            name: 'test-runtime',
            workspaceId: null,
          }),
        })
      );
    });

    it('should use existing runtime for system identity when runtime exists', async () => {
      const mockRuntime: dgraphResolversTypes.Runtime = {
        id: 'runtime-existing',
        name: 'test-runtime',
        status: dgraphResolversTypes.ActiveStatus.Active,
        type: dgraphResolversTypes.RuntimeType.Edge,
        createdAt: new Date().toISOString(),
      };

      const handshakeRequest = {
        data: {
          key: 'SYSK1234567890',
          nature: 'runtime' as const,
          name: 'test-runtime',
          hostIP: '192.168.1.1',
        },
        respond: vi.fn(),
      };

      vi.spyOn(mockKeyRateLimiter, 'checkKeyAttempt').mockReturnValue(true);
      vi.spyOn(mockIdentityRepository, 'findKey').mockResolvedValue({
        nature: 'system',
        relatedId: 'system-123',
      });
      vi.spyOn(mockSystemRepository, 'getSystem').mockResolvedValue(mockSystem);
      vi.spyOn(mockRuntimeRepository, 'findByName').mockResolvedValue(mockRuntime);

      await (service as unknown as { handleHandshake: (msg: unknown) => Promise<void> }).handleHandshake(handshakeRequest);

      expect(mockRuntimeRepository.create).not.toHaveBeenCalled();
      expect(handshakeRequest.respond).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nature: 'runtime',
            id: 'runtime-existing',
            name: 'test-runtime',
          }),
        })
      );
    });
  });

  describe('handleHandshake - Workspace Identity', () => {
    it('should create runtime for workspace identity when runtime does not exist', async () => {
      const mockRuntime: dgraphResolversTypes.Runtime = {
        id: 'runtime-456',
        name: 'test-runtime',
        status: dgraphResolversTypes.ActiveStatus.Active,
        type: dgraphResolversTypes.RuntimeType.Edge,
        createdAt: new Date().toISOString(),
      };

      const handshakeRequest = {
        data: {
          key: 'WSK1234567890',
          nature: 'runtime' as const,
          name: 'test-runtime',
          hostIP: '192.168.1.1',
        },
        respond: vi.fn(),
      };

      vi.spyOn(mockKeyRateLimiter, 'checkKeyAttempt').mockReturnValue(true);
      vi.spyOn(mockIdentityRepository, 'findKey').mockResolvedValue({
        nature: 'workspace',
        relatedId: 'workspace-123',
      });
      vi.spyOn(mockWorkspaceRepository, 'findById').mockResolvedValue(mockWorkspace);
      vi.spyOn(mockRuntimeRepository, 'findByName').mockResolvedValue(undefined);
      vi.spyOn(mockRuntimeRepository, 'create').mockResolvedValue(mockRuntime);

      await (service as unknown as { handleHandshake: (msg: unknown) => Promise<void> }).handleHandshake(handshakeRequest);

      expect(mockRuntimeRepository.create).toHaveBeenCalledWith(
        'workspace',
        'workspace-123',
        'test-runtime',
        '',
        'ACTIVE',
        'EDGE'
      );
      expect(handshakeRequest.respond).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nature: 'runtime',
            id: 'runtime-456',
            name: 'test-runtime',
            workspaceId: 'workspace-123',
          }),
        })
      );
    });

    it('should create skill for workspace identity when skill does not exist', async () => {
      const mockToolset: dgraphResolversTypes.Skill = {
        id: 'skill-789',
        name: 'test-skill',
        createdAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      const handshakeRequest = {
        data: {
          key: 'WSK1234567890',
          nature: 'skill' as const,
          name: 'test-skill',
          hostIP: '192.168.1.1',
        },
        respond: vi.fn(),
      };

      vi.spyOn(mockKeyRateLimiter, 'checkKeyAttempt').mockReturnValue(true);
      vi.spyOn(mockIdentityRepository, 'findKey').mockResolvedValue({
        nature: 'workspace',
        relatedId: 'workspace-123',
      });
      vi.spyOn(mockWorkspaceRepository, 'findById').mockResolvedValue(mockWorkspace);
      vi.spyOn(mockToolsetRepository, 'findByName').mockResolvedValue(null);
      vi.spyOn(mockToolsetRepository, 'create').mockResolvedValue(mockToolset);

      await (service as unknown as { handleHandshake: (msg: unknown) => Promise<void> }).handleHandshake(handshakeRequest);

      expect(mockToolsetRepository.create).toHaveBeenCalledWith('test-skill', '', 'workspace-123');
      expect(handshakeRequest.respond).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nature: 'skill',
            id: 'skill-789',
            name: 'test-skill',
            workspaceId: 'workspace-123',
          }),
        })
      );
    });

    it('should use existing skill for workspace identity when skill exists', async () => {
      const mockToolset: dgraphResolversTypes.Skill = {
        id: 'skill-existing',
        name: 'test-skill',
        createdAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      const handshakeRequest = {
        data: {
          key: 'WSK1234567890',
          nature: 'skill' as const,
          name: 'test-skill',
          hostIP: '192.168.1.1',
        },
        respond: vi.fn(),
      };

      vi.spyOn(mockKeyRateLimiter, 'checkKeyAttempt').mockReturnValue(true);
      vi.spyOn(mockIdentityRepository, 'findKey').mockResolvedValue({
        nature: 'workspace',
        relatedId: 'workspace-123',
      });
      vi.spyOn(mockWorkspaceRepository, 'findById').mockResolvedValue(mockWorkspace);
      vi.spyOn(mockToolsetRepository, 'findByName').mockResolvedValue(mockToolset);

      await (service as unknown as { handleHandshake: (msg: unknown) => Promise<void> }).handleHandshake(handshakeRequest);

      expect(mockToolsetRepository.create).not.toHaveBeenCalled();
      expect(handshakeRequest.respond).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nature: 'skill',
            id: 'skill-existing',
            name: 'test-skill',
          }),
        })
      );
    });
  });

  describe('handleHandshake - Direct Runtime Identity', () => {
    it('should authenticate runtime with direct runtime identity', async () => {
      const mockRuntime: dgraphResolversTypes.Runtime = {
        id: 'runtime-456',
        name: 'test-runtime',
        status: dgraphResolversTypes.ActiveStatus.Active,
        type: dgraphResolversTypes.RuntimeType.Edge,
        createdAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      const handshakeRequest = {
        data: {
          key: 'RTK1234567890',
          nature: 'runtime' as const,
          name: 'test-runtime',
          hostIP: '192.168.1.1',
        },
        respond: vi.fn(),
      };

      vi.spyOn(mockKeyRateLimiter, 'checkKeyAttempt').mockReturnValue(true);
      vi.spyOn(mockIdentityRepository, 'findKey').mockResolvedValue({
        nature: 'runtime',
        relatedId: 'runtime-456',
      });
      vi.spyOn(mockRuntimeRepository, 'findById').mockResolvedValue(mockRuntime);

      await (service as unknown as { handleHandshake: (msg: unknown) => Promise<void> }).handleHandshake(handshakeRequest);

      expect(handshakeRequest.respond).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nature: 'runtime',
            id: 'runtime-456',
            name: 'test-runtime',
            workspaceId: 'workspace-123',
          }),
        })
      );
    });

    it('should set roots when provided in handshake', async () => {
      const mockRuntime: dgraphResolversTypes.Runtime = {
        id: 'runtime-456',
        name: 'test-runtime',
        status: dgraphResolversTypes.ActiveStatus.Active,
        type: dgraphResolversTypes.RuntimeType.Edge,
        createdAt: new Date().toISOString(),
      };

      const handshakeRequest = {
        data: {
          key: 'RTK1234567890',
          nature: 'runtime' as const,
          name: 'test-runtime',
          hostIP: '192.168.1.1',
          roots: [{ id: 'root1', key: 'temp' }],
        },
        respond: vi.fn(),
      };

      vi.spyOn(mockKeyRateLimiter, 'checkKeyAttempt').mockReturnValue(true);
      vi.spyOn(mockIdentityRepository, 'findKey').mockResolvedValue({
        nature: 'runtime',
        relatedId: 'runtime-456',
      });
      vi.spyOn(mockRuntimeRepository, 'findById').mockResolvedValue(mockRuntime);

      await (service as unknown as { handleHandshake: (msg: unknown) => Promise<void> }).handleHandshake(handshakeRequest);

      expect(mockRuntimeRepository.setRoots).toHaveBeenCalledWith('runtime-456', [
        { id: 'root1', key: 'temp' },
      ]);
    });
  });

  describe('handleHandshake - Direct Toolset Identity', () => {
    it('should authenticate skill with direct skill identity', async () => {
      const mockToolset: dgraphResolversTypes.Skill = {
        id: 'skill-789',
        name: 'test-skill',
        createdAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      const handshakeRequest = {
        data: {
          key: 'TSK1234567890',
          nature: 'skill' as const,
          name: 'test-skill',
          hostIP: '192.168.1.1',
        },
        respond: vi.fn(),
      };

      vi.spyOn(mockKeyRateLimiter, 'checkKeyAttempt').mockReturnValue(true);
      vi.spyOn(mockIdentityRepository, 'findKey').mockResolvedValue({
        nature: 'skill',
        relatedId: 'skill-789',
      });
      vi.spyOn(mockToolsetRepository, 'findById').mockResolvedValue(mockToolset);

      await (service as unknown as { handleHandshake: (msg: unknown) => Promise<void> }).handleHandshake(handshakeRequest);

      expect(handshakeRequest.respond).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nature: 'skill',
            id: 'skill-789',
            name: 'test-skill',
            workspaceId: 'workspace-123',
          }),
        })
      );
    });
  });

  describe('handleHandshake - Rate Limiting', () => {
    it('should reject handshake when rate limit is exceeded', async () => {
      const handshakeRequest = {
        data: {
          key: 'WSK1234567890',
          nature: 'runtime' as const,
          name: 'test-runtime',
          hostIP: '192.168.1.1',
        },
        respond: vi.fn(),
      };

      vi.spyOn(mockKeyRateLimiter, 'checkKeyAttempt').mockReturnValue(false);

      await (service as unknown as { handleHandshake: (msg: unknown) => Promise<void> }).handleHandshake(handshakeRequest);

      expect(mockIdentityRepository.findKey).not.toHaveBeenCalled();
      expect(handshakeRequest.respond).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            error: 'AUTHENTICATION_FAILED',
          }),
        })
      );
    });

    it('should record successful attempt on valid key', async () => {
      const mockRuntime: dgraphResolversTypes.Runtime = {
        id: 'runtime-456',
        name: 'test-runtime',
        status: dgraphResolversTypes.ActiveStatus.Active,
        type: dgraphResolversTypes.RuntimeType.Edge,
        createdAt: new Date().toISOString(),
      };

      const handshakeRequest = {
        data: {
          key: 'WSK12345678',
          nature: 'runtime' as const,
          name: 'test-runtime',
          hostIP: '192.168.1.1',
        },
        respond: vi.fn(),
      };

      vi.spyOn(mockKeyRateLimiter, 'checkKeyAttempt').mockReturnValue(true);
      vi.spyOn(mockIdentityRepository, 'findKey').mockResolvedValue({
        nature: 'workspace',
        relatedId: 'workspace-123',
      });
      vi.spyOn(mockWorkspaceRepository, 'findById').mockResolvedValue(mockWorkspace);
      vi.spyOn(mockRuntimeRepository, 'findByName').mockResolvedValue(mockRuntime);

      await (service as unknown as { handleHandshake: (msg: unknown) => Promise<void> }).handleHandshake(handshakeRequest);

      expect(mockKeyRateLimiter.recordSuccessfulAttempt).toHaveBeenCalledWith('WSK12345');
    });

    it('should record failed attempt on invalid key', async () => {
      const handshakeRequest = {
        data: {
          key: 'WSK12345678',
          nature: 'runtime' as const,
          name: 'test-runtime',
          hostIP: '192.168.1.1',
        },
        respond: vi.fn(),
      };

      vi.spyOn(mockKeyRateLimiter, 'checkKeyAttempt').mockReturnValue(true);
      vi.spyOn(mockIdentityRepository, 'findKey').mockRejectedValue(new Error('NOT_FOUND'));

      await (service as unknown as { handleHandshake: (msg: unknown) => Promise<void> }).handleHandshake(handshakeRequest);

      expect(mockKeyRateLimiter.recordFailedAttempt).toHaveBeenCalledWith('WSK12345', '192.168.1.1');
      expect(handshakeRequest.respond).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            error: 'AUTHENTICATION_FAILED',
          }),
        })
      );
    });
  });

  describe('handleHandshake - Error Masking', () => {
    it('should mask NOT_FOUND error as AUTHENTICATION_FAILED', async () => {
      const handshakeRequest = {
        data: {
          key: 'WSK1234567890',
          nature: 'runtime' as const,
          name: 'test-runtime',
          hostIP: '192.168.1.1',
        },
        respond: vi.fn(),
      };

      vi.spyOn(mockKeyRateLimiter, 'checkKeyAttempt').mockReturnValue(true);
      vi.spyOn(mockIdentityRepository, 'findKey').mockRejectedValue(new Error('NOT_FOUND'));

      await (service as unknown as { handleHandshake: (msg: unknown) => Promise<void> }).handleHandshake(handshakeRequest);

      expect(handshakeRequest.respond).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            error: 'AUTHENTICATION_FAILED',
          }),
        })
      );
    });

    it('should mask EXPIRED error as AUTHENTICATION_FAILED', async () => {
      const handshakeRequest = {
        data: {
          key: 'WSK1234567890',
          nature: 'runtime' as const,
          name: 'test-runtime',
          hostIP: '192.168.1.1',
        },
        respond: vi.fn(),
      };

      vi.spyOn(mockKeyRateLimiter, 'checkKeyAttempt').mockReturnValue(true);
      vi.spyOn(mockIdentityRepository, 'findKey').mockRejectedValue(new Error('EXPIRED'));

      await (service as unknown as { handleHandshake: (msg: unknown) => Promise<void> }).handleHandshake(handshakeRequest);

      expect(handshakeRequest.respond).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            error: 'AUTHENTICATION_FAILED',
          }),
        })
      );
    });

    it('should mask workspace not found error as AUTHENTICATION_FAILED', async () => {
      const handshakeRequest = {
        data: {
          key: 'WSK1234567890',
          nature: 'runtime' as const,
          name: 'test-runtime',
          hostIP: '192.168.1.1',
        },
        respond: vi.fn(),
      };

      vi.spyOn(mockKeyRateLimiter, 'checkKeyAttempt').mockReturnValue(true);
      vi.spyOn(mockIdentityRepository, 'findKey').mockResolvedValue({
        nature: 'workspace',
        relatedId: 'workspace-123',
      });
      vi.spyOn(mockWorkspaceRepository, 'findById').mockResolvedValue(null as unknown as Workspace);

      await (service as unknown as { handleHandshake: (msg: unknown) => Promise<void> }).handleHandshake(handshakeRequest);

      expect(handshakeRequest.respond).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            error: 'AUTHENTICATION_FAILED',
          }),
        })
      );
    });
  });

  describe('handleHandshake - Callbacks', () => {
    it('should invoke runtime handshake callbacks', async () => {
      const mockRuntime: dgraphResolversTypes.Runtime = {
        id: 'runtime-456',
        name: 'test-runtime',
        status: dgraphResolversTypes.ActiveStatus.Active,
        type: dgraphResolversTypes.RuntimeType.Edge,
        createdAt: new Date().toISOString(),
      };

      const handshakeRequest = {
        data: {
          key: 'RTK1234567890',
          nature: 'runtime' as const,
          name: 'test-runtime',
          hostIP: '192.168.1.1',
          pid: 1234,
          hostname: 'test-host',
        },
        respond: vi.fn(),
      };

      const callback1 = vi.fn();
      const callback2 = vi.fn();

      service.onHandshake('runtime', callback1);
      service.onHandshake('runtime', callback2);

      vi.spyOn(mockKeyRateLimiter, 'checkKeyAttempt').mockReturnValue(true);
      vi.spyOn(mockIdentityRepository, 'findKey').mockResolvedValue({
        nature: 'runtime',
        relatedId: 'runtime-456',
      });
      vi.spyOn(mockRuntimeRepository, 'findById').mockResolvedValue(mockRuntime);

      await (service as unknown as { handleHandshake: (msg: unknown) => Promise<void> }).handleHandshake(handshakeRequest);

      expect(callback1).toHaveBeenCalledWith({
        instance: mockRuntime,
        pid: 1234,
        hostIP: '192.168.1.1',
        hostname: 'test-host',
      });
      expect(callback2).toHaveBeenCalledWith({
        instance: mockRuntime,
        pid: 1234,
        hostIP: '192.168.1.1',
        hostname: 'test-host',
      });
    });

    it('should invoke skill handshake callbacks', async () => {
      const mockToolset: dgraphResolversTypes.Skill = {
        id: 'skill-789',
        name: 'test-skill',
        createdAt: new Date().toISOString(),
        workspace: mockWorkspace,
      };

      const handshakeRequest = {
        data: {
          key: 'TSK1234567890',
          nature: 'skill' as const,
          name: 'test-skill',
          hostIP: '192.168.1.1',
          pid: 5678,
          hostname: 'skill-host',
        },
        respond: vi.fn(),
      };

      const callback = vi.fn();
      service.onHandshake('skill', callback);

      vi.spyOn(mockKeyRateLimiter, 'checkKeyAttempt').mockReturnValue(true);
      vi.spyOn(mockIdentityRepository, 'findKey').mockResolvedValue({
        nature: 'skill',
        relatedId: 'skill-789',
      });
      vi.spyOn(mockToolsetRepository, 'findById').mockResolvedValue(mockToolset);

      await (service as unknown as { handleHandshake: (msg: unknown) => Promise<void> }).handleHandshake(handshakeRequest);

      expect(callback).toHaveBeenCalledWith({
        instance: mockToolset,
        pid: 5678,
        hostIP: '192.168.1.1',
        hostname: 'skill-host',
      });
    });

    it('should allow removing callbacks', async () => {
      const callback = vi.fn();
      const callbackId = service.onHandshake('runtime', callback);

      service.offHandshake('runtime', callbackId);

      const mockRuntime: dgraphResolversTypes.Runtime = {
        id: 'runtime-456',
        name: 'test-runtime',
        status: dgraphResolversTypes.ActiveStatus.Active,
        type: dgraphResolversTypes.RuntimeType.Edge,
        createdAt: new Date().toISOString(),
      };

      const handshakeRequest = {
        data: {
          key: 'RTK1234567890',
          nature: 'runtime' as const,
          name: 'test-runtime',
          hostIP: '192.168.1.1',
        },
        respond: vi.fn(),
      };

      vi.spyOn(mockKeyRateLimiter, 'checkKeyAttempt').mockReturnValue(true);
      vi.spyOn(mockIdentityRepository, 'findKey').mockResolvedValue({
        nature: 'runtime',
        relatedId: 'runtime-456',
      });
      vi.spyOn(mockRuntimeRepository, 'findById').mockResolvedValue(mockRuntime);

      await (service as unknown as { handleHandshake: (msg: unknown) => Promise<void> }).handleHandshake(handshakeRequest);

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
