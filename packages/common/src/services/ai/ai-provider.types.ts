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
