/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MainService } from './backend.main.service';
import { DGraphService } from './dgraph.service';

// Mock the DI container
vi.mock('../di/container', () => ({
  container: {
    get: vi.fn(),
  },
}));

// Mock dependencies
interface FakeDGraphService {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  initSchema: (dropAllData: boolean) => Promise<void>;
  dropAll: () => Promise<void>;
  isConnected: () => boolean;
}

interface FakeApolloService {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  isRunning: () => boolean;
}

interface FakeRuntimeService {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  isRunning: () => boolean;
  resetRuntimes: () => Promise<void>;
}

interface FakeToolSetService {
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

interface FakeFastifyService {
  fastify: {
    get: (path: string, handler: (req: unknown, res: unknown) => Promise<void>) => void;
  };
}

interface FakeSystemRepository {
  getSystem: () => Promise<{ instanceId: string; defaultWorkspace?: { name: string } | null; admins?: { id: string }[] } | null>;
  createSystem: () => Promise<{ instanceId: string; admins?: { id: string }[] }>;
  setDefaultWorkspace: (id: string) => Promise<void>;
  stopObservingRuntimes: () => void;
}

interface FakeWorkspaceRepository {
  create: (name: string, adminId: string) => Promise<{ id: string; name: string }>;
}

interface FakeMonitoringService {
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

interface FakeIdentityService {
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

function createService(dropAllData: boolean = false) {
  const logger = {
    getLogger: () => ({
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
    }),
  } as unknown as import('@2ly/common').LoggerService;

  const dgraphService: FakeDGraphService = {
    start: vi.fn(async () => {}),
    stop: vi.fn(async () => {}),
    initSchema: vi.fn(async () => {}),
    dropAll: vi.fn(async () => {}),
    isConnected: vi.fn(() => true),
  };

  const apolloService: FakeApolloService = {
    start: vi.fn(async () => {}),
    stop: vi.fn(async () => {}),
    isRunning: vi.fn(() => true),
  };

  const runtimeService: FakeRuntimeService = {
    start: vi.fn(async () => {}),
    stop: vi.fn(async () => {}),
    isRunning: vi.fn(() => true),
    resetRuntimes: vi.fn(async () => {}),
  };

  const toolSetService: FakeToolSetService = {
    start: vi.fn(async () => {}),
    stop: vi.fn(async () => {}),
  };

  let healthCheckHandler: ((req: unknown, res: unknown) => Promise<void>) | null = null;
  let resetHandler: ((req: unknown, res: unknown) => Promise<void>) | null = null;

  const fastifyService: FakeFastifyService = {
    fastify: {
      get: vi.fn((path: string, handler: (req: unknown, res: unknown) => Promise<void>) => {
        if (path === '/health') {
          healthCheckHandler = handler;
        } else if (path === '/reset') {
          resetHandler = handler;
        }
      }),
    },
  };

  const systemRepository: FakeSystemRepository = {
    getSystem: vi.fn(async () => null),
    createSystem: vi.fn(async () => ({ instanceId: 'sys-1', admins: [{ id: 'admin-1' }] })),
    setDefaultWorkspace: vi.fn(async () => {}),
    stopObservingRuntimes: vi.fn(),
  };

  const workspaceRepository: FakeWorkspaceRepository = {
    create: vi.fn(async (name: string) => ({ id: 'ws-1', name })),
  };

  const monitoringService: FakeMonitoringService = {
    start: vi.fn(async () => {}),
    stop: vi.fn(async () => {}),
  };

  const identityService: FakeIdentityService = {
    start: vi.fn(async () => {}),
    stop: vi.fn(async () => {}),
  };

  const service = new MainService(
    logger,
    dgraphService as unknown as import('./dgraph.service').DGraphService,
    apolloService as unknown as import('./apollo.service').ApolloService,
    runtimeService as unknown as import('./runtime.service').RuntimeService,
    toolSetService as unknown as import('./toolset.service').ToolSetService,
    fastifyService as unknown as import('./fastify.service').FastifyService,
    systemRepository as unknown as import('../repositories').SystemRepository,
    workspaceRepository as unknown as import('../repositories').WorkspaceRepository,
    monitoringService as unknown as import('./monitoring.service').MonitoringService,
    identityService as unknown as import('./identity.service').IdentityService,
  );

  // Set the dropAllData property
  (service as unknown as { dropAllData: boolean }).dropAllData = dropAllData;

  return {
    service,
    dgraphService,
    apolloService,
    runtimeService,
    toolSetService,
    fastifyService,
    systemRepository,
    workspaceRepository,
    monitoringService,
    identityService,
    healthCheckHandler: () => healthCheckHandler,
    resetHandler: () => resetHandler,
  };
}

describe('MainService', () => {
  describe('initialization', () => {
    it('initializes schema with dropAllData=false by default', async () => {
      const { service, dgraphService } = createService(false);
      await service.start('test');
      expect(dgraphService.initSchema).toHaveBeenCalledWith(false);
      await service.stop('test');
    });

    it('initializes schema with dropAllData=true when set', async () => {
      const { service, dgraphService } = createService(true);
      await service.start('test');
      expect(dgraphService.initSchema).toHaveBeenCalledWith(true);
      await service.stop('test');
    });

    it('starts all services in correct order', async () => {
      const { service, dgraphService, identityService, runtimeService, toolSetService, apolloService, monitoringService } = createService();
      const callOrder: string[] = [];

      dgraphService.start = vi.fn(async () => { callOrder.push('dgraph'); });
      identityService.start = vi.fn(async () => { callOrder.push('identity'); });
      runtimeService.start = vi.fn(async () => { callOrder.push('runtime'); });
      toolSetService.start = vi.fn(async () => { callOrder.push('toolset'); });
      apolloService.start = vi.fn(async () => { callOrder.push('apollo'); });
      monitoringService.start = vi.fn(async () => { callOrder.push('monitoring'); });

      await service.start('test');

      expect(callOrder).toEqual(['dgraph', 'identity', 'runtime', 'toolset', 'apollo', 'monitoring']);
      await service.stop('test');
    });

    it('creates system and default workspace if not exists', async () => {
      const { service, systemRepository, workspaceRepository } = createService();
      await service.start('test');
      expect(systemRepository.getSystem).toHaveBeenCalled();
      expect(systemRepository.createSystem).toHaveBeenCalled();
      expect(workspaceRepository.create).toHaveBeenCalledWith('Default', 'admin-1');
      expect(systemRepository.setDefaultWorkspace).toHaveBeenCalledWith('ws-1');
      await service.stop('test');
    });

    it('does not create system if already exists', async () => {
      const { service, systemRepository, workspaceRepository } = createService();
      systemRepository.getSystem = vi.fn(async () => ({
        instanceId: 'existing-sys',
        defaultWorkspace: { name: 'Default' },
        admins: [{ id: 'admin-1' }],
      }));

      await service.start('test');

      expect(systemRepository.createSystem).not.toHaveBeenCalled();
      expect(workspaceRepository.create).not.toHaveBeenCalled();
      await service.stop('test');
    });
  });

  describe('health check endpoint', () => {
    it('registers health check endpoint', async () => {
      const { service, fastifyService } = createService();
      await service.start('test');
      expect(fastifyService.fastify.get).toHaveBeenCalledWith('/health', expect.any(Function));
      await service.stop('test');
    });

    it('returns 200 when services are running', async () => {
      const { service, healthCheckHandler } = createService();
      await service.start('test');

      const handler = healthCheckHandler();
      expect(handler).not.toBeNull();

      const res = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      };

      await handler!(null, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({ status: 'ok' });
      await service.stop('test');
    });

    it('returns 503 when runtime is not running', async () => {
      const { service, runtimeService, healthCheckHandler } = createService();
      runtimeService.isRunning = vi.fn(() => false);
      await service.start('test');

      const handler = healthCheckHandler();
      const res = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      };

      await handler!(null, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.send).toHaveBeenCalledWith({ status: 'error', message: 'Service not running' });
      await service.stop('test');
    });

    it('returns 503 when apollo is not running', async () => {
      const { service, apolloService, healthCheckHandler } = createService();
      apolloService.isRunning = vi.fn(() => false);
      await service.start('test');

      const handler = healthCheckHandler();
      const res = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      };

      await handler!(null, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.send).toHaveBeenCalledWith({ status: 'error', message: 'Service not running' });
      await service.stop('test');
    });
  });

