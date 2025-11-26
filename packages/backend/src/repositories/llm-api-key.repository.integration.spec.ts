import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { DGraphService } from '../services/dgraph.service';
import { LoggerService } from '@2ly/common';
import { LLMAPIKeyRepository } from './llm-api-key.repository';
import { WorkspaceRepository } from './workspace.repository';
import { SystemRepository } from './system.repository';
import { IdentityRepository } from './identity.repository';
import { dgraphResolversTypes } from '@2ly/common';

describe('LLMAPIKeyRepository Integration', () => {
  let dgraphContainer: StartedTestContainer;
  let dgraphService: DGraphService;
  let repository: LLMAPIKeyRepository;
  let workspaceRepository: WorkspaceRepository;
  let systemRepository: SystemRepository;
  let identityRepository: IdentityRepository;
  let testWorkspaceId: string;

  beforeAll(async () => {
    // Start Dgraph container
    dgraphContainer = await new GenericContainer('dgraph/standalone:latest')
      .withExposedPorts(8080)
      .withWaitStrategy(Wait.forLogMessage(/Server is ready/))
      .start();

    const dgraphUrl = `${dgraphContainer.getHost()}:${dgraphContainer.getMappedPort(8080)}`;

    // Create logger service
    const loggerService = new LoggerService('test', 'silent', false);

    // Create Dgraph service
    dgraphService = new DGraphService(dgraphUrl, loggerService);
    await (dgraphService as unknown as { initialize: () => Promise<void> }).initialize();
    await dgraphService.initSchema(true); // Drop all data

    // Create repositories
    identityRepository = new IdentityRepository(dgraphService, loggerService);
    repository = new LLMAPIKeyRepository(dgraphService, loggerService);
    workspaceRepository = new WorkspaceRepository(dgraphService, loggerService, identityRepository);
    systemRepository = new SystemRepository(dgraphService, loggerService, identityRepository);

    // Create a test system and workspace
    const system = await systemRepository.createSystem();
    const adminUserId = system.admins![0].id;
    const workspace = await workspaceRepository.create('Test Workspace', adminUserId);
    testWorkspaceId = workspace.id;
  }, 60000); // Increase timeout for container startup

  afterAll(async () => {
    if (dgraphContainer) {
      await dgraphContainer.stop();
    }
  });

  beforeEach(async () => {
    // Clean up LLM API keys before each test
    const keys = await repository.findByWorkspace(testWorkspaceId);
    for (const key of keys) {
      await repository.delete(key.id);
    }
  });

  describe('create', () => {
    it('should create a new LLM API key', async () => {
      const key = await repository.create({
        provider: dgraphResolversTypes.LlmProvider.Openai,
        encryptedKey: 'encrypted_test_key',
        maskedKey: 'sk-...test',
        isActive: true,
        workspaceId: testWorkspaceId,
      });

      expect(key).toBeDefined();
      expect(key.id).toBeDefined();
      expect(key.provider).toBe(dgraphResolversTypes.LlmProvider.Openai);
      expect(key.encryptedKey).toBe('encrypted_test_key');
      expect(key.maskedKey).toBe('sk-...test');
      expect(key.isActive).toBe(true);
      expect(key.createdAt).toBeDefined();
    });

    it('should create multiple keys for different providers', async () => {
      const openaiKey = await repository.create({
        provider: dgraphResolversTypes.LlmProvider.Openai,
        encryptedKey: 'encrypted_openai',
        maskedKey: 'sk-...nai',
        isActive: true,
        workspaceId: testWorkspaceId,
      });

      const anthropicKey = await repository.create({
        provider: dgraphResolversTypes.LlmProvider.Anthropic,
        encryptedKey: 'encrypted_anthropic',
        maskedKey: 'sk-ant-...pic',
        isActive: true,
        workspaceId: testWorkspaceId,
      });

      expect(openaiKey.provider).toBe(dgraphResolversTypes.LlmProvider.Openai);
      expect(anthropicKey.provider).toBe(dgraphResolversTypes.LlmProvider.Anthropic);
    });
  });

  describe('findByWorkspace', () => {
    it('should return all keys for a workspace', async () => {
      await repository.create({
        provider: dgraphResolversTypes.LlmProvider.Openai,
        encryptedKey: 'encrypted_1',
        maskedKey: 'sk-...1',
        isActive: true,
        workspaceId: testWorkspaceId,
      });

      await repository.create({
        provider: dgraphResolversTypes.LlmProvider.Anthropic,
        encryptedKey: 'encrypted_2',
        maskedKey: 'sk-ant-...2',
        isActive: false,
        workspaceId: testWorkspaceId,
      });

      const keys = await repository.findByWorkspace(testWorkspaceId);

      expect(keys).toHaveLength(2);
      expect(keys.map((k) => k.provider)).toContain(dgraphResolversTypes.LlmProvider.Openai);
      expect(keys.map((k) => k.provider)).toContain(dgraphResolversTypes.LlmProvider.Anthropic);
    });

    it('should return empty array for workspace with no keys', async () => {
      const keys = await repository.findByWorkspace(testWorkspaceId);
      expect(keys).toHaveLength(0);
    });

    it('should return keys sorted by creation date (newest first)', async () => {
      const _key1 = await repository.create({
        provider: dgraphResolversTypes.LlmProvider.Openai,
        encryptedKey: 'encrypted_1',
        maskedKey: 'sk-...1',
        isActive: true,
        workspaceId: testWorkspaceId,
      });

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 100));

      const _key2 = await repository.create({
        provider: dgraphResolversTypes.LlmProvider.Openai,
        encryptedKey: 'encrypted_2',
        maskedKey: 'sk-...2',
        isActive: false,
        workspaceId: testWorkspaceId,
      });

      const keys = await repository.findByWorkspace(testWorkspaceId);

      expect(keys).toHaveLength(2);
      // Newest should be first
      expect(new Date(keys[0].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(keys[1].createdAt).getTime(),
      );
    });
  });

  describe('findById', () => {
    it('should find a key by ID', async () => {
      const created = await repository.create({
        provider: dgraphResolversTypes.LlmProvider.Openai,
        encryptedKey: 'encrypted_test',
        maskedKey: 'sk-...test',
        isActive: true,
        workspaceId: testWorkspaceId,
      });

      const found = await repository.findById(created.id);

      expect(found).toBeDefined();
      expect(found!.id).toBe(created.id);
      expect(found!.encryptedKey).toBe('encrypted_test');
    });

    it('should return null for non-existent ID', async () => {
      const found = await repository.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an existing key', async () => {
      const created = await repository.create({
        provider: dgraphResolversTypes.LlmProvider.Openai,
        encryptedKey: 'encrypted_old',
        maskedKey: 'sk-...old',
        isActive: true,
        workspaceId: testWorkspaceId,
      });

      const updated = await repository.update({
        id: created.id,
        encryptedKey: 'encrypted_new',
        maskedKey: 'sk-...new',
        lastValidatedAt: new Date(),
      });

      expect(updated.id).toBe(created.id);
      expect(updated.encryptedKey).toBe('encrypted_new');
      expect(updated.maskedKey).toBe('sk-...new');
      expect(updated.lastValidatedAt).toBeDefined();
      expect(updated.updatedAt).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should delete a key', async () => {
      const created = await repository.create({
        provider: dgraphResolversTypes.LlmProvider.Openai,
        encryptedKey: 'encrypted_test',
        maskedKey: 'sk-...test',
        isActive: true,
        workspaceId: testWorkspaceId,
      });

      await repository.delete(created.id);

      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });
  });

  describe('setActive', () => {
    it('should set a key as active and deactivate others', async () => {
      const key1 = await repository.create({
        provider: dgraphResolversTypes.LlmProvider.Openai,
        encryptedKey: 'encrypted_1',
        maskedKey: 'sk-...1',
        isActive: true,
        workspaceId: testWorkspaceId,
      });

      const key2 = await repository.create({
        provider: dgraphResolversTypes.LlmProvider.Openai,
        encryptedKey: 'encrypted_2',
        maskedKey: 'sk-...2',
        isActive: false,
        workspaceId: testWorkspaceId,
      });

      // Set key2 as active
      await repository.setActive(key2.id, dgraphResolversTypes.LlmProvider.Openai, testWorkspaceId);

      const updatedKey1 = await repository.findById(key1.id);
      const updatedKey2 = await repository.findById(key2.id);

      expect(updatedKey1!.isActive).toBe(false);
      expect(updatedKey2!.isActive).toBe(true);
    });

    it('should not affect keys from different providers', async () => {
      const _openaiKey = await repository.create({
        provider: dgraphResolversTypes.LlmProvider.Openai,
        encryptedKey: 'encrypted_openai',
        maskedKey: 'sk-...nai',
        isActive: true,
        workspaceId: testWorkspaceId,
      });

      const anthropicKey = await repository.create({
        provider: dgraphResolversTypes.LlmProvider.Anthropic,
        encryptedKey: 'encrypted_anthropic',
        maskedKey: 'sk-ant-...pic',
        isActive: true,
        workspaceId: testWorkspaceId,
      });

      // Set another OpenAI key as active
      const newOpenaiKey = await repository.create({
        provider: dgraphResolversTypes.LlmProvider.Openai,
        encryptedKey: 'encrypted_openai_2',
        maskedKey: 'sk-...ai2',
        isActive: false,
        workspaceId: testWorkspaceId,
      });

      await repository.setActive(newOpenaiKey.id, dgraphResolversTypes.LlmProvider.Openai, testWorkspaceId);

      const updatedAnthropicKey = await repository.findById(anthropicKey.id);

      // Anthropic key should still be active
      expect(updatedAnthropicKey!.isActive).toBe(true);
    });

    it('should throw error when key does not exist', async () => {
      await expect(
        repository.setActive('non-existent-id', dgraphResolversTypes.LlmProvider.Openai, testWorkspaceId),
      ).rejects.toThrow('Key not found');
    });

    it('should throw error when key provider does not match', async () => {
      const key = await repository.create({
        provider: dgraphResolversTypes.LlmProvider.Openai,
        encryptedKey: 'encrypted_test',
        maskedKey: 'sk-...test',
        isActive: false,
        workspaceId: testWorkspaceId,
      });

      // Try to set it active with wrong provider
      await expect(
        repository.setActive(key.id, dgraphResolversTypes.LlmProvider.Anthropic, testWorkspaceId),
      ).rejects.toThrow('Key not found');
    });

    it('should throw error when workspace does not match', async () => {
      const key = await repository.create({
        provider: dgraphResolversTypes.LlmProvider.Openai,
        encryptedKey: 'encrypted_test',
        maskedKey: 'sk-...test',
        isActive: false,
        workspaceId: testWorkspaceId,
      });

      // Try to set it active with wrong workspace
      await expect(
        repository.setActive(key.id, dgraphResolversTypes.LlmProvider.Openai, 'wrong-workspace-id'),
      ).rejects.toThrow('Key not found');
    });

    it('should atomically ensure only one key is active (race condition test)', async () => {
      // Create multiple keys for the same provider
      const keys = await Promise.all([
        repository.create({
          provider: dgraphResolversTypes.LlmProvider.Openai,
          encryptedKey: 'encrypted_1',
          maskedKey: 'sk-...1',
          isActive: false,
          workspaceId: testWorkspaceId,
        }),
        repository.create({
          provider: dgraphResolversTypes.LlmProvider.Openai,
          encryptedKey: 'encrypted_2',
          maskedKey: 'sk-...2',
          isActive: false,
          workspaceId: testWorkspaceId,
        }),
        repository.create({
          provider: dgraphResolversTypes.LlmProvider.Openai,
          encryptedKey: 'encrypted_3',
          maskedKey: 'sk-...3',
          isActive: false,
          workspaceId: testWorkspaceId,
        }),
      ]);

      // Try to set multiple keys as active concurrently
      const activationPromises = keys.map((key) =>
        repository.setActive(key.id, dgraphResolversTypes.LlmProvider.Openai, testWorkspaceId),
      );

      // Wait for all to complete
      await Promise.allSettled(activationPromises);

      // Verify only one key is active
      const allKeys = await repository.findByWorkspace(testWorkspaceId);
      const activeKeys = allKeys.filter((k) => k.isActive && k.provider === dgraphResolversTypes.LlmProvider.Openai);

      expect(activeKeys).toHaveLength(1);
    });

    it('should handle multiple activations of the same key', async () => {
      const key = await repository.create({
        provider: dgraphResolversTypes.LlmProvider.Openai,
        encryptedKey: 'encrypted_test',
        maskedKey: 'sk-...test',
        isActive: false,
        workspaceId: testWorkspaceId,
      });

      // Set active multiple times
      await repository.setActive(key.id, dgraphResolversTypes.LlmProvider.Openai, testWorkspaceId);
      await repository.setActive(key.id, dgraphResolversTypes.LlmProvider.Openai, testWorkspaceId);
      await repository.setActive(key.id, dgraphResolversTypes.LlmProvider.Openai, testWorkspaceId);

      const updatedKey = await repository.findById(key.id);
      expect(updatedKey!.isActive).toBe(true);
    });
  });

  describe('findActiveKey', () => {
    it('should find the active key for a provider', async () => {
      await repository.create({
        provider: dgraphResolversTypes.LlmProvider.Openai,
        encryptedKey: 'encrypted_1',
        maskedKey: 'sk-...1',
        isActive: false,
        workspaceId: testWorkspaceId,
      });

      const activeKey = await repository.create({
        provider: dgraphResolversTypes.LlmProvider.Openai,
        encryptedKey: 'encrypted_2',
        maskedKey: 'sk-...2',
        isActive: true,
        workspaceId: testWorkspaceId,
      });

      const found = await repository.findActiveKey(testWorkspaceId, dgraphResolversTypes.LlmProvider.Openai);

      expect(found).toBeDefined();
      expect(found!.id).toBe(activeKey.id);
      expect(found!.isActive).toBe(true);
    });

    it('should return null if no active key exists', async () => {
      await repository.create({
        provider: dgraphResolversTypes.LlmProvider.Openai,
        encryptedKey: 'encrypted_1',
        maskedKey: 'sk-...1',
        isActive: false,
        workspaceId: testWorkspaceId,
      });

      const found = await repository.findActiveKey(testWorkspaceId, dgraphResolversTypes.LlmProvider.Openai);

      expect(found).toBeNull();
    });

    it('should return null for provider with no keys', async () => {
      const found = await repository.findActiveKey(testWorkspaceId, dgraphResolversTypes.LlmProvider.Google);

      expect(found).toBeNull();
    });
  });

  describe('Workspace isolation', () => {
    let otherWorkspaceId: string;

    beforeEach(async () => {
      // Create another workspace
      const system = await systemRepository.getSystem();
      const adminUserId = system!.admins![0].id;
      const otherWorkspace = await workspaceRepository.create('Other Workspace', adminUserId);
      otherWorkspaceId = otherWorkspace.id;
    });

    it('should isolate keys between workspaces', async () => {
      await repository.create({
        provider: dgraphResolversTypes.LlmProvider.Openai,
        encryptedKey: 'encrypted_workspace1',
        maskedKey: 'sk-...ce1',
        isActive: true,
        workspaceId: testWorkspaceId,
      });

      await repository.create({
        provider: dgraphResolversTypes.LlmProvider.Openai,
        encryptedKey: 'encrypted_workspace2',
        maskedKey: 'sk-...ce2',
        isActive: true,
        workspaceId: otherWorkspaceId,
      });

      const workspace1Keys = await repository.findByWorkspace(testWorkspaceId);
      const workspace2Keys = await repository.findByWorkspace(otherWorkspaceId);

      expect(workspace1Keys).toHaveLength(1);
      expect(workspace2Keys).toHaveLength(1);
      expect(workspace1Keys[0].id).not.toBe(workspace2Keys[0].id);
    });

    it('should not affect other workspace keys when setting active', async () => {
      const _workspace1Key = await repository.create({
        provider: dgraphResolversTypes.LlmProvider.Openai,
        encryptedKey: 'encrypted_workspace1',
        maskedKey: 'sk-...ce1',
        isActive: true,
        workspaceId: testWorkspaceId,
      });

      const workspace2Key = await repository.create({
        provider: dgraphResolversTypes.LlmProvider.Openai,
        encryptedKey: 'encrypted_workspace2',
        maskedKey: 'sk-...ce2',
        isActive: true,
        workspaceId: otherWorkspaceId,
      });

      // Create a second key in workspace1 and set it active
      const workspace1Key2 = await repository.create({
        provider: dgraphResolversTypes.LlmProvider.Openai,
        encryptedKey: 'encrypted_workspace1_2',
        maskedKey: 'sk-...e12',
        isActive: false,
        workspaceId: testWorkspaceId,
      });

      await repository.setActive(workspace1Key2.id, dgraphResolversTypes.LlmProvider.Openai, testWorkspaceId);

      // Workspace 2 key should still be active
      const updatedWorkspace2Key = await repository.findById(workspace2Key.id);
      expect(updatedWorkspace2Key!.isActive).toBe(true);
    });
  });
});
