import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthService, PermanentAuthenticationError } from './auth.service';
import { LoggerService, NatsService, HandshakeResponse, ErrorResponse } from '@2ly/common';
import pino from 'pino';
import fs from 'fs';
import os from 'os';

// Mock the utils module
vi.mock('../utils', () => ({
  getHostIP: vi.fn(() => '192.168.1.1'),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockLoggerService: LoggerService;
  let mockNatsService: NatsService;
  let mockLogger: pino.Logger;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Create silent logger to avoid test output noise
    mockLogger = pino({ level: 'silent' });

    // Mock LoggerService
    mockLoggerService = {
      getLogger: vi.fn(() => mockLogger),
    } as unknown as LoggerService;

    // Mock NatsService
    mockNatsService = {
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
      waitForStarted: vi.fn().mockResolvedValue(undefined),
      request: vi.fn(),
    } as unknown as NatsService;

    authService = new AuthService(mockLoggerService, mockNatsService);
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('initialize - environment variable validation', () => {
    it('should throw when no key is provided', async () => {
      delete process.env.SYSTEM_KEY;
      delete process.env.WORKSPACE_KEY;
      delete process.env.TOOLSET_KEY;
      delete process.env.RUNTIME_KEY;

      await expect(authService['initialize']()).rejects.toThrow(
        'No key found in environment variables. Runtime requires SYSTEM_KEY, WORKSPACE_KEY, TOOLSET_KEY, or RUNTIME_KEY to operate.',
      );
    });

    it('should successfully initialize with SYSTEM_KEY', async () => {
      process.env.SYSTEM_KEY = 'sk_test123';
      process.env.RUNTIME_NAME = 'test-runtime';

      const mockHandshakeResponse = new HandshakeResponse({
        workspaceId: null,
        nature: 'runtime' as const,
        id: '0x1',
        name: 'test-runtime',
      });

      vi.mocked(mockNatsService.request).mockResolvedValue(mockHandshakeResponse);

      await authService['initialize']();

      expect(authService.getIdentity()).toEqual({
        nature: 'runtime',
        id: '0x1',
        name: 'test-runtime',
        workspaceId: null,
      });
    });

    it('should successfully initialize with WORKSPACE_KEY', async () => {
      process.env.WORKSPACE_KEY = 'wsk_test456';
      process.env.TOOLSET_NAME = 'test-toolset';

      const mockHandshakeResponse = new HandshakeResponse({
        workspaceId: '0x2',
        nature: 'toolset' as const,
        id: '0x3',
        name: 'test-toolset',
      });

      vi.mocked(mockNatsService.request).mockResolvedValue(mockHandshakeResponse);

      await authService['initialize']();

      expect(authService.getIdentity()).toEqual({
        nature: 'toolset',
        id: '0x3',
        name: 'test-toolset',
        workspaceId: '0x2',
      });
    });

    it('should successfully initialize with TOOLSET_KEY', async () => {
      process.env.TOOLSET_KEY = 'tsk_test789';

      const mockHandshakeResponse = new HandshakeResponse({
        workspaceId: '0x4',
        nature: 'toolset' as const,
        id: '0x5',
        name: 'my-toolset',
      });

      vi.mocked(mockNatsService.request).mockResolvedValue(mockHandshakeResponse);

      await authService['initialize']();

      expect(authService.getIdentity()).toEqual({
        nature: 'toolset',
        id: '0x5',
        name: 'my-toolset',
        workspaceId: '0x4',
      });
    });

    it('should successfully initialize with RUNTIME_KEY', async () => {
      process.env.RUNTIME_KEY = 'rtk_test321';

      const mockHandshakeResponse = new HandshakeResponse({
        workspaceId: '0x6',
        nature: 'runtime' as const,
        id: '0x7',
        name: 'edge-runtime',
      });

      vi.mocked(mockNatsService.request).mockResolvedValue(mockHandshakeResponse);

      await authService['initialize']();

      expect(authService.getIdentity()).toEqual({
        nature: 'runtime',
        id: '0x7',
        name: 'edge-runtime',
        workspaceId: '0x6',
      });
    });
  });

  describe('prepareHandshakeRequest - nature determination', () => {
    it('should determine nature as runtime when RUNTIME_NAME is set', async () => {
      process.env.RUNTIME_KEY = 'rtk_test';
      process.env.RUNTIME_NAME = 'test-runtime';

      const mockHandshakeResponse = new HandshakeResponse({
        workspaceId: null,
        nature: 'runtime' as const,
        id: '0x1',
        name: 'test-runtime',
      });

      vi.mocked(mockNatsService.request).mockResolvedValue(mockHandshakeResponse);

      await authService['initialize']();

      expect(mockNatsService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nature: 'runtime',
            name: 'test-runtime',
          }),
        }),
      );
    });

    it('should determine nature as toolset when TOOLSET_NAME is set', async () => {
      process.env.WORKSPACE_KEY = 'wsk_test';
      process.env.TOOLSET_NAME = 'test-toolset';

      const mockHandshakeResponse = new HandshakeResponse({
        workspaceId: '0x1',
        nature: 'toolset' as const,
        id: '0x2',
        name: 'test-toolset',
      });

      vi.mocked(mockNatsService.request).mockResolvedValue(mockHandshakeResponse);

      await authService['initialize']();

      expect(mockNatsService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nature: 'toolset',
            name: 'test-toolset',
          }),
        }),
      );
    });

    it('should leave nature undefined when neither RUNTIME_NAME nor TOOLSET_NAME is set', async () => {
      process.env.TOOLSET_KEY = 'tsk_test';

      const mockHandshakeResponse = new HandshakeResponse({
        workspaceId: '0x1',
        nature: 'toolset' as const,
        id: '0x2',
        name: 'inferred-toolset',
      });

      vi.mocked(mockNatsService.request).mockResolvedValue(mockHandshakeResponse);

      await authService['initialize']();

      expect(mockNatsService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nature: undefined,
            name: undefined,
          }),
        }),
      );
    });

    it('should include pid, hostIP, and hostname in handshake request', async () => {
      process.env.TOOLSET_KEY = 'tsk_test';

      const mockHandshakeResponse = new HandshakeResponse({
        workspaceId: '0x1',
        nature: 'toolset' as const,
        id: '0x2',
        name: 'test-toolset',
      });

      vi.mocked(mockNatsService.request).mockResolvedValue(mockHandshakeResponse);

      await authService['initialize']();

      expect(mockNatsService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            pid: expect.any(String),
            hostIP: '192.168.1.1',
            hostname: os.hostname(),
          }),
        }),
      );
    });
  });

  describe('prepareRoots - ROOTS validation', () => {
    it('should return undefined when ROOTS is not set', async () => {
      process.env.TOOLSET_KEY = 'tsk_test';
      delete process.env.ROOTS;

      const mockHandshakeResponse = new HandshakeResponse({
        workspaceId: '0x1',
        nature: 'toolset' as const,
        id: '0x2',
        name: 'test-toolset',
      });

      vi.mocked(mockNatsService.request).mockResolvedValue(mockHandshakeResponse);

      await authService['initialize']();

      expect(mockNatsService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            roots: undefined,
          }),
        }),
      );
    });

    it('should parse and validate single root correctly', async () => {
      process.env.TOOLSET_KEY = 'tsk_test';
      process.env.ROOTS = 'home:/Users/test';

      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as fs.Stats);

      const mockHandshakeResponse = new HandshakeResponse({
        workspaceId: '0x1',
        nature: 'toolset' as const,
        id: '0x2',
        name: 'test-toolset',
      });

      vi.mocked(mockNatsService.request).mockResolvedValue(mockHandshakeResponse);

      await authService['initialize']();

      expect(mockNatsService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            roots: [{ name: 'home', uri: 'file:///Users/test' }],
          }),
        }),
      );
    });

    it('should parse and validate multiple roots correctly', async () => {
      process.env.TOOLSET_KEY = 'tsk_test';
      process.env.ROOTS = 'home:/Users/test,workspace:/var/workspace';

      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as fs.Stats);

      const mockHandshakeResponse = new HandshakeResponse({
        workspaceId: '0x1',
        nature: 'toolset' as const,
        id: '0x2',
        name: 'test-toolset',
      });

      vi.mocked(mockNatsService.request).mockResolvedValue(mockHandshakeResponse);

      await authService['initialize']();

      expect(mockNatsService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            roots: [
              { name: 'home', uri: 'file:///Users/test' },
              { name: 'workspace', uri: 'file:///var/workspace' },
            ],
          }),
        }),
      );
    });

    it('should throw error when root format is invalid (missing colon)', async () => {
      process.env.TOOLSET_KEY = 'tsk_test';
      process.env.ROOTS = 'invalidformat';

      await expect(authService['initialize']()).rejects.toThrow(
        'Invalid root: invalidformat (should be in the format name:path)',
      );
    });

    it('should throw error when root file does not exist', async () => {
      process.env.TOOLSET_KEY = 'tsk_test';
      process.env.ROOTS = 'home:/nonexistent/path';

      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      await expect(authService['initialize']()).rejects.toThrow(
        'Invalid root: home:/nonexistent/path (file does not exist)',
      );
    });

    it('should throw error when root is not a directory', async () => {
      process.env.TOOLSET_KEY = 'tsk_test';
      process.env.ROOTS = 'file:/Users/test.txt';

      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => false } as fs.Stats);

      await expect(authService['initialize']()).rejects.toThrow(
        'Invalid root: file:/Users/test.txt (file is not a directory)',
      );
    });
  });

  describe('handshake - error handling', () => {
    it('should throw PermanentAuthenticationError when AUTHENTICATION_FAILED is returned', async () => {
      process.env.TOOLSET_KEY = 'tsk_invalid';

      const mockErrorResponse = new ErrorResponse({
        error: 'AUTHENTICATION_FAILED: Invalid key',
      });

      vi.mocked(mockNatsService.request).mockResolvedValue(mockErrorResponse);

      await expect(authService['initialize']()).rejects.toThrow(PermanentAuthenticationError);
      await expect(authService['initialize']()).rejects.toThrow('AUTHENTICATION_FAILED: Invalid key');
    });

    it('should throw regular Error when non-authentication error is returned', async () => {
      process.env.TOOLSET_KEY = 'tsk_test';

      const mockErrorResponse = new ErrorResponse({
        error: 'SERVICE_UNAVAILABLE: Backend is down',
      });

      vi.mocked(mockNatsService.request).mockResolvedValue(mockErrorResponse);

      await expect(authService['initialize']()).rejects.toThrow('SERVICE_UNAVAILABLE: Backend is down');
      await expect(authService['initialize']()).rejects.not.toThrow(PermanentAuthenticationError);
    });

    it('should throw error when handshake response is invalid', async () => {
      process.env.TOOLSET_KEY = 'tsk_test';

      vi.mocked(mockNatsService.request).mockResolvedValue({} as HandshakeResponse);

      await expect(authService['initialize']()).rejects.toThrow('Invalid handshake response received');
    });

    it('should throw error when handshake response has unknown nature', async () => {
      process.env.TOOLSET_KEY = 'tsk_test';

      const mockHandshakeResponse = new HandshakeResponse({
        workspaceId: '0x1',
        nature: 'unknown' as 'runtime' | 'toolset',
        id: '0x2',
        name: 'test',
      });

      vi.mocked(mockNatsService.request).mockResolvedValue(mockHandshakeResponse);

      await expect(authService['initialize']()).rejects.toThrow('Invalid handshake response: unknown nature');
    });
  });

  describe('handshake - identity parsing', () => {
    it('should parse runtime identity correctly', async () => {
      process.env.SYSTEM_KEY = 'sk_test';
      process.env.RUNTIME_NAME = 'edge-runtime';

      const mockHandshakeResponse = new HandshakeResponse({
        workspaceId: null,
        nature: 'runtime' as const,
        id: '0x1',
        name: 'edge-runtime',
      });

      vi.mocked(mockNatsService.request).mockResolvedValue(mockHandshakeResponse);

      await authService['initialize']();

      expect(authService.getIdentity()).toEqual({
        nature: 'runtime',
        id: '0x1',
        name: 'edge-runtime',
        workspaceId: null,
      });
    });

    it('should parse runtime identity with workspaceId', async () => {
      process.env.RUNTIME_KEY = 'rtk_test';
      process.env.RUNTIME_NAME = 'workspace-runtime';

      const mockHandshakeResponse = new HandshakeResponse({
        workspaceId: '0x5',
        nature: 'runtime' as const,
        id: '0x6',
        name: 'workspace-runtime',
      });

      vi.mocked(mockNatsService.request).mockResolvedValue(mockHandshakeResponse);

      await authService['initialize']();

      expect(authService.getIdentity()).toEqual({
        nature: 'runtime',
        id: '0x6',
        name: 'workspace-runtime',
        workspaceId: '0x5',
      });
    });

    it('should parse toolset identity correctly', async () => {
      process.env.TOOLSET_KEY = 'tsk_test';

      const mockHandshakeResponse = new HandshakeResponse({
        workspaceId: '0x2',
        nature: 'toolset' as const,
        id: '0x3',
        name: 'my-toolset',
      });

      vi.mocked(mockNatsService.request).mockResolvedValue(mockHandshakeResponse);

      await authService['initialize']();

      expect(authService.getIdentity()).toEqual({
        nature: 'toolset',
        id: '0x3',
        name: 'my-toolset',
        workspaceId: '0x2',
      });
    });

    it('should throw error when toolset workspaceId is null', async () => {
      process.env.TOOLSET_KEY = 'tsk_test';

      const mockHandshakeResponse = new HandshakeResponse({
        workspaceId: null,
        nature: 'toolset' as const,
        id: '0x4',
        name: 'invalid-toolset',
      });

      vi.mocked(mockNatsService.request).mockResolvedValue(mockHandshakeResponse);

      await expect(authService['initialize']()).rejects.toThrow(
        'Authentication failed: workspace ID cannot be null for toolsets',
      );
    });
  });

  describe('getIdentity', () => {
    it('should return null when not initialized', () => {
      expect(authService.getIdentity()).toBeNull();
    });

    it('should return identity after successful initialization', async () => {
      process.env.TOOLSET_KEY = 'tsk_test';

      const mockHandshakeResponse = new HandshakeResponse({
        workspaceId: '0x1',
        nature: 'toolset' as const,
        id: '0x2',
        name: 'test-toolset',
      });

      vi.mocked(mockNatsService.request).mockResolvedValue(mockHandshakeResponse);

      await authService['initialize']();

      expect(authService.getIdentity()).toEqual({
        nature: 'toolset',
        id: '0x2',
        name: 'test-toolset',
        workspaceId: '0x1',
      });
    });
  });

  describe('shutdown', () => {
    it('should stop NatsService on shutdown', async () => {
      process.env.TOOLSET_KEY = 'tsk_test';

      const mockHandshakeResponse = new HandshakeResponse({
        workspaceId: '0x1',
        nature: 'toolset' as const,
        id: '0x2',
        name: 'test-toolset',
      });

      vi.mocked(mockNatsService.request).mockResolvedValue(mockHandshakeResponse);

      await authService['initialize']();

      // Mock stopService to track calls
      const stopServiceSpy = vi.spyOn(authService as unknown as { stopService: (service: unknown) => Promise<void> }, 'stopService').mockResolvedValue(undefined);

      await authService['shutdown']();

      expect(stopServiceSpy).toHaveBeenCalledWith(mockNatsService);
    });
  });
});
