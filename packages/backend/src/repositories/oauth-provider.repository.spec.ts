import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  OAuthProviderRepository,
  type OAuthProviderConfigData,
  type OAuthProviderType,
} from './oauth-provider.repository';
import { DGraphService } from '../services/dgraph.service';
import { LoggerService, EncryptionService, dgraphResolversTypes } from '@skilder-ai/common';

describe('OAuthProviderRepository', () => {
  let repository: OAuthProviderRepository;
  let mockDGraphService: DGraphService;
  let mockLoggerService: LoggerService;
  let mockEncryptionService: EncryptionService;

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Mock DGraphService
    mockDGraphService = {
      mutation: vi.fn(),
      query: vi.fn(),
      observe: vi.fn(),
    } as unknown as DGraphService;

    // Mock LoggerService
    mockLoggerService = {
      getLogger: vi.fn(() => ({
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      })),
    } as unknown as LoggerService;

    // Mock EncryptionService
    mockEncryptionService = {
      encrypt: vi.fn((val: string) => `encrypted_${val}`),
      decrypt: vi.fn((val: string) => val.replace('encrypted_', '')),
    } as unknown as EncryptionService;

    repository = new OAuthProviderRepository(mockDGraphService, mockLoggerService, mockEncryptionService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateConfiguration()', () => {
    describe('clientId validation', () => {
      it('should reject empty clientId', () => {
        const result = repository.validateConfiguration('google', '', 'valid-secret');

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Client ID is required');
      });

      it('should reject whitespace-only clientId', () => {
        const result = repository.validateConfiguration('google', '   ', 'valid-secret');

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Client ID is required');
      });
    });

    describe('clientSecret validation', () => {
      it('should reject empty clientSecret', () => {
        const result = repository.validateConfiguration('google', 'valid-client-id', '');

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Client Secret is required');
      });

      it('should reject whitespace-only clientSecret', () => {
        const result = repository.validateConfiguration('google', 'valid-client-id', '   ');

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Client Secret is required');
      });
    });

    describe('Google provider validation', () => {
      it('should accept valid google configuration', () => {
        const result = repository.validateConfiguration('google', 'google-client-id', 'google-client-secret');

        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    describe('Microsoft provider validation', () => {
      it('should require tenantId for Microsoft', () => {
        const result = repository.validateConfiguration('microsoft', 'ms-client-id', 'ms-client-secret');

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Tenant ID is required for Microsoft');
      });

      it('should reject empty tenantId for Microsoft', () => {
        const result = repository.validateConfiguration('microsoft', 'ms-client-id', 'ms-client-secret', '');

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Tenant ID is required for Microsoft');
      });

      it('should reject whitespace-only tenantId for Microsoft', () => {
        const result = repository.validateConfiguration('microsoft', 'ms-client-id', 'ms-client-secret', '   ');

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Tenant ID is required for Microsoft');
      });

      it('should accept GUID tenantId format', () => {
        const result = repository.validateConfiguration(
          'microsoft',
          'ms-client-id',
          'ms-client-secret',
          '12345678-1234-1234-1234-123456789abc'
        );

        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept common tenantId', () => {
        const result = repository.validateConfiguration('microsoft', 'ms-client-id', 'ms-client-secret', 'common');

        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept organizations tenantId', () => {
        const result = repository.validateConfiguration(
          'microsoft',
          'ms-client-id',
          'ms-client-secret',
          'organizations'
        );

        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept consumers tenantId', () => {
        const result = repository.validateConfiguration('microsoft', 'ms-client-id', 'ms-client-secret', 'consumers');

        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept case-insensitive common tenant values', () => {
        const resultCommon = repository.validateConfiguration('microsoft', 'ms-client-id', 'ms-client-secret', 'COMMON');
        expect(resultCommon.valid).toBe(true);

        const resultOrgs = repository.validateConfiguration(
          'microsoft',
          'ms-client-id',
          'ms-client-secret',
          'ORGANIZATIONS'
        );
        expect(resultOrgs.valid).toBe(true);

        const resultConsumers = repository.validateConfiguration(
          'microsoft',
          'ms-client-id',
          'ms-client-secret',
          'CONSUMERS'
        );
        expect(resultConsumers.valid).toBe(true);
      });

      it('should reject invalid tenantId format', () => {
        const result = repository.validateConfiguration(
          'microsoft',
          'ms-client-id',
          'ms-client-secret',
          'invalid-tenant'
        );

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Tenant ID must be a valid GUID or one of: common, organizations, consumers');
      });

      it('should reject malformed GUID tenantId', () => {
        const result = repository.validateConfiguration(
          'microsoft',
          'ms-client-id',
          'ms-client-secret',
          '12345678-1234-1234-1234'
        );

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Tenant ID must be a valid GUID or one of: common, organizations, consumers');
      });
    });
  });

  describe('getByWorkspace()', () => {
    it('should return providers from database', async () => {
      const workspaceId = 'workspace-1';
      const mockProviders: dgraphResolversTypes.OAuthProviderConfig[] = [
        {
          id: 'provider-1',
          provider: dgraphResolversTypes.OAuthProviderType.Google,
          enabled: true,
          clientId: 'google-client-id',
          encryptedClientSecret: 'encrypted_google-secret',
          tenantId: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          workspace: {
            id: workspaceId,
            name: 'Test Workspace',
            createdAt: '2024-01-01T00:00:00Z',
            system: {
              id: 'system-1',
              createdAt: '2024-01-01T00:00:00Z',
              initialized: true,
            } as dgraphResolversTypes.System,
          },
        },
        {
          id: 'provider-2',
          provider: dgraphResolversTypes.OAuthProviderType.Microsoft,
          enabled: false,
          clientId: 'ms-client-id',
          encryptedClientSecret: 'encrypted_ms-secret',
          tenantId: 'common',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          workspace: {
            id: workspaceId,
            name: 'Test Workspace',
            createdAt: '2024-01-01T00:00:00Z',
            system: {
              id: 'system-1',
              createdAt: '2024-01-01T00:00:00Z',
              initialized: true,
            } as dgraphResolversTypes.System,
          },
        },
      ];

      vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
        getWorkspace: { oauthProviders: mockProviders },
      });

      const result = await repository.getByWorkspace(workspaceId);

      expect(result).toEqual(mockProviders);
      expect(mockDGraphService.query).toHaveBeenCalledWith(expect.anything(), { workspaceId });
    });

    it('should return empty array when no providers', async () => {
      const workspaceId = 'workspace-1';

      vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
        getWorkspace: { oauthProviders: [] },
      });

      const result = await repository.getByWorkspace(workspaceId);

      expect(result).toEqual([]);
    });

    it('should return empty array when workspace has no oauth providers', async () => {
      const workspaceId = 'workspace-1';

      vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
        getWorkspace: null,
      });

      const result = await repository.getByWorkspace(workspaceId);

      expect(result).toEqual([]);
    });

    it('should throw error when query fails', async () => {
      const workspaceId = 'workspace-1';

      vi.mocked(mockDGraphService.query).mockRejectedValueOnce(new Error('Database error'));

      await expect(repository.getByWorkspace(workspaceId)).rejects.toThrow('Failed to get OAuth providers');
    });
  });

  describe('findByType()', () => {
    it('should return matching provider', async () => {
      const workspaceId = 'workspace-1';
      const provider = dgraphResolversTypes.OAuthProviderType.Google;

      const mockProvider: dgraphResolversTypes.OAuthProviderConfig = {
        id: 'provider-1',
        provider: dgraphResolversTypes.OAuthProviderType.Google,
        enabled: true,
        clientId: 'google-client-id',
        encryptedClientSecret: 'encrypted_google-secret',
        tenantId: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        workspace: {
          id: workspaceId,
          name: 'Test Workspace',
          createdAt: '2024-01-01T00:00:00Z',
          system: {
            id: 'system-1',
            createdAt: '2024-01-01T00:00:00Z',
            initialized: true,
          } as dgraphResolversTypes.System,
        },
      };

      vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
        getWorkspace: { oauthProviders: [mockProvider] },
      });

      const result = await repository.findByType(workspaceId, provider);

      expect(result).toEqual(mockProvider);
      expect(mockDGraphService.query).toHaveBeenCalledWith(expect.anything(), { workspaceId, provider });
    });

    it('should return null when not found', async () => {
      const workspaceId = 'workspace-1';
      const provider = dgraphResolversTypes.OAuthProviderType.Google;

      vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
        getWorkspace: { oauthProviders: [] },
      });

      const result = await repository.findByType(workspaceId, provider);

      expect(result).toBeNull();
    });

    it('should return null when workspace not found', async () => {
      const workspaceId = 'workspace-1';
      const provider = dgraphResolversTypes.OAuthProviderType.Google;

      vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
        getWorkspace: null,
      });

      const result = await repository.findByType(workspaceId, provider);

      expect(result).toBeNull();
    });

    it('should throw error when query fails', async () => {
      const workspaceId = 'workspace-1';
      const provider = dgraphResolversTypes.OAuthProviderType.Google;

      vi.mocked(mockDGraphService.query).mockRejectedValueOnce(new Error('Database error'));

      await expect(repository.findByType(workspaceId, provider)).rejects.toThrow('Failed to find OAuth provider');
    });
  });

  describe('findById()', () => {
    it('should return provider by id', async () => {
      const id = 'provider-1';

      vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
        getOAuthProviderConfig: {
          id: 'provider-1',
          provider: 'GOOGLE',
          workspace: { id: 'workspace-1' },
        },
      });

      const result = await repository.findById(id);

      expect(result).toEqual({
        id: 'provider-1',
        provider: 'GOOGLE',
        workspaceId: 'workspace-1',
      });
      expect(mockDGraphService.query).toHaveBeenCalledWith(expect.anything(), { id });
    });

    it('should return null when provider not found', async () => {
      const id = 'non-existent-provider';

      vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
        getOAuthProviderConfig: null,
      });

      const result = await repository.findById(id);

      expect(result).toBeNull();
    });

    it('should throw error when query fails', async () => {
      const id = 'provider-1';

      vi.mocked(mockDGraphService.query).mockRejectedValueOnce(new Error('Database error'));

      await expect(repository.findById(id)).rejects.toThrow('Failed to find OAuth provider');
    });
  });

  describe('create()', () => {
    it('should encrypt client secret and save provider', async () => {
      const workspaceId = 'workspace-1';
      const data: OAuthProviderConfigData = {
        provider: dgraphResolversTypes.OAuthProviderType.Google,
        enabled: true,
        clientId: 'google-client-id',
        encryptedClientSecret: 'encrypted_google-secret',
        tenantId: null,
      };

      const expectedProvider: dgraphResolversTypes.OAuthProviderConfig = {
        id: 'provider-1',
        provider: dgraphResolversTypes.OAuthProviderType.Google,
        enabled: true,
        clientId: 'google-client-id',
        encryptedClientSecret: 'encrypted_google-secret',
        tenantId: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        workspace: {
          id: workspaceId,
          name: 'Test Workspace',
          createdAt: '2024-01-01T00:00:00Z',
          system: {
            id: 'system-1',
            createdAt: '2024-01-01T00:00:00Z',
            initialized: true,
          } as dgraphResolversTypes.System,
        },
      };

      vi.mocked(mockDGraphService.mutation).mockResolvedValueOnce({
        addOAuthProviderConfig: { oAuthProviderConfig: [expectedProvider] },
      });

      const result = await repository.create(workspaceId, data);

      expect(result).toEqual(expectedProvider);
      expect(mockDGraphService.mutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          workspaceId,
          provider: data.provider,
          enabled: data.enabled,
          clientId: data.clientId,
          encryptedClientSecret: data.encryptedClientSecret,
          tenantId: data.tenantId,
          now: expect.any(String),
        })
      );
    });

    it('should create Microsoft provider with tenantId', async () => {
      const workspaceId = 'workspace-1';
      const data: OAuthProviderConfigData = {
        provider: dgraphResolversTypes.OAuthProviderType.Microsoft,
        enabled: true,
        clientId: 'ms-client-id',
        encryptedClientSecret: 'encrypted_ms-secret',
        tenantId: 'common',
      };

      const expectedProvider: dgraphResolversTypes.OAuthProviderConfig = {
        id: 'provider-1',
        provider: dgraphResolversTypes.OAuthProviderType.Microsoft,
        enabled: true,
        clientId: 'ms-client-id',
        encryptedClientSecret: 'encrypted_ms-secret',
        tenantId: 'common',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        workspace: {
          id: workspaceId,
          name: 'Test Workspace',
          createdAt: '2024-01-01T00:00:00Z',
          system: {
            id: 'system-1',
            createdAt: '2024-01-01T00:00:00Z',
            initialized: true,
          } as dgraphResolversTypes.System,
        },
      };

      vi.mocked(mockDGraphService.mutation).mockResolvedValueOnce({
        addOAuthProviderConfig: { oAuthProviderConfig: [expectedProvider] },
      });

      const result = await repository.create(workspaceId, data);

      expect(result.tenantId).toBe('common');
    });

    it('should throw error when creation fails', async () => {
      const workspaceId = 'workspace-1';
      const data: OAuthProviderConfigData = {
        provider: dgraphResolversTypes.OAuthProviderType.Google,
        enabled: true,
        clientId: 'google-client-id',
        encryptedClientSecret: 'encrypted_google-secret',
        tenantId: null,
      };

      vi.mocked(mockDGraphService.mutation).mockRejectedValueOnce(new Error('Database error'));

      await expect(repository.create(workspaceId, data)).rejects.toThrow('Failed to create OAuth provider');
    });
  });

  describe('update()', () => {
    it('should update existing provider', async () => {
      const id = 'provider-1';
      const data: Partial<Omit<OAuthProviderConfigData, 'provider' | 'enabled'>> = {
        clientId: 'new-client-id',
        encryptedClientSecret: 'encrypted_new-secret',
      };

      const updatedProvider: dgraphResolversTypes.OAuthProviderConfig = {
        id: 'provider-1',
        provider: dgraphResolversTypes.OAuthProviderType.Google,
        enabled: true,
        clientId: 'new-client-id',
        encryptedClientSecret: 'encrypted_new-secret',
        tenantId: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        workspace: {
          id: 'workspace-1',
          name: 'Test Workspace',
          createdAt: '2024-01-01T00:00:00Z',
          system: {
            id: 'system-1',
            createdAt: '2024-01-01T00:00:00Z',
            initialized: true,
          } as dgraphResolversTypes.System,
        },
      };

      vi.mocked(mockDGraphService.mutation).mockResolvedValueOnce({
        updateOAuthProviderConfig: { oAuthProviderConfig: [updatedProvider] },
      });

      const result = await repository.update(id, data);

      expect(result).toEqual(updatedProvider);
      expect(mockDGraphService.mutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          id,
          clientId: data.clientId,
          encryptedClientSecret: data.encryptedClientSecret,
          now: expect.any(String),
        })
      );
    });

    it('should update only tenantId for Microsoft provider', async () => {
      const id = 'provider-1';
      const data: Partial<Omit<OAuthProviderConfigData, 'provider' | 'enabled'>> = {
        tenantId: 'organizations',
      };

      const updatedProvider: dgraphResolversTypes.OAuthProviderConfig = {
        id: 'provider-1',
        provider: dgraphResolversTypes.OAuthProviderType.Microsoft,
        enabled: true,
        clientId: 'ms-client-id',
        encryptedClientSecret: 'encrypted_ms-secret',
        tenantId: 'organizations',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        workspace: {
          id: 'workspace-1',
          name: 'Test Workspace',
          createdAt: '2024-01-01T00:00:00Z',
          system: {
            id: 'system-1',
            createdAt: '2024-01-01T00:00:00Z',
            initialized: true,
          } as dgraphResolversTypes.System,
        },
      };

      vi.mocked(mockDGraphService.mutation).mockResolvedValueOnce({
        updateOAuthProviderConfig: { oAuthProviderConfig: [updatedProvider] },
      });

      const result = await repository.update(id, data);

      expect(result.tenantId).toBe('organizations');
    });

    it('should throw error when update fails', async () => {
      const id = 'provider-1';
      const data: Partial<Omit<OAuthProviderConfigData, 'provider' | 'enabled'>> = {
        clientId: 'new-client-id',
      };

      vi.mocked(mockDGraphService.mutation).mockRejectedValueOnce(new Error('Database error'));

      await expect(repository.update(id, data)).rejects.toThrow('Failed to update OAuth provider');
    });
  });

  describe('updateEnabled()', () => {
    it('should toggle enabled status to true', async () => {
      const id = 'provider-1';
      const enabled = true;

      const updatedProvider: dgraphResolversTypes.OAuthProviderConfig = {
        id: 'provider-1',
        provider: dgraphResolversTypes.OAuthProviderType.Google,
        enabled: true,
        clientId: 'google-client-id',
        encryptedClientSecret: 'encrypted_google-secret',
        tenantId: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        workspace: {
          id: 'workspace-1',
          name: 'Test Workspace',
          createdAt: '2024-01-01T00:00:00Z',
          system: {
            id: 'system-1',
            createdAt: '2024-01-01T00:00:00Z',
            initialized: true,
          } as dgraphResolversTypes.System,
        },
      };

      vi.mocked(mockDGraphService.mutation).mockResolvedValueOnce({
        updateOAuthProviderConfig: { oAuthProviderConfig: [updatedProvider] },
      });

      const result = await repository.updateEnabled(id, enabled);

      expect(result.enabled).toBe(true);
      expect(mockDGraphService.mutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          id,
          enabled,
          now: expect.any(String),
        })
      );
    });

    it('should toggle enabled status to false', async () => {
      const id = 'provider-1';
      const enabled = false;

      const updatedProvider: dgraphResolversTypes.OAuthProviderConfig = {
        id: 'provider-1',
        provider: dgraphResolversTypes.OAuthProviderType.Google,
        enabled: false,
        clientId: 'google-client-id',
        encryptedClientSecret: 'encrypted_google-secret',
        tenantId: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        workspace: {
          id: 'workspace-1',
          name: 'Test Workspace',
          createdAt: '2024-01-01T00:00:00Z',
          system: {
            id: 'system-1',
            createdAt: '2024-01-01T00:00:00Z',
            initialized: true,
          } as dgraphResolversTypes.System,
        },
      };

      vi.mocked(mockDGraphService.mutation).mockResolvedValueOnce({
        updateOAuthProviderConfig: { oAuthProviderConfig: [updatedProvider] },
      });

      const result = await repository.updateEnabled(id, enabled);

      expect(result.enabled).toBe(false);
    });

    it('should throw error when update fails', async () => {
      const id = 'provider-1';
      const enabled = true;

      vi.mocked(mockDGraphService.mutation).mockRejectedValueOnce(new Error('Database error'));

      await expect(repository.updateEnabled(id, enabled)).rejects.toThrow('Failed to update OAuth provider');
    });
  });

  describe('upsert()', () => {
    it('should create new provider when not exists', async () => {
      const workspaceId = 'workspace-1';
      const data: OAuthProviderConfigData = {
        provider: dgraphResolversTypes.OAuthProviderType.Google,
        enabled: true,
        clientId: 'google-client-id',
        encryptedClientSecret: 'encrypted_google-secret',
        tenantId: null,
      };

      // Mock findByType returning null (provider doesn't exist)
      vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
        getWorkspace: { oauthProviders: [] },
      });

      // Mock create mutation
      const expectedProvider: dgraphResolversTypes.OAuthProviderConfig = {
        id: 'provider-1',
        provider: dgraphResolversTypes.OAuthProviderType.Google,
        enabled: true,
        clientId: 'google-client-id',
        encryptedClientSecret: 'encrypted_google-secret',
        tenantId: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        workspace: {
          id: workspaceId,
          name: 'Test Workspace',
          createdAt: '2024-01-01T00:00:00Z',
          system: {
            id: 'system-1',
            createdAt: '2024-01-01T00:00:00Z',
            initialized: true,
          } as dgraphResolversTypes.System,
        },
      };

      vi.mocked(mockDGraphService.mutation).mockResolvedValueOnce({
        addOAuthProviderConfig: { oAuthProviderConfig: [expectedProvider] },
      });

      const result = await repository.upsert(workspaceId, data);

      expect(result).toEqual(expectedProvider);
      expect(mockDGraphService.query).toHaveBeenCalledTimes(1);
      expect(mockDGraphService.mutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          workspaceId,
          provider: data.provider,
          clientId: data.clientId,
          encryptedClientSecret: data.encryptedClientSecret,
        })
      );
    });

    it('should update existing provider when exists', async () => {
      const workspaceId = 'workspace-1';
      const existingProvider: dgraphResolversTypes.OAuthProviderConfig = {
        id: 'provider-1',
        provider: dgraphResolversTypes.OAuthProviderType.Google,
        enabled: false,
        clientId: 'old-client-id',
        encryptedClientSecret: 'encrypted_old-secret',
        tenantId: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        workspace: {
          id: workspaceId,
          name: 'Test Workspace',
          createdAt: '2024-01-01T00:00:00Z',
          system: {
            id: 'system-1',
            createdAt: '2024-01-01T00:00:00Z',
            initialized: true,
          } as dgraphResolversTypes.System,
        },
      };

      const updateData: OAuthProviderConfigData = {
        provider: dgraphResolversTypes.OAuthProviderType.Google,
        enabled: true,
        clientId: 'new-client-id',
        encryptedClientSecret: 'encrypted_new-secret',
        tenantId: null,
      };

      // Mock findByType returning existing provider
      vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
        getWorkspace: { oauthProviders: [existingProvider] },
      });

      // Mock update mutation
      const updatedProvider: dgraphResolversTypes.OAuthProviderConfig = {
        ...existingProvider,
        clientId: 'new-client-id',
        encryptedClientSecret: 'encrypted_new-secret',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      vi.mocked(mockDGraphService.mutation).mockResolvedValueOnce({
        updateOAuthProviderConfig: { oAuthProviderConfig: [updatedProvider] },
      });

      const result = await repository.upsert(workspaceId, updateData);

      expect(result).toEqual(updatedProvider);
      expect(mockDGraphService.mutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          id: existingProvider.id,
          clientId: 'new-client-id',
          encryptedClientSecret: 'encrypted_new-secret',
        })
      );
    });

    it('should preserve existing values when partial update provided', async () => {
      const workspaceId = 'workspace-1';
      const existingProvider: dgraphResolversTypes.OAuthProviderConfig = {
        id: 'provider-1',
        provider: dgraphResolversTypes.OAuthProviderType.Microsoft,
        enabled: true,
        clientId: 'existing-client-id',
        encryptedClientSecret: 'encrypted_existing-secret',
        tenantId: 'common',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        workspace: {
          id: workspaceId,
          name: 'Test Workspace',
          createdAt: '2024-01-01T00:00:00Z',
          system: {
            id: 'system-1',
            createdAt: '2024-01-01T00:00:00Z',
            initialized: true,
          } as dgraphResolversTypes.System,
        },
      };

      // Partial update - only updating tenantId
      const updateData: OAuthProviderConfigData = {
        provider: dgraphResolversTypes.OAuthProviderType.Microsoft,
        enabled: true,
        clientId: undefined as unknown as string,
        encryptedClientSecret: undefined as unknown as string,
        tenantId: 'organizations',
      };

      vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
        getWorkspace: { oauthProviders: [existingProvider] },
      });

      const updatedProvider: dgraphResolversTypes.OAuthProviderConfig = {
        ...existingProvider,
        tenantId: 'organizations',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      vi.mocked(mockDGraphService.mutation).mockResolvedValueOnce({
        updateOAuthProviderConfig: { oAuthProviderConfig: [updatedProvider] },
      });

      await repository.upsert(workspaceId, updateData);

      // Should preserve existing clientId and encryptedClientSecret
      expect(mockDGraphService.mutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          id: existingProvider.id,
          clientId: 'existing-client-id', // Preserved
          encryptedClientSecret: 'encrypted_existing-secret', // Preserved
          tenantId: 'organizations', // Updated
        })
      );
    });
  });

  describe('delete()', () => {
    it('should remove provider successfully', async () => {
      const id = 'provider-1';

      vi.mocked(mockDGraphService.mutation).mockResolvedValueOnce({
        deleteOAuthProviderConfig: { oAuthProviderConfig: [{ id: 'provider-1' }] },
      });

      const result = await repository.delete(id);

      expect(result).toBe(true);
      expect(mockDGraphService.mutation).toHaveBeenCalledWith(expect.anything(), { id });
    });

    it('should throw error when deletion fails', async () => {
      const id = 'provider-1';

      vi.mocked(mockDGraphService.mutation).mockRejectedValueOnce(new Error('Database error'));

      await expect(repository.delete(id)).rejects.toThrow('Failed to delete OAuth provider');
    });
  });

  describe('configure()', () => {
    it('should validate then save valid Google configuration', async () => {
      const workspaceId = 'workspace-1';
      const provider: OAuthProviderType = 'google';
      const clientId = 'google-client-id';
      const clientSecret = 'google-client-secret';

      // Mock findByType returning null (new provider)
      vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
        getWorkspace: { oauthProviders: [] },
      });

      const expectedProvider: dgraphResolversTypes.OAuthProviderConfig = {
        id: 'provider-1',
        provider: dgraphResolversTypes.OAuthProviderType.Google,
        enabled: true,
        clientId: 'google-client-id',
        encryptedClientSecret: 'encrypted_google-client-secret',
        tenantId: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        workspace: {
          id: workspaceId,
          name: 'Test Workspace',
          createdAt: '2024-01-01T00:00:00Z',
          system: {
            id: 'system-1',
            createdAt: '2024-01-01T00:00:00Z',
            initialized: true,
          } as dgraphResolversTypes.System,
        },
      };

      vi.mocked(mockDGraphService.mutation).mockResolvedValueOnce({
        addOAuthProviderConfig: { oAuthProviderConfig: [expectedProvider] },
      });

      const result = await repository.configure(workspaceId, provider, clientId, clientSecret);

      expect(result.valid).toBe(true);
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(clientSecret);
      expect(mockDGraphService.mutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          provider: 'GOOGLE',
          enabled: true,
          clientId,
          encryptedClientSecret: 'encrypted_google-client-secret',
        })
      );
    });

    it('should validate then save valid Microsoft configuration', async () => {
      const workspaceId = 'workspace-1';
      const provider: OAuthProviderType = 'microsoft';
      const clientId = 'ms-client-id';
      const clientSecret = 'ms-client-secret';
      const tenantId = 'common';

      // Mock findByType returning null (new provider)
      vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
        getWorkspace: { oauthProviders: [] },
      });

      const expectedProvider: dgraphResolversTypes.OAuthProviderConfig = {
        id: 'provider-1',
        provider: dgraphResolversTypes.OAuthProviderType.Microsoft,
        enabled: true,
        clientId: 'ms-client-id',
        encryptedClientSecret: 'encrypted_ms-client-secret',
        tenantId: 'common',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        workspace: {
          id: workspaceId,
          name: 'Test Workspace',
          createdAt: '2024-01-01T00:00:00Z',
          system: {
            id: 'system-1',
            createdAt: '2024-01-01T00:00:00Z',
            initialized: true,
          } as dgraphResolversTypes.System,
        },
      };

      vi.mocked(mockDGraphService.mutation).mockResolvedValueOnce({
        addOAuthProviderConfig: { oAuthProviderConfig: [expectedProvider] },
      });

      const result = await repository.configure(workspaceId, provider, clientId, clientSecret, tenantId);

      expect(result.valid).toBe(true);
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(clientSecret);
      expect(mockDGraphService.mutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          provider: 'MICROSOFT',
          enabled: true,
          clientId,
          encryptedClientSecret: 'encrypted_ms-client-secret',
          tenantId,
        })
      );
    });

    it('should return error when validation fails (empty clientId)', async () => {
      const workspaceId = 'workspace-1';
      const provider: OAuthProviderType = 'google';
      const clientId = '';
      const clientSecret = 'google-client-secret';

      const result = await repository.configure(workspaceId, provider, clientId, clientSecret);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Client ID is required');
      expect(mockDGraphService.mutation).not.toHaveBeenCalled();
    });

    it('should return error when validation fails (Microsoft missing tenantId)', async () => {
      const workspaceId = 'workspace-1';
      const provider: OAuthProviderType = 'microsoft';
      const clientId = 'ms-client-id';
      const clientSecret = 'ms-client-secret';

      const result = await repository.configure(workspaceId, provider, clientId, clientSecret);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Tenant ID is required for Microsoft');
      expect(mockDGraphService.mutation).not.toHaveBeenCalled();
    });

    it('should auto-enable provider on configure', async () => {
      const workspaceId = 'workspace-1';
      const provider: OAuthProviderType = 'google';
      const clientId = 'google-client-id';
      const clientSecret = 'google-client-secret';

      // Mock findByType returning null
      vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
        getWorkspace: { oauthProviders: [] },
      });

      vi.mocked(mockDGraphService.mutation).mockResolvedValueOnce({
        addOAuthProviderConfig: {
          oAuthProviderConfig: [
            {
              id: 'provider-1',
              provider: dgraphResolversTypes.OAuthProviderType.Google,
              enabled: true,
              clientId,
              encryptedClientSecret: 'encrypted_google-client-secret',
              tenantId: null,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
              workspace: {
                id: workspaceId,
                name: 'Test Workspace',
                createdAt: '2024-01-01T00:00:00Z',
                system: {
                  id: 'system-1',
                  createdAt: '2024-01-01T00:00:00Z',
                  initialized: true,
                } as dgraphResolversTypes.System,
              },
            },
          ],
        },
      });

      await repository.configure(workspaceId, provider, clientId, clientSecret);

      expect(mockDGraphService.mutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          enabled: true,
        })
      );
    });
  });

  describe('getDecryptedConfig()', () => {
    it('should return decrypted credentials for Google', async () => {
      const workspaceId = 'workspace-1';
      const provider: OAuthProviderType = 'google';

      const mockProvider: dgraphResolversTypes.OAuthProviderConfig = {
        id: 'provider-1',
        provider: dgraphResolversTypes.OAuthProviderType.Google,
        enabled: true,
        clientId: 'google-client-id',
        encryptedClientSecret: 'encrypted_google-secret',
        tenantId: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        workspace: {
          id: workspaceId,
          name: 'Test Workspace',
          createdAt: '2024-01-01T00:00:00Z',
          system: {
            id: 'system-1',
            createdAt: '2024-01-01T00:00:00Z',
            initialized: true,
          } as dgraphResolversTypes.System,
        },
      };

      vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
        getWorkspace: { oauthProviders: [mockProvider] },
      });

      const result = await repository.getDecryptedConfig(workspaceId, provider);

      expect(result).toEqual({
        clientId: 'google-client-id',
        clientSecret: 'google-secret', // Decrypted (mock removes 'encrypted_' prefix)
        tenantId: undefined,
      });
      expect(mockEncryptionService.decrypt).toHaveBeenCalledWith('encrypted_google-secret');
    });

    it('should return decrypted credentials for Microsoft with tenantId', async () => {
      const workspaceId = 'workspace-1';
      const provider: OAuthProviderType = 'microsoft';

      const mockProvider: dgraphResolversTypes.OAuthProviderConfig = {
        id: 'provider-1',
        provider: dgraphResolversTypes.OAuthProviderType.Microsoft,
        enabled: true,
        clientId: 'ms-client-id',
        encryptedClientSecret: 'encrypted_ms-secret',
        tenantId: 'common',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        workspace: {
          id: workspaceId,
          name: 'Test Workspace',
          createdAt: '2024-01-01T00:00:00Z',
          system: {
            id: 'system-1',
            createdAt: '2024-01-01T00:00:00Z',
            initialized: true,
          } as dgraphResolversTypes.System,
        },
      };

      vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
        getWorkspace: { oauthProviders: [mockProvider] },
      });

      const result = await repository.getDecryptedConfig(workspaceId, provider);

      expect(result).toEqual({
        clientId: 'ms-client-id',
        clientSecret: 'ms-secret', // Decrypted
        tenantId: 'common',
      });
    });

    it('should throw error when provider not configured', async () => {
      const workspaceId = 'workspace-1';
      const provider: OAuthProviderType = 'google';

      vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
        getWorkspace: { oauthProviders: [] },
      });

      await expect(repository.getDecryptedConfig(workspaceId, provider)).rejects.toThrow(
        'OAuth provider google is not configured'
      );
    });

    it('should convert null tenantId to undefined', async () => {
      const workspaceId = 'workspace-1';
      const provider: OAuthProviderType = 'google';

      const mockProvider: dgraphResolversTypes.OAuthProviderConfig = {
        id: 'provider-1',
        provider: dgraphResolversTypes.OAuthProviderType.Google,
        enabled: true,
        clientId: 'google-client-id',
        encryptedClientSecret: 'encrypted_google-secret',
        tenantId: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        workspace: {
          id: workspaceId,
          name: 'Test Workspace',
          createdAt: '2024-01-01T00:00:00Z',
          system: {
            id: 'system-1',
            createdAt: '2024-01-01T00:00:00Z',
            initialized: true,
          } as dgraphResolversTypes.System,
        },
      };

      vi.mocked(mockDGraphService.query).mockResolvedValueOnce({
        getWorkspace: { oauthProviders: [mockProvider] },
      });

      const result = await repository.getDecryptedConfig(workspaceId, provider);

      expect(result.tenantId).toBeUndefined();
    });
  });
});
