import { injectable, inject } from 'inversify';
import { LoggerService } from '@2ly/common';
import pino from 'pino';
import { LLMAPIKeyRepository } from '../repositories/llm-api-key.repository';
import { encrypt, decrypt, maskApiKey } from '../helpers/encryption';
import { dgraphResolversTypes } from '@2ly/common';

export interface ValidateAPIKeyResult {
  valid: boolean;
  error?: string;
}

@injectable()
export class LLMAPIKeyService {
  private logger: pino.Logger;

  constructor(
    @inject(LLMAPIKeyRepository) private readonly llmApiKeyRepository: LLMAPIKeyRepository,
    @inject(LoggerService) private readonly loggerService: LoggerService,
  ) {
    this.logger = this.loggerService.getLogger('llm-api-key-service');
  }

  /**
   * Create a new LLM API key with encryption and validation
   */
  async createKey(
    workspaceId: string,
    provider: dgraphResolversTypes.LlmProvider,
    apiKey: string,
  ): Promise<dgraphResolversTypes.LlmapiKey> {
    // Validate the API key with the provider
    const validation = await this.validateAPIKey(provider, apiKey);
    if (!validation.valid) {
      throw new Error(`API key validation failed: ${validation.error}`);
    }

    // Encrypt the API key
    const encryptedKey = encrypt(apiKey);
    const maskedKey = maskApiKey(apiKey);

    // Check if there are any existing keys for this provider
    const existingKeys = await this.llmApiKeyRepository.findByWorkspace(workspaceId);
    const providerKeys = existingKeys.filter((k) => k.provider === provider);

    // First key for this provider should be active by default
    const isActive = providerKeys.length === 0;

    // Create the key in the database
    const key = await this.llmApiKeyRepository.create({
      provider,
      encryptedKey,
      maskedKey,
      isActive,
      workspaceId,
    });

    // Update lastValidatedAt
    await this.llmApiKeyRepository.update({
      id: key.id,
      lastValidatedAt: new Date(),
    });

    this.logger.info(`Created and validated ${provider} API key for workspace ${workspaceId}`);
    return key;
  }

  /**
   * Update an existing LLM API key
   */
  async updateKey(id: string, apiKey: string): Promise<dgraphResolversTypes.LlmapiKey> {
    // Find the existing key
    const existingKey = await this.llmApiKeyRepository.findById(id);
    if (!existingKey) {
      throw new Error('API key not found');
    }

    // Validate the new API key with the provider
    const validation = await this.validateAPIKey(existingKey.provider, apiKey);
    if (!validation.valid) {
      throw new Error(`API key validation failed: ${validation.error}`);
    }

    // Encrypt the new API key
    const encryptedKey = encrypt(apiKey);
    const maskedKey = maskApiKey(apiKey);

    // Update the key in the database
    const updatedKey = await this.llmApiKeyRepository.update({
      id,
      encryptedKey,
      maskedKey,
      lastValidatedAt: new Date(),
    });

    this.logger.info(`Updated and validated ${existingKey.provider} API key ${id}`);
    return updatedKey;
  }

  /**
   * Delete an LLM API key
   */
  async deleteKey(id: string): Promise<dgraphResolversTypes.LlmapiKey> {
    const key = await this.llmApiKeyRepository.delete(id);
    this.logger.info(`Deleted LLM API key ${id}`);
    return key;
  }

  /**
   * Set an LLM API key as active
   */
  async setActiveKey(id: string): Promise<dgraphResolversTypes.LlmapiKey> {
    // Find the key to get provider and workspace info
    const key = await this.llmApiKeyRepository.findById(id);
    if (!key) {
      throw new Error('API key not found');
    }

    // Set as active (automatically deactivates other keys for the same provider)
    const updatedKey = await this.llmApiKeyRepository.setActive(id, key.provider, key.workspace!.id);

    this.logger.info(`Set ${key.provider} API key ${id} as active`);
    return updatedKey;
  }

  /**
   * Get all LLM API keys for a workspace
   */
  async getKeysByWorkspace(workspaceId: string): Promise<dgraphResolversTypes.LlmapiKey[]> {
    return this.llmApiKeyRepository.findByWorkspace(workspaceId);
  }

  /**
   * Get a specific LLM API key by ID
   */
  async getKeyById(id: string): Promise<dgraphResolversTypes.LlmapiKey | null> {
    return this.llmApiKeyRepository.findById(id);
  }

  /**
   * Get the decrypted API key (use with caution, only when needed for actual API calls)
   */
  async getDecryptedKey(id: string): Promise<string> {
    const key = await this.llmApiKeyRepository.findById(id);
    if (!key) {
      throw new Error('API key not found');
    }

    return decrypt(key.encryptedKey);
  }

  /**
   * Get the active API key for a provider in a workspace
   */
  async getActiveKey(
    workspaceId: string,
    provider: dgraphResolversTypes.LlmProvider,
  ): Promise<dgraphResolversTypes.LlmapiKey | null> {
    return this.llmApiKeyRepository.findActiveKey(workspaceId, provider);
  }

  /**
   * Validate an API key with the provider's API
   */
  private async validateAPIKey(provider: dgraphResolversTypes.LlmProvider, apiKey: string): Promise<ValidateAPIKeyResult> {
    try {
      switch (provider) {
        case dgraphResolversTypes.LlmProvider.Openai:
          return await this.validateOpenAIKey(apiKey);

        case dgraphResolversTypes.LlmProvider.Anthropic:
          return await this.validateAnthropicKey(apiKey);

        case dgraphResolversTypes.LlmProvider.Google:
          return await this.validateGoogleKey(apiKey);

        default:
          return { valid: false, error: 'Unknown provider' };
      }
    } catch (error) {
      this.logger.error(`API key validation error for ${provider}: ${error}`);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      };
    }
  }

  /**
   * Validate OpenAI API key
   */
  private async validateOpenAIKey(apiKey: string): Promise<ValidateAPIKeyResult> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        return { valid: true };
      }

      if (response.status === 401) {
        return { valid: false, error: 'Invalid API key' };
      }

      return { valid: false, error: `Validation failed with status ${response.status}` };
    } catch (error) {
      this.logger.error({ error }, 'OpenAI validation error');
      return { valid: false, error: 'Network error during validation' };
    }
  }

  /**
   * Validate Anthropic API key
   */
  private async validateAnthropicKey(apiKey: string): Promise<ValidateAPIKeyResult> {
    try {
      // Use a minimal request to test the key
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }],
        }),
      });

      // Accept both 200 (success) and 400 (validation error due to minimal request)
      // as proof the key is valid
      if (response.ok || response.status === 400) {
        return { valid: true };
      }

      if (response.status === 401) {
        return { valid: false, error: 'Invalid API key' };
      }

      return { valid: false, error: `Validation failed with status ${response.status}` };
    } catch (error) {
      this.logger.error({ error }, 'Anthropic validation error');
      return { valid: false, error: 'Network error during validation' };
    }
  }

  /**
   * Validate Google API key
   */
  private async validateGoogleKey(apiKey: string): Promise<ValidateAPIKeyResult> {
    try {
      // Use the Gemini API to validate
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        {
          method: 'GET',
        },
      );

      if (response.ok) {
        return { valid: true };
      }

      if (response.status === 400 || response.status === 403) {
        return { valid: false, error: 'Invalid API key' };
      }

      return { valid: false, error: `Validation failed with status ${response.status}` };
    } catch (error) {
      this.logger.error({ error }, 'Google validation error');
      return { valid: false, error: 'Network error during validation' };
    }
  }
}
