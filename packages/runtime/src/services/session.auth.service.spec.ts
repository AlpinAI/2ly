import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionAuthService } from './session.auth.service';
import { LoggerService, NatsService, HandshakeResponse, ErrorResponse } from '@2ly/common';
import pino from 'pino';

describe('SessionAuthService', () => {
  let sessionAuthService: SessionAuthService;
  let mockLoggerService: LoggerService;
  let mockNatsService: NatsService;
  let mockLogger: pino.Logger;

  beforeEach(() => {
    // Create silent logger to avoid test output noise
    mockLogger = pino({ level: 'silent' });

    // Mock LoggerService
    mockLoggerService = {
      getLogger: vi.fn(() => mockLogger),
    } as unknown as LoggerService;

    // Mock NatsService
    mockNatsService = {
      request: vi.fn(),
    } as unknown as NatsService;

    sessionAuthService = new SessionAuthService(mockLoggerService, mockNatsService);
  });

  describe('validateAuthHeaders', () => {
    it('should throw when both WORKSPACE_KEY and TOOLSET_KEY are provided', () => {
      expect(() => {
        sessionAuthService.validateAuthHeaders({
          workspaceKey: 'wsk_test',
          toolsetKey: 'tsk_test',
        });
      }).toThrow('WORKSPACE_KEY and TOOLSET_KEY are mutually exclusive');
    });

    it('should throw when neither WORKSPACE_KEY nor TOOLSET_KEY is provided', () => {
      expect(() => {
        sessionAuthService.validateAuthHeaders({});
      }).toThrow('Either WORKSPACE_KEY or TOOLSET_KEY is required');
    });

    it('should throw when WORKSPACE_KEY is provided without TOOLSET_NAME', () => {
      expect(() => {
        sessionAuthService.validateAuthHeaders({
          workspaceKey: 'wsk_test',
        });
      }).toThrow('WORKSPACE_KEY requires TOOLSET_NAME');
    });

    it('should throw when TOOLSET_KEY is provided with TOOLSET_NAME', () => {
      expect(() => {
        sessionAuthService.validateAuthHeaders({
          toolsetKey: 'tsk_test',
          toolsetName: 'my-toolset',
        });
      }).toThrow('TOOLSET_KEY must not be used with TOOLSET_NAME');
    });

    it('should pass validation with valid WORKSPACE_KEY and TOOLSET_NAME', () => {
      expect(() => {
        sessionAuthService.validateAuthHeaders({
          workspaceKey: 'wsk_test',
          toolsetName: 'my-toolset',
        });
      }).not.toThrow();
    });

    it('should pass validation with valid TOOLSET_KEY only', () => {
      expect(() => {
        sessionAuthService.validateAuthHeaders({
          toolsetKey: 'tsk_test',
        });
      }).not.toThrow();
    });
  });

  describe('authenticateViaHandshake', () => {
    it('should successfully authenticate with WORKSPACE_KEY and return toolset identity', async () => {
      const headers = {
        workspaceKey: 'wsk_test123',
        toolsetName: 'test-toolset',
      };

      const mockHandshakeResponse = new HandshakeResponse({
        workspaceId: '0x1',
        nature: 'toolset' as const,
        id: '0x2',
        name: 'test-toolset',
      });

      vi.mocked(mockNatsService.request).mockResolvedValue(mockHandshakeResponse);

      const identity = await sessionAuthService.authenticateViaHandshake(headers);

      expect(identity).toEqual({
        workspaceId: '0x1',
        toolsetId: '0x2',
        toolsetName: 'test-toolset',
      });

      expect(mockNatsService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            key: 'wsk_test123',
            nature: 'toolset',
            name: 'test-toolset',
          }),
        }),
        { timeout: 5000 },
      );
    });

    it('should successfully authenticate with TOOLSET_KEY and return toolset identity', async () => {
      const headers = {
        toolsetKey: 'tsk_test456',
      };

      const mockHandshakeResponse = new HandshakeResponse({
        workspaceId: '0x3',
        nature: 'toolset' as const,
        id: '0x4',
        name: 'another-toolset',
      });

      vi.mocked(mockNatsService.request).mockResolvedValue(mockHandshakeResponse);

      const identity = await sessionAuthService.authenticateViaHandshake(headers);

      expect(identity).toEqual({
        workspaceId: '0x3',
        toolsetId: '0x4',
        toolsetName: 'another-toolset',
      });

      expect(mockNatsService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            key: 'tsk_test456',
            nature: 'toolset',
            name: undefined,
          }),
        }),
        { timeout: 5000 },
      );
    });

    it('should throw error when handshake returns ErrorResponse', async () => {
      const headers = {
        workspaceKey: 'wsk_invalid',
        toolsetName: 'test-toolset',
      };

      const mockErrorResponse = new ErrorResponse({
        error: 'AUTHENTICATION_FAILED: Invalid workspace key',
      });

      vi.mocked(mockNatsService.request).mockResolvedValue(mockErrorResponse);

      await expect(sessionAuthService.authenticateViaHandshake(headers)).rejects.toThrow(
        'Authentication failed: AUTHENTICATION_FAILED: Invalid workspace key',
      );
    });

    it('should throw error when response is not HandshakeResponse or ErrorResponse', async () => {
      const headers = {
        toolsetKey: 'tsk_test',
      };

      // Mock an invalid response type
      vi.mocked(mockNatsService.request).mockResolvedValue({} as HandshakeResponse);

      await expect(sessionAuthService.authenticateViaHandshake(headers)).rejects.toThrow(
        'Authentication failed: invalid response from backend',
      );
    });

    it('should throw error when response nature is not toolset', async () => {
      const headers = {
        toolsetKey: 'tsk_test',
      };

      const mockHandshakeResponse = new HandshakeResponse({
        workspaceId: null,
        nature: 'runtime' as const,
        id: '0x5',
        name: 'runtime-1',
      });

      vi.mocked(mockNatsService.request).mockResolvedValue(mockHandshakeResponse);

      await expect(sessionAuthService.authenticateViaHandshake(headers)).rejects.toThrow(
        'Authentication failed: expected toolset nature, got runtime',
      );
    });

    it('should throw error when workspaceId is null for toolset', async () => {
      const headers = {
        toolsetKey: 'tsk_test',
      };

      const mockHandshakeResponse = new HandshakeResponse({
        workspaceId: null,
        nature: 'toolset' as const,
        id: '0x6',
        name: 'test-toolset',
      });

      vi.mocked(mockNatsService.request).mockResolvedValue(mockHandshakeResponse);

      await expect(sessionAuthService.authenticateViaHandshake(headers)).rejects.toThrow(
        'Authentication failed: workspace ID cannot be null for toolsets',
      );
    });

    it('should include pid, hostIP, and hostname in handshake request', async () => {
      const headers = {
        toolsetKey: 'tsk_test',
      };

      const mockHandshakeResponse = new HandshakeResponse({
        workspaceId: '0x1',
        nature: 'toolset' as const,
        id: '0x2',
        name: 'test-toolset',
      });

      vi.mocked(mockNatsService.request).mockResolvedValue(mockHandshakeResponse);

      await sessionAuthService.authenticateViaHandshake(headers);

      expect(mockNatsService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            pid: expect.any(String),
            hostIP: expect.any(String),
            hostname: expect.any(String),
          }),
        }),
        { timeout: 5000 },
      );
    });
  });

  describe('getIdentity', () => {
    it('should return null when not authenticated', () => {
      expect(sessionAuthService.getIdentity()).toBeNull();
    });

    it('should return identity after successful authentication', async () => {
      const headers = {
        toolsetKey: 'tsk_test',
      };

      const mockHandshakeResponse = new HandshakeResponse({
        workspaceId: '0x1',
        nature: 'toolset' as const,
        id: '0x2',
        name: 'test-toolset',
      });

      vi.mocked(mockNatsService.request).mockResolvedValue(mockHandshakeResponse);

      await sessionAuthService.authenticateViaHandshake(headers);

      expect(sessionAuthService.getIdentity()).toEqual({
        workspaceId: '0x1',
        toolsetId: '0x2',
        toolsetName: 'test-toolset',
      });
    });
  });
});
