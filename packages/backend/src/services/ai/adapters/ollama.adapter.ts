import { createOllama } from 'ollama-ai-provider';
import { generateText, streamText } from 'ai';
import type {
  IAIClient,
  AIClientConfig,
  AIChatRequest,
  AIChatResponse,
  AIStreamChunk,
  AICredentialValidation,
  AIModel,
  AIProviderType,
} from '../ai-client.interface';
import { DEFAULT_MODELS, DEFAULT_BASE_URLS } from '../ai-client.interface';

interface OllamaTagsResponse {
  models: Array<{
    name: string;
    modified_at: string;
    size: number;
    details?: {
      parameter_size?: string;
    };
  }>;
}

/**
 * Ollama Adapter - Implements IAIClient using Vercel AI SDK with ollama-ai-provider.
 * Ollama is a local LLM runner, so no API key is required.
 */
export class OllamaAdapter implements IAIClient {
  readonly provider: AIProviderType = 'ollama';
  private readonly client: ReturnType<typeof createOllama>;
  private readonly baseUrl: string;
  private readonly defaultModel: string;

  constructor(config: AIClientConfig) {
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URLS.ollama || 'http://localhost:11434';

    this.client = createOllama({
      baseURL: `${this.baseUrl}/api`,
    });

    this.defaultModel = config.defaultModel || DEFAULT_MODELS.ollama;
  }

  async chat(request: AIChatRequest): Promise<AIChatResponse> {
    const model = request.model || this.defaultModel;

    const result = await generateText({
      // Ollama provider may be v1, cast to any for compatibility
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: this.client(model) as any,
      messages: request.messages,
      temperature: request.temperature,
      maxOutputTokens: request.maxTokens,
    });

    return {
      content: result.text,
      model,
      finishReason: result.finishReason,
      usage: result.usage
        ? {
            promptTokens: result.usage.inputTokens || 0,
            completionTokens: result.usage.outputTokens || 0,
            totalTokens: (result.usage.inputTokens || 0) + (result.usage.outputTokens || 0),
          }
        : undefined,
    };
  }

  async *stream(request: AIChatRequest): AsyncIterable<AIStreamChunk> {
    const model = request.model || this.defaultModel;

    const result = streamText({
      // Ollama provider may be v1, cast to any for compatibility
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: this.client(model) as any,
      messages: request.messages,
      temperature: request.temperature,
      maxOutputTokens: request.maxTokens,
    });

    for await (const chunk of result.textStream) {
      yield { content: chunk, done: false };
    }

    yield { content: '', done: true };
  }

  async validateCredentials(): Promise<AICredentialValidation> {
    try {
      // Check if Ollama is running by fetching available models
      const models = await this.listModels();

      if (models.length === 0) {
        return {
          valid: true,
          availableModels: [],
          error: 'Ollama is running but no models are installed. Run "ollama pull llama3.2" to install a model.',
        };
      }

      return {
        valid: true,
        availableModels: models.map((m) => m.id),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      // Check for common Ollama connection errors
      if (message.includes('ECONNREFUSED') || message.includes('fetch failed')) {
        return {
          valid: false,
          error: `Cannot connect to Ollama at ${this.baseUrl}. Make sure Ollama is running.`,
        };
      }

      return {
        valid: false,
        error: `Ollama validation failed: ${message}`,
      };
    }
  }

  async listModels(): Promise<AIModel[]> {
    try {
      // Fetch models directly from Ollama API
      const response = await fetch(`${this.baseUrl}/api/tags`);

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = (await response.json()) as OllamaTagsResponse;

      return data.models.map((model) => ({
        id: model.name,
        name: model.name,
        contextWindow: undefined, // Ollama doesn't provide this in the tags API
      }));
    } catch (error) {
      // If we can't fetch models, return an empty list
      console.warn('Failed to fetch Ollama models:', error);
      return [];
    }
  }

  getDefaultModel(): string {
    return this.defaultModel;
  }
}