  describe('reset endpoint', () => {
    it('registers reset endpoint', async () => {
      const { service, fastifyService } = createService();
      await service.start('test');
      expect(fastifyService.fastify.get).toHaveBeenCalledWith('/reset', expect.any(Function));
      await service.stop('test');
    });

    it('resets runtimes and reinitializes database', async () => {
      const { service, runtimeService, dgraphService, systemRepository, workspaceRepository, resetHandler } = createService();

      // Mock the container.get to return our dgraphService mock
      const { container } = await import('../di/container');
      vi.mocked(container.get).mockImplementation((serviceIdentifier) => {
        if (serviceIdentifier === DGraphService) {
          return dgraphService;
        }
        return undefined;
      });

      await service.start('test');

      const handler = resetHandler();
      expect(handler).not.toBeNull();

      const res = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      };

      // Reset the mock call counts
      vi.clearAllMocks();

      await handler!(null, res);

      expect(runtimeService.resetRuntimes).toHaveBeenCalled();
      expect(dgraphService.dropAll).toHaveBeenCalled();
      expect(dgraphService.initSchema).toHaveBeenCalledWith(true);
      expect(res.send).toHaveBeenCalledWith({ response: 'OK' });
      await service.stop('test');
    });

    it('handles reset errors gracefully', async () => {
      const { service, runtimeService, dgraphService, resetHandler } = createService();
      runtimeService.resetRuntimes = vi.fn(async () => {
        throw new Error('Reset failed');
      });

      // Mock the container.get to return our dgraphService mock
      const { container } = await import('../di/container');
      vi.mocked(container.get).mockImplementation((serviceIdentifier) => {
        if (serviceIdentifier === DGraphService) {
          return dgraphService;
        }
        return undefined;
      });

      await service.start('test');

      const handler = resetHandler();
      const res = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      };

      await handler!(null, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Error during reset');
      await service.stop('test');
    });
  });

  describe('shutdown', () => {
    it('stops all services in correct order', async () => {
      const { service, identityService, runtimeService, apolloService, monitoringService, dgraphService, toolSetService } = createService();
      const callOrder: string[] = [];

      identityService.stop = vi.fn(async () => { callOrder.push('identity'); });
      runtimeService.stop = vi.fn(async () => { callOrder.push('runtime'); });
      apolloService.stop = vi.fn(async () => { callOrder.push('apollo'); });
      monitoringService.stop = vi.fn(async () => { callOrder.push('monitoring'); });
      dgraphService.stop = vi.fn(async () => { callOrder.push('dgraph'); });
      toolSetService.stop = vi.fn(async () => { callOrder.push('toolset'); });

      await service.start('test');
      await service.stop('test');

      expect(callOrder).toEqual(['identity', 'runtime', 'apollo', 'monitoring', 'dgraph', 'toolset']);
    });
  });
});
