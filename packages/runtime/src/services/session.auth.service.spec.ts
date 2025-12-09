import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionAuthService } from './session.auth.service';
import { LoggerService, NatsService, HandshakeResponse, ErrorResponse } from '@skilder-ai/common';
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
    it('should throw when both WORKSPACE_KEY and SKILL_KEY are provided', () => {
      expect(() => {
        sessionAuthService.validateAuthHeaders({
          workspaceKey: 'wsk_test',
          skillKey: 'tsk_test',
        });
      }).toThrow('WORKSPACE_KEY and SKILL_KEY are mutually exclusive');
    });

    it('should throw when neither WORKSPACE_KEY nor SKILL_KEY is provided', () => {
      expect(() => {
        sessionAuthService.validateAuthHeaders({});
      }).toThrow('Either WORKSPACE_KEY or SKILL_KEY is required');
    });

    it('should throw when WORKSPACE_KEY is provided without SKILL_NAME', () => {
      expect(() => {
        sessionAuthService.validateAuthHeaders({
          workspaceKey: 'wsk_test',
        });
      }).toThrow('WORKSPACE_KEY requires SKILL_NAME');
    });

    it('should throw when SKILL_KEY is provided with SKILL_NAME', () => {
      expect(() => {
        sessionAuthService.validateAuthHeaders({
          skillKey: 'tsk_test',
          skillName: 'my-skill',
        });
      }).toThrow('SKILL_KEY must not be used with SKILL_NAME');
    });

    it('should pass validation with valid WORKSPACE_KEY and SKILL_NAME', () => {
      expect(() => {
        sessionAuthService.validateAuthHeaders({
          workspaceKey: 'wsk_test',
          skillName: 'my-skill',
        });
      }).not.toThrow();
    });

    it('should pass validation with valid SKILL_KEY only', () => {
      expect(() => {
        sessionAuthService.validateAuthHeaders({
          skillKey: 'tsk_test',
        });
      }).not.toThrow();
    });
  });

  describe('authenticateViaHandshake', () => {
    it('should successfully authenticate with WORKSPACE_KEY and return skill identity', async () => {
      const headers = {
        workspaceKey: 'wsk_test123',
        skillName: 'test-skill',
      };

      const mockHandshakeResponse = new HandshakeResponse({
        workspaceId: '0x1',
        nature: 'skill' as const,
        id: '0x2',
        name: 'test-skill',
      });

      vi.mocked(mockNatsService.request).mockResolvedValue(mockHandshakeResponse);

      const identity = await sessionAuthService.authenticateViaHandshake(headers);

      expect(identity).toEqual({
        workspaceId: '0x1',
        skillId: '0x2',
        skillName: 'test-skill',
      });

      expect(mockNatsService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            key: 'wsk_test123',
            nature: 'skill',
            name: 'test-skill',
          }),
        }),
        { timeout: 5000 },
      );
    });

    it('should successfully authenticate with SKILL_KEY and return skill identity', async () => {
      const headers = {
        skillKey: 'tsk_test456',
      };

      const mockHandshakeResponse = new HandshakeResponse({
        workspaceId: '0x3',
        nature: 'skill' as const,
        id: '0x4',
        name: 'another-skill',
      });

      vi.mocked(mockNatsService.request).mockResolvedValue(mockHandshakeResponse);

      const identity = await sessionAuthService.authenticateViaHandshake(headers);

      expect(identity).toEqual({
        workspaceId: '0x3',
        skillId: '0x4',
        skillName: 'another-skill',
      });

      expect(mockNatsService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            key: 'tsk_test456',
            nature: 'skill',
            name: undefined,
          }),
        }),
        { timeout: 5000 },
      );
    });

    it('should throw error when handshake returns ErrorResponse', async () => {
      const headers = {
        workspaceKey: 'wsk_invalid',
        skillName: 'test-skill',
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
        skillKey: 'tsk_test',
      };

      // Mock an invalid response type
      vi.mocked(mockNatsService.request).mockResolvedValue({} as HandshakeResponse);

      await expect(sessionAuthService.authenticateViaHandshake(headers)).rejects.toThrow(
        'Authentication failed: invalid response from backend',
      );
    });

    it('should throw error when response nature is not skill', async () => {
      const headers = {
        skillKey: 'tsk_test',
      };

      const mockHandshakeResponse = new HandshakeResponse({
        workspaceId: null,
        nature: 'runtime' as const,
        id: '0x5',
        name: 'runtime-1',
      });

      vi.mocked(mockNatsService.request).mockResolvedValue(mockHandshakeResponse);

      await expect(sessionAuthService.authenticateViaHandshake(headers)).rejects.toThrow(
        'Authentication failed: expected skill nature, got runtime',
      );
    });

    it('should throw error when workspaceId is null for skill', async () => {
      const headers = {
        skillKey: 'tsk_test',
      };

      const mockHandshakeResponse = new HandshakeResponse({
        workspaceId: null,
        nature: 'skill' as const,
        id: '0x6',
        name: 'test-skill',
      });

      vi.mocked(mockNatsService.request).mockResolvedValue(mockHandshakeResponse);

      await expect(sessionAuthService.authenticateViaHandshake(headers)).rejects.toThrow(
        'Authentication failed: workspace ID cannot be null for skills',
      );
    });

    it('should include pid, hostIP, and hostname in handshake request', async () => {
      const headers = {
        skillKey: 'tsk_test',
      };

      const mockHandshakeResponse = new HandshakeResponse({
        workspaceId: '0x1',
        nature: 'skill' as const,
        id: '0x2',
        name: 'test-skill',
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
        skillKey: 'tsk_test',
      };

      const mockHandshakeResponse = new HandshakeResponse({
        workspaceId: '0x1',
        nature: 'skill' as const,
        id: '0x2',
        name: 'test-skill',
      });

      vi.mocked(mockNatsService.request).mockResolvedValue(mockHandshakeResponse);

      await sessionAuthService.authenticateViaHandshake(headers);

      expect(sessionAuthService.getIdentity()).toEqual({
        workspaceId: '0x1',
        skillId: '0x2',
        skillName: 'test-skill',
      });
    });
  });
});
