export type AIProviderType = 'openai' | 'anthropic' | 'google' | 'ollama';

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
}

export interface AIProviderValidationResult {
  valid: boolean;
  error?: string;
  availableModels?: string[];
}

export interface ParsedModelString {
  provider: AIProviderType;
  modelName: string;
}

export const VALID_PROVIDERS = ['openai', 'anthropic', 'google', 'ollama'] as const;

export const PROVIDER_REQUIRES_KEY: Record<AIProviderType, boolean> = {
  openai: true,
  anthropic: true,
  google: true,
  ollama: false,
};

/**
 * Base error class for AI provider operations
 */
export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: AIProviderType
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

/**
 * Thrown when a requested model is not found or not available
 */
export class ModelNotFoundError extends AIProviderError {
  constructor(
    provider: AIProviderType,
    public readonly modelName: string
  ) {
    super(`Model '${modelName}' not found for provider '${provider}'`, provider);
    this.name = 'ModelNotFoundError';
  }
}

/**
 * Thrown when API key is invalid or missing
 */
export class InvalidAPIKeyError extends AIProviderError {
  constructor(provider: AIProviderType) {
    super(`Invalid or missing API key for provider '${provider}'`, provider);
    this.name = 'InvalidAPIKeyError';
  }
}

/**
 * Thrown when rate limit is exceeded
 */
export class RateLimitError extends AIProviderError {
  constructor(
    provider: AIProviderType,
    public readonly retryAfter?: number
  ) {
    super(`Rate limit exceeded for provider '${provider}'`, provider);
    this.name = 'RateLimitError';
  }
}

/**
 * Thrown when token limit is exceeded
 */
export class TokenLimitError extends AIProviderError {
  constructor(
    provider: AIProviderType,
    public readonly maxTokens?: number
  ) {
    super(`Token limit exceeded for provider '${provider}'`, provider);
    this.name = 'TokenLimitError';
  }
}
