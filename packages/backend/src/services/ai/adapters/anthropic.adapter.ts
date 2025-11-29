import { createAnthropic } from '@ai-sdk/anthropic';
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
import { DEFAULT_MODELS } from '../ai-client.interface';

/**
 * Anthropic Adapter - Implements IAIClient using Vercel AI SDK.
 */
export class AnthropicAdapter implements IAIClient {
  readonly provider: AIProviderType = 'anthropic';
  private readonly client: ReturnType<typeof createAnthropic>;
  private readonly defaultModel: string;

  constructor(config: AIClientConfig) {
    if (!config.apiKey) {
      throw new Error('Anthropic API key is required');
    }

    this.client = createAnthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });

    this.defaultModel = config.defaultModel || DEFAULT_MODELS.anthropic;
  }

  async chat(request: AIChatRequest): Promise<AIChatResponse> {
    const model = request.model || this.defaultModel;

    const result = await generateText({
      model: this.client(model),
      messages: request.messages,
      temperature: request.temperature,
      maxOutputTokens: request.maxTokens || 4096, // Anthropic requires maxOutputTokens
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
      model: this.client(model),
      messages: request.messages,
      temperature: request.temperature,
      maxOutputTokens: request.maxTokens || 4096,
    });

    for await (const chunk of result.textStream) {
      yield { content: chunk, done: false };
    }

    yield { content: '', done: true };
  }

  async validateCredentials(): Promise<AICredentialValidation> {
    try {
      // Make a minimal API call to validate credentials
      await generateText({
        model: this.client('claude-3-5-haiku-20241022'),
        messages: [{ role: 'user', content: 'Hi' }],
        maxOutputTokens: 1,
      });

      const models = await this.listModels();

      return {
        valid: true,
        availableModels: models.map((m) => m.id),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        valid: false,
        error: `Anthropic API validation failed: ${message}`,
      };
    }
  }

  async listModels(): Promise<AIModel[]> {
    return [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', contextWindow: 200000 },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', contextWindow: 200000 },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', contextWindow: 200000 },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', contextWindow: 200000 },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', contextWindow: 200000 },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', contextWindow: 200000 },
    ];
  }

  getDefaultModel(): string {
    return this.defaultModel;
  }
}
