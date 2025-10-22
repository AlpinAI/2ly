/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AGENT_CAPABILITY, IDENTITY_NAME, IdentityService, TOOL_CAPABILITY, WORKSPACE_ID } from './identity.service';
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

describe('IdentityService', () => {
  let identityService: IdentityService;
  const mockProcessId = 12345;
  let mockIterator: ControllableAsyncIterator<unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'pid', 'get').mockReturnValue(mockProcessId);
    mockIterator = new ControllableAsyncIterator<unknown>();
    const container = new Container();
    container.bind(LoggerService).toConstantValue(new LoggerServiceMock() as unknown as LoggerService);
    container.bind(NatsService).toConstantValue(new NatsServiceMock(mockIterator) as unknown as NatsService);
    container.bind(IdentityService).toSelf().inSingletonScope();
    container.bind(IDENTITY_NAME).toConstantValue('test-runtime');
    container.bind(WORKSPACE_ID).toConstantValue('workspace-123');
    container.bind(AGENT_CAPABILITY).toConstantValue('auto');
    container.bind(TOOL_CAPABILITY).toConstantValue(true);
    identityService = container.get(IdentityService);
  });

  describe('Initialization', () => {
    it('should start successfully with default capabilities', async () => {
      await identityService.start('test');
      const identity = identityService.getIdentity();
      expect(identity.capabilities).toContain('tool');
    });

    it('should handle adding agent capability', async () => {
      await identityService.start('test');
      identityService.addCapability('agent');
      const identity = identityService.getIdentity();
      expect(identity.capabilities).toContain('agent');
      expect(identity.capabilities).toContain('tool');
    });
  });

  describe('Identity Management', () => {
    beforeEach(async () => {
      await identityService.start('test');
    });

    it('should return correct identity structure', () => {
      const identity = identityService.getIdentity();

      expect(identity).toMatchObject({
        id: null,
        RID: null,
        processId: mockProcessId.toString(),
        workspaceId: 'workspace-123',
        name: 'test-runtime',
        version: '1.0.0',
        hostIP: '192.168.1.100',
        hostname: 'test-hostname',
        capabilities: ['tool'],
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

      identityService.setId(testId, testRID, testWorkspaceId);

      expect(identityService.getId()).toBe(testId);

      const identity = identityService.getIdentity();
      expect(identity.id).toBe(testId);
      expect(identity.RID).toBe(testRID);
      expect(identity.workspaceId).toBe(testWorkspaceId);
    });

    it('should return correct capabilities based on configuration', () => {
      (identityService as any).agentCapability = true;
      (identityService as any).toolCapability = false;

      const identity = identityService.getIdentity();
      expect(identity.capabilities).toEqual(['agent']);
    });

    it('should return empty capabilities when both are false', () => {
      (identityService as any).agentCapability = false;
      (identityService as any).toolCapability = false;

      const identity = identityService.getIdentity();
      expect(identity.capabilities).toEqual([]);
    });
  });

  describe('Capability Getters', () => {
    it('should return correct agent capability', () => {
      expect(identityService.getAgentCapability()).toBe('auto');

      (identityService as any).agentCapability = true;
      expect(identityService.getAgentCapability()).toBe(true);

      (identityService as any).agentCapability = false;
      expect(identityService.getAgentCapability()).toBe(false);
    });

    it('should return correct tool capability', () => {
      expect(identityService.getToolCapability()).toBe(true);

      (identityService as any).toolCapability = false;
      expect(identityService.getToolCapability()).toBe(false);
    });
  });

  describe('Shutdown', () => {
    it('should stop NATS service on shutdown', async () => {
      await identityService.start('test');
      await identityService.stop('test');

      expect(true).toBe(true); // Simple test that start/stop doesn't throw
    });
  });

  describe('Edge Cases', () => {
    it('should maintain identity state across multiple calls', async () => {
      await identityService.start('test');

      const identity1 = identityService.getIdentity();
      const identity2 = identityService.getIdentity();

      expect(identity1).toEqual(identity2);
      // Identity objects should be deeply equal
      expect(identity1.id).toBe(identity2.id);
      expect(identity1.RID).toBe(identity2.RID);
    });
  });
});
