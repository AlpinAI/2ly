/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AGENT_CAPABILITY, AuthService, IDENTITY_NAME, TOOL_CAPABILITY, WORKSPACE_ID } from './auth.service';
import { LoggerService, NatsService } from '@2ly/common';
import { LoggerServiceMock, NatsServiceMock, ControllableAsyncIterator } from '@2ly/common/test/vitest';
import { Container } from 'inversify';

// Mock os module
vi.mock('os', () => {
  return {
    default: {
      hostname: vi.fn(() => 'test-hostname'),
      platform: vi.fn(() => 'darwin' as NodeJS.Platform),
      arch: vi.fn(() => 'arm64'),
    },
  };
});

// Mock getHostIP utility
vi.mock('../utils', () => ({
  getHostIP: vi.fn(() => '192.168.1.100'),
}));

describe('AuthService', () => {
  let authService: AuthService;
  const mockProcessId = 12345;
  let mockIterator: ControllableAsyncIterator<unknown>;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'pid', 'get').mockReturnValue(mockProcessId);
    mockIterator = new ControllableAsyncIterator<unknown>();

    // Store original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  const createAuthService = (envOverrides: Record<string, string | undefined> = {}) => {
    // Apply environment overrides
    Object.entries(envOverrides).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });

    const container = new Container();
    container.bind(LoggerService).toConstantValue(new LoggerServiceMock() as unknown as LoggerService);
    container.bind(NatsService).toConstantValue(new NatsServiceMock(mockIterator) as unknown as NatsService);
    container.bind(AuthService).toSelf().inSingletonScope();
    container.bind(IDENTITY_NAME).toConstantValue('test-runtime');
    container.bind(WORKSPACE_ID).toConstantValue('workspace-123');
    container.bind(AGENT_CAPABILITY).toConstantValue('auto');
    container.bind(TOOL_CAPABILITY).toConstantValue(true);

    return container.get(AuthService);
  };

  describe('Identity Management', () => {
    beforeEach(async () => {
      authService = createAuthService();
      await authService.start('test');
    });

    it('should return correct identity structure', () => {
      const identity = authService.getIdentity();

      expect(identity).toMatchObject({
        id: null,
        RID: null,
        processId: mockProcessId.toString(),
        workspaceId: 'workspace-123',
        name: 'test-runtime',
        version: '1.0.0',
        hostIP: '192.168.1.100',
        hostname: 'test-hostname',
        metadata: {
          platform: 'darwin',
          arch: 'arm64',
          node_version: process.version,
        },
      });
    });

    it('should set and retrieve ID, RID, and workspaceId', () => {
      const testId = 'test-id-123';
      const testRID = 'test-rid-456';
      const testWorkspaceId = 'test-workspace-789';

      authService.setId(testId, testRID, testWorkspaceId);

      expect(authService.getId()).toBe(testId);

      const identity = authService.getIdentity();
      expect(identity.id).toBe(testId);
      expect(identity.RID).toBe(testRID);
      expect(identity.workspaceId).toBe(testWorkspaceId);
    });

    it('should clear identity correctly', () => {
      const testId = 'test-id-123';
      const testRID = 'test-rid-456';
      const testWorkspaceId = 'test-workspace-789';

      authService.setId(testId, testRID, testWorkspaceId);
      authService.clearIdentity();

      expect(authService.getId()).toBeNull();
      const identity = authService.getIdentity();
      expect(identity.id).toBeNull();
      expect(identity.RID).toBeNull();
      // WorkspaceId should reset to env var or DEFAULT
      expect(identity.workspaceId).toBe('DEFAULT');
    });
  });

  describe('Capability Getters', () => {
    beforeEach(async () => {
      authService = createAuthService();
      await authService.start('test');
    });

    it('should return correct agent capability', () => {
      expect(authService.getAgentCapability()).toBe('auto');

      (authService as any).agentCapability = true;
      expect(authService.getAgentCapability()).toBe(true);

      (authService as any).agentCapability = false;
      expect(authService.getAgentCapability()).toBe(false);
    });

    it('should return correct tool capability', () => {
      expect(authService.getToolCapability()).toBe(true);

      (authService as any).toolCapability = false;
      expect(authService.getToolCapability()).toBe(false);
    });
  });

  describe('Environment Variable Parsing', () => {
    it('should parse MASTER_KEY from environment', () => {
      authService = createAuthService({
        MASTER_KEY: 'test-master-key',
        TOOLSET_NAME: 'test-toolset',
      });

      expect(authService.getMasterKey()).toBe('test-master-key');
      expect(authService.getToolsetName()).toBe('test-toolset');
    });

    it('should parse MASTER_KEY without TOOLSET_NAME', () => {
      authService = createAuthService({
        MASTER_KEY: 'test-master-key',
        TOOLSET_NAME: undefined,
      });

      expect(authService.getMasterKey()).toBe('test-master-key');
      expect(authService.getToolsetName()).toBeUndefined();
    });

    it('should parse TOOLSET_KEY from environment', () => {
      authService = createAuthService({
        TOOLSET_KEY: 'test-toolset-key',
      });

      expect(authService.getToolsetKey()).toBe('test-toolset-key');
    });

    it('should handle no auth credentials gracefully', () => {
      authService = createAuthService({
        MASTER_KEY: undefined,
        TOOLSET_KEY: undefined,
        TOOL_SET: 'test-toolset',
      });

      expect(authService.getMasterKey()).toBeUndefined();
      expect(authService.getToolsetKey()).toBeUndefined();
      expect(authService.hasValidAuth()).toBe(false);
    });

    it('should allow both MASTER_KEY and TOOLSET_KEY simultaneously', () => {
      authService = createAuthService({
        MASTER_KEY: 'test-master-key',
        TOOLSET_NAME: 'test-toolset',
        TOOLSET_KEY: 'test-toolset-key',
      });

      expect(authService.getMasterKey()).toBe('test-master-key');
      expect(authService.getToolsetName()).toBe('test-toolset');
      expect(authService.getToolsetKey()).toBe('test-toolset-key');
    });
  });

  describe('Credential Management', () => {
    beforeEach(async () => {
      authService = createAuthService({
        MASTER_KEY: 'test-master-key',
      });
      await authService.start('test');
    });

    it('should set and retrieve credentials', () => {
      const credentials = {
        accessToken: 'test-access-token',
        natsJwt: 'test-nats-jwt',
        toolsetId: 'test-toolset-id',
      };

      authService.setCredentials(credentials);

      const retrievedCredentials = authService.getTokens();
      expect(retrievedCredentials).toEqual(credentials);
    });

    it('should partially update credentials', () => {
      authService.setCredentials({
        accessToken: 'token-1',
        natsJwt: 'jwt-1',
      });

      authService.setCredentials({
        toolsetId: 'toolset-1',
      });

      const credentials = authService.getTokens();
      expect(credentials).toEqual({
        accessToken: 'token-1',
        natsJwt: 'jwt-1',
        toolsetId: 'toolset-1',
      });
    });

    it('should handle undefined credential values', () => {
      authService.setCredentials({
        accessToken: 'test-token',
      });

      const credentials = authService.getTokens();
      expect(credentials.accessToken).toBe('test-token');
      expect(credentials.natsJwt).toBeUndefined();
      expect(credentials.toolsetId).toBeUndefined();
    });
  });

  describe('hasValidAuth', () => {
    it('should return true when MASTER_KEY is present', () => {
      authService = createAuthService({
        MASTER_KEY: 'test-master-key',
      });

      expect(authService.hasValidAuth()).toBe(true);
    });

    it('should return true when TOOLSET_KEY is present', () => {
      authService = createAuthService({
        TOOLSET_KEY: 'test-toolset-key',
      });

      expect(authService.hasValidAuth()).toBe(true);
    });

    it('should return true when accessToken is set', () => {
      authService = createAuthService({
        MASTER_KEY: undefined,
        TOOLSET_KEY: undefined,
      });

      authService.setCredentials({
        accessToken: 'test-access-token',
      });

      expect(authService.hasValidAuth()).toBe(true);
    });

    it('should return false when no auth is present', () => {
      authService = createAuthService({
        MASTER_KEY: undefined,
        TOOLSET_KEY: undefined,
      });

      expect(authService.hasValidAuth()).toBe(false);
    });
  });

  describe('Service Lifecycle', () => {
    it('should start and stop without errors', async () => {
      authService = createAuthService();
      await authService.start('test');
      await authService.stop('test');

      expect(true).toBe(true); // Simple test that start/stop doesn't throw
    });

    it('should maintain identity state across multiple calls', async () => {
      authService = createAuthService();
      await authService.start('test');

      const identity1 = authService.getIdentity();
      const identity2 = authService.getIdentity();

      expect(identity1).toEqual(identity2);
      // Identity objects should be deeply equal
      expect(identity1.id).toBe(identity2.id);
      expect(identity1.RID).toBe(identity2.RID);
    });
  });

  describe('Edge Cases', () => {
    it('should handle clearIdentity with WORKSPACE_ID env var', () => {
      authService = createAuthService({
        WORKSPACE_ID: 'env-workspace-id',
      });

      authService.setId('id', 'rid', 'workspace');
      authService.clearIdentity();

      const identity = authService.getIdentity();
      expect(identity.workspaceId).toBe('env-workspace-id');
    });

    it('should handle clearIdentity without WORKSPACE_ID env var', () => {
      authService = createAuthService({
        WORKSPACE_ID: undefined,
      });

      authService.setId('id', 'rid', 'workspace');
      authService.clearIdentity();

      const identity = authService.getIdentity();
      expect(identity.workspaceId).toBe('DEFAULT');
    });

    it('should preserve credentials when clearing identity', () => {
      authService = createAuthService({
        MASTER_KEY: 'test-master-key',
      });

      authService.setCredentials({
        accessToken: 'test-access-token',
        natsJwt: 'test-nats-jwt',
      });

      authService.clearIdentity();

      const credentials = authService.getTokens();
      expect(credentials.accessToken).toBe('test-access-token');
      expect(credentials.natsJwt).toBe('test-nats-jwt');
      expect(authService.getMasterKey()).toBe('test-master-key');
    });
  });

  describe('Standalone MCP Stream Mode', () => {
    it('should not warn about missing auth in standalone MCP stream mode', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      authService = createAuthService({
        MASTER_KEY: undefined,
        TOOLSET_KEY: undefined,
        TOOL_SET: undefined,
        RUNTIME_NAME: undefined,
        REMOTE_PORT: '3000',
      });

      // In standalone mode, no warning should be logged
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });
});
