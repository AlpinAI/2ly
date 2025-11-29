/**
 * AI Client Interface - Provider-agnostic abstraction layer.
 *
 * This interface allows easy switching between AI SDK implementations
 * (Vercel AI SDK, OpenRouter, native SDKs, etc.) without changing
 * the rest of the application.
 */

export type AIProviderType = 'openai' | 'anthropic' | 'google' | 'ollama';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIChatRequest {
  messages: AIMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIChatResponse {
  content: string;
  model: string;
  finishReason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIStreamChunk {
  content: string;
  done: boolean;
}

export interface AICredentialValidation {
  valid: boolean;
  error?: string;
  availableModels?: string[];
}

export interface AIModel {
  id: string;
  name: string;
  contextWindow?: number;
}

export interface AIClientConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
}

/**
 * IAIClient - The main interface for AI client implementations.
 *
 * Each provider adapter must implement this interface, allowing
 * the application to switch between providers seamlessly.
 */
export interface IAIClient {
  /**
   * The provider type this client represents.
   */
  readonly provider: AIProviderType;

  /**
   * Send a chat request and get a complete response.
   */
  chat(request: AIChatRequest): Promise<AIChatResponse>;

  /**
   * Stream a chat response chunk by chunk.
   */
  stream(request: AIChatRequest): AsyncIterable<AIStreamChunk>;

  /**
   * Validate the credentials are correct by making a lightweight API call.
   * Returns available models if validation succeeds.
   */
  validateCredentials(): Promise<AICredentialValidation>;

  /**
   * List available models for this provider.
   */
  listModels(): Promise<AIModel[]>;

  /**
   * Get the default model for this provider.
   */
  getDefaultModel(): string;
}

/**
 * Default models for each provider.
 */
export const DEFAULT_MODELS: Record<AIProviderType, string> = {
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-20250514',
  google: 'gemini-1.5-pro',
  ollama: 'llama3.2',
};

/**
 * Provider display names.
 */
export const PROVIDER_NAMES: Record<AIProviderType, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google Gemini',
  ollama: 'Ollama (Local)',
};

/**
 * Whether the provider requires an API key.
 */
export const PROVIDER_REQUIRES_KEY: Record<AIProviderType, boolean> = {
  openai: true,
  anthropic: true,
  google: true,
  ollama: false,
};

/**
 * Default base URLs for providers that support custom endpoints.
 */
export const DEFAULT_BASE_URLS: Partial<Record<AIProviderType, string>> = {
  ollama: 'http://localhost:11434',
};
